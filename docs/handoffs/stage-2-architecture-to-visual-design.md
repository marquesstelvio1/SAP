# Handoff Report: Stage 2 → Stage 3 (Architecture → Visual Design)

> **De:** Departamento de Arquitetura (@enterprise-architecture)
> **Para:** Departamento de Design Visual (@enterprise-visual-design)
> **Data:** 2026-07-02
> **Propósito:** Transmitir decisões arquiteturais, bounded contexts validados, novos modelos de dados e implicações de UI para o design visual.

---

## 1. Resumo do Trabalho Realizado

### O que foi validado

| Área | Decisão | Estado |
|------|---------|--------|
| **Bounded Context: Billing** | Contexto separado, não sub-contexto de Organization | ✅ Validado |
| **Bounded Context: Team** | Sub-contexto de Organization (Team não existe sem Organization) | ✅ Validado |
| **Usage Metering** | Event-driven via EventBus (já implementado) | ✅ Validado |
| **SSO/SAML** | Configuração vive em Organization, execução em Auth | ✅ Validado |
| **Schema existente** | Subscription, Invoice, UsageRecord, Team, TeamMember já existem | ✅ Confirmado |
| **C4 Model** | Níveis 1, 2 e 3 criados | ✅ Criado |
| **Audit Issues** | 3/4 resolvidos, 1 pendente (Prisma tenant scoping extension) | 🟡 Parcial |

### ADRs Criados

| ADR | Título | Status |
|-----|--------|--------|
| 0014 | Billing/Subscription como Bounded Context Separado | Accepted |
| 0015 | Team-Based Access Control com Scoped Resources | Accepted |
| 0016 | Usage Metering Architecture (Event-Driven) | Accepted |
| 0017 | Schema Additions: Plan, SsoConfig, teamId, FeatureFlags | Accepted |

### ADRs Atualizados

| ADR | Mudança |
|-----|---------|
| 0012 | oRPC Transport Rationale: **Proposed → Accepted** (já implementado) |
| 0013 | Event-Driven Usage Tracking: **Proposed → Accepted** (já implementado) |

### Diagramas C4 Criados

| Diagrama | Nível | Ficheiro |
|----------|-------|----------|
| Context Diagram | Level 1 | `docs/architecture/c4-context.md` |
| Container Diagram | Level 2 | `docs/architecture/c4-container.md` |
| Component Diagram | Level 3 | `docs/architecture/c4-component.md` |

---

## 2. Mapa de Bounded Contexts

### Contextos Existentes (13)

```
┌─────────────────────────────────────────────────────────────────┐
│                         SAPTM API                               │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  CARGO   │  │ TRACKING │  │ CAPACITY │  │ PLANNING │       │
│  │  (core)  │  │  (core)  │  │          │  │          │       │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘       │
│       │              │                                           │
│       ▼              ▼                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  TARIFF  │  │ BILLING  │  │   AUTH   │  │    ORG   │       │
│  │          │  │  (novo)  │  │          │  │  + TEAM  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │INTEGRA-  │  │NOTIFICA- │  │ AUDIT    │  │ DOCUMENTS│       │
│  │TIONS     │  │TIONS     │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌──────────┐                                                    │
│  │WEBHOOKS  │                                                    │
│  └──────────┘                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Relações entre Contextos

| Contexto A | Contexto B | Tipo | Meio |
|------------|-----------|------|------|
| Cargo | Tracking | Event-driven (async) | EventBus → outbox |
| Cargo | Billing | Event-driven (consumo de métricas) | EventBus → usage-event-handler |
| Tracking | Billing | Event-driven (consumo de métricas) | EventBus → usage-event-handler |
| Tracking | Capacity | Sync (direct) | RPC / DI |
| Planning | Tariff | Sync (direct) | RPC / DI |
| Planning | Cargo | Sync (direct) | RPC / DI |
| Billing | Stripe | Webhook (external) | HTTP POST |
| Auth | Better Auth | Library integration | DI |

---

## 3. Novas Entidades que Impactam UI

### 3.1 Billing/Subscrições

**Já implementado no backend e RPC contracts.** UI precisa de:

| Funcionalidade | Estado | Onde |
|---------------|--------|------|
| Página de billing overview | ✅ Já existe | `apps/web/app/(platform)/app/settings/billing/` |
| Checkout Stripe (plano Pro) | 🟡 RPC + backend pronto, UI precisa de ligar | Botão "Upgrade to Pro" |
| Customer Portal (Stripe) | 🟡 RPC + backend pronto, UI precisa de ligar | Gerir subscrição, faturas |
| Usage meters visuais | ✅ `UsageCard` ou `MetricTile` com current/limit | Dashboard de billing |
| Plan badge no header | 🟡 Novo — badge "Free" / "Pro" / "Enterprise" | Sidebar / settings header |
| Invoices list | ✅ Já existe na página de billing | Tabela de faturas |

**Entidades com impacto visual:**
- `Plan` — slug, name, price, features[], memberLimit, cargoLimit, trackingLimit
- `Subscription` — plan, status (active, past_due, canceled, unpaid, trialing), period dates
- `UsageRecord` — metric (members, cargo_shipments, tracking_events), current, limit

### 3.2 Equipas (Teams)

**Já implementado no backend.** UI precisa de:

| Funcionalidade | Estado | Onde |
|---------------|--------|------|
| List teams page | ✅ Já existe | `apps/web/app/(platform)/app/admin/teams/` |
| Create/edit team dialog | ✅ Já existe | `team-members-dialog.tsx` |
| Team member management | ✅ Já existe | Adicionar/remover membros, alterar roles |
| Team switcher no shell | 🟡 **Novo — critical** | Sidebar: dropdown para selecionar equipa atual |
| Team badge nos cards | 🟡 **Novo** | Mostrar team name nos cards de carga/tracking |
| Team filter nas listas | 🟡 **Novo** | Filtro por equipa nas tabelas |

**Navegação:**
- Team switcher no topo do sidebar (estilo Slack/Linear)
- Ao selecionar equipa, todo o contexto muda (cargas, tracking, etc.)
- Team context indicado visualmente (cor, badge, label)
- Voltar a "All teams" para ver dados consolidados

### 3.3 SSO/SAML

**Backend precisa de schema additions (ADR 0017).** UI precisa de:

| Funcionalidade | Estado | Onde |
|---------------|--------|------|
| SSO configuration page | 🔴 **Novo** | Settings → Authentication |
| Domain verification | 🔴 **Novo** | Adicionar domínio, verificar DNS |
| IdP metadata upload | 🔴 **Novo** | URL/XML para SAML IdP |
| OAuth provider toggles | 🔴 **Novo** | Google, Microsoft login on/off |
| JIT provisioning toggle | 🔴 **Novo** | Auto-create users on SSO login |

### 3.4 Signup Flow

**Novo — backend precisa de implementar.** UI:

| Funcionalidade | Estado |
|---------------|--------|
| Signup page (email + password) | 🔴 **Novo** |
| Organization creation step | 🔴 **Novo** (nome, slug da organização) |
| Email verification | 🟡 Better Auth já suporta |
| Welcome/onboarding page | 🔴 **Novo** (convite de membros, configuração inicial) |
| Plan selection (free vs pro) | 🟡 Ligar ao checkout Stripe |

---

## 4. Implicações de Navegação

### Estrutura Proposta do Sidebar

```
🏢 [Team Switcher]          ← NOVO: dropdown com teams
─────────────────────
📊 Dashboard Operacional
🚚 Cargas
📡 Tracking
📋 Planeamento
⚡ Capacidade
─────────────────────
⚙️ Administração           ← renomeado de "Admin"
  ├── 👥 Utilizadores       ← NOVO: gestão de membros
  ├── 🏷️ Equipas           ← NOVO: gestão de equipas
  ├── 🔐 Autenticação       ← NOVO: SSO/OAuth config
  └── 📊 Relatórios
💳 Faturação               ← NOVO no sidebar principal
  ├── 📋 Subscrição
  ├── 📄 Faturas
  └── 📊 Utilização
👤 Perfil
```

### Breadcrumbs (Sprint A)

Breadcrumbs impactados pelas novas páginas:
- `Faturação > Subscrição`
- `Faturação > Faturas`
- `Administração > Equipas > [Nome da Equipa]`
- `Administração > Autenticação`
- `Administração > Utilizadores`

---

## 5. Novos Componentes de UI Necessários

### Prioridade Alta (Sprint A)

| Componente | Descrição | Tipo |
|-----------|-----------|------|
| `PlanBadge` | Badge "Free" / "Pro" / "Enterprise" com cor | shadcn Badge variant |
| `UsageMeter` | Barra de progresso current/limit com warning | Custom (Radix Progress) |
| `TeamSwitcher` | Dropdown no sidebar para selecionar equipa | Custom (Radix DropdownMenu) |
| `InvoiceTable` | Tabela de faturas com status, data, valor | shadcn Table |
| `SignupForm` | Formulário de registo com email e password | shadcn Form + Field |
| `OrgCreateForm` | Formulário de criação de organização pós-signup | shadcn Form + Field |

### Prioridade Média (Sprint B)

| Componente | Descrição |
|-----------|-----------|
| `SsoConfigForm` | Configuração de SSO/SAML (domínio, IdP, providers) |
| `TeamFilter` | Dropdown de filtro por equipa nas tabelas |
| `TeamBadge` | Badge de equipa nos cards de recurso |
| `UserInviteForm` | Formulário de convite de utilizador por email |
| `WelcomeCard` | Card de onboarding pós-signup |

### Prioridade Baixa (Later)

| Componente | Descrição |
|-----------|-----------|
| `FeatureGate` | Wrapper que esconde conteúdo baseado no plano |
| `PlanUpgradePrompt` | Card/interstitial para upgrade de plano |
| `DomainVerifyCard` | Card de verificação de domínio DNS TXT |

---

## 6. Estados de UI para Novas Funcionalidades

### Página de Billing Overview

| Estado | Template |
|--------|----------|
| **Free plan** | Mostrar usage meters, "Upgrade to Pro" CTA, features comparison |
| **Pro active** | Mostrar usage meters, "Manage subscription" CTA, próximo ciclo |
| **Past due** | Warning banner + "Update payment" CTA |
| **Canceled** | Info card + "Reactivate" CTA |
| **Loading** | `<AccessState badgeLabel="Faturação" title="A carregar ..." description="A obter detalhes da subscrição..." />` |
| **Error** | `<AccessState badgeLabel="Faturação" title="Faturação indisponivel" description="Nao foi possivel carregar os detalhes da subscricao." variant="error" />` |

### Team Switcher

| Estado | Comportamento |
|--------|---------------|
| **Single team** | Mostrar nome da equipa como label estática (sem dropdown) |
| **Multiple teams** | Dropdown com lista de equipas + "All teams" |
| **Loading** | Skeleton de 40px width |
| **No teams** | Ocultar (não mostrar team switcher) |

### Página de Subscrição (Settings)

| Estado | Layout |
|--------|--------|
| **Free** | 3 cards (Free/Pro/Enterprise) com features, "Current plan" no Free |
| **Pro** | Card "Current: Pro" com detalhes, botão "Change plan" |
| **Enterprise** | Card "Custom plan" com "Contact sales" |

---

## 7. Decisões Arquiteturais com Impacto Visual

### 7.1 Plan-Limits no Frontend

Os limites do plano devem ser verificados **no servidor** (RPC layer com PlanGuard). No frontend, usar `AccessState` com variante `plan_limit` para features bloqueadas:

```tsx
<AccessState
  badgeLabel="Registo de cargas"
  title="Limite do plano atingido"
  description="O seu plano Free permite 50 cargas por mes. Faça upgrade para Pro para registar mais."
  variant="blocked"
  cta={{ label: "Ver planos", href: "/app/settings/billing" }}
/>
```

**Não expor** o nome técnico "plan_limit" nem o permission name "cargo.register".

### 7.2 Feature Gating Visual

Features disponíveis por plano:

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Registo de cargas | 50/mês | 500/mês | Ilimitado |
| Tracking events | 1.000/mês | 10.000/mês | Ilimitado |
| Membros | 5 | 50 | Ilimitado |
| Equipas | ❌ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ✅ |
| API Webhooks | ❌ | ✅ | ✅ |
| Relatórios CSV | ✅ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |

### 7.3 Team Switcher no Contexto de Navegação

- O team switcher muda o contexto das queries (teamId é injetado nas RPC calls)
- Recursos sem teamId são visíveis em "All teams" e também em cada equipa com permissão
- A UI deve indicar qual o team context atual (ex: "Equipa: Logística Porto" no header)
- Ao navegar para uma página de detalhe de recurso, mostrar o team badge se aplicável

### 7.4 Linguagem Operacional (PT-PT)

Manter a convenção de **nunca expor** ao utilizador:
- Permission names (`cargo.register`, `tracking.shipment.read`)
- RPC endpoints (`POST /rpc/...`)
- IDs de sessão ou organização
- Termos como "RBAC", "CRUD", "governado"

Usar linguagem operacional logística:
- "Registo autorizado" / "Registo indisponivel"
- "Cargas" em vez de "Registo governado de cargas"
- "Faturação" em vez de "Billing"
- "Equipas" em vez de "Teams"
- "Subscrição" em vez de "Subscription"

---

## 8. ADRs Relevantes para Visual Design

| ADR | Impacto Visual |
|-----|---------------|
| 0014 — Billing/Subscription Context | Plan badge, usage meters, upgrade prompts, pricing page |
| 0015 — Team Scoping Model | TeamSwitcher, team badge, team filter, team context nav |
| 0016 — Usage Metering | Visual progress bars, limit warnings, upgrade CTAs |
| 0017 — Schema Additions | SSO config page, plan selection, feature flags UI |

---

## 9. O que foi Implementado vs Apenas Desenhado

### ✅ Já Implementado (backend + RPC contracts)

- Billing module completo: `BillingService`, `UsageService`, webhook handling
- RPC contracts para billing: overview, checkout, portal, subscription, invoices, usage, plans
- Teams module completo: CRUD teams, member management
- RPC contracts para teams: create, update, delete, list, get, add/remove/update member
- Subscription + Invoice + UsageRecord models no Prisma schema
- Team + TeamMember models no Prisma schema
- UsageEventHandler (event-driven, já migrado)
- Outbox worker (real, com polling, retry, DLQ)
- Página de billing UI (`/app/settings/billing/`)
- Página de teams UI (`/app/admin/teams/`)

### 🔴 Por Implementar (backend + frontend)

- **Plan model** (schema addition, ADR 0017)
- **SsoConfig model** (schema addition, ADR 0017)
- **teamId em Cargo/TrackingShipment** (schema addition, ADR 0017)
- Signup flow (criação de organização + plano Free)
- Stripe checkout ligado à UI (RPC pronto, UI precisa de botão)
- Team switcher no shell (UI component)
- Processamento real de eventos de subscrição (subscription.updated, subscription.deleted)
- SSO/SAML configuration page
- Feature gating middleware (PlanGuard)

---

## 10. Handoff Points para Visual Design

### O que Design Visual deve fazer a seguir:

1. **Desenhar TeamSwitcher** — Dropdown no sidebar para seleção de equipa (estilo Slack/Linear)
2. **Desenhar PlanBadge** — Badge "Free" / "Pro" / "Enterprise" com cores distintas
3. **Desenhar UsageMeter** — Barra de progresso com current/limit e estado de warning (perto do limite)
4. **Desenhar Billing Overview** — Página com subscription details, usage meters, upgrade CTA
5. **Desenhar Pricing Cards** — 3 cards (Free/Pro/Enterprise) com features comparison
6. **Desenhar Signup Flow** — 3-step: email/password → create org → plan selection
7. **Desenhar SSO Config Page** — Domain, IdP metadata, OAuth provider toggles
8. **Validar Sidebar Navigation** — Com novos items (Faturação, Administração > Equipas)
9. **Rever linguagem operacional** — Garantir que todas as labels usam PT-PT logístico

### Documentos de Referência

- [C4 Context Diagram](../architecture/c4-context.md) — Visão geral do sistema
- [C4 Container Diagram](../architecture/c4-container.md) — Contentores e dependências
- [C4 Component Diagram](../architecture/c4-component.md) — Bounded contexts e relações
- [ADR 0014 — Billing Context](../adr/0014-billing-subscription-context.md)
- [ADR 0015 — Team Scoping Model](../adr/0015-team-scoping-model.md)
- [ADR 0016 — Usage Metering](../adr/0016-usage-metering-architecture.md)
- [ADR 0017 — Schema Additions](../adr/0017-schema-additions-billing-teams-sso.md)
- [Audit UX-UI](../UX-UI-AUDIT.md) — Auditoria de UX/UI com 48 findings
- [Product Backlog](../product/product-backlog.md) — Backlog priorizado com RICE
- [Sprint Goals](../product/sprint-goals.md) — Sprint A e B

---

> **Handoff entregue pelo Departamento de Arquitetura (@enterprise-architecture)**
> *Próximo passo: Departamento de Design Visual (@enterprise-visual-design) produzir wireframes e mockups*
