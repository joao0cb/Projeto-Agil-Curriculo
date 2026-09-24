"""Configuração e validação — env vars + CLI → dataclass imutável."""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable

# -- Constantes do domínio -----------------------------------------------------

SOURCE_COLUMN = "Backlog"
TARGET_COLUMN = "Done"
GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql"

# Padrão de nomenclatura do repositório (ver README.md): issues "S0-1 — ...".
# Número da sprint fica no prefixo "S<N>"; trackers usam "Sprint <N>".
SPRINT_TITLE_PATTERN = r"^S(\d+)-\d+"
TRACKER_TITLE_PATTERN = r"(?i)sprint\s*0*(\d+)"

# Campo customizado opcional de iteração/sprint (Projects v2). Se existir no
# quadro, tem prioridade sobre a detecção por título.
ITERATION_FIELD_CANDIDATES = ("Sprint", "Iteração", "Iteration", "Sprint/Iteração")


class ConfigError(ValueError):
    """Erro de configuração (token ausente, parâmetros inválidos, etc.)."""


@dataclass(frozen=True)
class Settings:
    """Configuração resolvida de uma execução."""

    owner: str
    project_number: int
    sprints: tuple[int, ...]
    source_column: str = SOURCE_COLUMN
    target_column: str = TARGET_COLUMN
    dry_run: bool = False
    timeout: int = 30
    max_retries: int = 4
    per_page: int = 100

    def sprint_label(self) -> str:
        return ", ".join(f"Sprint {n}" for n in self.sprints)


def _parse_sprints(raw: Iterable[str]) -> tuple[int, ...]:
    """Converte strings como "0, 1, 2" em tupla ordenada de ints únicos (> 0)."""
    numbers: set[int] = set()
    for chunk in raw:
        for token in str(chunk).replace(";", ",").split(","):
            token = token.strip()
            if not token:
                continue
            try:
                value = int(token)
            except ValueError as exc:
                raise ConfigError(f"Sprint inválida: {token!r} (use números, ex.: 0,1,2)") from exc
            if value < 0:
                raise ConfigError("O número da sprint não pode ser negativo.")
            numbers.add(value)
    if not numbers:
        raise ConfigError("Nenhuma sprint informada (use --sprints ou TARGET_SPRINTS).")
    return tuple(sorted(numbers))


def load_settings(
    *,
    owner_arg: str | None = None,
    project_number_arg: int | None = None,
    sprints_arg: Iterable[str] | None = None,
    dry_run: bool = False,
) -> Settings:
    """Resolve a configuração a partir de argumentos CLI com fallback para env.

    Precedência: argumento CLI > variável de ambiente > erro.
    """
    owner = owner_arg or os.environ.get("GH_PROJECT_OWNER")
    if not owner:
        raise ConfigError(
            "Informe o dono do projeto via --owner ou na variável GH_PROJECT_OWNER "
            "(login do usuário ou organização)."
        )

    raw_number = project_number_arg or os.environ.get("GH_PROJECT_NUMBER")
    if not raw_number:
        raise ConfigError(
            "Informe o número do projeto via --project-number ou na variável GH_PROJECT_NUMBER."
        )
    try:
        project_number = int(raw_number)
    except (TypeError, ValueError) as exc:
        raise ConfigError(f"GH_PROJECT_NUMBER deve ser um inteiro (recebido: {raw_number!r}).") from exc

    raw_sprints: Iterable[str] | None = sprints_arg
    if not raw_sprints:
        env_sprints = os.environ.get("TARGET_SPRINTS")
        raw_sprints = [env_sprints] if env_sprints else None
    if not raw_sprints:
        raise ConfigError(
            "Informe as sprints alvo via --sprints (ex.: --sprints 0,1,2) "
            "ou na variável TARGET_SPRINTS (ex.: 0,1,2,3,4)."
        )

    sprints = _parse_sprints(raw_sprints)

    try:
        timeout = int(os.environ.get("GH_GRAPHQL_TIMEOUT", "30"))
        max_retries = int(os.environ.get("GH_GRAPHQL_MAX_RETRIES", "4"))
        per_page = max(1, min(int(os.environ.get("GH_PROJECT_PER_PAGE", "100")), 100))
    except ValueError as exc:
        raise ConfigError("GH_GRAPHQL_TIMEOUT / GH_GRAPHQL_MAX_RETRIES devem ser inteiros.") from exc

    return Settings(
        owner=owner,
        project_number=project_number,
        sprints=sprints,
        source_column=os.environ.get("SOURCE_COLUMN", SOURCE_COLUMN),
        target_column=os.environ.get("TARGET_COLUMN", TARGET_COLUMN),
        dry_run=dry_run or os.environ.get("DRY_RUN", "").lower() in {"1", "true", "yes"},
        timeout=max(5, timeout),
        max_retries=max(1, max_retries),
        per_page=per_page,
    )
