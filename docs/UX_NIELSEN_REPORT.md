# Relatório — Aplicação das 10 Heurísticas de Nielsen por Tela

**Escopo:** App shell (Dashboard/navegação), Insumos (listagem, ficha, cadastro), Manutenção (chamados, preventivas, calibrações) e elementos compartilhados (Modal, StatusBadge). Verificado no código atual, pós-auditoria UX (Etapa 2 concluída).

---

## 1. App Shell / Dashboard (`App.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 — Visibilidade do status | ✅ Implementada | Skeleton animado nos KPIs durante carregamento; "Laboratórios — Em breve" rotula dado indisponível em vez de "—" solto; alerta de estoque baixo em `role="alert"` no topo |
| H2 — Mundo real | ⚠️ Parcial | Linguagem de laboratório correta; porém contadores não explicam de onde vêm os números |
| H3 — Controle e liberdade | ⚠️ Parcial | Navegação livre entre abas; mas sem "voltar" explícito ou breadcrumb (aplicável ao surgirem rotas) |
| H4 — Consistência | ✅ Implementada | Abas seguem o mesmo padrão visual da tablist de Manutenção; `aria-current="page"` na aba ativa |
| H5 — Prevenção de erros | ➖ Não aplicável | Nenhuma ação destrutiva nesta tela |
| H6 — Reconhecimento | ✅ Implementada | Ícones + rótulos nas abas (Package, Wrench); nada para memorizar |
| H7 — Flexibilidade | ⚠️ Parcial | **Corrigido na Etapa 2:** estado preservado entre abas (páginas montadas com `hidden`); sem atalhos de teclado |
| H8 — Minimalismo | ✅ Implementada | **Corrigido:** texto de roadmap removido; sem IDs técnicos expostos |
| H9 — Diagnóstico de erros | ⚠️ Parcial | Falha de query no dashboard **derruba a tela** (sem error boundary aqui — só em Insumos) |
| H10 — Ajuda | ❌ Ausente | KPIs sem explicação do que significam (auditado como 10.3) |

---

## 2. Insumos — Listagem (`SupplyList.tsx` + `InsumosPage.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 | ✅ | "Carregando insumos…" em `role="status"` `aria-live="polite"` |
| H2 | ✅ | Placeholder "Buscar por nome, código ou categoria…"; termos do domínio (lote, saldo, mínimo) |
| H3 | ✅ | Filtros combináveis e removíveis a qualquer momento; seleção de ficha reversível |
| H4 | ✅ | Padrão de filtro igual ao de Chamados (label + select); badge de nível de estoque reutilizado da ficha |
| H5 | ✅ | Empty state sugere a ação correta conforme contexto (com/sem filtros) |
| H6 | ✅ | Busca visível permanentemente; filtros sempre à vista — nada na memória |
| H7 | ✅ | Busca ao digitar (sem botão "buscar"); contagem no filtro "Só estoque baixo (n)" mostra resultado antes de aplicar |
| H8 | ✅ | Cards de linha compactos; só informações de decisão |
| H9 | ✅ | **Corrigido na Etapa 2:** falha de query exibida via `QueryErrorBoundary` com botão "Tentar novamente" (antes `error={null}` hardcodado — 9.1) |
| H10 | ⚠️ Parcial | Empty state orienta; sem tooltips sobre estoque mínimo/validade (10.1, Sprint 8) |

---

## 3. Insumos — Cadastro (`SupplyForm.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 | ✅ | Botão "Salvando…" durante a mutation; modal bloqueia interação de fundo |
| H2 | ✅ | Placeholders com exemplos reais ("Ex.: Reagente, Vidraria") |
| H3 | ✅ | Cancelar sempre disponível; **descarte de dados confirmado** (guarda `isDirty` no Modal base — 3.2) |
| H4 | ✅ | Campos com `*` = obrigatório, alinhado aos outros formulários |
| H5 | ✅ | **Corrigido:** validação por campo no domínio (`validateSupplyDraftFields`); regra lote/validade condicional ao saldo inicial; limpar número não vira `0` silencioso (5.4) |
| H6 | ✅ | Labels sempre visíveis; placeholders com exemplos |
| H7 | ✅ | Layout em grid 2 colunas; marca/fornecedor opcionais separados dos obrigatórios |
| H8 | ✅ | `*` só muda quando a regra exige; sem campos de enrolação |
| H9 | ✅ | **Corrigido:** erro junto ao campo com `aria-invalid`/`aria-describedby` (9.2); mensagem de mutation com caminho de volta ("seus dados continuam preenchidos…") |
| H10 | ⚠️ Parcial | Sem tooltips de domínio (o que é "lote"? — 10.1) |

---

## 4. Insumos — Ficha/Movimentação (`SupplyDetail.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 | ✅ | Saldo, mínimo, nível e validade sempre visíveis no topo da ficha; "Registrando…" no botão; sucesso em `role="status"` |
| H2 | ✅ | "+/−" com cores e sinal textual no histórico; "Validade próxima — X dia(s) — atenção!" |
| H3 | ✅ | Fechar ficha com dados não salvos pede confirmação (`isDirty`); tipo entrada/saída alternável |
| H4 | ✅ | `StockLevelBadge` reutilizado da listagem; formatos de data consistentes (pt-BR) |
| H5 | ✅ | Saída maior que saldo **bloqueada no frontend** (`MOVEMENT_BALANCE_INSUFICIENTE`) e revalidada no backend; quantidade ≤ 0 bloqueada |
| H6 | ✅ | Saldo atual sempre visível enquanto digita a saída — usuário não precisa lembrar quanto tem |
| H7 | ⚠️ Parcial | Histórico sem paginação/janela (7.3) |
| H8 | ✅ | Histórico resumido; detalhes opcionais colapsados |
| H9 | ✅ | Erro em `role="alert"` junto ao form; sucesso distinto de erro |
| H10 | ⚠️ Parcial | Bloqueio de reserva do domínio sem explicação inline |

---

## 5. Manutenção — Chamados (`ManutencaoPage.tsx` + `TicketRow.tsx` + `ChamadoForm.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 | ✅ | **Corrigido:** transição de status com "Aplicando…" no botão (1.1); loading na listagem; erro da mutation agora visível em `role="alert"` no card (9.3) |
| H2 | ✅ | **Corrigido:** símbolos distintos por estado (◔/⚙/⊘/✕); "Aberto"=âmbar (fila), "Cancelado"=neutro; "solicitante" em vez de "responsável" (2.4); "Nº de série" (2.5) |
| H3 | ✅ | **Corrigido:** Cancelar/Concluir pedem confirmação (3.3); modal fecha por Escape/backdrop com guarda de descarte |
| H4 | ✅ | **Corrigido:** mapa `CHAMADO_LABEL` local eliminado — rótulo/variante/símbolo vêm do `StatusBadge` único (4.1) |
| H5 | ✅ | Botões de transição desabilitados para transições inválidas; validação dupla (frontend `validateTicketDraft` + backend); prioridade via radio pré-selecionado |
| H6 | ⚠️ Parcial | Status/prioridade sempre visíveis; **pendência S1–S2:** formulário sem seleção real de equipamento (5.1/6.1) e IDs crus na listagem |
| H7 | ✅ | Filtro de status acessível e sempre visível; sem atalhos (global) |
| H8 | ✅ | **Corrigido:** aviso de bloqueio de reserva só no chamado "em andamento" (8.1) — antes repetia em todo card não-finalizado |
| H9 | ✅ | **Corrigido:** erro da mutation de status com mensagem ("o status continua o mesmo"); erro do form com próximo passo; `aria-live` |
| H10 | ❌ Ausente | Sem tooltips sobre prioridades/bloqueio de reserva (10.1) |

---

## 6. Manutenção — Preventivas (`PreventivaForm.tsx` + seção na `ManutencaoPage.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 | ✅ | "Registrando…" no botão; estado da preventiva (Programada/Concluída) via `StatusBadge` |
| H2 | ✅ | **Corrigido:** seletor mostra "{tipo} — Equipamento: {id}" em vez de executar na preventiva errada; "Última execução por" (mais claro) |
| H3 | ✅ | Descarte confirmado; cancelar disponível |
| H4 | ✅ | **Corrigido:** badge slate local → `StatusBadge` compartilhado (4.2) |
| H5 | ✅ | **Bug 5.2 corrigido:** data e observação coletadas são **enviadas**; seletor obrigatório (fim do `taskId` fixo "preventiva-demo"); validação por campo |
| H6 | ✅ | **Corrigido:** seletor lista preventivas pendentes por tipo+equipamento — não precisa decorar IDs |
| H7 | ✅ | Data já vem preenchida com hoje; botão desabilitado quando não há preventivas pendentes |
| H8 | ✅ | Form com 3 campos, nada além |
| H9 | ✅ | Erro em `role="alert"` com caminho de volta; erros por campo com `aria-invalid` |
| H10 | ❌ Ausente | Sem explicação do que significa "registrar execução" para novatos (Sprint 8) |

---

## 7. Manutenção — Calibrações (`CalibracaoCard.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 | ✅ | Data e resultado (Aprovado/Reprovado) imediatamente visíveis |
| H2 | ✅ | **Corrigido:** badge via `StatusBadge` — símbolo/cor/descrição consistentes com o resto do app; `title`/`aria-label` explicam o resultado |
| H3 | ➖ Não aplicável | Tela somente-leitura |
| H4 | ✅ | Mesma fonte de status do app inteiro |
| H5 | ➖ Não aplicável | Sem ações nesta tela (registro via form dedicado, não auditado — sem componente próprio ainda) |
| H6 | ⚡ Parcial | Responsável e certificado visíveis; **pendência:** mostra `responsibleId` cru e não mostra qual equipamento foi calibrado |
| H7 | ➖ Não aplicável | Somente-leitura |
| H8 | ✅ | Card mínimo: data, resultado, responsável, certificado, nota |
| H9 | ➖ Não aplicável | Sem entrada do usuário |
| H10 | ⚖️ Parcial | `title` no badge explica o resultado; sem ajuda sobre laudos/certificados |

---

## 8. Elementos compartilhados (`Modal.tsx`, `StatusBadge.tsx`)

| Heurística | Status | Onde |
|---|---|---|
| H1 | ✅ | Símbolo+cor+texto+`title` no badge — status sempre evidente |
| H3 | ✅ | **Modal:** Escape, focus trap, retorno de foco, guarda de descarte com confirmação (3.1/3.2) |
| H4 | ✅ | **Modal/StatusBadge:** padrão único de diálogo e de status no app inteiro |
| H6 | ✅ | `aria-label` do badge inclui descrição do estado |
| H9 | ✅ | Badge legível por cor **e** texto (não só cor) — base do H9 em todas as telas |
| H10 | ✅ | `title`/`aria-label` descrevem cada estado |
| H2/H5/H7/H8 | ✅ | Modal: scroll lock + foco inicial (H5); badge: paleta de 5 variantes sem exagero (H8) |

---

## Síntese geral

| Heurística | Cobertura |
|---|---|
| H1 — Visibilidade do status | ✅ Forte em todas as telas (loading/sucesso/erro/estado de espera nos botões) |
| H2 — Mundo real | ✅ Forte após correções (símbolos, semântica de cor, linguagem) — pendem IDs crus (S1–S2) |
| H3 — Controle e liberdade | ✅ Forte após Modal base + confirmações destrutivas |
| H4 — Consistência | ✅ Forte após fonte única de rótulos/status |
| H5 — Prevenção de erros | ✅ Forte após validação por campo + validação dupla frontend/backend |
| H6 — Reconhecimento | ⚠️ Único ponto fraco real: **IDs técnicos expostos** (equipamento/responsável) — bloqueado pelos módulos S1–S2 |
| H7 — Flexibilidade | ⚠️ Estado entre abas resolvido; faltam atalhos de teclado e paginação (oportunidade, não defeito) |
| H8 — Minimalismo | ✅ Forte após remoção do roadmap e do aviso repetido |
| H9 — Diagnóstico de erros | ✅ Forte após boundary de query + erros em mutation nunca silenciosos |
| H10 — Ajuda/documentação | ❌ **Única heurística sistemicamente ausente** — sem tooltips/guia rápido; planejada para a Sprint 8 (8.3/8.5) |

**Único gap sistêmico:** H10 (ajuda) — planejada, mas não implementada. Os demais pontos fracos (H6/IDs, H7/atalhos) dependem de sprints futuras ou são oportunidades, não defeitos.
