# GitHub Projects v2 — Backlog → Done por Sprint

Script Python (apenas stdlib, sem dependências) que move cards de um GitHub
Projects v2 (Kanban) da coluna **Backlog** para **Done**, selecionando os itens
das **Sprints 0–4** identificadas pelo **prefixo do título** da issue
(`S0-`, `S1-`, `S2-`, `S3-`, `S4-`).

Funciona com issues comuns e com draft issues (cards sem issue vinculada).

## Por que o título e não o campo de iteração?

Este quadro não possui campo customizado de Iteração/Sprint. A convenção do
repositório é embutir a sprint no início do título (ex.: `S2- Implementar login`).
O padrão aceito é `^S<n>[-_\s]` (case-insensitive), ex.:

- `S0- Setup do repositório` ✔ (Sprint 0)
- `S1_api de dados` ✔ (Sprint 1)
- `S2 Documentar API` ✔ (Sprint 2)
- `Sprint 3` ✘ (não casa — não começa com `S<n>-`)
- `S9- ...` ✘ (fora das sprints alvo, configurável via `--sprints`)

## Estrutura modular

| Arquivo | Responsabilidade |
|---|---|
| `gh_client.py` | Cliente GraphQL com retry (502/503/504), timeout e erros claros |
| `projects_v2.py` | Domínio: descobrir quadro, ler campo Status, paginar itens, filtrar por sprint, atualizar status |
| `main.py` | CLI com subcomandos `discover` e `move`, dry-run por padrão, `--apply` |

## 1) Configurar o token (PAT)

O script lê o token de `GH_PROJECTS_TOKEN` (preferido) ou `GH_TOKEN`.

> **Importante (Freebuff):** o nome `GH_TOKEN` é reservado pela plataforma para
> o credential gerenciado do GitHub App (escopado só ao repositório, sem acesso
> a Projects do usuário). Por isso use **`GH_PROJECTS_TOKEN`**.

### Fine-grained PAT (recomendado)

1. GitHub → avatar → **Settings** → **Developer settings** →
   **Personal access tokens → Fine-grained tokens** → **Generate new token**.
2. **Expiration:** 30–90 dias (suficiente para a automação).
3. **Resource owner:** `joao0cb` (dono do quadro).
4. **Repository access:** `Only select repositories` → `joao0cb/Projeto-Agil-Curriculo`
   (necessário só para o `Metadata` automático; o quadro em si é do usuário).
5. **Account permissions → Projects:** `Read and write`.
   *(Se o quadro pertencer a uma organização, use em vez disso
   **Organization permissions → Projects: Read and write**.)*
6. **Generate token** e copie o valor (começa com `github_pat_`).

### Alternativa: classic PAT

- **Settings → Developer settings → Tokens (classic)** → **Generate new token (classic)**.
- Scopes obrigatórios: `repo` + `project` (Read and write access to projects).

## 2) Adicionar a variável no Freebuff

**Settings → Environment** → adicione:

| Chave | Valor |
|---|---|
| `GH_PROJECTS_TOKEN` | o PAT gerado acima |

(Após salvar, novas execuções de terminal já recebem a variável.)

## 3) Descobrir o quadro

```bash
python3 scripts/github_projects/main.py discover --owner joao0cb
# Quadros Projects v2 visíveis para 'joao0cb':
#   #3   Sprint Board  (ativo)
```

O número na primeira coluna é o `--project` do próximo passo.

## 4) Simular (dry-run) e aplicar

```bash
# Dry-run (padrão): mostra exatamente o que seria movido, sem tocar no quadro
python3 scripts/github_projects/main.py move --owner joao0cb --project 3

# Aplicar de verdade
python3 scripts/github_projects/main.py move --owner joao0cb --project 3 --apply
```

Saída do dry-run lista cada card candidato com sprint e origem:

```
Serão movidos:
  + S0  S0- Definir arquitetura  [joao0cb/Projeto-Agil-Curriculo#12]
  + S1  S1- Autenticação         [draft]
```

### Opções do `move`

| Opção | Padrão | Descrição |
|---|---|---|
| `--sprints 0 1 2 3 4` | `0 1 2 3 4` | Sprints alvo (prefixo `S<n>-` no título) |
| `--from` | `Backlog` | Coluna de origem |
| `--to` | `Done` | Coluna de destino |
| `--apply` | off | Sem isso, apenas simula |
| `--json` | off | Saída em JSON para CI/logs |

## Comportamento e tratamento de erros

- **Idempotente:** rodar duas vezes não duplica mudanças; cards já em `Done`
  simplesmente não são candidatos. Respostas de "já no destino" são contadas
  como `already_moved`.
- **Opção de status inexistente** (ex.: sem coluna `Done`): falha cedo com a
  lista das opções disponíveis — nada é movido parcialmente por isso.
- **Falha em um card** não interrompe os demais; erros são somarizados
  (`"errors"` no JSON) e o processo sai com código 1.
- **Quadro/sprint não encontrados:** `discover` lista o que é visível; o filtro
  ignora títulos fora do padrão e os reporta como `backlog_out_of_sprints`.
- **Rate limit/rede:** retries com backoff exponencial em 502/503/504.
- **Segredo:** o token nunca é impresso; só seu formato (ex.: `Fine-grained PAT`).

## Códigos de saída

| Código | Significado |
|---|---|
| `0` | Sucesso (inclui dry-run sem erros) |
| `1` | Concluído com erros em algum card (veja `errors`) |
| `2` | Falha fatal (token ausente/inválido, quadro ou coluna não encontrados) |
