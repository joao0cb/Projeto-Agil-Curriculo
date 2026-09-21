#!/usr/bin/env bash
# Sincroniza o kanban do GitHub Project #1 (joao0cb) com as atividades das sprints.
#
# Pré-requisito: o token usado pelo `gh` precisa ter permissão de ESCRITA no
# Project (Projects: write). O app do Freebuff atualmente só consegue adicionar
# itens; quando a permissão for liberada, rode:  sh ./scripts/sync-kanban.sh
#
# O que faz:
#   1. Define o Status de cada issue de atividade (Done / In progress / Ready / Backlog)
#   2. Arquiva os cards antigos das sprints completas (#1–#9)
set -euo pipefail

PROJECT_ID="PVT_kwHOChVHHs4Bjcuj"
FIELD_ID="PVTSSF_lAHOChVHHs4BjcujzhiQ-jE"
REPO="joao0cb/Projeto-Agil-Curriculo"

# IDs das opções do campo Status
OPT_DONE="98236657"
OPT_READY="61e4505c"
OPT_INPROGRESS="47fc9ee4"
OPT_BACKLOG="f75ad846"

status_for() {
  case "$1" in
    Done) echo "$OPT_DONE";;
    Ready) echo "$OPT_READY";;
    Inprogress) echo "$OPT_INPROGRESS";;
    *) echo "$OPT_BACKLOG";;
  esac
}

issue_id() {
  gh api "repos/$REPO/issues/$1" --jq '.id'
}

set_status() {
  local num="$1" status="$2"
  local content_id item opt
  content_id=$(issue_id "$num")
  item=$(gh api graphql -f query="mutation { add: addProjectV2ItemById(input:{projectId:\"$PROJECT_ID\", contentId:\"$content_id\"}) { item { id } } }" --jq '.data.add.item.id' 2>/dev/null || true)
  if [ -z "$item" ]; then
    item=$(gh api graphql -f query='{ user(login:"joao0cb") { projectV2(number:1) { items(first:100) { nodes { id content { ... on Issue { number } } } } } } }' --jq ".data.user.projectV2.items.nodes[] | select(.content.number == $num) | .id")
  fi
  opt=$(status_for "$status")
  gh api graphql -f query="mutation { u: updateProjectV2ItemFieldValue(input:{projectId:\"$PROJECT_ID\", itemId:\"$item\", fieldId:\"$FIELD_ID\", value:{singleSelectOptionId:\"$opt\"}}) { projectV2Item { id } } }" > /dev/null
  echo "OK #$num -> $status"
}

# issue status
while IFS='|' read -r num status; do
  [ -z "$num" ] && continue
  set_status "$num" "$status"
done <<'EOF'
12|Done
13|Done
14|Backlog
15|Done
16|Backlog
17|Done
18|Done
19|Done
20|Done
21|Backlog
22|Backlog
23|Backlog
24|Backlog
25|Backlog
26|Done
27|Backlog
28|Backlog
29|Done
30|Done
31|Done
32|Done
33|Done
34|Done
35|Done
36|Done
37|Done
38|Inprogress
39|Inprogress
40|Inprogress
41|Ready
42|Ready
43|Backlog
44|Backlog
45|Backlog
46|Backlog
47|Backlog
48|Backlog
49|Backlog
50|Backlog
51|Backlog
52|Backlog
53|Backlog
54|Backlog
55|Backlog
56|Backlog
57|Backlog
EOF

# Arquiva os cards das sprints completas (sprint = documento, não card de atividade)
gh api graphql -f query='{ user(login:"joao0cb") { projectV2(number:1) { items(first:100) { nodes { id content { ... on Issue { number title } } } } } } }' --jq '.data.user.projectV2.items.nodes[] | select(.content.title | startswith("Sprint ")) | .id' | while read -r item_id; do
  gh api graphql -f query="mutation { a: archiveProjectV2Item(input:{projectId:\"$PROJECT_ID\", itemId:\"$item_id\"}) { item { id } } }" > /dev/null
  echo "Arquivado: $item_id"
done

echo "Kanban sincronizado."
