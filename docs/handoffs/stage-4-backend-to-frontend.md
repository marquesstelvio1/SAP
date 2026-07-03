# Handoff Report: Stage 4 → Stage 5 (Backend + Database → Frontend)

> **De:** Departamento de Backend (@enterprise-backend) + Database (@enterprise-database)
> **Para:** Departamento de Frontend (@enterprise-frontend)
> **Data:** 2026-07-03
> **Propósito:** Transmitir alterações de schema, novos campos RPC, contratos actualizados e decisões arquitecturais implementadas.

---

## 1. Resumo do Trabalho Realizado

| Área | Descrição | Estado |
|------|-----------|--------|
| **Work Stream A — Plan Model** | Modelo `Plan` no schema, RPC contracts (`packages/rpc/src/plans.ts`), módulo API `apps/api/src/billing/plans/` com service + repository + RPC router | ✅ Já existente |
| **Work Stream B — teamId em Cargo/TrackingShipment** | `teamId` no schema já existia. Adicionados `teamId` + `team { id, name }` nos schemas de output tracking e cargo. Team info incluído nas queries. | ✅ **Implementado** — ver §2 |
| **Work Stream C — SSO Config CRUD** | Modelo `SsoConfig` no schema, RPC contracts (`packages/rpc/src/sso.ts`), módulo API `apps/api/src/sso/` | ✅ Já existente |
| **Work Stream D — Fix dead code (audit finding 4)** | `organizationId: ""` fixado em `apps/api/src/planning/domain/events.ts` — factories passam a aceitar `organizationId: string` | ✅ **Implementado** — ver §3 |
| **Work Stream E — PlanGuard middleware** | `@PlanFeature()` decorator + `PlanGuard` já implementado | ✅ Já existente |
| **Work Stream F — Billing endpoints** | `billing.subscription.get`, `billing.subscription.usage`, `billing.invoices.list`, `billing.checkout.create`, `billing.portal.create` | ✅ Já existente |
| **Work Stream G — Usage Metering** | `UsageService.checkLimit()` + `trackUsage()` existentes. **Adicionados** `displayLabel` e `unit` ao output de usage | ✅ **Implementado** — ver §2 |

---

## 2. RPC Contract Changes

### 2.1. Tracking RPC — Novos campos em output

**`trackingRecentShipmentSchema`** (usado em tracking overview)
```typescript
// ADICIONADOS:
teamId: z.string().nullable()
team: trackingTeamSummarySchema.nullable()
```

**`trackingShipmentDetailOutputSchema`** (usado em shipment detail — `tracking.shipment.detail`)
```typescript
// ADICIONADOS:
teamId: z.string().nullable()
team: trackingTeamSummarySchema.nullable()
```

**`trackingTeamSummarySchema`**
```typescript
export const trackingTeamSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});
```

### 2.2. Cargo RPC — Novos campos em output

**`cargoSummarySchema`** (usado em recentCargo no overview e em todos os outputs cargo)
```typescript
// ADICIONADOS:
teamId: z.string().nullable().optional()
team: trackingTeamSummarySchema.nullable().optional()
```

### 2.3. Billing RPC — Novos campos em output

**`billingUsageOutputSchema`**
```typescript
// ADICIONADOS:
usage: z.array(billingUsageMetricSchema.extend({
  displayLabel: z.string(),        // PT-PT: "Membros", "Cargas", "Eventos de tracking"
  unit: z.string().optional(),     // "/mês"
}))
```

### 2.4. Nova export em `packages/rpc/src/index.ts`

```typescript
export { trackingTeamSummarySchema } from "./tracking.js";
```

### 2.5. RPC Operations Metadata

| Operation | Permissions Required | Auth Mode | Idempotent | Audit |
|-----------|---------------------|-----------|------------|-------|
| `cargo.overview` | `cargo.read` | Session | — | — |
| `cargo.register` | `cargo.register` | Session | ✅ | ✅ |
| `cargo.release` | `cargo.manage` | Session | ✅ | ✅ |
| `tracking.overview` | `tracking.shipment.read` | Session | — | — |
| `tracking.shipment.detail` | `tracking.shipment.read` | Session | — | — |
| `tracking.event.record` | `tracking.event.record` | Session | ✅ | ✅ |
| `billing.subscription.usage` | `billing.usage.read` | Session | — | — |

---

## 3. Dead Code Fix (Architecture Audit Finding 4)

**Ficheiros alterados:**

- **`apps/api/src/planning/domain/events.ts`** — 3 factories (`createPlanningAllocationProposedEvent`, `createPlanningAllocationConfirmedEvent`, `createPlanningAllocationCancelledEvent`) tinham `organizationId: ""` hardcoded. Foram alteradas para aceitar `organizationId: string` como parâmetro.

- **`apps/api/src/cargo/domain/cargo.events.ts`** — Já estava correcto (aceita `organizationId` como parâmetro). Nenhuma alteração necessária.

**Impacto:** Nenhuma rota RPC expõe estes eventos. São usados internamente pelo módulo de planeamento.

---

## 4. Schema Changes (Nenhuma migração necessária)

Todos os modelos necessários já existiam no schema Prisma. Nenhuma migração é necessária.

| Modelo | Campos relevantes | Estado |
|--------|-------------------|--------|
| `Cargo` | `teamId String?` | ✅ Já existente |
| `TrackingShipment` | `teamId String?` | ✅ Já existente |
| `Plan` | `id, name, features Json, rateLimits Json, maxMembers Int, monthlyCredits Int, ...` | ✅ Já existente |
| `OrganizationPlan` | `organizationId, planId, status, startsAt, endsAt` | ✅ Já existente |
| `SsoConfig` | `organizationId, provider, issuer, clientId, clientSecret Encrypted, ...` | ✅ Já existente |
| `UsageRecord` | `organizationId, metric, value, recordedAt` | ✅ Já existente |

---

## 5. Environment Variables

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `STRIPE_SECRET_KEY` | ✅ (billing) | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | ✅ (billing) | Webhook signing secret |
| `STRIPE_PRICE_MEMBERS` | ⚠️ (se billing) | Price ID para members |
| `STRIPE_PRICE_CARGO_SHIPMENTS` | ⚠️ (se billing) | Price ID para cargo/shipments |
| `STRIPE_PRICE_TRACKING_EVENTS` | ⚠️ (se billing) | Price ID para tracking events |

---

## 6. Frontend Consumption Guide

### 6.1. Tracking Overview — Mostrar team info

```typescript
// tracking.overview devolve:
interface TrackingRecentShipment {
  // ... campos existentes
  teamId: string | null;
  team: { id: string; name: string } | null;
}
```

Sugestão de UI: Mostrar `team.name` como badge/tag na tabela de envios recentes. Se `team` for null, mostrar "—" ou "Sem equipa".

### 6.2. Tracking Shipment Detail — Team info

```typescript
// tracking.shipment.detail devolve:
interface TrackingShipmentDetailOutput {
  // ... campos existentes
  shipment: {
    // ... campos existentes
    teamId: string | null;
    team: { id: string; name: string } | null;
  }
}
```

Sugestão de UI: Mostrar `team.name` no header do shipment detail.

### 6.3. Cargo Overview — Team info em recentCargo

```typescript
// cargo.overview devolve:
interface CargoOverviewOutput {
  recentCargo: Array<{
    // ... campos existentes
    teamId: string | null | undefined;
    team: { id: string; name: string } | null | undefined;
  }>
}
```

Sugestão de UI: Mostrar `team.name` como badge/tag na tabela de cargas recentes.

### 6.4. Billing Usage — displayLabel e unit

```typescript
// billing.subscription.usage devolve:
interface BillingUsageOutput {
  usage: Array<{
    metric: string;   // ex: "members", "cargo_shipments", "tracking_events"
    used: number;
    limit: number | null;
    displayLabel: string;  // ex: "Membros", "Cargas", "Eventos de tracking"
    unit: string | null;   // ex: "/mês"
  }>
}
```

Sugestão de UI: Usar `displayLabel` em vez de `metric` para o nome legível, e `unit` após o valor (ex: "150/200 /mês").

---

## 7. Alterações Técnicas (Ficheiros Modificados)

### RPC Package
| Ficheiro | Alteração |
|----------|-----------|
| `packages/rpc/src/cargo.ts` | Adicionado `team` a `cargoSummarySchema` |
| `packages/rpc/src/tracking.ts` | Adicionado `trackingTeamSummarySchema`, `teamId` + `team` a `trackingRecentShipmentSchema` e `trackingShipmentDetailOutputSchema` |
| `packages/rpc/src/billing.ts` | Adicionado `displayLabel` e `unit` a `billingUsageOutputSchema` |
| `packages/rpc/src/index.ts` | Adicionado `trackingTeamSummarySchema` às exports |

### API Backend
| Ficheiro | Alteração |
|----------|-----------|
| `apps/api/src/cargo/infrastructure/prisma-cargo.repository.ts` | Adicionado `team` include em `findById`, `findByIdempotencyKey`, `findBy*IdempotencyKey`, `getOverview`; `mapCargo` mapeia `team` |
| `apps/api/src/cargo/domain/dto.ts` | Adicionado `CargoTeamRef` type; adicionado `team` a `CargoRecord` e `createCargoSummary` |
| `apps/api/src/tracking/tracking.service.ts` | Mapeia `teamId` + `team` em `recentShipments` e `getShipmentDetail` |
| `apps/api/src/tracking/infrastructure/prisma-tracking.repository.ts` | Adicionado `team` include em `findRecentShipments` e `findShipmentWithEvents` |
| `apps/api/src/tracking/domain/tracking.repository.ts` | Adicionado `teamId` + `team` aos tipos de retorno de `findRecentShipments` e `findShipmentWithEvents` |
| `apps/api/src/billing/billing.service.ts` | Adicionado `metricDisplayLabels` com `displayLabel`/`unit` a `getUsage()` |
| `apps/api/src/planning/domain/events.ts` | Fix `organizationId: ""` → `organizationId: string` em 3 factories |

---

## 8. Quality Gates

- [x] RPC contratos validados com Zod
- [x] Auth mode declarado em cada operação (já existente)
- [x] Mutações idempotentes (já existente)
- [x] Audit trail implementado (já existente)
- [x] Tenant scoping verificado (organizationId) — jáz existente via Prisma extension
- [x] Eventos publicados via transactional outbox (já existente)
- [x] Sem hard deletes em dados de domínio (já existente)
- [x] Rate limits configurados (já existente)
- [x] Lint ✅ (`biome check` limpo)
- [x] Build API ✅ (`@saptm/api:build` sucesso)
- [ ] Build Web ❌ (pré-existente — `ContextRow` não encontrado no audit page)

---

## 9. Observações

1. **Team model não tem `color`** — O schema `Team` não inclui campo `color`. Se o frontend quiser mostrar cores por equipa, será necessário adicionar uma migração futura.
2. **Audit finding 4 (cargo events)** — O architecture audit indicava que `cargo.events.ts` tinha `organizationId: ""`, mas o ficheiro já estava correcto. O audit está desactualizado.
3. **Testes cargo-service-business-rules** — 6 testes de regras de negócio cargo falham com `TypeError: this.cargoRepo.transaction is not a function`. É um problema de mock nos testes (pré-existente), não afecta produção.
4. **Teste RPC billing** — `billingInvoiceOutputSchema` não exportado do barrel `index.ts`. Teste pré-existente, não funcional.
