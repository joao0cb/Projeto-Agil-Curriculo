# 🔍 Auditoria UX — 10 Heurísticas de Nielsen

**Escopo:** `infra/src/` — App shell (`App.tsx`), módulo **Manutenção** (`ManutencaoPage`, `ChamadoForm`, `TicketRow`, `PreventivaForm`, `CalibracaoCard`, `EquipmentCard`), módulo **Insumos** (`InsumosPage`, `SupplyList`, `SupplyForm`, `SupplyDetail`) e `StatusBadge` compartilhado.

**Stack real:** Vite + React 18 + Convex + Tailwind CSS. Os componentes analisados são os mesmos conceitos de um app React/Next.js; a auditoria se aplica integralmente.

> ⚠️ **Etapa 1 — somente auditoria.** Nenhum arquivo de código foi alterado. A refatoração (Etapa 2) só começa após confirmação.

**Legenda de severidade:** 🔴 Alta · 🟡 Média · 🟢 Baixa

---

## H1 — Visibilidade do status do sistema

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 1.1 | 🔴 | `TicketRow.tsx` | Troca de status ("Iniciar", "Concluir"…) dispara a mutation sem loading no botão, sem optimistic update e sem mensagem de erro. O card só muda quando a query reativa re-renderiza; falhas são silenciosas. |
| 1.2 | 🔴 | `PreventivaForm.tsx` | `handleSubmit` usa `try { await onSubmit(taskId) } finally {...}` **sem catch**. Se a mutation falhar: promise rejection não tratada, modal fica aberto, zero mensagem ao usuário. |
| 1.3 | 🔴 | `ManutencaoPage.tsx` | Mutations (`abrirChamado`, `registrarPreventiva`) chamadas com `await` direto nos callbacks dos modais; erros não são capturados nem comunicados. |
| 1.4 | 🟡 | `App.tsx` (Dashboard) | "Laboratórios: —" sem contexto (placeholder? em breve? erro?). |
| 1.5 | 🟢 | `App.tsx` | Contadores "…" durante carregamento, sem skeleton. |
| 1.6 | 🟡 | `SupplyDetail.tsx` | Sucesso é texto persistente; formulário não some nem dá feedback claro de que o saldo já mudou — convida a duplicar registros. |

## H2 — Correspondência com o mundo real

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 2.1 | 🔴 | `StatusBadge.tsx` + `EquipmentCard.tsx` | Símbolos ambíguos: `◐` significa "em uso" **e** "em manutenção"; `✕` cobre "indisponível" **e** "quebrado" (cores diferentes, símbolo igual). |
| 2.2 | 🔴 | `StatusBadge.tsx` | Semântica invertida: chamado **Aberto** → variante `unavailable` (vermelho = problema); **Cancelado** → `pending` (âmbar = aguardando). |
| 2.3 | 🟡 | Vários | **IDs técnicos expostos**: `user-demo`, `equipamento-demo`, `preventiva-demo`, `labId`, `responsibleId`, `#eq-1`. O usuário não reconhece esses valores como entidades reais. |
| 2.4 | 🟡 | `TicketRow.tsx` | "responsável: user-demo" para `requesterId` — quem **abriu** o chamado não é o responsável técnico. |
| 2.5 | 🟢 | `EquipmentCard.tsx` | "Nº serie" → correto é "Nº de série". |
| 2.6 | 🟢 | `ChamadoForm.tsx` | Placeholder "já disponível peça no almoxarife" — frase confusa. |

## H3 — Controle e liberdade do usuário

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 3.1 | 🔴 | Todos os modais | Sem fechar com **Escape**, sem focus trap, sem devolver o foco ao elemento que abriu. Teclado/leitor de tela ficam presos. |
| 3.2 | 🔴 | Todos os modais | Fechar por X ou backdrop **descarta dados preenchidos sem confirmação** (destructive discard silencioso). |
| 3.3 | 🟡 | `TicketRow.tsx` | "Cancelar" um chamado é ação destrutiva executada em 1 clique, sem confirmação. |
| 3.4 | 🟡 | `SupplyDetail.tsx` | Formulário de movimentação dentro do modal da ficha: após registrar, o form permanece aberto sobre dados novos (saldo), facilitando erro. |

## H4 — Consistência e padrões

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 4.1 | 🔴 | `TicketRow.tsx` | Duplica o mapeamento status→label do `StatusBadge` (`CHAMADO_LABEL` local — inclusive cada status listado 2×, lowercase e UPPERCASE). O mesmo status pode renderizar com símbolo/estilo diferente conforme o componente. |
| 4.2 | 🟡 | `ManutencaoPage.tsx` (Preventivas) | Badge inline com paleta própria (slate) em vez de reusar `StatusBadge`. |
| 4.3 | 🟡 | `EquipmentCard.tsx` | Recalcula `statusClass`/`dot`/label com cadeias de ternários em vez de usar `StatusBadge`. |
| 4.4 | 🟡 | `ManutencaoPage.tsx` | CTA de "Registrar execução" fica na direita da lista; em Chamados o CTA principal fica no header — dois padrões de posicionamento de ação. |
| 4.5 | 🟢 | `ManutencaoPage.tsx` vs `SupplyList.tsx` | Filtros construídos com padrões diferentes (label sr-only + select vs ícone + sr-only). |

## H5 — Prevenção de erros

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 5.1 | 🔴 | `ChamadoForm.tsx` | **Não existe seleção de equipamento.** O formulário envia `equipmentId: "equipamento-demo"` hardcodado — o chamado nasce sem equipamento real. Erro evitado na origem? Não: o campo simplesmente não existe. |
| 5.2 | 🔴 | `PreventivaForm.tsx` | **Dados coletados e descartados:** o form coleta `executionDate` e `note`, mas chama `onSubmit(taskId)` **sem passar nada disso**; além disso `taskId` é `"preventiva-demo"` fixo — a execução é registrada na preventiva errada. |
| 5.3 | 🟡 | `SupplyForm.tsx` | Validação devolve **uma mensagem única** (primeiro erro); sem erro por campo, sem `aria-invalid`, sem `aria-describedby`. Lote/Validade mudam o `*` conforme `initialBalance`, mas não há validação inline desses campos. |
| 5.4 | 🟢 | `SupplyForm.tsx` | `Number(e.target.value)` em números: limpar o campo vira `0` silenciosamente. |
| 5.5 | 🟡 | `ChamadoForm.tsx` | Validação também é mensagem única; sem destaque do campo com problema. |

## H6 — Reconhecimento em vez de memorização

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 6.1 | 🔴 | `ChamadoForm.tsx` | Sem lista de equipamentos para escolher — o usuário teria que decorar IDs. |
| 6.2 | 🟡 | `TicketRow.tsx`, `ManutencaoPage.tsx` | Mostra IDs crus em vez de nomes de pessoas/equipamentos (ver 2.3). |
| 6.3 | 🟡 | `ManutencaoPage.tsx` | O estado `filters.equipmentId` existe na lógica, mas **não há filtro de equipamento na UI**. |
| 6.4 | 🟢 | `SupplyDetail.tsx` | Histórico de movimentações não mostra quem executou (`responsibleId` é gravado mas não exibido). |

## H7 — Flexibilidade e eficiência de uso

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 7.1 | 🔴 | `App.tsx` | **Trocar de tab desmonta a página** (`condição ? <Page /> : …`): busca, filtros, ficha aberta e modal de insumos somem ao alternar Início ⇄ Insumos ⇄ Manutenção. |
| 7.2 | 🟡 | Todos os modais | Sem suporte a teclado (Esc, Tab preso no fundo) — ver 3.1. |
| 7.3 | 🟢 | `SupplyDetail.tsx` | Histórico renderiza todas as movimentações sem paginação/janela. |
| 7.4 | 🟢 | Global | Sem atalhos (ex.: "/" foca busca) — oportunidade, não defeito grave. |

## H8 — Design estético e minimalista

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 8.1 | 🟡 | `TicketRow.tsx` | Banner de aviso repetido em **cada** chamado não-finalizado ("não está disponível para nova reserva…") — regra de negócio repetida vira ruído; pertence ao card do equipamento. |
| 8.2 | 🟡 | `App.tsx` (Dashboard) | Texto de roadmap em produção: "o módulo de insumos entra agora na Sprint 4". |
| 8.3 | 🟢 | Cards em geral | Exibição de `responsibleId`/IDs técnicos polui (ver 2.3). |

## H9 — Ajudar a reconhecer, diagnosticar e corrigir erros

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 9.1 | 🔴 | `InsumosPage.tsx` → `SupplyList` | `error={null}` **hardcodado**: o componente de lista tem tratamento de erro completo, mas a página nunca o alimenta — falhas da query Convex nunca aparecem ao usuário. |
| 9.2 | 🔴 | `ChamadoForm`, `SupplyForm` | Erros aparecem num banner genérico, sem indicar **qual** campo corrigir, sem scroll até ele, sem `aria-invalid`/`aria-describedby`. |
| 9.3 | 🔴 | `TicketRow.tsx` | Falha da mutation de status é 100% silenciosa (ver 1.1) — o usuário acha que concluiu quando não concluiu. |
| 9.4 | 🟢 | Modais | `err.message` do backend pode aparecer cru (inglês/técnico) sem tradução contextual. |

## H10 — Ajuda e documentação

| # | Sev. | Onde | Problema |
|---|---|---|---|
| 10.1 | 🟡 | Formulários | Sem tooltips/ajuda em conceitos do domínio (estoque mínimo, lote, validade, bloqueio de reserva). |
| 10.2 | 🟢 | Empty states | Frases de orientação existem e são razoáveis ✓. |
| 10.3 | 🟢 | `App.tsx` | KPIs do Dashboard sem explicação do que significam. |

---

## Bugs funcionais encontrados durante a auditoria (fora do escopo estrito de UX)

| # | Onde | Bug |
|---|---|---|
| B1 | `ManutencaoPage.tsx` (tabs) | Os botões de aba usam classes `data-[selected=true]:border-primary data-[selected=true]:text-foreground`, mas **o atributo `data-selected` nunca é renderizado** — o estilo de aba ativa não aplica. Só muda `aria-selected`. |
| B2 | `PreventivaForm.tsx` | `?` solto após o ícone no botão de fechar (`<Calendar … />?`). |
| B3 | `ManutencaoPage.tsx` | `useCalibrations(undefined)` e `usePreventiveTasks(false)` chamados mesmo com tabs inativas — queries desnecessárias (menor, mas custa rede). |

---

## Resumo executivo

| Heurística | 🔴 | 🟡 | 🟢 |
|---|---|---|---|
| H1 Visibilidade do status | 3 | 2 | 1 |
| H2 Mundo real | 2 | 1 | 3 |
| H3 Controle e liberdade | 2 | 2 | 0 |
| H4 Consistência | 1 | 3 | 1 |
| H5 Prevenção de erros | 2 | 2 | 1 |
| H6 Reconhecimento | 1 | 2 | 1 |
| H7 Flexibilidade | 1 | 1 | 2 |
| H8 Estético/minimalista | 0 | 2 | 1 |
| H9 Diagnóstico de erros | 3 | 0 | 1 |
| H10 Ajuda | 0 | 1 | 2 |
| **Total** | **15** | **16** | **13** |

### Os 6 problemas mais críticos (P0)
1. **Chamado sem equipamento** — form envia `equipamento-demo` fixo (5.1/6.1).
2. **Preventiva registra dados errados** — data/observação coletadas e descartadas; taskId fixo (5.2).
3. **Erros silenciosos em mutações** — status de chamado e preventiva falham sem feedback (1.1/1.2/9.3).
4. **Erros de query nunca exibidos em Insumos** — `error={null}` hardcodado (9.1).
5. **Estado perdido ao trocar de tab** — busca/filtros/ficha somem (7.1).
6. **Modais sem Escape/focus trap e descartando dados sem confirmação** (3.1/3.2).

## Plano de refatoração proposto (Etapa 2, após confirmação)

| Passo | Arquivos | O que muda |
|---|---|---|
| 1 | `src/components/ui/Modal.tsx` (novo) | Modal base: Escape, focus trap, retorno de foco, `aria-hidden` no fundo, guarda de dados não salvos. |
| 2 | `StatusBadge.tsx` | Fonte única de verdade: `statusMeta` (label, variante, símbolo, `aria-label`/`title`), semântica corrigida (Aberto→pending, Cancelado→neutral). |
| 3 | `TicketRow.tsx`, `EquipmentCard.tsx`, `ManutencaoPage.tsx` | Consumir o `statusMeta`/`StatusBadge`; remover mapas duplicados; estado de loading nos botões de status; confirmação antes de "Cancelar"; corrigir `data-selected` (B1); textos (Nº de série, responsável). |
| 4 | `ChamadoForm.tsx`, `PreventivaForm.tsx` | Validação por campo (`aria-invalid`, mensagem junto ao campo); `PreventivaForm` passa `executionDate`/`note` ao submit; catch de erros com mensagem clara; remover `?` (B2); equipamento via prop/lista quando disponível (depende de hook do módulo de equipamentos — S2). |
| 5 | `SupplyForm.tsx`, `SupplyDetail.tsx` | Erros por campo; após sucesso, feedback e reset previsíveis; loading consistente. |
| 6 | `InsumosPage.tsx`, `SupplyList.tsx`, `App.tsx` | Propagar erro real da query; skeleton no Dashboard; rótulo "Em breve" para Laboratórios; preservar estado entre tabs; remover texto de roadmap. |
| 7 | Verificação | `bun tsc -b --noEmit` + `bun vitest run` (testes do domínio não devem quebrar). |

**Fora do escopo desta refatoração:** hooks de equipamentos/usuários reais (módulos S1–S2), paginação de histórico, atalhos globais.

---

## 📋 Registro de execução

### Etapa 1 — Modal base + StatusBadge centralizado (✅ concluída)

**Arquivos:**
- `src/components/ui/Modal.tsx` *(novo)* — portal, Escape, focus trap (Tab/Shift+Tab), retorno de foco, `aria-hidden`+`inert` no `#root`, scroll lock, guarda de descarte com `isDirty`/`confirmDiscardMessage` (H3: 3.1, 3.2).
- `src/components/StatusBadge.tsx` *(reescrito)* — fonte única de verdade `STATUS_META` (variante + símbolo + descrição), normalização case/acento-insensitive, semântica corrigida (Aberto→`pending`, Cancelado→`neutral`, símbolos distintos ◔/⚙/⊘), `title`/`aria-label` acessíveis (H2: 2.1, 2.2, 2.6).
- `ChamadoForm`, `PreventivaForm`, `SupplyForm`, `SupplyDetail` — migrados para o Modal base, sem mudança de lógica interna (exception: `PreventivaForm` ganhou catch de erro com `role="alert"`, auditoria 1.2).
- `ManutencaoPage.tsx` — **B1 corrigido**: `data-selected` agora é renderizado nas abas.
- **B2 corrigido**: o `?` solto e o ícone errado do fechar foram eliminados pela migração ao Modal base.

**Verificação:** `tsc -b` limpo nos arquivos alterados (restam 4 erros pré-existentes de `convex/_generated`, backend fora do snapshot); `vitest`: 49/49 aprovados.

**Não alterados nesta etapa (aguardam próximas etapas):** TicketRow, EquipmentCard, CalibracaoCard, SupplyList, InsumosPage, App shell.

### Etapa 2 — Passos 3–7 do plano (✅ concluída)

**Passo 3 — Consistência e status (H4):**
- `StatusBadge.tsx` — `STATUS_LABELS`/`statusLabelFor` viraram a fonte única de rótulos (4.1); normalização também cobre `_` (nao_aplicavel → "Não aplicável"); badge renderiza o rótulo canônico.
- `TicketRow.tsx` — mapa `CHAMADO_LABEL` removido; "responsável" → "solicitante" para `requesterId` (2.4); aviso de bloqueio só no chamado "em andamento" (8.1); transições com estado de espera no botão ("Aplicando…"), confirmação antes de Cancelar/Concluir (3.3) e erro visível da mutation (9.3) — falha nunca fica silenciosa.
- `EquipmentCard.tsx` — ternários/dot/paleta local substituídos pelo `StatusBadge` (4.3); "Nº serie" → "Nº de série" (2.5).
- `CalibracaoCard.tsx` — badge via `StatusBadge` (sem paleta própria).
- `ManutencaoPage.tsx` — badge slate das preventivas via `StatusBadge` (4.2); mapa de labels local removido; seção preventivas mostra "Equipamento: {id}" e "Última execução por" (texto mais claro).

**Passo 4 — Formulários de manutenção (H5/H9):**
- `ChamadoForm.tsx` — erro com `role="alert"`, `aria-invalid`/`aria-describedby` no campo com problema, mensagem com próximo passo ("dados continuam preenchidos…").
- `PreventivaForm.tsx` — **5.2 corrigido**: agora recebe a lista de preventivas pendentes, tem seletor obrigatório (fim do `taskId` fixo `preventiva-demo`), e envia `executionDate` + `note` coletados; validação por campo com `aria-invalid`.

**Passo 5 — Formulários de insumos (H5/H9):**
- `domain/rules.ts` — nova `validateSupplyDraftFields()` (erros indexados por campo; `validateSupplyDraft` mantida para backend/testes).
- `SupplyForm.tsx` — erros por campo com `aria-invalid`/`aria-describedby`/mensagem junto ao input; limpar número não vira 0 silencioso (5.4); catch de mutation com mensagem de recuperação.
- `SupplyDetail.tsx` — já tinha feedback pós-sucesso e validação dupla (mantido).

**Passo 6 — Shell e estados de erro (H7/H1/H9):**
- `App.tsx` — **7.1 corrigido**: páginas ficam montadas com `hidden` ao trocar de aba (busca/filtros/ficha/modais sobrevivem); skeleton no Dashboard (1.5); "Laboratórios — Em breve" (1.4); texto de roadmap removido (8.2).
- `QueryErrorBoundary.tsx` *(novo)* — captura erros lançados por `useQuery` do Convex (rede/permissão) e mostra estado de erro humano com "Tentar novamente" — **9.1 corrigido** (falha de query nunca mais é silenciosa nem derruba a tela).
- `InsumosPage.tsx` — listagem envolvida pelo error boundary.
- `useSupplies.ts` — comentário documentando que `useQuery` lança em render (contrato real do Convex).

**Passo 7 — Verificação:**
- `bun tsc -p tsconfig.json --noEmit` limpo.
- `bun vitest run`: **52/52 aprovados** (StatusBadge.test e TicketRow.test atualizados ao novo comportamento de rótulo/aviso).
- `bun run lint` limpo (2 no-unused-vars no mock de preview resolvidos).

**Pendências fora do escopo (conforme plano):** seleção real de equipamento no ChamadoForm e nomes de pessoas/equipamentos no lugar de IDs (dependem dos módulos S1–S2 — 5.1/6.1 parcialmente resolvidos: PreventivaForm já tem seleção); paginação de histórico (7.3); atalhos de teclado globais (7.4); tooltips de domínio (10.1 — Sprint 8).
