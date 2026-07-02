# Handoff Report: Stage 3 → Stage 4 (Visual Design → Backend + Database)

> **De:** Departamento de Design Visual (@enterprise-visual-design)
> **Para:** Departamento de Backend (@enterprise-backend) + Database (@enterprise-database)
> **Data:** 2026-07-02
> **Propósito:** Transmitir decisões visuais, novos componentes UI, alterações de API necessárias e campos de dados adicionais para suportar o design.

---

## 1. Resumo do Trabalho Realizado

### O que foi feito

| Área | Descrição | Estado |
|------|-----------|--------|
| **Auditoria de tokens** | Verificação de todos os tokens CSS em `globals.css` | ✅ Completo |
| **Correção de contraste (warning)** | `--warning` ajustado de `oklch(0.77...)` para `oklch(0.65...)` para cumprir WCAG AA | ✅ Aplicado |
| **Density tokens em @theme inline** | Adicionados `--density-*`, `--radius-2xl`, `--radius-3xl` ao `@theme inline` | ✅ Aplicado |
| **High contrast improvements** | Status colors com fallback de alto contraste no `prefers-contrast: high` | ✅ Aplicado |
| **Iconography standards** | `docs/design/iconography-standards.md` | ✅ Criado |
| **Component patterns** | `docs/design/component-patterns.md` | ✅ Criado |
| **UI specs: Billing Overview** | `docs/design/ui-specs/billing-overview.md` | ✅ Criado |
| **UI specs: Team Switcher** | `docs/design/ui-specs/team-switcher.md` | ✅ Documentado |
| **UI specs: Subscription Mgmt** | `docs/design/ui-specs/subscription-management.md` | ✅ Criado |
| **UI specs: SSO Config** | `docs/design/ui-specs/sso-config.md` | ✅ Criado |

### Handoff points detalhados abaixo

---

## 2. Design Changes That Affect Backend

### 2.1 PlanBadge — Novo Componente

**Descrição:** Badge visual "Free" / "Pro" / "Enterprise" que aparece no header de billing e na sidebar.

**Dados necessários do backend:**
- `Plan.slug` (string: "free" | "pro" | "enterprise")
- `Plan.name` (string: "Free" | "Pro" | "Enterprise")
- Associado à `Organization` atual através da `Subscription`

**API mapping:**
```
BillingOverviewResponse.subscription.plan -> plan slug
```

**Cores por plano:**
| Plan | Badge Variant | Suggested Color |
|------|---------------|-----------------|
| Free | `outline` | Neutral |
| Pro | `info` | Blue |
| Enterprise | `warning` | Amber/Purple |

### 2.2 UsageMeter — Novo Componente

**Descrição:** Barra de progresso visual current/limit com warning color quando perto do limite.

**Dados necessários do backend:**
```typescript
interface UsageMetric {
  metric: string;         // "cargo_shipments" | "tracking_events" | "members"
  current: number;
  limit: number;
  displayLabel: string;   // PT-PT: "Cargas" | "Tracking" | "Membros"
  unit?: string;          // "/mês"
}
```

**Já implementado:** `BillingUsage[]` com `metrics` array — confirmar que inclui `displayLabel`.

### 2.3 Team Context — Badge + Filter

**Descrição:** Badge de equipa nos cards de recurso (carga, tracking) e filtro por equipa nas listas.

**Campos adicionais necessários (ADR 0017):**
- `Cargo.teamId?: string` — associar carga a uma equipa
- `TrackingShipment.teamId?: string` — associar tracking a uma equipa
- `Team.name` — para exibição no badge
- `Team.color?` — cor opcional para identificação visual

**API endpoints que precisam de teamId:**
- `GET /rpc/cargo.list` — filtro opcional `teamId`
- `GET /rpc/tracking.list` — filtro opcional `teamId`
- `GET /rpc/cargo.get` — incluir `team.name` no response
- `GET /rpc/tracking.get` — incluir `team.name` no response

### 2.4 Subscription Status Mapping

O frontend usa o seguinte mapeamento de status para exibição. **Manter estes valores consistentes:**

| Backend Status | UI Label | Badge Variant |
|---------------|----------|---------------|
| `active` | Ativo | `success` |
| `past_due` | Vencido | `warning` |
| `canceled` | Cancelado | `destructive` |
| `incomplete` | Incompleto | `warning` |
| `incomplete_expired` | Expirado | `destructive` |
| `trialing` | Teste | `info` |
| `paused` | Pausado | `outline` |
| `unpaid` | Não pago | `destructive` |

### 2.5 Invoice Status Mapping

| Backend Status | UI Label | Badge Variant |
|---------------|----------|---------------|
| `paid` | Paga | `success` |
| `open` | Pendente | `warning` |
| `draft` | Rascunho | `outline` |
| `uncollectible` | Incobrável | `destructive` |
| `void` | Anulada | `info` |

---

## 3. New UI Components That Backend Must Support

### Priority: Sprint A (Backend: RPC only, UI: Full)

| Component | Backend Requirement | RPC Contract |
|-----------|-------------------|--------------|
| **PlanBadge** | `billing.overview` must return `plan.slug` | ✅ Already exists |
| **UsageMeter** | `billing.usage` must return per-metric `current` + `limit` | ✅ Already exists |
| **TeamSwitcher** | `GET /rpc/organization.list` must return user's orgs | ✅ Already exists |

### Priority: Sprint B (New Backend Work Required)

| Component | Backend Requirement | RPC Contract |
|-----------|-------------------|--------------|
| **TeamFilter** | `GET /rpc/cargo.list` — `teamId` query param | 🟡 Needs ADR 0017 |
| **TeamBadge** | `cargo.get` response — include `team.name` | 🟡 Needs ADR 0017 |
| **SsoConfigForm** | `sso-config` CRUD endpoints | 🔴 Need new RPC module |
| **PlanCard** | `billing.plans` — list all plans with features | 🔴 Need `Plan` model |
| **PlanComparisonModal** | `billing.plans` — feature matrix per plan | 🔴 Need `Plan.features` |

### Priority: Sprint C (Future)

| Component | Backend Requirement |
|-----------|-------------------|
| **DomainVerifyCard** | SSo domain verification endpoint |
| **FeatureGate** | Server-side PlanGuard middleware |
| **WelcomeCard** | Onboarding step completion status |

---

## 4. API Contract Changes Suggested by UX

### 4.1 Billing Overview Response

```typescript
// Current (apps/web/lib/billing.ts)
type BillingOverview = {
  subscription: {
    id: string;
    plan: string;           // "free" | "pro" | "enterprise"
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: Array<{
    metrics: Array<{
      metric: string;       // "cargo_shipments" | "tracking_events" | "members"
      current: number;
      limit: number;
    }>;
  }>;
  recentInvoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    paidAt: string | null;
    downloadUrl: string | null;
  }>;
};
```

**Sugestão de melhoria UX:**
- Adicionar `planLabel?: string` (PT-PT: "Gratuito", "Pro", "Empresarial")
- Adicionar `planFeatures: string[]` para a comparação de planos
- Adicionar `usage.metrics[].displayLabel` e `usage.metrics[].unit`

### 4.2 Cargo List Response

```typescript
// Campo adicional desejado
type CargoListItem = {
  // ... existing fields
  team?: {
    id: string;
    name: string;
    color?: string;  // opcional
  };
};
```

### 4.3 Plan Model (Novo — ADR 0017)

```typescript
interface Plan {
  slug: string;              // "free" | "pro" | "enterprise"
  name: string;              // "Free" | "Pro" | "Enterprise"
  label: string;             // PT-PT: "Gratuito" | "Profissional" | "Empresarial"
  price: number;             // cents
  currency: string;          // "eur"
  interval: "month" | "year";
  features: PlanFeature[];   // feature list for comparison UI
  limits: {
    maxMembers: number;
    maxCargoShipments: number;
    maxTrackingEvents: number;
    maxTeams: number;         // 0 = not available
    hasSso: boolean;
    hasApi: boolean;
    hasWebhooks: boolean;
    hasReports: boolean;
  };
}

interface PlanFeature {
  key: string;               // "equipas" | "api" | "sso"
  label: string;             // PT-PT: "Equipas" | "API" | "SSO/SAML"
  included: boolean;
  limit?: string;            // "50/mês" | "Ilimitado"
}
```

### 4.4 SSO Config (Novo — ADR 0017)

```typescript
interface SsoConfig {
  organizationId: string;
  domain: string;
  domainVerified: boolean;
  domainVerifiedAt: string | null;
  idpMetadataUrl?: string;
  idpMetadataXml?: string;
  entityId: string;
  acsUrl: string;
  jitProvisioning: boolean;
  oauthProviders: {
    google?: { clientId: string; enabled: boolean };
    microsoft?: { clientId: string; enabled: boolean };
    github?: { clientId: string; enabled: boolean };
  };
}
```

---

## 5. Accessibility & UX Requirements

### 5.1 Color Contrast

All UI components use OKLCH color tokens. The backend/RPC layer does not need to handle colors, but **status values returned by the API must map to the correct semantic badge variant in the frontend.**

| Backend Status | UI Variant |
|---------------|------------|
| "active", "paid", "confirmed" | `success` |
| "past_due", "pending", "warning" | `warning` |
| "canceled", "error", "blocked" | `destructive` |
| "trialing", "new", "info" | `info` |
| "draft", "paused", "inactive" | `outline` |

### 5.2 PT-PT Labels

**Nunca expor** na UI: permission names, RPC endpoints, session IDs, terms like "RBAC", "CRUD".

**Usar sempre** linguagem operacional logística PT-PT nos labels retornados pela API:

| Technical | PT-PT Display |
|-----------|---------------|
| `billing` | Faturação |
| `subscription` | Subscrição |
| `invoice` | Fatura |
| `plan` | Plano |
| `usage` | Utilização |
| `team` | Equipa |
| `member` | Membro |
| `organization` | Organização |
| `sso` | Autenticação única (SSO) |
| `upgrade` | Upgrade / Melhorar plano |
| `feature` | Funcionalidade |

---

## 6. Priorities

### 🔴 Critical (Sprint A)
- Implementar `Plan` model + CRUD no schema (ADR 0017)
- Adicionar `teamId` a `Cargo` e `TrackingShipment` (ADR 0017)
- Criar RPC contract para `billing.plans` (lista de planos com features)
- Criar RPC contract para `sso-config` CRUD

### 🟡 Important (Sprint B)
- Adicionar `displayLabel` e `unit` na resposta de `billing.usage`
- Adicionar `team.name` e `team.color` nas respostas de `cargo.get` e `tracking.get`
- Implementar `PlanGuard` middleware para feature gating server-side
- Criar RPC contract para `domain.verify`

### 🟢 Nice to Have (Sprint C)
- Endpoint para `signup` (criação de organização + plano Free)
- Welcome/onboarding status endpoint
- Billing webhook handler para `subscription.updated` e `subscription.deleted`

---

## 7. Files Created / Modified

### Modified
| File | Change |
|------|--------|
| `packages/ui/src/styles/globals.css` | Warning contrast fix, density tokens in `@theme inline`, high contrast improvements |
| `packages/ui/src/styles/globals.css` | Added `--radius-2xl`, `--radius-3xl` to `@theme inline` |

### Created
| File | Description |
|------|-------------|
| `docs/design/iconography-standards.md` | Icon library, sizing, color, accessibility standards |
| `docs/design/component-patterns.md` | All component composition patterns, states, variants |
| `docs/design/ui-specs/billing-overview.md` | Billing page layout, states, components |
| `docs/design/ui-specs/team-switcher.md` | Team switcher documentation |
| `docs/design/ui-specs/subscription-management.md` | Plan cards, subscription detail, comparison |
| `docs/design/ui-specs/sso-config.md` | SSO config page layout, states, validation |
| `docs/handoffs/stage-3-visual-design-to-backend.md` | This document |

---

## 8. Documentos de Referência

- [Iconography Standards](../design/iconography-standards.md)
- [Component Patterns](../design/component-patterns.md)
- [UI Spec: Billing Overview](../design/ui-specs/billing-overview.md)
- [UI Spec: Team Switcher](../design/ui-specs/team-switcher.md)
- [UI Spec: Subscription Management](../design/ui-specs/subscription-management.md)
- [UI Spec: SSO Config](../design/ui-specs/sso-config.md)
- [ADR 0017 — Schema Additions](../adr/0017-schema-additions-billing-teams-sso.md)
- [ADR 0014 — Billing Context](../adr/0014-billing-subscription-context.md)
- [ADR 0015 — Team Scoping Model](../adr/0015-team-scoping-model.md)
- [Handoff Stage 2](../handoffs/stage-2-architecture-to-visual-design.md)

---

> **Handoff entregue pelo Departamento de Design Visual (@enterprise-visual-design)**
> *Próximo passo: Departamento de Backend (@enterprise-backend) + Database (@enterprise-database)*
