# SAPTM — Auditoria UX/UI Design

> **Data:** 2026-06-29  
> **Departamentos envolvidos:** Visual Design, Frontend, UX Research, Design QA  
> **Propósito:** Auditar o core Transportation Manager (Cargo, Tracking, Planning) contra o design system shadcn/ui e princípios de visual design, **sem propor novas funcionalidades**.

---

## Resumo Executivo

**Nota geral:** O produto tem uma base técnica sólida (RBAC, idempotência, audit trail, outbox, soft-delete, tenant scoping) mas a **experiência de utilizador está orientada ao desenvolvedor**, não ao Transportation Manager real.

O design system shadcn/ui está bem implementado nos tokens e primitivas, mas **as páginas de produto não o consomem correctamente** — usam hardcoded sizes, misturam tokens com valores fixos, e expõem detalhes internos (permission names, RPC endpoints, session IDs) ao utilizador final.

**Design QA:** 48 major findings — **CONDITIONAL** (não blocker porque acessibilidade base está OK, mas precisa de correcções antes de qualquer entrega).

---

## 1. Auditoria de Visual Design

### 1.1 Tokens e Consistência Visual

| Problema | Severidade | Ocorrências | Descrição |
|----------|-----------|-------------|-----------|
| Hardcoded `text-3xl`, `text-base`, `text-sm` em vez de tokens de type scale | **Major** | 20+ instâncias | Card titles usam `text-3xl` fixo em vez da escala tipográfica definida no design system. `text-sm` para labels em vez de tokens de escala. |
| Hardcoded `text-[0.65rem]` | **Major** | 4 instâncias | Tracking detail usa tamanho de fonte arbitrário (`0.65rem`) que não está na escala definida (12/14/16/20/24/32/40/48). |
| Hardcoded `rounded-lg`, `rounded-md` inline | **Major** | 8 instâncias | Cross-links no tracking detail usam `rounded-md` e `rounded-lg` fixos em vez das variantes de radius do design system. |
| Non-standard `font-medium` em contextos de heading | **Major** | 5 instâncias | Table cells e labels usam `font-medium` fora da especificação do type scale headings. |
| Badge `info` variant sem contraste consistente | **Minor** | 2 instâncias | Badge `info` tem contraste inconsistente entre light/dark mode. |
| Padding inline `p-3`, `p-4` não normalizados | **Minor** | Disperso | Cargo lifecycle sections misturam `p-3` e `p-4` no mesmo contexto visual. |

**Veredito Visual Design:** O design system está bem definido nos tokens, mas **as páginas de produto não os consomem**. Há 20+ violações de type scale e 8+ violações de radius tokens. A consistência visual está comprometida.

### 1.2 Linguagem e Tom (UX Writing)

| Problema | Severidade | Localização | Exemplo |
|----------|-----------|-------------|---------|
| Títulos técnicos em vez de operacionais | **Major** | Dashboard, Cargo, Planning, Tracking | "Foundation Control Center", "Registo governado de cargas", "Planeamento de transporte governado", "Tracking operacional de cargas" → devia ser "Dashboard", "Cargas", "Planeamento", "Tracking" |
| Descrições developer-facing | **Major** | Todas as páginas | "Esta etapa entrega leitura operacional segura antes de qualquer CRUD", "A ligacao cria shipment planeado no Operational Tracking sem CRUD e sem bypass de seguranca" |
| Exposição de nomes de permissão | **Blocker** | Todas as páginas | "Permissao: tracking.shipment.read", "Operacao: cargo.register", RPC endpoints (`POST /rpc/cargo/register`) visíveis |
| Exposição de IDs internos | **Major** | Tracking detail, Cargo, Planning | Session ID, Organization ID, Shipment ID expostos em ContextRows |
| Termos CRUD para utilizador final | **Major** | Todas as páginas | "Nao existe CRUD generico nesta fatia" — o utilizador não sabe nem precisa de saber o que é CRUD |
| Labels em inglês misturados com português | **Minor** | Planning | "Business P26", "Transport Planning", "Claims Settlement Accounting" |
| "Sem CRUD" repetido | **Major** | Cargo lifecycle sections | Uso de "Sem CRUD" como badge em 3+ secções — linguagem interna de arquitectura |

**Veredito UX Writing:** **Bloqueante para Transportation Manager.** Um operador portuário real (HHLA Planner, APM Terminals Dispatcher) não reconheceria estes termos. O tom é de documentação técnica, não de ferramenta operacional.

### 1.3 Hierarquia de Informação

| Problema | Severidade | Descrição |
|----------|-----------|-----------|
| Governance cards ocupam 40% do viewport | **Major** | Cada página tem um card "Contexto de seguranca"/"Contexto auditavel" com permissions/RPC/IDs que rouba espaço dos dados operacionais reais |
| Conteúdo operacional abaixo da dobra | **Major** | Métricas e tabelas operacionais estão abaixo dos governance cards |
| Badges de permissão misturados com conteúdo operacional | **Major** | "Pode registar" / "Somente leitura" badges aparecem em cada secção, poluindo a hierarquia visual |
| Informação de auditoria/arquitectura no mesmo nível que acções | **Major** | Regras de negócio e RPC endpoints lado a lado com formulários operacionais |

**Veredito Hierarquia:** O conteúdo operacional está a competir com informação de arquitectura. Um redesign da hierarquia é necessário: **governança interna deve estar invisível para o operador.**

---

## 2. Auditoria Frontend (Componentes e shadcn/ui)

### 2.1 Uso do Design System

| Problema | Severidade | Descrição |
|----------|-----------|-----------|
| Componentes shadcn/ui bem utilizados | ✅ | Card, Badge, BadgeGroup, Button, Table, Dialog, Sheet, DropdownMenu, Timeline, MetricTile, EmptyState, AccessState — todos de `@saptm/ui` |
| Forms usam Field composition | ✅ | Forms seguem o padrão FieldGroup → Field → FieldLabel/FieldContent/FieldDescription/FieldError |
| `gap-*` sobre `space-*` | ✅ | Layout usa `gap-*` consistentemente |
| `cn()` para classes condicionais | ✅ | Utilizado nos componentes de UI |
| Composição sobre props | ✅ | `<Card><CardHeader><CardTitle>` pattern seguido consistentemente |

### 2.2 Estados (Loading / Empty / Error)

| Problema | Severidade | Localização | Descrição |
|----------|-----------|-------------|-----------|
| Loading state inconsistente | **Major** | Cargo vs Tracking vs Planning | Cargo usa `<AccessState>` com badge "Carregando"; Tracking usa `<Card>` inline com descrição; Planning (server component) **não tem loading state** |
| Planning sem error handling | **Major** | Planning page | `getPlanningOverview` server-side fetch **não tem try/catch ou error boundary** — se falhar, a página quebra completamente |
| Empty state muito genérico | **Minor** | Todas as páginas | "Nao ha dados de cargas disponiveis no momento" — não orienta o utilizador no próximo passo |
| Tracking mostra 3 error states separados | **Minor** | TrackingOverviewClient | 3 blocos if separados para overview/analytics/advisory em vez de um error boundary unificado |

### 2.3 Padrões de Implementação

| Problema | Severidade | Descrição |
|----------|-----------|-----------|
| Inline format helpers | **Major** | `formatOperationalDate` definido na planning page em vez de ser um util partilhado |
| AccessState API inconsistente | **Major** | CargoOverviewClient usa `status` prop, TrackingOverviewClient usa `variant` prop — a API do componente parece ter mudado |
| Cross-links com markup raw | **Major** | Tracking detail (`[shipmentId]/page.tsx:246,253,260`) usa `<a>` raw estilizado em vez de `<Button asChild><Link>` |
| Caractere especial errado | **Minor** | Planning page line 236: `Â·` em vez de `·` (encoding issue) |
| Paginação ausente no Planning | **Minor** | Cargo e Tracking têm paginação; Planning não |

### 2.4 Acessibilidade (WCAG 2.2 AA)

**Nota prévia:** Não detectámos violações críticas de contraste (cores tokens OKLCH) nem falta de ARIA labels nos componentes base. No entanto:

| Problema | Severidade | Descrição |
|----------|-----------|-----------|
| Hover/focus states em elementos interactivos | **Major** | Design QA detectou 11 componentes com "Interactive elements missing hover or focus states". Os forms e botões usam shadcn (que tem focus states), mas elementos estilizados manualmente podem não herdar. |
| Role alert em loading states | ✅ | AccessState usa `role="alert"` correctamente |
| Semantic HTML | ✅ | Uso de `<nav>`, `<section>`, `<Card>` com heading hierarchy |

---

## 3. Auditoria UX (Fluxos Transportation Manager)

### 3.1 Jornada do Transportation Manager

O core SAP Transportation Manager (baseado em `SAP_BR_DISPATCHER` e `SAP_BR_TRANSPORTATION_MGR`) opera assim:

```
Dashboard → Cargo (registar/libertar) → Tracking (monitorizar) → Planeamento (ordens) → Excepções
```

**Problemas detectados:**

| Problema | Severidade | Descrição |
|----------|-----------|-----------|
| Dashboard não é operacional | **Major** | Mostra readiness checks, RBAC matrix, permissions — não mostra KPIs reais (shipments hoje, excepções abertas, SLA) |
| Navegação entre módulos não integrada | **Major** | Cargo → Tracking → Planning não têm ligações entre si no conteúdo (só na sidebar). Tracking tem cross-link para Cargo em exceptions, mas é raw HTML. |
| Sem pesquisa global | **Major** | Command palette (Cmd+K) existe mas não há pesquisa/filtro em nenhuma página |
| Sem filtros nas tabelas | **Major** | Cargo, Tracking, Planning mostram tabelas sem filtro por status/data/tipo |
| Sem ordenação nas colunas | **Minor** | Nenhuma tabela tem sort por coluna |
| Detalhe de tracking sem breadcrumbs | **Minor** | A única navegação de volta é um "Voltar" no topo |
| Onboarding zero | **Major** | Primeira vez que um utilizador entra, vê tabelas vazias e "Nao ha dados" — sem call-to-action |

### 3.2 Alinhamento com SAP TM Business Roles

| Role SAP TM | Status no Produto | Gaps |
|------------|-------------------|------|
| `SAP_BR_DISPATCHER` — Dispatcher | Coberto parcialmente (Planning, Cargo, Tracking) | Faltam: visão consolidada de capacidade, alocação visual, notificações em tempo real |
| `SAP_BR_TRANSPORTATION_MGR` — Transportation Manager | Coberto parcialmente (Tracking, Exceptions, Reports) | Falta: dashboard executivo, SLA analytics, visão multi-modal consolidada |
| `SAP_BR_TRANSP_MDSPEC` — Master Data Specialist | Coberto (Cargo register) | OK mas sem wizard de registo |
| `SAP_BR_FREIGHT_CONTRACTSPEC` — Freight Contract Specialist | Não coberto | Contratos, claims avançados, pricing |

---

## 4. Design QA — Automated Audit Results

**Resultado: CONDITIONAL** (48 Major, 0 Blocker, 0 Minor)

| Categoria | Count |
|-----------|-------|
| Hardcoded text sizes (não usam type scale) | 26 |
| Interactive elements missing hover/focus | 11 |
| Hardcoded border radius (não usam tokens) | 6 |
| Non-standard font weight | 5 |
| **Total** | **48** |

---

## 5. Prioridades de Consolidação

### P0 — Bloqueante (fazer antes de qualquer entrega)
1. **Remover linguagem developer-facing** — substituir títulos técnicos por operacionais, remover CRUD, permission names, RPC endpoints, session IDs, organization IDs da UI
2. **Consolidar loading states** — Planning page precisa de loading/error states (actualmente quebra em falha)
3. **Adicionar hover/focus states** — 11 componentes detectados sem estados interactivos

### P1 — Crítico (core experience)
4. **Redesenhar governance cards** — esconder informação de arquitectura do operador; meter em painel colapsável ou admin view
5. **Converter hardcoded tokens** — substituir `text-3xl`, `text-base`, `text-[0.65rem]`, `rounded-lg` raw pelos tokens do design system
6. **Inconsistent AccessState API** — unificar `status` vs `variant` prop
7. **Normalizar cross-links** — substituir raw `<a>` por `Button asChild Link`

### P2 — Importante (qualidade)
8. **Criar shared format helpers** — extrair `formatOperationalDate` para util partilhado
9. **Adicionar pesquisa/filtro** nas tabelas de Cargo, Tracking, Planning
10. **Melhorar empty states** com orientação accionável
11. **Adicionar breadcrumbs** no tracking detail
12. **Fix encoding** `Â·` → `·` na planning page

### P3 — Desejável (refinamento)
13. **Dashboard operacional** — substituir readiness checks por KPIs reais (shipments hoje, excepções abertas, SLA, dwell time)
14. **Badges de permissão** — remover badges "Pode registar"/"Somente leitura" do fluxo principal
15. **Ordenação nas tabelas**
16. **Paginação no Planning**
17. **Navegação integrada** entre Cargo → Tracking → Planning

---

## 6. Ficheiros com Mais Problemas

| Ficheiro | Problemas Detectados |
|----------|---------------------|
| `apps/web/app/(platform)/app/planning/page.tsx` | 15 tokens hardcoded, sem loading/error states, inline format helper, encoding issue |
| `apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx` | 8 tokens hardcoded, 4 raw `<a>` links, permission names expostos, RPC endpoints visíveis |
| `apps/web/app/(platform)/app/(platform)/app/page.tsx` (Dashboard) | 4 tokens hardcoded, linguagem developer-facing, readiness checks em vez de KPIs |
| `apps/web/components/cargo/cargo-lifecycle-sections.tsx` | 20+ ContextRows com RPC endpoints e permission names; badges de permissão poluídos |
| `apps/web/components/tracking/tracking-overview-header.tsx` | Card de "Contexto auditavel" com session ID e organization ID expostos |
| `apps/web/components/cargo/cargo-overview-header.tsx` | Card de "Contexto de seguranca" com permissions expostas como ContextRows |

---

*Fim do relatório. Próximo passo: executar correcções P0-P1 e re-auditar.*
