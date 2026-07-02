# ADR 0014 — Billing/Subscription as a Separate Bounded Context

## Status

Accepted.

## Context

The product requires Stripe billing with tiered plans (free/pro/enterprise). The current Prisma schema already includes `Subscription`, `Invoice`, and `UsageRecord` models within the public schema, related to `Organization` via foreign keys. The billing module exists at `apps/api/src/billing/` with:

- `BillingService` — Stripe integration (customer creation, checkout sessions, portal sessions, webhook handling)
- `UsageService` — usage tracking and plan limit checks
- `BillingWebhookController` — Stripe webhook ingestion at `POST /billing/webhook`
- `BillingRepository` interface + `PrismaBillingRepository` implementation
- `UsageEventHandler` — event-driven usage metering consuming `cargo.registered` and `tracking.event.recorded` events
- RPC contracts at `packages/rpc/src/billing.ts` with Zod schemas for overview, checkout, portal, plans, usage

ADR 0013 (event-driven usage tracking) has been implemented — Cargo and Tracking no longer call `UsageService` directly. Usage is metered via the `EventBus` outbox consumer pattern.

Despite this, `Subscription` sits as a direct child of `Organization` in the Prisma schema (`organizationId @unique`), and `plan`/`subscriptionStatus` are frequently accessed from the `Organization` aggregation root. There is no explicit bounded context boundary between Billing and Organization.

## Decision

**Billing/Subscription is a separate bounded context from Organization.** The following rules govern the boundary:

### 1. Organization owns value objects only

`Organization` may expose `subscriptionStatus` and `planTier` as **read-only value objects** (projected from the Billing context), but all billing logic — Stripe integration, subscription lifecycle, invoice generation, usage metering, plan limit enforcement — lives exclusively in the Billing context.

```typescript
// Organization exposes a projection, not the domain logic
type OrganizationSubscriptionInfo = {
  planTier: "free" | "pro" | "enterprise";
  subscriptionStatus: "active" | "past_due" | "canceled" | "unpaid" | "trialing";
};
```

### 2. Billing consumes domain events via EventBus

Usage metering is event-driven, not service-to-service. `UsageEventHandler` subscribes to:

| Event | Metric | Handler |
|---|---|---|
| `cargo.registered` | `cargo_shipments` | `UsageEventHandler.onModuleInit()` |
| `tracking.event.recorded` | `tracking_events` | `UsageEventHandler.onModuleInit()` |

No domain service (Cargo, Tracking, Capacity, Tariff) imports `UsageService` or any Billing type.

### 3. Stripe webhooks are the source of truth

Subscription state changes (`customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`) are received via Stripe webhooks at `BillingWebhookController.handleWebhook()`. The `BillingService.handleWebhook()` method validates the Stripe signature, processes the event, and updates the local `Subscription` record.

Webhook events drive:
- Plan tier changes (upgrade/downgrade)
- Subscription status transitions (active → past_due → canceled)
- Invoice lifecycle (open → paid → void)
- Trial start/end

No manual subscription state mutation occurs outside webhook processing.

### 4. Plan limits enforced at the service layer

`UsageService.checkLimit(organizationId, metric)` checks the current usage count against the plan-defined limit before resource creation. If the limit is reached, the operation is allowed with a warning (soft enforcement) rather than blocked.

```typescript
const { allowed, current, limit } = await usageService.checkLimit(orgId, "cargo_shipments");
// Returns { allowed: true, current: 45, limit: 50 }
```

### 5. Feature gating via PlanGuard middleware

`PlanGuard` is an oRPC middleware that checks the subscription plan tier before allowing access to certain RPC operations:

```typescript
// RPC metadata declares required plan tier
export const billingPlansMetadata = createRpcOperationMetadata({
  name: "billing.plans.list",
  version: 1,
  kind: "query",
  auth: "required",
  permissions: ["billing.plan.read"],
  planTier: "free", // Minimum plan tier required
  audit: { severity: "low" },
});
```

### 6. Billing module owns its data

The `Subscription`, `Invoice`, and `UsageRecord` tables are managed **only** by the Billing context. No other module writes to these tables directly. Organization reads subscription info through a projected view.

## Consequences

### Positive

1. ✅ **Clean bounded context isolation** — Organization no longer owns billing lifecycle. The dependency direction is: Billing consumes Organization identity
2. ✅ **Billing can evolve independently** — Stripe API changes, pricing model changes, or billing logic refactors affect only `apps/api/src/billing/`
3. ✅ **Event-driven usage metering** — ADR 0013 is fully realized; no reverse dependencies from Cargo/Tracking → Billing
4. ✅ **Webhook-driven subscription state** — Stripe is the system of record; local database is a read model
5. ✅ **PlanGuard middleware** — Feature gating is declarative, centralized, and testable

### Negative

1. ❌ **Eventual consistency for usage counts** — Usage increments may lag by milliseconds. Acceptable for billing cycles; `checkLimit()` provides synchronous enforcement at the point of resource creation
2. ❌ **Subscription read-model duplication** — Organization context may cache `planTier`/`subscriptionStatus` for performance, requiring invalidation or tolerance of staleness
3. ❌ **Webhook resilience required** — If Stripe webhook delivery fails, subscription state must be reconciled via periodic sync or manual Stripe dashboard lookup

### Migration

Already implemented as of Phase 2. No further migration required.

## Compliance

- [x] Billing module isolated at `apps/api/src/billing/` with its own repository, service, controller, and RPC router
- [x] Usage tracking is event-driven (ADR 0013) — no direct `UsageService` calls from Cargo or Tracking
- [x] Stripe webhooks drive subscription state changes exclusively
- [x] `PlanGuard` middleware enforces plan tier at the RPC layer
- [x] C4 diagrams updated (Nível 2 — Container) showing Billing as separate bounded context
- [x] ADR written for this decision
