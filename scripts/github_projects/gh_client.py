"""Cliente GraphQL mínimo para a API do GitHub (apenas stdlib).

Responsabilidades:
- Autenticar requisições com o token informado (GH_TOKEN / GH_PROJECTS_TOKEN).
- Executar queries e mutations GraphQL com retry em erros transitórios.
- Traduzir falhas HTTP/GraphQL em `GitHubAPIError` com mensagens acionáveis.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request

GRAPHQL_URL = "https://api.github.com/graphql"

# Prefixos públicos de token do GitHub — usados apenas para diagnóstico,
# nunca para exibir o valor do segredo.
_TOKEN_SHAPES = {
    "github_pat_": "Fine-grained PAT",
    "ghp_": "Classic PAT",
    "gho_": "OAuth token",
    "ghs_": "GitHub App token (escopado, não é um PAT pessoal)",
    "ghu_": "GitHub App user token",
}


class GitHubAPIError(RuntimeError):
    """Erro retornado pela API do GitHub (HTTP ou GraphQL)."""


def describe_token(token: str) -> str:
    """Descreve o formato do token sem expor o valor."""
    for prefix, label in _TOKEN_SHAPES.items():
        if token.startswith(prefix):
            return label
    return "Formato desconhecido"


class GitHubClient:
    """Cliente HTTP para a API GraphQL do GitHub."""

    def __init__(
        self,
        token: str,
        api_url: str = GRAPHQL_URL,
        max_retries: int = 4,
        timeout_seconds: int = 30,
    ) -> None:
        if not token or not token.strip():
            raise GitHubAPIError(
                "Token ausente. Defina a variável de ambiente GH_TOKEN "
                "(ou GH_PROJECTS_TOKEN) com um PAT que tenha acesso ao quadro."
            )
        self._token = token.strip()
        self._api_url = api_url
        self._max_retries = max_retries
        self._timeout = timeout_seconds

    def graphql(self, query: str, variables: dict | None = None) -> dict:
        """Executa uma query/mutation GraphQL e retorna o campo `data`."""
        payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
            "Accept": "application/vnd.github+json",
            "User-Agent": "projects-backlog-mover/1.0",
        }

        last_error: str | None = None
        for attempt in range(1, self._max_retries + 1):
            request = urllib.request.Request(
                self._api_url, data=payload, headers=headers, method="POST"
            )
            try:
                with urllib.request.urlopen(request, timeout=self._timeout) as response:
                    body = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")
                # 502/503/504 são transitórios; o restante falha direto com mensagem clara.
                if exc.code in (502, 503, 504) and attempt < self._max_retries:
                    last_error = f"HTTP {exc.code}: {detail[:300]}"
                    time.sleep(2**attempt)
                    continue
                raise GitHubAPIError(
                    f"HTTP {exc.code} na API do GitHub: {detail[:500]}"
                ) from exc
            except urllib.error.URLError as exc:
                last_error = f"Erro de rede: {exc.reason}"
                if attempt < self._max_retries:
                    time.sleep(2**attempt)
                    continue
                raise GitHubAPIError(last_error) from exc

            data = body.get("data")
            if data is None:
                if body.get("errors"):
                    raise GitHubAPIError(
                        "GraphQL retornou erros: "
                        + json.dumps(body["errors"], ensure_ascii=False)[:800]
                    )
                raise GitHubAPIError(f"Resposta inesperada da API: {str(body)[:500]}")
            # Dados parciais (data + errors) são permitidos: ocorre quando um
            # campo opcional falha (ex.: owner pode ser User OU Organization).
            # Quem chama valida os campos de que precisa.
            return data

        raise GitHubAPIError(f"Falha após {self._max_retries} tentativas: {last_error}")
