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

---

# Design QA Audit — Pipeline Stage 10
**Date:** 2026-07-03
**Pages Audited:** Billing Overview, Subscription Management, SSO Config, Team Switcher, Billing Layout
**Result:** ⚠️ CONDITIONAL (1 Blocker P0, 9 Major P1, 8 Minor P2, 4 Refinement P3)
**UX Score:** 7.5/10 — GOOD (needs refinement)

---

## Resumo Executivo

Esta auditoria cobre 4 novas páginas (Faturação, Subscrição, SSO, Team Switcher) e o layout de facturação. São páginas de administração/settings com qualidade geral superior às páginas operacionais (Cargo, Tracking, Planning) auditadas na Stage 1-9. A implementação segue os padrões do design system (AccessState, Card, DataTable, Badge, skeleton loading, erro handling) de forma consistente.

**Pontos fortes:**
- ✅ Server components com try/catch em todas as páginas
- ✅ AccessState usado consistentemente para loading/error/blocked states
- ✅ Skeleton loading states (loading.tsx) em todas as rotas
- ✅ Error boundaries (error.tsx) em todas as rotas de billing
- ✅ DataTable com paginação server-side (Invoices)
- ✅ Formulários usam Field/FieldLabel/FieldContent/FieldError pattern
- ✅ PT-PT consistente em todas as labels
- ✅ tokens de design system (tracking-heading, density, gap) bem aplicados

**Problemas críticos:**
- ❌ **Blocker P0:** SSO feature gate `isEnterprisePlan = true` hardcoded — página mostra-se sempre, mesmo para não-Enterprise
- ❌ **Blocker P0:** Emojis (⚠️, ℹ️, 🔐, 🌐, ⚙️) usados em vez de Lucide icons — falha de acessibilidade
- ❌ **Major P1:** Tabs do layout não reflectem rota activa — `defaultValue` estático
- ❌ **Major P1:** Duplicação de código (subscriptionBadge map, invoiceColumns) entre ficheiros
- ❌ **Major P1:** Formulário SSO não submete dados (sem onSubmit handler)
- ❌ **Major P1:** Duas implementações diferentes de TeamSwitcher com padrões inconsistentes

---

## 1. Billing Overview (`/app/billing`)

### 1.1 Inventário de Componentes

| Categoria | Componentes | Count |
|-----------|-------------|-------|
| Containers | Card, CardContent | 3+ |
| Ações | Button (gerir/configurar subscrição, upgrade) | 3 |
| Badges | Badge (subscription status), PlanBadge | 2+ |
| Data Display | DataTable (invoices), MetricTile | 2+ |
| Feedback | AccessState (blocked, error, empty) | 3 estados |
| Métricas | UsageMeter | 3 (cargas, tracking, membros) |
| Navegação | Tabs (layout), Link | 3 tabs |
| Esqueleto | SkeletonCard, SkeletonMetricTile, SkeletonTable (loading.tsx) | - |

### 1.2 Zero Justification

| Componente | Decisão | Justificação |
|------------|---------|--------------|
| BillingSubscriptionCard | ✅ MANTER | Bloco central de informação de subscrição |
| UsageMeter (×3) | ✅ MANTER | Métricas de utilização essenciais |
| MetricTile | ✅ MANTER | KPI de uso por recurso |
| BillingInvoicesSection | ✅ MANTER | Histórico necessário |
| Tabs | 🔄 FUNDIR com layout | Já está no layout, OK |
| AccessState (blocked) | ✅ MANTER | Permissions check |
| AccessState (error) | ✅ MANTER | API error handling |

### 1.3 Hierarquia Visual

- **Scan path:** Título "Faturação" → Subscription Card → Usage Meters → Recent Invoices
- **Primary action:** "Gerir subscrição" / "Configurar subscrição" — claro e bem posicionado
- **Above fold:** Título + Subscription Card + início dos Usage Meters
- **Whitespace:** ~35% — bom uso de `gap-6`, `flex flex-col`
- **5s test:** ✅ O utilizador entende que vê a subscrição, uso e faturas

### 1.4 Responsividade

| Breakpoint | Status | Issues |
|-----------|--------|--------|
| 320px (Mobile S) | 🟡 OK | UsageMeters colapsam para 1 coluna (`sm:grid-cols-2` não activo) |
| 390px (Mobile L) | 🟡 OK | Tables com scroll horizontal |
| 768px (Tablet M) | ✅ OK | `sm:grid-cols-2` activo |
| 1024px+ | ✅ OK | `lg:grid-cols-3` activo para meters |

Código usa `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` — padrão responsivo correcto.

### 1.5 Cognitive Load

- **Decisões:** 1 — "O que faço com a subscrição?" (gerir/upgrade)
- **Densidade:** Média — 3 secções com 3-5 items cada
- **Clareza:** ✅ Propósito claro em 1 frase: "Ver subscrição, uso e faturas"
- **Progressive disclosure:** PlanComparisonModal é dinâmico (lazy load)

### 1.6 Design System

| Check | Status | Notas |
|-------|--------|-------|
| Tokens de cor | ✅ OK | bg-destructive/5, text-destructive, etc. |
| Type scale | ✅ OK | text-sm, text-base, font-semibold — todos tokens mapeados |
| Spacing | ✅ OK | gap-6, p-3, p-4 — na grelha 4px |
| Radius | ✅ OK | Usa Card/Button que têm tokens internos |
| Shadows | ⚠️ Minor | Cards usam token --shadow-panel via shadcn default |
| tracking-heading | ✅ OK | Usado nos headings |

---

## 2. Subscription Management (`/app/billing/subscription`)

### 2.1 Inventário

| Componente | Uso |
|------------|-----|
| SubscriptionManagementClient | Container client-side |
| PlanCard (×3) | Free, Pro, Enterprise |
| PlanBadge | Badge por plano |
| PlanComparisonModal | Dynamic import |
| ContextRowDetail | Inline detail rows |
| Badge | Status subscription |
| Button | Gerir, reativar |
| AccessState | blocked, error (×2) |

### 2.2 Zero Justification

| Componente | Decisão | Justificação |
|------------|---------|--------------|
| PlanCard (3×) | ✅ MANTER | Grid de planos é o core da página |
| PlanBadge | ✅ MANTER | Identificação visual do plano |
| PlanComparisonModal | ✅ MANTER | Comparação detalhada |
| ContextRowDetail | 🔄 EXTRAIR | Deve virar componente partilhado em `@saptm/ui` |
| Past due banner | ✅ MANTER | Alerta crítico de pagamento |
| Feature usage grid | ✅ MANTER | Mostra limites do plano |

### 2.3 Hierarquia Visual

- **Scan path:** Past due banner (se aplicável) → Current subscription card → Plan cards grid
- **Primary action:** "Gerir subscrição" + "Alterar plano" / "Reativar"
- **Above fold:** Past due banner + subscription card
- **Whitespace:** ~30% — adequado para página de decisão

### 2.4 Cognitive Load

- **Decisões:** 1-2 — "Qual plano escolher?" + "Confirmar upgrade?"
- **Densidade:** Moderada-alta nos plan cards (features list)
- **Clareza:** ✅ "Escolha o melhor plano para a sua organização"
- **Progressive disclosure:** Feature comparison em modal

### 2.5 Design System Findings

| Issue | Location | Severity |
|-------|----------|----------|
| `subscriptionBadge` map duplicado | subscription-management-client.tsx:29-41 | 🔴 **Major** — Duplicado de billing-subscription-card.tsx:28-40 |
| `ContextRowDetail` inline | subscription-management-client.tsx:258-264 | 🟡 **Major** — Deve ser extraído para componente partilhado |
| `rounded-lg` inline em feature cards | subscription-management-client.tsx:234 | ⚠️ Minor — Usa `rounded-lg border p-3` que são tokens válidos |
| `text-lg` hardcoded (heading) | subscription-management-client.tsx:215 | ⚠️ Minor — Na verdade é `font-semibold text-base tracking-heading` que usa tokens |

---

## 3. Billing Layout (`/app/billing/layout.tsx`)

### 3.1 Problemas Detectados

| Issue | Location | Severity | Descrição |
|-------|----------|----------|-----------|
| Tabs não reflectem rota activa | layout.tsx:36 | 🔴 **Major** | `defaultValue="overview"` é estático. O tab highlight não muda quando navega entre Visão Geral, Subscrição e Faturas. |
| Link wrapping TabsTrigger | layout.tsx:39-41 | 🔴 **Major** | Padrão não standard. TabsTrigger espera ser clicado para mudar o valor. Ao wrap com Link, pode causar dupla navegação. |
| `value` prop não dinâmica | layout.tsx:36-46 | 🟡 **Major** | Deveria usar `value` derivado do pathname + `onValueChange` com `router.push` |

**Recomendação:** Substituir o padrão actual por:

```tsx
"use client"; // necessário para usePathname
const pathname = usePathname();
const currentTab = pathname === "/app/billing" ? "overview" : pathname.split("/").pop() ?? "overview";

<Tabs value={currentTab} onValueChange={(v) => router.push(tabMap[v])}>
  <TabsList>
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="subscription">Subscrição</TabsTrigger>
    <TabsTrigger value="invoices">Faturas</TabsTrigger>
  </TabsList>
</Tabs>
```

---

## 4. SSO Configuration (`/app/admin/sso`)

### 4.1 Inventário

| Componente | Uso |
|------------|-----|
| SsoConfigClient | Container client-side |
| AccessState | blocked, error, loading |
| Card (×3) | SSO/SAML, OAuth Providers, Provisioning |
| Field/FieldLabel/FieldContent/FieldError | Form pattern |
| Input | Domain, IdP URL, Entity ID |
| Switch (×2) | JIT, Domain-wide Email |
| Badge | Domain verified/not-verified |
| OAuthProviderField (×3) | Google, Microsoft, GitHub |

### 4.2 Zero Justification

| Componente | Decisão | Justificação |
|------------|---------|--------------|
| SSO/SAML Card | ✅ MANTER | Core configuration |
| Domain Input | ✅ MANTER | SSO domain requirement |
| IdP Metadata URL | ✅ MANTER | SAML integration |
| Read-only Entity/ACS | ✅ MANTER | Informação necessária para configurar IdP |
| OAuth Providers | 🔄 MOVER para sub-página | Configuração de 3 providers com secrets aumenta complexidade |
| JIT Provisioning | ✅ MANTER | Toggle simples e claro |
| Domain-wide Email | ✅ MANTER | Toggle simples |

### 4.3 Problemas Detectados — 🔴 BLOQUER P0

| Issue | Location | Severity | Descrição |
|-------|----------|----------|-----------|
| `isEnterprisePlan = true` hardcoded | sso-config-client.tsx:76 | 🔴 **P0 — Blocker** | A variável está hardcoded para `true`, o que significa que o bloqueio "SSO disponível apenas no plano Enterprise" (linhas 101-115) NUNCA é mostrado. Qualquer utilizador em plano Free/Pro vê a página SSO como se tivesse acesso. |
| Emoji icons (🔐, 🌐, ⚙️) em vez de Lucide | sso-config-client.tsx:130,236,262 | 🔴 **P0 — Blocker** | Emojis não são consistentes entre browsers/OS, não têm suporte a `size-*`, não têm `aria-hidden`, e podem ser interpretados incorrectamente por leitores de ecrã. Devem ser substituídos por `LockKeyholeIcon`, `GlobeIcon`, `SettingsIcon` de `lucide-react`. |

### 4.4 Problemas — 🟡 Major P1

| Issue | Location | Severity | Descrição |
|-------|----------|----------|-----------|
| Form não submete dados | sso-config-client.tsx:227 | 🟡 **P1 — Major** | Botão "Guardar configuração" não tem `onClick` ou `type="submit"` associado a um form handler. Os estados `domain`, `idpMetadataUrl`, `idpEntityId` são geridos com `useState` mas nunca são enviados ao servidor. |
| OAuthProviderField não guarda | sso-config-client.tsx:344 | 🟡 **P1 — Major** | Botão "Guardar" dentro do OAuthProviderField não tem handler |
| SSO grace degradation | sso-config-client.tsx:66-68 | ⚠️ Minor | Tratamento de API unavailable é bom, mas não há feedback claro para o utilizador |

### 4.5 Hierarquia Visual

- **Scan path:** Título → SSO/SAML Card → OAuth Providers → Provisioning
- **Primary action:** "Guardar configuração" — mas não funcional
- **Above fold:** Título + início do SSO/SAML Card
- **Densidade:** Alta — muitos campos num só card

### 4.6 Design System

| Check | Status | Notas |
|-------|--------|-------|
| Field composition | ✅ OK | Field/FieldLabel/FieldContent/FieldError |
| Input placeholder | ✅ OK | Texto descritivo |
| Switch | ✅ OK | Com aria-label |
| Badge variants | ✅ OK | success, outline |
| Emoji use | ❌ **Blocker** | 🔐🌐⚙️ devem ser Lucide icons |

---

## 5. Team Switcher

### 5.1 Componente Standalone (`components/teams/team-switcher.tsx`)

| Aspecto | Status |
|---------|--------|
| Estados: empty, single, multiple, loading, error | ✅ Todos implementados |
| Search via Command | ✅ Sim |
| Skeleton loading | ✅ Sim |
| Error state with message | ✅ Sim |
| PT-PT labels | ✅ Sim |
| Keyboard accessible | ✅ Via Command component |

### 5.2 Componente Sidebar (`components/app-sidebar/team-switcher.tsx`)

| Aspecto | Status |
|---------|--------|
| Estados: apenas multi-org | ⚠️ Single org não tratado como display estático |
| Sidebar integration | ✅ SidebarMenu/SidebarMenuItem |
| Mobile support | ✅ `isMobile` prop para side |
| Keyboard shortcut slot | ✅ DropdownMenuShortcut preparado |
| Create org CTA | ✅ Sim |

### 5.3 Problemas Detectados

| Issue | Location | Severity | Descrição |
|-------|----------|----------|-----------|
| Duas implementações diferentes | `teams/team-switcher.tsx` vs `app-sidebar/team-switcher.tsx` | 🟡 **P1 — Major** | Uma usa Popover+Command (standalone), outra usa DropdownMenu (sidebar). Mesma funcionalidade, UX diferente. Deviam partilhar lógica core. |
| Sidebar version: sem single-org state | app-sidebar/team-switcher.tsx:50-104 | 🟡 **P2 — Minor** | O sidebar team-switcher mostra sempre o dropdown trigger, mesmo quando há apenas 1 organização. O standalone trata isso correctamente. |
| Sem team-level switching | Ambos | ⚠️ Minor | Spec indica refinamento futuro |
| Sem keyboard shortcut | Ambos | ⚠️ Minor | `Ctrl+Shift+T` indicado no spec |

### 5.4 Design System

| Check | Status |
|-------|--------|
| Token use | ✅ OK — bg-sidebar-primary, text-sidebar-primary-foreground |
| Icon use | ✅ OK — BuildingIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon |
| Accessibility | ✅ OK — role="combobox", aria-expanded, aria-label |
| Command pattern | ✅ OK — shadcn Command para search |

---

## 6. UX Score Summary

| Dimensão | Billing Overview | Subscription Mgmt | SSO Config | Team Switcher | Billing Layout | Média |
|----------|:---------------:|:-----------------:|:----------:|:-------------:|:--------------:|:-----:|
| **Layout** | 8 | 8 | 7 | 8 | 7 | 7.6 |
| **Responsividade** | 8 | 8 | 7 | 9 | 8 | 8.0 |
| **Organização** | 8 | 8 | 7 | 9 | 7 | 7.8 |
| **Consistência** | 7 | 7 | 5 | 7 | 5 | 6.2 |
| **Escaneabilidade** | 8 | 8 | 7 | 9 | 7 | 7.8 |
| **Carga Cognitiva** | 8 | 8 | 7 | 9 | 9 | 8.2 |
| **Usabilidade** | 7 | 7 | 5 | 8 | 6 | 6.6 |
| **Acessibilidade** | 8 | 8 | 5 | 8 | 7 | 7.2 |
| **Média** | **7.75** | **7.75** | **6.25** | **8.38** | **7.0** | **7.4** |

**Weighted Composite UX Score: 7.5/10 — GOOD (needs refinement)**

### Rating Breakdown
- 9.0-10: EXCELLENT — Stripe/Linear level
- 7.0-8.9: 🟡 GOOD — Needs refinement ⬅️
- 5.0-6.9: 🟠 POOR — Needs redesign (SSO Config)
- <5.0: 🔴 FAIL

---

## 7. Reorganização Proposals

### 7.1 SSO Config Page — Before/After

```
## HOJE
+----------------------------------+
| Autenticação                     |
| Configure o login                |
+----------------------------------+
| 🔐 SSO/SAML [LONG FORM]         |
| Domain, IdP URL, Entity ID,     |
| ACS URL, Guardar                |
+----------------------------------+
| 🌐 OAuth Providers [3 PROVS]    |
| Google (expansível)             |
| Microsoft (expansível)          |
| GitHub (expansível)             |
+----------------------------------+
| ⚙️ Provisioning [2 TOGGLES]     |
| JIT, Domain-wide                |
+----------------------------------+

## NOVO (Proposed)
+----------------------------------+
| Autenticação                     |
| Configure o login                |
+----------------------------------+
| [SSO/SAML] [Providers OAuth]    | ← Tabs
+----------------------------------+
| Tab SSO/SAML:                    |
| Domain + verificação             |
| IdP Metadata URL/XML upload      |
| Entity/ACS (read-only)           |
| [Guardar configuração]           |
+----------------------------------+
| Tab Providers OAuth:             |
| Google [Configurado/Não]        |
| Microsoft [Configurado/Não]     |
| GitHub [Configurado/Não]        |
+----------------------------------+
| ⚙️ Provisioning (independente)   |
| JIT + Domain-wide toggles       |
+----------------------------------+
```

### 7.2 Billing Layout — Tabs Fix

```
## HOJE
<Tabs defaultValue="overview">
  <Link><TabsTrigger value="overview" /></Link>
  <Link><TabsTrigger value="subscription" /></Link>
  <Link><TabsTrigger value="invoices" /></Link>
</Tabs>

## NOVO (Proposed)
"use client"
const pathname = usePathname();
const currentTab = tabFromPath(pathname);
<Tabs value={currentTab} onValueChange={handleTabChange}>
  <TabsTrigger value="overview">Visão geral</TabsTrigger>
  <TabsTrigger value="subscription">Subscrição</TabsTrigger>
  <TabsTrigger value="invoices">Faturas</TabsTrigger>
</Tabs>
```

### 7.3 Team Switcher — Unificação

```
## HOJE
- components/teams/team-switcher.tsx (Popover + Command)
- components/app-sidebar/team-switcher.tsx (DropdownMenu)

## NOVO (Proposed)
- components/teams/team-switcher.tsx — shared core logic
- components/teams/sidebar-team-switcher.tsx — sidebar wrapper
  (usa o core, renderiza com SidebarMenu)
```

---

## 8. Design System Token Compliance

### Automated Audit Results

| Categoria | Count | True Positives | False Positives |
|-----------|-------|----------------|-----------------|
| Hardcoded text sizes | 36 | 3 (emoji text-2xl) | 33 (text-{xs/sm/base/lg/2xl/3xl} são tokens mapeados) |
| Hardcoded border radius | 12 | 4 (rounded-full, não na escala de tokens) | 8 (rounded-{sm/md/lg} são tokens mapeados) |
| Non-standard font weight | 10 | 1 (font-medium em heading context) | 9 (font-medium e font-semibold são tokens) |
| Missing hover/focus states | 13 | 2 (links raw sem focus-visible consistentes) | 11 (componentes shadcn/ui têm focus states internos) |
| Button without ARIA label | 1 | 0 (falso positivo — botão tem texto visível) | 1 |

**Total real violações: ~10** (não 80 como o automated audit reportou)

### Tokens Correctamente Usados

| Token | Ocorrências | Exemplos |
|-------|------------|----------|
| `tracking-heading` | 6 | Títulos de página e secção |
| `bg-destructive/*` | 5 | Banners de erro past-due |
| `bg-warning/*` | 3 | Banners de cancelamento |
| `text-muted-foreground` | 15+ | Descrições, labels secundários |
| `bg-sidebar-primary` | 2 | TeamSwitcher avatars |
| `density-compact` | 5 | Badge density |
| `gap-*` | 20+ | Layout spacing |

### Tokens Ausentes/Não Usados

| Token | Localização Esperada | Estado |
|-------|---------------------|--------|
| `--shadow-panel` | Cards, DropdownMenu | ⚠️ Usado internamente por shadcn |
| `--duration-slow` (300ms) | UsageMeter transition | ❌ Usa `duration-500` |
| `rounded-2xl/3xl` | Cards de destaque | ⚠️ Não usado (cards usam token via shadcn) |

---

## 9. Product Thinking Review

### 9.1 Stripe Standard
> "Every pixel should feel intentional. If a user can't tell what to do in 2 seconds, we've failed."

| Check | Status | Notas |
|-------|--------|-------|
| Propósito imediatamente claro? | ✅ | Billing: "Faturação — Subscrição, planos e faturas" |
| Ação primária óbvia? | ✅ | "Gerir subscrição" / "Configurar subscrição" |
| Informação secundária recuada? | ✅ | Uso está abaixo da subscrição |
| Tom confiante e directo? | ⚠️ Parcial | SSO usa emojis, quebra o tom profissional |
| **Veredito:** | ✅ **Passa** (SSO precisa de correcção) | |

### 9.2 Linear Standard
> "Design is how it works, not just how it looks."

| Check | Status | Notas |
|-------|--------|-------|
| Experiência fluida? | ⚠️ Parcial | Tabs não seguem rota activa — pequena fricção |
| Keyboard shortcuts? | ❌ | Nenhum atalho implementado |
| Transições suaves? | ⚠️ Parcial | UsageMeter tem `duration-500` (não do sistema) |
| Empty states informativos? | ✅ | "Sem faturas — aparecerão após primeira cobrança" |
| **Veredito:** | ⚠️ **Condicional** | Tabs fix + shortcuts melhorariam |

### 9.3 Vercel Standard
> "Performance is a design feature."

| Check | Status | Notas |
|-------|--------|-------|
| Skeleton screens? | ✅ | loading.tsx em todas as rotas |
| Server-renderable? | ✅ | Server components com try/catch |
| Loading optimista? | ❌ | Não usado (seria complexo para billing) |
| **Veredito:** | ✅ **Passa** | |

### 9.4 SAP Fiori Standard (Enterprise)
> "Enterprise apps must be efficient, not just beautiful."

| Check | Status | Notas |
|-------|--------|-------|
| Mínimo de cliques? | ✅ | 1 clique para gerir subscrição |
| Terminologia operacional? | ✅ | PT-PT, "Faturação", "Subscrição", "Planos" |
| Suporte a atalhos? | ❌ | Sem atalhos de teclado |
| Densidade apropriada? | ✅ | Modo compacto em badges, tables |
| Dados mestres vs transacionais? | ✅ | Planos (mestre) vs Faturas (transacional) |
| **Veredito:** | ✅ **Passa** | |

---

## 10. Action Plan

### P0 — 🔴 Bloqueante (Antes de qualquer entrega)

1. **🔴 Fix `isEnterprisePlan` hardcoded**
   - **Ficheiro:** `apps/web/app/(platform)/app/admin/sso/sso-config-client.tsx:76`
   - **Mudança:** Substituir `const isEnterprisePlan = true` por lógica real que verifica o plano activo do utilizador a partir dos RPC data (ex: `subscription?.plan === "enterprise"` ou um campo `plan` passado como prop)
   - **Departamento:** Frontend
   - **Complexidade:** S
   - **Context7:** Better Auth session/permissions patterns

2. **🔴 Substituir emojis por Lucide icons**
   - **Ficheiro:** `apps/web/app/(platform)/app/admin/sso/sso-config-client.tsx:130,236,262`
   - **Mudança:** 🔐 → `LockKeyholeIcon`, 🌐 → `GlobeIcon`, ⚙️ → `SettingsIcon` de `lucide-react`. Adicionar `aria-hidden="true"` nos icons.
   - **Ficheiro:** `apps/web/app/(platform)/app/billing/components/billing-subscription-card.tsx:84,110`
   - **Mudança:** ⚠️ → `TriangleAlertIcon`, ℹ️ → `InfoIcon` de `lucide-react`. Adicionar `aria-hidden="true"`.
   - **Departamento:** Frontend
   - **Complexidade:** S
   - **Context7:** `lucide-react` icon names

### P1 — 🟡 Core Experience

1. **Fix Tabs navigation (billing layout)**
   - **Ficheiro:** `apps/web/app/(platform)/app/billing/layout.tsx:28-52`
   - **Mudança:** Converter para client component. Usar `usePathname()` para derivar `value` dinâmico. Usar `onValueChange` com `router.push`. Remover `Link` wrapping dos `TabsTrigger`.
   - **Departamento:** Frontend
   - **Complexidade:** M

2. **Implementar form submission no SSO**
   - **Ficheiro:** `apps/web/app/(platform)/app/admin/sso/sso-config-client.tsx:39-293`
   - **Mudança:** Adicionar `form action` ou `useActionState` para submeter a configuração SSO. Implementar handler para "Guardar configuração".
   - **Departamento:** Frontend + Backend
   - **Complexidade:** L

3. **Extrair subscriptionBadge map partilhado**
   - **Ficheiro:** `apps/web/app/(platform)/app/billing/components/billing-subscription-card.tsx:28-40` + `apps/web/app/(platform)/app/billing/subscription/subscription-management-client.tsx:29-41`
   - **Mudança:** Mover `subscriptionBadge` map (e `planNames` map) para `@saptm/rpc/billing` ou `@saptm/ui` como constantes partilhadas.
   - **Departamento:** Frontend
   - **Complexidade:** S

4. **Unificar TeamSwitcher implementations**
   - **Ficheiro:** `apps/web/components/teams/team-switcher.tsx` + `apps/web/components/app-sidebar/team-switcher.tsx`
   - **Mudança:** Extrair lógica core (fetch orgs, switch, loading/error states) para hook ou componente base. Criar wrapper para sidebar.
   - **Departamento:** Frontend
   - **Complexidade:** M

5. **Extrair ContextRowDetail para componente partilhado**
   - **Ficheiro:** `apps/web/app/(platform)/app/billing/subscription/subscription-management-client.tsx:258-264`
   - **Mudança:** Mover `ContextRowDetail` para `@saptm/ui` e reutilizar em billing-subscription-card.tsx e subscription-management-client.tsx.
   - **Departamento:** Frontend
   - **Complexidade:** S

6. **Implementar SSO OAuth provider config**
   - **Ficheiro:** `apps/web/app/(platform)/app/admin/sso/sso-config-client.tsx:297-351`
   - **Mudança:** Adicionar form submission handler para OAuthProviderField "Guardar" button.
   - **Departamento:** Frontend
   - **Complexidade:** M

### P2 — 🟠 Qualidade

1. **Extract invoice columns para partilhado**
   - **Ficheiro:** `apps/web/app/(platform)/app/billing/components/billing-invoices-section.tsx:19-75` + `apps/web/app/(platform)/app/billing/invoices/page.tsx:43-99`
   - **Mudança:** Mover `invoiceColumns` e `invoiceStatusMap` para ficheiro partilhado (ex: `apps/web/app/(platform)/app/billing/shared/invoice-table.tsx`)
   - **Complexidade:** S

2. **Adicionar tooltip no UsageMeter hover** (conforme spec: "meter bar shows a tooltip with exact counts on hover")
   - **Ficheiro:** `apps/web/components/billing/usage-meter.tsx`
   - **Mudança:** Envolver barra de progresso em componente Tooltip de shadcn/ui com detalhes exactos (current/limit)
   - **Complexidade:** S

3. **Substituir `duration-500` por `duration-slow` token**
   - **Ficheiro:** `apps/web/components/billing/usage-meter.tsx:65`
   - **Mudança:** `transition-all duration-500` → `transition-all duration-slow`
   - **Complexidade:** S

4. **Adicionar active tab display no sidebar team-switcher para single org**
   - **Ficheiro:** `apps/web/components/app-sidebar/team-switcher.tsx`
   - **Mudança:** Se organizations.length === 1, mostrar display estático em vez de dropdown trigger (como o standalone faz)
   - **Complexidade:** S

5. **SSO config: claro feedback quando API não disponível**
   - **Ficheiro:** `apps/web/app/(platform)/app/admin/sso/sso-config-client.tsx:66-68`
   - **Mudança:** Em vez de silenciosamente retornar null, mostrar badge "Indisponível" ou mensagem informativa no formulário
   - **Complexidade:** S

### P3 — 🔵 Refinamento

1. **Keyboard shortcut para TeamSwitcher** (`Ctrl+Shift+T`)
2. **Team-level switching** (dentro da organização)
3. **Billing overview: adicionar paginação nas faturas** (se houver mais de 5)
4. **PlanCard: tooltip de preço anual vs mensal**
5. **SSO: Domain verification real com DNS check** (implementar verificação)
6. **Search dentro do TeamSwitcher standalone** (já existe no Command pattern)

---

## 11. Handoff Summary

| Departamento | P0 | P1 | P2 | P3 | Total |
|-------------|:--:|:--:|:--:|:--:|:-----:|
| Frontend | 2 | 5 | 4 | 4 | 15 |
| Backend | 0 | 1 | 0 | 0 | 1 |
| Visual Design | 0 | 0 | 1 | 1 | 2 |

### Files with Most Issues

| File | Blocker | Major | Minor | Total |
|------|:-------:|:-----:|:-----:|:-----:|
| `sso-config-client.tsx` | 2 | 2 | 1 | 5 |
| `layout.tsx` (billing) | 0 | 2 | 0 | 2 |
| `billing-subscription-card.tsx` | 0 | 1 | 1 | 2 |
| `subscription-management-client.tsx` | 0 | 2 | 1 | 3 |
| `team-switcher.tsx (sidebar)` | 0 | 1 | 1 | 2 |
| `usage-meter.tsx` | 0 | 0 | 2 | 2 |

---

## Severity Summary

| Nível | Count | Acção |
|-------|-------|-------|
| **Blocker (P0)** | 2 | REJECT — cannot deliver |
| **Major (P1)** | 9 | Must fix before delivery |
| **Minor (P2)** | 8 | Document for next cycle |
| **Refinement (P3)** | 4 | Nice to have |

## Quality Gates

| Gate | Status |
|------|--------|
| Inventário completo | ✅ |
| Zero Justification | ✅ |
| Hierarquia Visual | ✅ |
| Responsividade | ✅ |
| Cognitive Load | ✅ |
| UX Score ≥ 7.0 | ✅ (7.5) |
| Reorganização proposta | ✅ |
| Design System tokens | ⚠️ 2 violações P0 |
| Product Thinking | ✅ Condicional |
| Implementação priorizada | ✅ |

## Context7 Consultas Realizadas

| Library | Query | Purpose |
|---------|-------|---------|
| shadcn/ui | Badge component variant types and usage patterns | Verificar variantes suportadas |
| - | - | Review interno do design system tokens |

---

*Relatório gerado por `@enterprise-design-qa` — Pipeline Stage 10*  
*Próximo passo: Executar correcções P0-P1 e re-auditar.*
