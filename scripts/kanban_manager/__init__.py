"""Gerenciador de kanban para GitHub Projects v2 (API GraphQL via gh CLI).

Módulos:
    config          — configuração (env vars + CLI) e validações
    graphql_client  — cliente GraphQL resiliente sobre `gh api graphql`
    projects_api    — operações do Projects v2 (campos, itens, update de status)
    sprint_resolver — identificação da sprint de um card
    mover           — orquestração Backlog → Done com resumo
    cli             — linha de comando (`python3 scripts/move_backlog_to_done.py`)
"""
