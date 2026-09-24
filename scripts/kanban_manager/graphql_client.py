"""Cliente GraphQL resiliente sobre `gh api graphql` (usa a credencial do ambiente).

O token nunca é lido aqui: o `gh` resolve GH_TOKEN/GITHUB_TOKEN/App token
automaticamente, o que mantém o módulo compatível com PATs e credenciais
gerenciadas. Erros conhecidos viram exceções tipadas; falhas transitórias
(rede/rate limit/5xx) são reexecutadas com backoff exponencial + jitter.
"""
from __future__ import annotations

import json
import random
import subprocess
import time
from dataclasses import dataclass
from typing import Any, Mapping


class GraphQLError(RuntimeError):
    """Erro de execução GraphQL reportado pela API do GitHub."""

    def __init__(self, message: str, *, type_: str = "GraphQLError") -> None:
        super().__init__(message)
        self.type = type_


class GhClientError(RuntimeError):
    """Falha ao executar o `gh` (binário ausente, credencial inválida, rede)."""


@dataclass(frozen=True)
class RetryPolicy:
    """Parâmetros de reexecução para falhas transitórias."""

    max_retries: int = 4
    base_delay: float = 1.0
    max_delay: float = 20.0
    timeout: int = 30

    # Erros que valem nova tentativa: rede instável, rate limit e 5xx.
    RETRYABLE = (
        "Couldn't resolve host",
        "Connection timed out",
        "connection refused",
        "SSL",
        "ECONNRESET",
        "rate limit",
        "abuse detection",
        "Bad credentials",  # token de curta duração pode ser remintado pelo wrapper
        "502",
        "503",
        "504",
        "timeout",
    )


def _is_retryable(stderr: str) -> bool:
    lowered = stderr.lower()
    return any(marker.lower() in lowered for marker in RetryPolicy.RETRYABLE)


def _sleep_with_backoff(attempt: int, policy: RetryPolicy) -> None:
    delay = min(policy.max_delay, policy.base_delay * (2 ** (attempt - 1)))
    time.sleep(delay + random.uniform(0, 0.5))


class GraphQLClient:
    """Executa queries/mutations GraphQL via `gh api graphql`."""

    def __init__(self, policy: RetryPolicy | None = None) -> None:
        self.policy = policy or RetryPolicy()
        self._validate_gh_installation()

    @staticmethod
    def _validate_gh_installation() -> None:
        try:
            subprocess.run(
                ["gh", "--version"],
                capture_output=True,
                check=True,
                timeout=10,
            )
        except FileNotFoundError as exc:
            raise GhClientError(
                "O binário `gh` não foi encontrado. Instale o GitHub CLI: https://cli.github.com/"
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise GhClientError("O comando `gh --version` não respondeu (timeout).") from exc
        except subprocess.CalledProcessError as exc:
            raise GhClientError(f"`gh --version` falhou: {exc.stderr.decode(errors='ignore')}") from exc

    def execute(
        self,
        query: str,
        variables: Mapping[str, Any] | None = None,
        *,
        operation_name: str = "graphql",
    ) -> dict[str, Any]:
        """Executa uma operação GraphQL e devolve o objeto `data`.

        Erros GraphQL viram `GraphQLError`; falhas transitórias são reexecutadas
        com backoff exponencial + jitter até `max_retries` tentativas.
        """
        payload: dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = dict(variables)

        last_error: Exception | None = None
        for attempt in range(1, self.policy.max_retries + 1):
            try:
                proc = subprocess.run(
                    [
                        "gh", "api", "graphql",
                        "-H", "X-Github-Next-Global-ID: 1",  # IDs em formato global estável
                        "--input", "-",  # body JSON com {query, variables} via stdin
                    ],
                    input=json.dumps(payload).encode(),
                    capture_output=True,
                    timeout=self.policy.timeout,
                    check=False,
                )
            except subprocess.TimeoutExpired as exc:
                last_error = GhClientError(f"`gh api graphql` excedeu {self.policy.timeout}s.")
                if attempt < self.policy.max_retries:
                    _sleep_with_backoff(attempt, self.policy)
                continue

            stderr = proc.stderr.decode(errors="ignore")
            if proc.returncode != 0:
                if _is_retryable(stderr) and attempt < self.policy.max_retries:
                    _sleep_with_backoff(attempt, self.policy)
                    continue
                raise GhClientError(
                    f"`gh api graphql` falhou (exit {proc.returncode}): {stderr.strip() or 'sem stderr'}"
                )

            try:
                body = json.loads(proc.stdout.decode())
            except json.JSONDecodeError as exc:
                raise GhClientError(f"Resposta não-JSON do gh: {proc.stdout.decode(errors='ignore')[:200]!r}") from exc

            if "errors" in body:
                if self._is_throttled(body["errors"]) and attempt < self.policy.max_retries:
                    _sleep_with_backoff(attempt, self.policy)
                    continue
                first = body["errors"][0]
                raise GraphQLError(
                    str(first.get("message", body["errors"])),
                    type_=str(first.get("type", "GraphQLError")),
                )

            if "data" not in body:
                raise GhClientError(f"Resposta inesperada do gh: {str(body)[:200]}")

            return body["data"]

        raise GhClientError(f"Falha transitória persistente após {self.policy.max_retries} tentativas: {last_error}")

    @staticmethod
    def _is_throttled(errors: list[dict[str, Any]]) -> bool:
        joined = " ".join(str(e.get("message", "")) for e in errors).lower()
        return "rate limit" in joined or "abuse" in joined
