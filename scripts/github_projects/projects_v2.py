"""Camada de domínio para GitHub Projects v2 (API GraphQL).

Fluxo implementado:
1. Descobrir o quadro por `owner/number` (ou auto-descobrir listando projetos).
2. Carregar o campo single-select "Status" e suas opções (ex.: "Backlog", "Done").
3. Iterar os itens do projeto com paginação, coletando título e status atual.
4. Selecionar os itens com status "Backlog" cujo título casa com o padrão de
   sprint por prefixo (ex.: "S0-", "S1-", ..., "S4-").
5. Atualizar o campo Status de cada item selecionado para o status destino
   (ex.: "Done") via mutation `updateProjectV2ItemFieldValue`.

Notas de API:
- O campo "Status" é um `ProjectV2SingleSelectField`; o valor é alterado com
  `singleSelectOptionId` (não `text`/`number`/`date`).
- Draft issues (cards sem issue vinculada) também são suportados.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from gh_client import GitHubClient, GitHubAPIError

STATUS_FIELD_NAME = "Status"
DEFAULT_SPRINT_PATTERN = r"^S([0-4])[-_\s]"  # prefixo S0- .. S4- no título


# --------------------------------------------------------------------------
# Modelos
# --------------------------------------------------------------------------

@dataclass
class StatusOption:
    id: str
    name: str


@dataclass
class ProjectBoard:
    id: str
    number: int
    title: str
    owner: str
    status_field_id: str | None = None
    status_options: list[StatusOption] = field(default_factory=list)


@dataclass
class ProjectItem:
    item_id: str
    title: str
    status: str | None  # None quando o campo Status nunca foi definido
    repo: str | None
    issue_number: int | None
    is_draft: bool
    sprint: int | None = None  # preenchido pelo filtro de sprint


# --------------------------------------------------------------------------
# Descoberta do quadro
# --------------------------------------------------------------------------

def get_board(client: GitHubClient, owner: str, number: int) -> ProjectBoard:
    """Carrega um quadro por owner + número (funciona para user ou org)."""
    query = """
    query($owner: String!, $number: Int!) {
      user(login: $owner) { projectV2(number: $number) { ...board } }
      organization(login: $owner) { projectV2(number: $number) { ...board } }
    }
    fragment board on ProjectV2 {
      id number title closed
      owner { ... on User { login } ... on Organization { login } }
    }
    """
    data = client.graphql(query, {"owner": owner, "number": number})
    node = (data.get("user") or {}).get("projectV2") or (data.get("organization") or {}).get("projectV2")
    if not node:
        raise GitHubAPIError(
            f"Quadro #{number} não encontrado para '{owner}'. Verifique owner/número "
            f"e se o token tem acesso ao projeto."
        )
    return ProjectBoard(
        id=node["id"], number=node["number"], title=node["title"],
        owner=(node.get("owner") or {}).get("login") or owner,
    )


def discover_boards(client: GitHubClient, owner: str) -> list[dict]:
    """Lista quadros visíveis do usuário (ajuda a achar o número do quadro)."""
    query = """
    query($owner: String!) {
      user(login: $owner) {
        projectsV2(first: 50) {
          nodes { number title closed items(first: 1) { totalCount } }
        }
      }
    }
    """
    try:
        data = client.graphql(query, {"owner": owner})
    except GitHubAPIError as exc:
        raise GitHubAPIError(
            f"Não foi possível listar quadros de '{owner}': {exc}"
        ) from exc
    nodes = ((data.get("user") or {}).get("projectsV2") or {}).get("nodes") or []
    return [
        {"number": n["number"], "title": n["title"], "closed": n["closed"]}
        for n in nodes
    ]


# --------------------------------------------------------------------------
# Campo Status
# --------------------------------------------------------------------------

def load_status_field(client: GitHubClient, board: ProjectBoard) -> None:
    """Carrega o campo single-select 'Status' e as opções no board informado."""
    query = """
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 50) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id name
                options { id name }
              }
            }
          }
        }
      }
    }
    """
    data = client.graphql(query, {"projectId": board.id})
    nodes = ((data["node"]).get("fields") or {}).get("nodes") or []
    for f in nodes:
        if f.get("name", "").strip().lower() == STATUS_FIELD_NAME.lower():
            board.status_field_id = f["id"]
            board.status_options = [
                StatusOption(id=o["id"], name=o["name"]) for o in f.get("options", [])
            ]
            return
    raise GitHubAPIError(
        f"Campo '{STATUS_FIELD_NAME}' não encontrado no quadro '{board.title}'. "
        "Sem esse campo não é possível mover cards entre colunas."
    )


def option_id_for(board: ProjectBoard, name: str) -> str:
    """Resolve o id da opção de status pelo nome (case-insensitive)."""
    for opt in board.status_options:
        if opt.name.strip().lower() == name.strip().lower():
            return opt.id
    available = ", ".join(o.name for o in board.status_options) or "(nenhuma)"
    raise GitHubAPIError(
        f"Opção de status '{name}' não existe no quadro '{board.title}'. "
        f"Opções disponíveis: {available}"
    )


# --------------------------------------------------------------------------
# Itens do quadro
# --------------------------------------------------------------------------

def _parse_item(node: dict) -> ProjectItem | None:
    """Converte um nó da API em ProjectItem; draft issues são suportados."""
    content = node.get("content") or {}
    if not content or not content.get("__typename"):
        return None
    is_draft = content["__typename"] == "DraftIssue"
    repo = content.get("repository") or {}
    return ProjectItem(
        item_id=node["id"],
        title=content.get("title") or "",
        status=(node.get("fieldValueByName") or {}).get("name")
        if node.get("fieldValueByName")
        else None,
        repo=None if is_draft else repo.get("nameWithOwner"),
        issue_number=None if is_draft else content.get("number"),
        is_draft=is_draft,
    )


def list_items(client: GitHubClient, board: ProjectBoard) -> list[ProjectItem]:
    """Lista todos os itens do quadro com paginação automática."""
    query = """
    query($projectId: ID!, $cursor: String) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              fieldValueByName(name: "Status") {
                ... on ProjectV2ItemFieldSingleSelectValue { name }
              }
              content {
                __typename
                ... on Issue {
                  title number
                  repository { nameWithOwner }
                }
                ... on DraftIssue { title }
                ... on PullRequest { title number repository { nameWithOwner } }
              }
            }
          }
        }
      }
    }
    """
    items: list[ProjectItem] = []
    cursor: str | None = None
    while True:
        data = client.graphql(query, {"projectId": board.id, "cursor": cursor})
        conn = data["node"]["items"]
        for node in conn["nodes"]:
            item = _parse_item(node)
            if item is not None:
                items.append(item)
        if not conn["pageInfo"]["hasNextPage"]:
            break
        cursor = conn["pageInfo"]["endCursor"]
    return items


# --------------------------------------------------------------------------
# Filtro de sprint por prefixo do título
# --------------------------------------------------------------------------

def compile_sprint_pattern(sprints: list[int]) -> re.Pattern:
    """Compila o padrão ^S<n>[-_\\s] para as sprints informadas (0-4 etc.)."""
    digits = "|".join(str(s) for s in sorted(set(sprints)))
    return re.compile(rf"^S({digits})[-_\s]", re.IGNORECASE)


def select_backlog_sprint_items(
    items: list[ProjectItem],
    sprints: list[int],
    from_status: str = "Backlog",
) -> tuple[list[ProjectItem], list[ProjectItem]]:
    """Divide os itens em (para_mover, backlog_fora_de_sprint).

    - `para_mover`: status == from_status e título casa com S<n>- de alguma
      sprint alvo. O número da sprint é anotado em `item.sprint`.
    - `backlog_fora_de_sprint`: continua em Backlog mas não casa nenhuma
      sprint alvo (só informativo, nunca é movido).
    """
    pattern = compile_sprint_pattern(sprints)
    to_move: list[ProjectItem] = []
    backlog_other: list[ProjectItem] = []
    for item in items:
        current = (item.status or "").strip().lower()
        if current != from_status.strip().lower():
            continue
        match = pattern.match(item.title.strip())
        if match:
            item.sprint = int(match.group(1))
            to_move.append(item)
        else:
            backlog_other.append(item)
    return to_move, backlog_other


# --------------------------------------------------------------------------
# Atualização de status
# --------------------------------------------------------------------------

def update_item_status(
    client: GitHubClient,
    board: ProjectBoard,
    item: ProjectItem,
    target_option_id: str,
) -> None:
    """Move um item para a coluna de status destino (idempotente na API)."""
    mutation = """
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }
    """
    client.graphql(
        mutation,
        {
            "projectId": board.id,
            "itemId": item.item_id,
            "fieldId": board.status_field_id,
            "optionId": target_option_id,
        },
    )
