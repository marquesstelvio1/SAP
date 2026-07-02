# Handoff Report: Stage 1 → Stage 2 (Product → Architecture)

> **De:** Departamento de Produto (@enterprise-product)  
> **Para:** Departamento de Arquitetura (@enterprise-architecture)  
> **Data:** 2026-07-02  
> **Propósito:** Transmitir decisões de produto, prioridades e implicações arquiteturais para validação de bounded contexts e desenho técnico.

---

## 1. Resumo das Decisões de Produto

### Estado Atual do Projeto

A SAPTM completou 6 sprints de hardening + 2 fases de produção (Phase 1 e Phase 2). O estado atual do produto é:

| Dimensão | Pontuação | Estado |
|----------|-----------|--------|
| Product Strategy | 82/100 | 🟡 Foundation Complete |
| UX | 79/100 | 🟡 Needs Improvement |
| Multi-Tenant Readiness | 52/100 | 🔴🔴 Critical Gap |
| Testing | 62/100 | 🔴 Needs Work |
| **OVERALL** | **76.5/100** | **🟡 Foundation Complete** |

### O que já foi entregue (sprints anteriores)

- ✅ Error boundaries em todas as rotas
- ✅ Loading states em 11 rotas de domínio
- ✅ Extração de componentes inline (páginas < 100 linhas)
- ✅ Repository pattern em todos os módulos
- ✅ EventBus + Outbox pattern
- ✅ API versioning (prefixo `/v1/`)
- ✅ Paginação server-side no DataTable
- ✅ Validação Zod client-side
- ✅ Testes unitários de regras de negócio
- ✅ Scripts PowerShell migrados para Node.js cross-platform
- ✅ Skip-to-content + navegação por teclado
- ✅ Password reset flows
- ✅ Organization switcher
- ✅ Páginas de settings (billing, webhooks, branding, teams)
- ✅ 22 de 38 eventos PostHog instrumentados
- ✅ Analytics provider + hook `useCaptureEvent`
- ✅ Design token adoption parcial (input, skeleton, navigation-menu, sidebar, toggle)

### O que ainda está em falta (P0-P1)

| Gap | Prioridade | Esforço Estimado |
|-----|------------|------------------|
| Stripe billing + subscrições | P0 | 4-6 semanas |
| Fluxo de signup + criação de organização | P0 | 3-4 semanas |
| SSO/SAML (Google, Microsoft) | P0 | 4-6 semanas |
| Equipas com scoping de permissões | P0 | 4-6 semanas |
| Breadcrumb component | P1 | 0.5 semanas |
| Perfil do utilizador | P1 | 1-2 semanas |
| Spacing tokens (adoção total) | P1 | 1-2 semanas |
| 16 eventos PostHog em falta | P1 | 1 semana |
| Webhook delivery real (worker + retry) | P1 | 3-4 semanas |
| TanStack Query (caching client-side) | P1 | 2-3 semanas |

---

## 2. Top 3 Prioridades para Arquitetura

### Prioridade #1: Modelo de Subscrições e Faturação (Stripe)

**Decisão de Produto:** Implementar billing com Stripe como prioridade P0.

**Porquê:** Sem billing o SaaS é inviável. É o maior gap identificado no Enterprise Scorecard (Multi-Tenant Readiness: 52/100).

**O que precisa de Arquitetura:**
- Modelo de dados de subscrições (plan, subscription, invoice, usage record)
- Integração com Stripe (webhooks, checkout session, customer portal)
- Metering de uso por organização (quantas cargas registadas, tracking events, etc.)
- Planos: Free (limitado), Pro (ilimitado), Enterprise (custom)
- Billing webhook com idempotency (já existe verified signatures)
- Feature gating baseado no plano da organização

**Bounded Contexts envolvidos:**
- `Billing` (novo) — subscrições, faturas, pagamentos
- `Organization` (existente) — plano ativo, limites
- `Cargo` — meter registos de carga por organização
- `Tracking` — meter eventos de tracking

**Já existe:**
- Página de billing UI (`/app/settings/billing/`)
- Página de conteúdo billing (`billing-page-content.tsx`)
- Billing module no backend (`apps/api/src/billing/`)
- Stripe env vars no `.env.example`

### Prioridade #2: Self-Service de Organização (Signup + Onboarding)

**Decisão de Produto:** Criar fluxo de signup que permite a qualquer utilizador criar uma organização sem intervenção manual.

**Porquê:** Atualmente cada novo tenant requer seed manual de DB. Bloqueia crescimento.

**O que precisa de Arquitetura:**
- Fluxo signup → criar organização → configurar primeiro admin
- Validação de email (Better Auth já suporta)
- Criação de organização com plano Free por defeito
- Página de onboarding pós-signup (configurar equipa, convidar membros)
- Limitação de recursos por plano (ex: Free = 50 cargas/mês)

**Bounded Contexts envolvidos:**
- `Auth` (existente) — signup, email verification
- `Organization` (existente) — criação, configuração inicial
- `Billing` (novo) — plano Free atribuído na criação

### Prioridade #3: SSO/SAML + Equipas com Scoping

**Decisão de Produto:** Implementar autenticação SSO (Google, Microsoft, SAML) e gestão de equipas com permissões scoped.

**Porquê:** É requisito bloqueante para clientes enterprise. Sem SSO não há deal.

**O que precisa de Arquitetura:**
- Configuração de OAuth providers no Better Auth
- SAML/JIT provisioning para organizações enterprise
- Modelo de equipas (team) com membros e permissões scoped
- Team-based access control: permissões aplicam-se a recursos da equipa
- Team switcher no shell (navegação por equipa)
- Tenant + Team scoping combinado (Prisma extension)

**Bounded Contexts envolvidos:**
- `Auth` (existente) — OAuth, SAML, JIT provisioning
- `Organization` (existente) — equipas como sub-entidade
- `Team` (novo ou dentro de Organization) — membros, permissões scoped

**Já existe:**
- Página de teams (`/app/admin/teams/`)
- Team dialog (`team-members-dialog.tsx`)
- Teams repository (`prisma-teams.repository.ts`)
- Better Auth com suporte OAuth (precisa de configuração)

---

## 3. Implicações Arquiteturais das Decisões de Produto

### 3.1 Modelo de Dados — Subscrições

```
Organization
  ├── id
  ├── name
  ├── subscriptionStatus (active, past_due, canceled, unpaid)
  ├── planTier (free, pro, enterprise)
  └── planLimits (JSON: maxCargos, maxTracking, maxMembers, etc.)

Subscription
  ├── id
  ├── organizationId
  ├── stripeSubscriptionId
  ├── stripeCustomerId
  ├── status (active, past_due, canceled, incomplete)
  ├── currentPeriodStart
  ├── currentPeriodEnd
  └── planId

UsageRecord
  ├── id
  ├── organizationId
  ├── meterType (cargo_registered, tracking_event, api_call)
  ├── quantity
  ├── periodStart
  └── periodEnd
```

**Nota:** O modelo de usage metering é crítico para planos free/pro. Precisa de ser eficiente (incrementos atómicos, não queries pesadas).

### 3.2 Feature Gating por Plano

As features devem ser gated pelo plano da organização, não apenas por RBAC. Isto implica:

- Um middleware de plano (PlanGuard) que verifica se a organização tem acesso à feature
- Limites de recursos verificados antes de criar/registar entidades
- UI que esconde/desativa features não disponíveis no plano atual

**Stack sugerida:**
- PlanGuard como NestJS guard (inspirado no AuthorizationGuard existente)
- PlanLimits resolvidos por tenant context (AsyncLocalStorage)
- UI: `AccessState` com variante `"plan_limit"` para features bloqueadas por plano

### 3.3 SSO/SAML — Impacto na Arquitetura

O Better Auth suporta OAuth providers mas a configuração atual é apenas email/password. Para SSO enterprise:

- Provider OAuth configurável por organização (domain-based SSO)
- JIT provisioning: criar utilizador no primeiro login SAML
- Mapeamento de grupos SAML para equipas SAPTM
- Suporte para múltiplos IdPs por organização

**Stack:**
- Better Auth `oauthProviders` com configuração dinâmica
- SAML via Better Auth plugin ou library externa (passport-saml)
- Domain verification para auto-associação de SSO

### 3.4 Equipas com Scoping de Permissões

O modelo atual tem `Organization → User` (plano). O modelo desejado é `Organization → Team → User` com:

- Permissões definidas ao nível da equipa (não apenas do utilizador global)
- Recursos scoped por equipa (uma equipa não vê cargas de outra equipa)
- Team-admin pode gerir membros da sua equipa
- Team-switcher no shell para navegar entre equipas

**Stack:**
- Prisma schema: `Team` + `TeamMembership` (role dentro da equipa)
- Prisma Client Extension: scoping de queries por `teamId` (além de `organizationId`)
- Team scoping middleware: `runWithTenantContext` estendido para `teamContext`
- UI: TeamSwitcher no sidebar + team badge nos cards

---

## 4. Features que Precisam de Validação de Bounded Context

### 4.1. Billing ∩ Organization

**Questão:** O billing é um bounded context separado ou parte de Organization?

**Recomendação de Produto:** Contexto separado (`Billing`). A organização tem um `subscriptionStatus` e `planTier` como value objects, mas a lógica de faturação, webhooks Stripe e metering vive no contexto Billing.

**Eventos de domínio:**
- `billing:subscription.activated` → Organization atualiza planTier
- `billing:subscription.past_due` → Organization marca como past_due, notifica admin
- `billing:usage.threshold_exceeded` → Notifica organization, sugere upgrade

### 4.2. Team ∩ Organization ∩ Auth

**Questão:** Team é sub-contexto de Organization ou contexto próprio?

**Recomendação de Produto:** Sub-contexto de Organization. Team não existe sem Organization. Mas a gestão de membros e permissões de equipa partilha lógica com Auth (membership, roles).

**Implicação:** O módulo `Teams` pode viver dentro do módulo `Organization` ou ser um submódulo de `Admin`. Importante não criar dependência circular.

### 4.3. Billing ∩ Cargo/Tracking (Metering)

**Questão:** O metering de uso (contar cargas registadas, eventos de tracking) pertence a que contexto?

**Recomendação de Produto:** O metering é um evento de domínio publicado por `Cargo`/`Tracking` e consumido por `Billing`. Usar o EventBus existente (`EventBus.publish()`) para publicar `UsageEvent` sempre que uma carga é registada ou um evento de tracking é criado.

**Eventos:**
- `cargo:created` → `UsageEvent { orgId, meterType: "cargo_registered", quantity: 1 }`
- `tracking:event_received` → `UsageEvent { orgId, meterType: "tracking_event", quantity: 1 }`

### 4.4. SSO ∩ Auth

**Questão:** O SSO é configuração de Auth ou uma feature de Organization?

**Recomendação de Produto:** Ambos. A configuração de SSO (domínio, IdP metadata) vive em Organization. A execução do login SSO vive em Auth. O módulo de Organization expõe `ssoConfig` e o Auth lê essa configuração durante o fluxo de login.

---

## 5. O que foi implementado (ficheiros criados/alterados)

### Ficheiros Criados

| Ficheiro | Propósito |
|----------|-----------|
| `docs/product/product-backlog.md` | Backlog priorizado com RICE scoring |
| `docs/product/sprint-goals.md` | Sprint goals detalhados para Sprint A e B |
| `docs/handoffs/stage-1-product-to-architecture.md` | Este documento — handoff para Stage 2 |

### Ficheiros Alterados

| Ficheiro | Alterações |
|----------|------------|
| `docs/product/product-vision-okrs.md` | Adicionado Objective 5 (Decisões por Dados), atualizado roadmap Now/Next/Later, adicionadas métricas de produto (MRR, instrumentação, hipóteses) |
| `docs/product/analytics-events.md` | Adicionado status de instrumentação por evento (✅/🔲/🚫), prioridade, sumário, e instruções de implementação |

---

## 6. Resumo para o Departamento de Arquitetura

### O que precisamos que a Arquitetura valide e desenhe:

1. **Modelo de Subscrições** — Schema Prisma para `Plan`, `Subscription`, `UsageRecord`. Integração com Stripe webhooks. Feature gating por plano.

2. **SSO/SAML Architecture** — Configuração OAuth dinâmica por organização. JIT provisioning. Mapeamento de grupos SAML para equipas.

3. **Team Scoping Model** — Schema para `Team`, `TeamMembership`. Prisma Client Extension para scoping por teamId. Team-switcher no shell.

4. **Bounded Context Integrity** — Validação dos contextos propostos (Billing separado, Team como sub-contexto de Organization, metering como eventos de domínio).

5. **Usage Metering** — Modelo de dados para contagem de uso. Publicação de eventos de uso. Limites verificados antes de operações.

### Links para documentos de referência:

- [Product Vision & OKRs](../docs/product/product-vision-okrs.md)
- [Product Backlog (RICE)](../docs/product/product-backlog.md)
- [Sprint Goals](../docs/product/sprint-goals.md)
- [Gap Analysis](../../audit/GAP-ANALYSIS.md)
- [Enterprise Scorecard](../../audit/ENTERPRISE-SCORECARD.md)
- [Product Audit](../../audit/PRODUCT-AUDIT.md)
- [Event Taxonomy](../docs/product/analytics-events.md)
- [ADR-003: Better Auth + Platform Authorization](../adr/0003-better-auth-plus-platform-authorization.md)
- [ADR-005: Prisma + PostgreSQL](../adr/0005-prisma-postgresql-system-of-record.md)

---

> **Handoff entregue pelo Departamento de Produto (@enterprise-product)**  
> *Próximo passo: Departamento de Arquitetura (@enterprise-architecture) validar bounded contexts e produzir C4 model + ADRs*
