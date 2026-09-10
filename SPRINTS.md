# 🧪 Sprints — Site de Gestão de Laboratório

> Plano de desenvolvimento iterativo do site, cobrindo **boas práticas de programação**,
> **organização do código por módulos**, **gestão do projeto** e estratégia de testes de
> **qualidade (QA)** e de **usabilidade**.
>
> 🧠 Hub central do projeto: **[[CEREBRO]]**
> 🎨 Identidade visual: [[stitch_portal_de_carreiras_unicap/academic_prestige_modern/DESIGN|Design System — Academic Prestige]] ([DESIGN.md](stitch_portal_de_carreiras_unicap/academic_prestige_modern/DESIGN.md))

---

## 1. Visão do produto (resumo)

Sistema web de **gestão de laboratório** para centralizar:

- Cadastro de **laboratórios** e **equipamentos** (fichas técnicas, status, documentos)
- **Agendamento/reservas** de laboratórios e equipamentos com fluxo de aprovação
- Controle de **insumos** (entradas, saídas, estoque mínimo e alertas)
- **Manutenção e calibração** (chamados, preventiva, histórico por equipamento)
- **Usuários e permissões** (RBAC) com trilha de auditoria
- **Relatórios** de uso, ocupação e estoque com exportação

| Papel (RBAC) | Permissões típicas |
|---|---|
| `admin` | Acesso total, configurações, gestão de usuários |
| `gestor` | Aprova reservas, gerencia cadastros, relatórios gerenciais |
| `tecnico` | Insumos, manutenção, atualização de status de equipamentos |
| `docente` | Reserva em nome de turmas/projetos, relatórios do próprio uso |
| `aluno` | Consulta catálogo, solicita reservas, acompanha suas reservas |

> ⚠️ As premissas de escopo estão registradas em [[Premissas do Escopo]] e devem ser
> validadas com os [[Stakeholders]] no Sprint 0.

---

## 2. Stack e ferramentas

| Camada | Escolha | Justificativa |
|---|---|---|
| Linguagem | TypeScript (`strict`) | Menos bugs, refatoração segura |
| Frontend | React + Vite | Build rápido, ecossistema maduro |
| UI | Tailwind CSS + shadcn/ui | Componentes acessíveis + tokens do design system |
| Backend/DB | Convex | Funções e dados reativos, sem servidor próprio para manter |
| Testes | Vitest + Testing Library + Playwright | Unidade, componente e E2E |
| A11y / Performance | axe-core + Lighthouse CI | WCAG 2.1 AA e nota ≥ 90 |
| Qualidade | ESLint, Prettier, Husky, GitHub Actions | Padrão automatizado em todo PR |
| Gestão | GitHub Projects + Conventional Commits + ADRs | Rastreabilidade e decisões documentadas |

---

## 3. Organização do código por módulos

**Princípios:** feature-first, alta coesão e baixo acoplamento, contratos explícitos,
testes junto do módulo, manutenção isolada (mudar um módulo não quebra os outros).

```
src/
├── app/                    # rotas, layouts e shells por módulo
├── modules/                # 👈 um diretório por módulo de negócio
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/       # chamadas ao backend (Convex)
│   │   ├── types/
│   │   ├── utils/
│   │   ├── __tests__/      # testes do módulo
│   │   └── index.ts        # 👈 única porta de entrada pública do módulo
│   ├── dashboard/
│   ├── laboratorios/
│   ├── equipamentos/
│   ├── reservas/
│   ├── insumos/
│   ├── manutencao/
│   ├── usuarios/
│   └── relatorios/
├── shared/                 # código reutilizado por 2+ módulos
│   ├── ui/                 # design system (tokens + shadcn/ui)
│   ├── lib/                # clientes, formatadores, validações
│   └── hooks/
e2e/                        # testes E2E de fluxos críticos
convex/                     # backend espelhando os domínios dos módulos
```

**Regras de dependência:**

1. Cada módulo exporta apenas pelo `index.ts` (barrel). Nada de import profundo entre módulos.
2. Código usado por 2+ módulos sobe para `shared/` — nunca é copiado.
3. `shared/` **não** pode importar de `modules/`.
4. O backend espelha os domínios: uma pasta por módulo em `convex/`.
5. Cada módulo tem uma nota viva: [[Modulo Auth]], [[Modulo Equipamentos]], [[Modulo Reservas]], etc.

---

## 4. Visão geral das sprints

**Cadência:** sprints de 2 semanas, com demo e retrospectiva ao final. Total: 9 sprints (≈ 18 semanas).

| Sprint | Foco | Entregas principais | Módulos |
|---|---|---|---|
| 0 | Fundações | Repo, CI, lint, tokens do design system, esqueleto de rotas, ambiente Convex | `app`, `shared` |
| 1 | Acesso e segurança | Login/logout, sessão, RBAC, guarda de rotas, auditoria | `auth`, `usuarios` |
| 2 | Núcleo de cadastros | CRUD de laboratórios e equipamentos, listagem com filtros | `laboratorios`, `equipamentos` |
| 3 | Agendamento | Calendário, reservas com aprovação, conflitos de horário, dashboard | `reservas`, `dashboard` |
| 4 | Insumos e estoque | Entradas/saídas, estoque mínimo, alertas, histórico | `insumos` |
| 5 | Manutenção | Chamados, preventiva/calibração, bloqueio de reservas | `manutencao`, `equipamentos` |
| 6 | Relatórios | Relatórios de uso/ocupação/estoque, exportação CSV/PDF | `relatorios` |
| 7 | Qualidade e usabilidade | Plano de testes completo, acessibilidade, testes com usuários (SUS) | todos |
| 8 | Estabilização e lançamento | Correções, hardening, deploy de produção, documentação | todos |

---

## 5. Detalhamento por sprint

### [[Sprint 0]] — Fundações (semanas 1–2)

**Objetivo:** ambiente e padrões prontos para o time produzir sem atrito.
**Módulos:** `app`, `shared`

- [ ] Setup Vite + TS `strict` + ESLint + Prettier + Husky (pre-commit)
- [ ] CI no GitHub Actions: `tsc`, lint e testes em todo PR
- [ ] Tokens do [[stitch_portal_de_carreiras_unicap/academic_prestige_modern/DESIGN|design system]] aplicados (cores, tipografia, espaçamento)
- [ ] Esqueleto de rotas por módulo + layout base com navegação
- [ ] Projeto Convex provisionado e `convex/` versionado

**Aceite:** CI verde; preview navegável; README com setup reproduzível.
**Testes:** pipeline de testes configurado com 1 exemplo por camada (unidade, componente, E2E "health check").

### [[Sprint 1]] — Autenticação, papéis e usuários (semanas 3–4)

**Objetivo:** só entra quem deve entrar — e cada um vê o que pode.
**Módulos:** [[Modulo Auth]] · [[Modulo Usuarios]]

- [ ] Login/logout, recuperação de senha, sessão persistente
- [ ] RBAC com os papéis da seção 1 + guarda de rotas
- [ ] CRUD de usuários pelo `admin` e convite de novos usuários
- [ ] Log de auditoria básico (quem fez o quê)

**Aceite:** rotas protegidas testadas por papel; acesso negado exibe mensagem adequada.
**Testes:** unitários de permissões; integração de sessão; E2E de login com 2 papéis.

### [[Sprint 2]] — Cadastros: laboratórios e equipamentos (semanas 5–6)

**Objetivo:** inventário confiável como base de todo o sistema.
**Módulos:** [[Modulo Laboratorios]] · [[Modulo Equipamentos]]

- [ ] CRUD de laboratórios (local, capacidade, recursos)
- [ ] Ficha do equipamento (nº de série, status, responsável, documentos)
- [ ] Listagem com busca, filtros combinados e paginação
- [ ] Exclusão lógica (soft delete) com histórico

**Aceite:** filtros combinados funcionam; status legível por cor **e** texto (não só cor).
**Testes:** unitários de validação de formulário; integração de CRUD; E2E cadastrar → buscar → editar.

### [[Sprint 3]] — Reservas e dashboard (semanas 7–8)

**Objetivo:** agendamento sem conflito e visão geral do laboratório.
**Módulos:** [[Modulo Reservas]] · [[Modulo Dashboard]]

- [ ] Calendário de disponibilidade por lab/equipamento
- [ ] Fluxo solicitar → aprovar/recusar (com motivo) → cancelar
- [ ] Detecção de conflito de horário (inclusive recorrência)
- [ ] Dashboard com KPIs (próximas reservas, equipamentos em manutenção, alertas)

**Aceite:** conflito bloqueado com mensagem clara; gestor aprova/recusa em ≤ 2 cliques.
**Testes:** unitários do motor de conflitos; integração do fluxo completo; E2E de reserva.

### [[Sprint 4]] — Insumos e estoque (semanas 9–10)

**Objetivo:** controle de consumo com rastreabilidade.
**Módulos:** [[Modulo Insumos]]

- [ ] Cadastro de insumos (unidade, lote, validade)
- [ ] Entradas/saídas vinculadas a usuário e/ou reserva
- [ ] Estoque mínimo com alerta no dashboard
- [ ] Histórico de movimentações com filtro por período

**Aceite:** saída maior que o saldo é bloqueada; alerta de mínimo visível para `gestor`/`tecnico`.
**Testes:** unitários de regra de saldo; integração de movimentações; E2E entrada → saída → alerta.

### [[Sprint 5]] — Manutenção e calibração (semanas 11–12)

**Objetivo:** equipamentos confiáveis e disponíveis quando precisos.
**Módulos:** [[Modulo Manutencao]] · [[Modulo Equipamentos]]

- [ ] Abertura de chamado (equipamento, defeito, prioridade)
- [ ] Manutenção preventiva com periodicidade
- [ ] Calibração com data e registro de certificado
- [ ] Status do equipamento reflete manutenção (bloqueia novas reservas)

**Aceite:** equipamento em manutenção não aparece como disponível; histórico completo na ficha.
**Testes:** integração chamado → status; E2E abrir chamado → indisponível → concluir → disponível.

### [[Sprint 6]] — Relatórios (semanas 13–14)

**Objetivo:** dados para decisão da coordenação.
**Módulos:** [[Modulo Relatorios]]

- [ ] Relatórios: ocupação de labs, uso de equipamentos, consumo de insumos, manutenções por período
- [ ] Filtros por data e unidade
- [ ] Exportação CSV e PDF

**Aceite:** números conferem com os dados de origem; exportações abrem corretamente.
**Testes:** unitários de agregações; testes com dataset fixo determinístico; E2E de exportação.

### [[Sprint 7]] — Qualidade e usabilidade (semanas 15–16)

**Objetivo:** fechar a sprint provando que o produto funciona **e** que as pessoas conseguem usar.

- [ ] Executar o [[Plano de Testes por Modulo]] completo e corrigir bugs S1/S2
- [ ] [[Auditoria de Acessibilidade]] (axe + revisão WCAG 2.1 AA) e correções
- [ ] Lighthouse ≥ 90 (performance, acessibilidade, boas práticas, SEO)
- [ ] [[Roteiro de Usabilidade]] executado com 5+ participantes (gravado, com consentimento)
- [ ] Aplicar [[Metricas SUS]] (meta ≥ 75)
- [ ] Priorizar achados e transformá-los em itens do [[Backlog do Produto]]

**Aceite:** relatório de QA e de usabilidade publicados em [[Plano de Qualidade]] e [[Plano de Usabilidade]].

### [[Sprint 8]] — Estabilização e lançamento (semanas 17–18)

**Objetivo:** produção estável e time autônomo.

- [ ] Corrigir os achados priorizados de usabilidade
- [ ] Hardening (validação no backend, rate limit, backup dos dados)
- [ ] Dados de demonstração e onboarding do primeiro acesso
- [ ] Deploy de produção + plano de rollback
- [ ] Documentação final: [[Arquitetura]], [[Glossario]] e guias por módulo

**Aceite:** checklist de go-live completo; time treinado; rollback documentado.

---

## 6. Boas práticas de programação

**Código**
- [ ] TypeScript `strict`; `any` proibido por lint; contratos de API tipados
- [ ] Componentes pequenos e puros; lógica de negócio em hooks/serviços testáveis
- [ ] Validação **sempre no backend** (e no frontend para UX)
- [ ] Estados de carregamento, vazio e erro desenhados em toda tela
- [ ] Mensagens de erro humanas (sem jargão técnico para o usuário)

**Git e revisão**
- [ ] Conventional Commits (`feat:`, `fix:`, `chore:`…)
- [ ] Branches curtas: `feat/modulo-funcionalidade`, `fix/...`
- [ ] PRs pequenos (< ~400 linhas) com checklist e ≥ 1 revisão
- [ ] Trunk-based: merge rápido no `main`, CI obrigatório

**Backend e segurança**
- [ ] Autorização verificada em **cada** função do backend (nunca confiar no frontend)
- [ ] Segredos apenas em variáveis de ambiente
- [ ] Dados sensíveis mascarados em logs

---

## 7. Gestão do projeto

- **Quadro ([[Quadro Kanban]]):** `Backlog → Pronto → Em progresso (WIP ≤ 2 por pessoa) → Review → QA → Feito`
- **Rituais ([[Rituais Ageis]]):** Planning (1h) · Daily (15 min) · Review/Demo (45 min) · Retrospectiva (45 min) — por sprint
- **Estimativa:** story points (Fibonacci 1-2-3-5-8); capacidade calibrada após 2 sprints ([[Metricas do Time]])
- **Métricas:** velocity, burndown, lead time de PR, bugs abertos × fechados, cobertura de testes
- **Decisões:** toda decisão de arquitetura vira um ADR em [[ADRs]]
- **Riscos:** registrados em [[Riscos e Mitigacoes]] e revisados a cada sprint

---

## 8. Estratégia de testes

### 8.1 Pirâmide de testes

| Nível | Ferramenta | O quê | Meta |
|---|---|---|---|
| Unitário | Vitest | regras de negócio (conflitos de reserva, saldo, permissões) | ≥ 70% cobertura global |
| Componente/Integração | Testing Library + Vitest | formulários, listagens, fluxos com backend de teste | fluxos críticos cobertos |
| E2E | Playwright | caminhos críticos: login, reservar, mover insumo, abrir chamado, exportar | suíte smoke verde no CI |
| Acessibilidade | axe-core + revisão manual | WCAG 2.1 AA (contraste, foco, labels, teclado) | 0 violações críticas |
| Performance | Lighthouse CI | carregamento e boas práticas | nota ≥ 90 |

Detalhes: [[Piramide de Testes]]

### 8.2 Plano por módulo (resumo)

| Módulo | Testes prioritários |
|---|---|
| `auth` | permissões por papel, sessão expirada, rotas protegidas |
| `reservas` | conflito de horário, aprovação, cancelamento, recorrência |
| `insumos` | saldo, validade, estoque mínimo, movimentações concorrentes |
| `manutencao` | transição de status, bloqueio de reservas |
| `relatorios` | agregações com dataset determinístico, exportações |

Detalhe completo: [[Plano de Testes por Modulo]] · critérios por história: [[Criterios de Aceite]]

### 8.3 Bug triage

| Severidade | Definição | SLA |
|---|---|---|
| S1 | Bloqueia operação / risco de dados corrompidos | Correção na sprint corrente |
| S2 | Funcionalidade principal degradada | Sprint corrente ou próxima |
| S3 | Problema com contorno | Backlog priorizado |
| S4 | Cosmético / melhoria | Backlog |

Detalhes: [[Bug Triage]]

### 8.4 Testes de usabilidade

- **Método:** testes moderados (presencial ou remoto) com **5 participantes por persona** principal (aluno, docente, técnico) — 5 usuários revelam ~85% dos problemas de usabilidade
- **Roteiro:** tarefas reais → (1) reservar equipamento; (2) consultar disponibilidade do lab; (3) registrar saída de insumo; (4) abrir chamado de manutenção; (5) exportar relatório de ocupação
- **Coleta:** tela gravada (com consentimento), anotação de tempo, erros e verbalizações; sem ajuda do moderador
- **Métricas:** taxa de sucesso por tarefa, tempo de conclusão, erros, SUS (meta ≥ 75)
- **Pós-teste:** classificar problemas (grave/médio/leve), priorizar e transformar em itens do [[Backlog do Produto]]; revisar telas com as 10 heurísticas de Nielsen antes de cada rodada
- Modelos e detalhes: [[Plano de Usabilidade]] · [[Roteiro de Usabilidade]] · [[Metricas SUS]]

---

## 9. Definition of Ready e Definition of Done

**Definition of Ready** (para entrar na sprint): história com objetivo e critérios de aceite; design/tokens linkados quando aplicável; dependências mapeadas; estimada pelo time.

**Definition of Done** (por história):

- [ ] Código revisado (≥ 1 aprovação) e mergeado no `main`
- [ ] Testes escritos (unitário/integração conforme o módulo) e suíte verde
- [ ] Lint + `tsc` sem erros; CI verde
- [ ] E2E smoke sem regressão
- [ ] Acessibilidade básica verificada (teclado, labels, contraste)
- [ ] Nota do módulo atualizada (ex.: [[Modulo Reservas]])
- [ ] Critérios de aceite validados em QA

---

## 10. Riscos e premissas

| Risco | Impacto | Mitigação |
|---|---|---|
| Escopo do laboratório pouco detalhado | Re-trabalho | Validar [[Premissas do Escopo]] no Sprint 0 com [[Stakeholders]] |
| Integração institucional (ex.: SSO) | Sprint 1 atrasa | Prever adaptador de autenticação; homologar cedo |
| Regras de agenda recorrentes complexas | Motor de reservas | Prototipar regras no Sprint 3 com casos reais |
| Baixa adesão dos usuários | Produto não usado | Testes de usabilidade a partir do Sprint 7 + onboarding |
