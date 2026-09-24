#!/usr/bin/env python3
"""Move cards de uma coluna do GitHub Projects v2 com base na sprint (prefixo do título).

Uso típico (a partir da raiz do projeto):

    # 1) Descobrir os quadros disponíveis do usuário
    python3 scripts/github_projects/main.py discover --owner joao0cb

    # 2) Simular (dry-run padrão) — mostra o que seria movido, sem alterar nada
    python3 scripts/github_projects/main.py move --owner joao0cb --project 3

    # 3) Aplicar de fato
    python3 scripts/github_projects/main.py move --owner joao0cb --project 3 --apply

Opções úteis:
    --sprints 0 1 2 3 4   Sprints alvo via prefixo do título (padrão: 0 1 2 3 4)
    --from Backlog        Coluna de origem (padrão: Backlog)
    --to Done             Coluna de destino (padrão: Done)
    --json                Saída em JSON (útil para CI)

Token: lido de GH_PROJECTS_TOKEN ou GH_TOKEN. Nunca é impresso em logs.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

# Permite execução direta (python scripts/github_projects/main.py)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gh_client import GitHubClient, GitHubAPIError, describe_token
import projects_v2 as pv

TARGET_SPRINTS_DEFAULT = [0, 1, 2, 3, 4]


def resolve_token(cli_token: str | None) -> str:
    """Resolve o token: CLI > GH_PROJECTS_TOKEN > GH_TOKEN (nunca imprime o valor)."""
    token = cli_token or os.environ.get("GH_PROJECTS_TOKEN") or os.environ.get("GH_TOKEN") or ""
    if not token:
        raise GitHubAPIError(
            "Token não encontrado. Defina GH_TOKEN (ou GH_PROJECTS_TOKEN) no ambiente.\n"
            "O PAT precisa de: repo (ou acesso ao repositório) + project (read/write)."
        )
    return token


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="main.py",
        description="Move cards do GitHub Projects v2 (Backlog -> Done) por sprint no título.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    def add_common(p: argparse.ArgumentParser) -> None:
        p.add_argument("--owner", required=True, help="Login do usuário/org dono do quadro")
        p.add_argument("--token", help="Sobrescreve o token (evite; prefira variáveis de ambiente)")
        p.add_argument("--json", action="store_true", help="Saída em JSON")

    d = sub.add_parser("discover", help="Lista quadros Projects v2 visíveis para o token")
    add_common(d)

    m = sub.add_parser("move", help="Move cards de --from para --to conforme sprints no título")
    add_common(m)
    m.add_argument("--project", type=int, required=True, help="Número do quadro Projects v2")
    m.add_argument("--sprints", type=int, nargs="+", default=TARGET_SPRINTS_DEFAULT,
                   help="Sprints alvo (prefixo S<n>- no título). Padrão: 0 1 2 3 4")
    m.add_argument("--from", dest="from_status", default="Backlog", help="Coluna de origem")
    m.add_argument("--to", dest="to_status", default="Done", help="Coluna de destino")
    m.add_argument("--apply", action="store_true",
                   help="Executa as mudanças (sem isso, apenas simula / dry-run)")
    return parser


def cmd_discover(args: argparse.Namespace) -> int:
    client = GitHubClient(resolve_token(args.token))
    boards = pv.discover_boards(client, args.owner)
    if args.json:
        print(json.dumps({"owner": args.owner, "boards": boards}, ensure_ascii=False, indent=2))
    else:
        print(f"Quadros Projects v2 visíveis para '{args.owner}':")
        if not boards:
            print("  (nenhum quadro visível — verifique se o PAT tem acesso ao projeto)")
        for b in boards:
            estado = "arquivado" if b["closed"] else "ativo"
            print(f"  #{b['number']:<3} {b['title']}  ({estado})")
    return 0


def cmd_move(args: argparse.Namespace) -> int:
    client = GitHubClient(resolve_token(args.token))

    # Diagnóstico silencioso do formato do token (sem expor o valor).
    shape = describe_token(resolve_token(args.token))
    if not args.json:
        print(f"Token: {shape}")

    board = pv.get_board(client, args.owner, args.project)
    pv.load_status_field(client, board)
    target_option_id = pv.option_id_for(board, args.to_status)
    source_option_exists = True
    try:
        pv.option_id_for(board, args.from_status)
    except GitHubAPIError:
        source_option_exists = False

    items = pv.list_items(client, board)
    to_move, backlog_other = pv.select_backlog_sprint_items(
        items, args.sprints, from_status=args.from_status
    )

    by_sprint: dict[int, int] = {}
    for item in to_move:
        by_sprint[item.sprint] = by_sprint.get(item.sprint, 0) + 1

    summary = {
        "board": {"owner": board.owner, "number": board.number, "title": board.title},
        "from": args.from_status,
        "to": args.to_status,
        "sprints": args.sprints,
        "source_column_exists": source_option_exists,
        "total_items": len(items),
        "candidates": len(to_move),
        "candidates_by_sprint": {f"S{k}": v for k, v in sorted(by_sprint.items())},
        "backlog_out_of_sprints": len(backlog_other),
        "moved": 0,
        "already_moved": 0,
        "errors": [],
        "dry_run": not args.apply,
    }

    def human_line(item: pv.ProjectItem) -> str:
        origem = "draft" if item.is_draft else f"{item.repo}#{item.issue_number}"
        return f"S{item.sprint}  {item.title}  [{origem}]"

    if args.json:
        summary["candidates_list"] = [human_line(i) for i in to_move]
    else:
        print(f"\nQuadro: {board.title} (#{board.number}, dono: {board.owner})")
        print(f"Colunas: {args.from_status} -> {args.to_status} | Sprints alvo: {args.sprints}")
        print(f"Itens no quadro: {len(items)} | Candidatos: {len(to_move)} "
              f"| Backlog fora das sprints: {len(backlog_other)}")
        if to_move:
            print("\nSerão movidos:")
            for item in to_move:
                print(f"  + {human_line(item)}")
        if backlog_other:
            print("\nContinuam em Backlog (não casam S0-..S4-):")
            for item in backlog_other[:15]:
                print(f"  - {item.title}")
            if len(backlog_other) > 15:
                print(f"  ... e mais {len(backlog_other) - 15}")

    if not args.apply:
        if not args.json:
            print("\nDRY-RUN: nenhuma alteração foi feita. Use --apply para mover de verdade.")
        if args.json:
            print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0

    print("\nAplicando movimentações...")
    for item in to_move:
        try:
            pv.update_item_status(client, board, item, target_option_id)
            summary["moved"] += 1
            if not args.json:
                print(f"  movido: {human_line(item)}")
        except GitHubAPIError as exc:
            # Idempotência: se o card já estiver no destino, seguimos.
            if "already" in str(exc).lower() or "not found" in str(exc).lower():
                summary["already_moved"] += 1
                if not args.json:
                    print(f"  já no destino (ignorado): {human_line(item)}")
            else:
                summary["errors"].append({"item": human_line(item), "error": str(exc)[:300]})
                if not args.json:
                    print(f"  ERRO: {human_line(item)} -> {exc}")

    summary["backlog_out_of_sprints"] = len(backlog_other)
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(f"\nConcluído: {summary['moved']} movido(s), "
              f"{summary['already_moved']} já estavam no destino, "
              f"{len(summary['errors'])} erro(s).")
    return 1 if summary["errors"] else 0


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "discover":
            return cmd_discover(args)
        return cmd_move(args)
    except GitHubAPIError as exc:
        print(f"FALHA: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
