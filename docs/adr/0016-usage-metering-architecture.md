# ADR 0016 — Usage Metering Architecture

## Status

Accepted.

## Context

The product requires usage metering for plan enforcement across three tiers:

| Plan | Cargos/month | Tracking Events/month | Members |
|---|---|---|---|
| Free | 50 | 1,000 | 5 |
| Pro | 500 | 50,000 | 25 |
| Enterprise | Unlimited | Unlimited | Unlimited |

The `UsageRecord` model exists in the Prisma schema:

```prisma
model UsageRecord {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  metric         String
  current        Int          @default(0)
  limit          Int
  periodStart    DateTime?
  periodEnd      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  @@unique([organizationId, metric])
  @@map("usage_records")
}
```

The `UsageService` at `apps/api/src/billing/usage.service.ts` provides:
- `trackUsage(organizationId, metric, delta)` — increments a usage counter
- `checkLimit(organizationId, metric)` — returns `{ allowed, current, limit }`
- `getPlanLimits(plan)` — returns limit definitions per plan tier

ADR 0013 has been fully implemented — usage tracking is now event-driven via `UsageEventHandler`, which consumes `cargo.registered` and `tracking.event.recorded` events from the EventBus.

## Decision

### 1. Event-driven counters

Usage counters are incremented exclusively by domain event consumers, not by direct service calls. The `UsageEventHandler` subscribes to:

```typescript
this.eventBus.subscribe("cargo.registered", async (event) => {
  await this.usageService.trackUsage(event.organizationId, "cargo_shipments", 1);
});

this.eventBus.subscribe("tracking.event.recorded", async (event) => {
  await this.usageService.trackUsage(event.organizationId, "tracking_events", 1);
});
```

No other code path calls `trackUsage()`. This ensures:
- The billing context owns all usage metering logic
- Domain contexts (Cargo, Tracking) have no dependency on Billing
- Usage increments are auditable via the outbox event log

### 2. Synchronous limit checks

Before creating a resource, the service layer calls `checkLimit()`:

```typescript
// In CargoService.registerCargo()
const { allowed, current, limit } = await this.usageService.checkLimit(
  input.organizationId,
  "cargo_shipments",
);
```

This is a **synchronous** check that reads the current counter value. It does not wait for event-driven increments to propagate — it reads the committed `UsageRecord` row.

### 3. UsageRecord stores period-scoped counters

Each `UsageRecord` is unique per `(organizationId, metric)` and carries:
- `current` — current count for the period
- `limit` — plan-defined maximum
- `periodStart` / `periodEnd` — billing period boundaries

The `trackUsage()` method upserts on the unique constraint:

```typescript
async trackUsage(organizationId: string, metric: string, delta: number): Promise<void> {
  const record = await this.billingRepo.findUsageRecord(organizationId, metric);

  if (!record) {
    const planLimits = this.getPlanLimits("free");
    const limit = planLimits[metric as keyof typeof planLimits] ?? 0;
    await this.billingRepo.createUsageRecord({
      organizationId, metric, current: delta, limit,
      periodStart: new Date(),
      periodEnd: endOfMonth(),
    });
    return;
  }

  await this.billingRepo.incrementUsageRecord(organizationId, metric, delta);
}
```

### 4. Defined metrics

| Metric | Entity | Incremented By | Plan Limit Field |
|---|---|---|---|
| `members` | TeamMember | Admin operations (direct) | `maxMembers` |
| `cargo_shipments` | Cargo | `cargo.registered` event | `maxCargos` |
| `tracking_events` | TrackingEvent | `tracking.event.recorded` event | `maxTrackingEvents` |

### 5. Plan limits managed in UsageService

```typescript
getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case "free":
      return { members: 5, cargo_shipments: 50, tracking_events: 1_000 };
    case "pro":
      return { members: 25, cargo_shipments: 500, tracking_events: 50_000 };
    case "enterprise":
      return { members: Infinity, cargo_shipments: Infinity, tracking_events: Infinity };
    default:
      return { members: 5, cargo_shipments: 50, tracking_events: 1_000 };
  }
}
```

When a subscription plan changes (via Stripe webhook), limits are updated on the UsageRecord to reflect the new plan tier.

### 6. Periodic usage reset

`UsageService.resetPeriodicUsage()` is called monthly (via cron or scheduled task) to reset counters for the new billing period:

```typescript
async resetPeriodicUsage(): Promise<void> {
  const records = await this.billingRepo.findAllUsageRecords();
  for (const record of records) {
    await this.billingRepo.resetUsageRecord(record.organizationId, record.metric);
  }
}
```

For plans with monthly billing cycles, `periodStart`/`periodEnd` determine when the reset occurs. Enterprise plans may have no reset (unlimited).

### 7. Soft enforcement — warning, not block

Exceeding a plan limit does **not** block the operation. `checkLimit()` returns:

```typescript
{
  allowed: true,   // Always true — soft enforcement
  current: 51,
  limit: 50,
  warning: "A sua organizacao excedeu o limite de 50 cargas no plano Free."
}
```

The calling service may choose to:
- Display a warning banner in the UI
- Log the exceedance for admin review
- Block the operation if configured for hard enforcement (enterprise opt-in)

This approach prevents production disruptions while surfacing the need for a plan upgrade.

## Consequences

### Positive

1. ✅ **Plan enforcement without hard blocks** — Soft enforcement prevents data loss or user frustration while incentivizing upgrades
2. ✅ **Event-driven increments** — No coupling between domain contexts and Billing
3. ✅ **Synchronous limit checks** — Real-time awareness of current counts before resource creation
4. ✅ **Clear reset cycle** — Monthly reset aligns with billing periods
5. ✅ **Auditable** — Every increment maps to a specific domain event

### Negative

1. ❌ **Counts may briefly exceed limits between events** — Eventual consistency means an org could create resources after `checkLimit()` but before the event-driven increment syncs to the same process. Mitigation: acceptable for soft enforcement; for hard enforcement, a pre-reservation pattern would be needed
2. ❌ **Period reset requires cron/scheduler** — Additional infrastructure dependency for monthly reset
3. ❌ **Plan change boundary** — When an org upgrades from free to pro, existing counts are preserved but the limit is raised. If they downgrade, counts may exceed the new limit. Mitigation: downgrade warning + grace period

### Migration

Already implemented as of Phase 2 (ADR 0013 cutover complete).

## Compliance

- [x] `UsageService.trackUsage()` called only from `UsageEventHandler` (event-driven)
- [x] `UsageService.checkLimit()` called synchronously before resource creation
- [x] `UsageRecord` stores period-scoped counters per organization per metric
- [x] `getPlanLimits()` defines limits per plan tier
- [x] `resetPeriodicUsage()` available for monthly reset
- [x] Soft enforcement pattern — warnings, not hard blocks
- [x] ADR written for this decision
