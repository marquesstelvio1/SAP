# Architecture Audit Report

> **Date**: 2026-07-02
> **Scope**: SAPTM monorepo — apps/api, apps/web, packages/*
> **Auditor**: Enterprise Architecture

---

## Executive Summary

The SAPTM architecture is fundamentally sound with a clear event-driven, multi-tenant, repository-pattern design. The monorepo structure with strict package boundaries is well-executed. However, there are **3 critical risks** around tenant isolation, event reliability, and dead code that must be addressed before production deployment.

**Overall Assessment**: 🟡 Architecture has strong foundations but requires urgent fixes in 3 areas.

---

## 1. Module Boundaries

### 1.1 Container Architecture

```
AppModule
├── EventBusModule (Global)
├── CargoModule → CargoService → CargoRepository (PrismaCargoRepository)
├── TrackingModule → TrackingService → TrackingRepository (PrismaTrackingRepository)
├── BillingModule → BillingService, UsageService
├── RpcModule → re-imports ALL domain modules
└── 20+ other modules
```

**Layered architecture**: ✅ Controller (RPC) → Service → Repository → Prisma is consistently followed.
**Module separation**: ✅ No direct cross-module imports between cargo → tracking (event-driven).
**Circular deps**: ✅ No circular package dependencies (DAG verified).

### 1.2 Cross-Module Import Check

| Source | Target | Verdict |
|--------|--------|---------|
| `tracking/events/cargo-event.handler.ts` | `event-bus/event-bus.service.ts` | ✅ Via EventBus, not direct cargo module |
| `tracking/events/cargo-event.handler.ts` | `event-bus/outbox-event-bus.adapter.ts` | ✅ Via EventBus |
| `cargo/service.ts` | `event-bus/outbox-event-bus.adapter.ts` | ✅ Via EventBus |
| `tracking/service.ts` | `event-bus/outbox-event-bus.adapter.ts` | ✅ Via EventBus |
| `cargo/` → `tracking/` | — | ✅ No direct imports |
| `tracking/` → `cargo/` | — | ✅ No direct imports |

### 1.3 Module Boundary Issues

🟡 **RpcModule as monolithic router**: `RpcModule` (`apps/api/src/rpc/rpc.module.ts`) re-imports **all 18 domain modules**. This creates tight coupling between the transport layer and every domain module. Every new domain requires modifying the RPC module.

🟡 **EventBusModule is @Global()**: The `@Global()` decorator on `EventBusModule` makes it implicitly available everywhere. Some modules import it explicitly anyway (TrackingModule, BillingModule), which is redundant but harmless.

---

## 2. Event-Driven Architecture

### 2.1 Event Flow Map

```
cargo.service.ts                   tracking/events/                billing/events/
  ┌─────────────────┐               cargo-event.handler.ts          usage-event-handler.ts
  │ cargo.registered │ ──────────►   (no-op subscriber)           ──► trackUsage("cargo_shipments")
  ├─────────────────┤
  │ cargo.released   │ ──►  ⚠️ NO SUBSCRIBER EXISTS
  ├─────────────────┤
  │ cargo.transport  │
  │ .planned         │ ──────────►  createShipment + createEvent ─► trackUsage("tracking_events")
  ├─────────────────┤               └──► tracking.shipment.created
  │ cargo.transport  │
  │ .departed        │ ──────────►  createEvent + updateStatus  ─► trackUsage("tracking_events")
  ├─────────────────┤               └──► tracking.event.recorded
  │ cargo.transport  │
  │ .arrived         │ ──────────►  createEvent + updateStatus  ─► trackUsage("tracking_events")
  ├─────────────────┤               └──► tracking.event.recorded
  │ cargo.delivery   │
  │ .completed       │ ──────────►  createEvent + updateStatus  ─► trackUsage("tracking_events")
  ├─────────────────┤               └──► tracking.event.recorded
  │ cargo.delivery   │
  │ .exception       │
  │ .recorded        │ ──────────►  createEvent + updateStatus  ─► trackUsage("tracking_events")
  ├─────────────────┤               └──► tracking.event.recorded
  │ cargo.delivery   │
  │ .exception       │
  │ .resolved        │ ──────────►  createEvent + updateStatus  ─► trackUsage("tracking_events")
  ├─────────────────┤               └──► tracking.event.recorded
  │ cargo.operational│
  │ .handoff.recorded│ ──────────►  createEvent                ─► trackUsage("tracking_events")
  └─────────────────┘               └──► tracking.event.recorded
```

### 2.2 🔴 Critical: `cargo.released` Event Has No Consumer

The `cargo.service.ts` publishes `"cargo.released"` on line 407, but **no module subscribes to this event**:
- `CargoTrackingEventHandler` (tracking) does not subscribe to it
- `UsageEventHandler` (billing) does not subscribe to it  
- No other handler exists

**Impact**: When cargo is released, no tracking event is created, no usage is recorded, and no downstream action is triggered. The release happens in isolation.

### 2.3 🔴 Critical: Outbox Worker is Disabled

```json
// packages/database/package.json
"worker:outbox": "echo 'Outbox worker disabled'"
```

Events are **written to the `outboxEvent` table** via `OutboxEventBusAdapter.publish()`, and simultaneously **emitted in-memory** via `EventBusService.emit()`. However:

- The outbox worker (`worker:outbox`) is a no-op
- If the server crashes between `publish()` and handler completion, events in `pending` status are **never recovered**
- Only the in-process RxJS Subject listeners process events
- Horizontal scaling is impossible — each instance has independent Subject state

**Mitigation needed**: A proper outbox worker that polls for `pending` events, processes them with idempotency, and marks them `published`.

### 2.4 🟡 In-Memory EventBus is Single-Process Only

`EventBusService.ts` uses an RxJS `Subject` for in-process pub/sub:

```typescript
private readonly subject = new Subject<DomainEvent>();
```

**Issues**:
- If a handler throws, subsequent handlers for the same event don't execute (sequential processing in same microtask)
- No backpressure mechanism
- No retry logic for handlers
- Coupled to a single Node.js process

### 2.5 🟡 Event Type Inconsistency: Delivery Exception Payload

The `cargo.events.ts` factory `createCargoDeliveryExceptionRecordedEvent` has:
```typescript
organizationId: "",  // HARDCODED EMPTY STRING!
```

This factory function is **not called** anywhere (see finding 🔵 5.1), but it's a ticking time bomb. The inline event construction in `cargo.service.ts` correctly uses `input.organizationId`.

### 2.6 Idempotency Pattern: ✅ Correct

All operations use idempotency keys with proper namespace prefixes:
- `cargo_plan_${payload.idempotencyKey}` in CargoTrackingEventHandler
- `cargo_depart_${payload.idempotencyKey}`
- `cargo_arrive_${payload.idempotencyKey}`

Cargo events carry their own idempotency key upstream, and tracking events prefix them to avoid collision. Prisma schema enforces `@@unique([organizationId, idempotencyKey])` on `TrackingEvent`.

---

## 3. Multi-Tenancy

### 3.1 Tenant Scoping Architecture

```
Request ──► AuthContextMiddleware ──► TenantContextMiddleware ──► RPC Handler/Services
                │                           │
                ▼                           ▼
         Resolves authContext       Sets AsyncLocalStorage
         (includes organizationId)  (runWithTenantContext)
                                         │
                                         ▼
                                  Prisma Client
                                  (NO $extends — manual filtering)
```

### 3.2 🔴 Critical: Prisma Tenant Scoping Extension Missing

The `packages/database/src/prisma/factory.ts` returns a **plain `PrismaClient`** without any `$extends` call:

```typescript
// Current factory.ts — returns bare PrismaClient
export function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  const baseClient = new PrismaClient({ adapter, log: [...] });
  return baseClient;  // ❌ No tenant scoping extension
}
```

The `TenantContextMiddleware` correctly sets `organizationId` in `AsyncLocalStorage`, but **no Prisma middleware reads it**. The AGENTS.md describes a `tenant-scoping.ts` with a Prisma Client Extension that auto-injects `organizationId` — but this file **does not exist**.

**Current protection**: Every query manually includes `organizationId` in `where` clauses. This is verified by grep (100+ occurrences across the codebase).

**Risk**: A single missed `organizationId` filter in any query can leak cross-tenant data. Since there's no automated enforcement at the ORM layer, this is a fragile single-point-of-failure pattern.

### 3.3 Manual organizationId Filtering: ✅ Consistent

Every service method accepts `organizationId` as a parameter, and every repository method includes it in the query. The pattern is consistent:

```typescript
// Service passes it down
const data = await this.cargoRepo.getOverview(input.organizationId, limit, offset);

// Repository uses it in WHERE clause
findMany({ where: { organizationId, ...otherFilters } })
```

This is **correct but fragile** — it relies entirely on developer discipline.

---

## 4. Package Dependency Graph

### 4.1 Verified Dependency Graph (DAG ✅)

```
@SAPTM/CONFIG (no internal deps)
    ↑
@SAPTM/EMAIL ──────────────► @saptm/config
    ↑
@SAPTM/DATABASE ───────────► @saptm/config, @saptm/email
    ↑
@SAPTM/OBSERVABILITY (no internal deps)
    ↑
@SAPTM/AUTH ───────────────► @saptm/config, @saptm/database, @saptm/email, @saptm/observability
    ↑
@SAPTM/TYPES (no internal deps)
    ↑
@SAPTM/RPC ────────────────► @saptm/auth, @saptm/observability, @saptm/types
    ↑
@SAPTM/TESTING ────────────► @saptm/auth, @saptm/observability, @saptm/rpc

APPS:
  @SAPTM/API ──────────────► @saptm/auth, @saptm/config, @saptm/database, @saptm/observability, @saptm/rpc, @saptm/types
  @SAPTM/WEB ──────────────► @saptm/auth, @saptm/config, @saptm/form, @saptm/rpc, @saptm/ui
```

**Verdict**: ✅ No circular dependencies. Clean DAG structure. Each package has clear responsibilities.

### 4.2 Package Boundary Rules: ✅ Verified

- No packages import from `apps/*`
- `@saptm/database` has no dependency on `@saptm/auth` (correct — the reverse is true)
- `@saptm/rpc` depends on `@saptm/auth` for permission types and `@saptm/observability` for trace types

### 4.3 🟡 `@saptm/testing` Depends on `@saptm/rpc`

`@saptm/testing` depends on both `@saptm/auth` and `@saptm/rpc`. This creates a transitive dependency chain: `testing → rpc → auth`. This is acceptable for a testing package but means `testing` cannot be used for testing `rpc` itself (circular dependency risk).

---

## 5. Error Handling Architecture

### 5.1 Error Flow

```
Prisma Error ──► Repository ──► Service ──► RPC Router ─────────► RpcExceptionFilter ──► Client
                      │                       │                        │
                      │                throws HttpException          maps to RPC envelope
                      │                       │                        │
                      ▼                       ▼                        ▼
              (no mapping)          BadRequestException          { code, message, traceId }
                                    NotFoundException
                                    ForbiddenException
                                    UnauthorizedException
```

### 5.2 RPC Exception Filter: ✅ Comprehensive

`RpcExceptionFilter` (`apps/api/src/rpc/exception.filter.ts`) handles three categories:

| Error Type | Mapping | Result |
|------------|---------|--------|
| Prisma `P2002`/`P2003` | → `CONFLICT` (409) |  |
| Prisma `P2025` | → `NOT_FOUND` (404) |  |
| NestJS `HttpException` | Via `mapHttpStatusToRpcErrorCode` | Status code → RPC error code |
| Unexpected | → `INTERNAL_ERROR` (500) | Logged with stack, traceId exposed |

### 5.3 🟡 Error Envelope Limitation

The `RpcExceptionFilter` sends `{ json: envelope }` instead of just `envelope`:

```typescript
response.status(httpStatus).json({ json: envelope });
```

This double-wraps the response in a `json` property, which may confuse clients expecting a flat error structure.

### 5.4 🟡 Service Layer Error Consistency

Services throw `HttpException` subclasses (`BadRequestException`, `NotFoundException`) with short string codes:

```typescript
throw new BadRequestException("cargo.reference_conflict");
throw new NotFoundException("cargo.not_found");
```

**Issue**: These string codes are not typed/enumerated. A typo like `"cargo.reference_confict"` (missing 'l') would not be caught at compile time.

**Recommendation**: Define typed error codes in `packages/rpc/src/errors.ts` alongside the existing catalog, or use a shared enum.

### 5.5 Event Handler Error Handling: 🟡 Fragile

`EventBusService` handlers catch errors but only log them:

```typescript
handler(event).catch((error: unknown) => {
  this.logger.error(`EventBus handler error for event ${eventType}.`, { ... });
});
```

There is no retry, dead-letter queue, or circuit breaker for failed event handlers. If the tracking handler fails (e.g., database connectivity issue), the event is **silently lost**.

---

## 6. Build Pipeline

### 6.1 `turbo.json`: ✅ Correct Configuration

| Task | Depends On | Notes |
|------|------------|-------|
| `build` | `^build`, `db:generate` | ✅ Correct ordering |
| `typecheck` | `^build` | ✅ Requires build first (output types needed) |
| `test` | `^build`, `build` | ✅ All dependencies built first |
| `lint` | `^lint` | ✅ Parallel across packages |

### 6.2 🔴 db:generate Without Cache

```json
"db:generate": { "cache": false }
```

Every build triggers `prisma generate` which can take 5-15 seconds. This is correct for safety (ensures Prisma client is regenerated) but **doubles build time** for every CI run.

### 6.3 Package Build Scripts

| Package | Build Tool | Output | Notes |
|---------|-----------|--------|-------|
| `@saptm/database` | `tsc` + ESM patches | `dist/src/` | Complex build with 3 post-processing scripts |
| `@saptm/auth` | `tsc` | `dist/` | Clean build |
| `@saptm/rpc` | `tsc` | `dist/` | Clean build |
| `@saptm/api` | `tsc` | `dist/` | Standard |
| `@saptm/web` | `next build` (via tsc for deps) | `.next/` | Through turbo |

### 6.4 Cache Outputs: ✅ Correctly Configured

```json
"outputs": ["dist/**", ".next/**", "!.next/cache/**"]
```

The `!.next/cache/**` exclusion prevents cache bloat from Next.js build cache.

---

## Consolidated Issue Register

| # | Severity | Area | Issue | Impact |
|---|----------|------|-------|--------|
| 1 | 🔴 | Multi-tenancy | Missing Prisma Client Extension for auto-tenant scoping (`tenant-scoping.ts` doesn't exist) | Cross-tenant data leak if any query omits `organizationId` |
| 2 | 🔴 | Event-driven | `cargo.released` event published but has no consumer | Cargo release creates no tracking event, no usage metric |
| 3 | 🔴 | Event-driven | Outbox worker is `echo 'disabled'` | Events lost on server restart; no async processing |
| 4 | 🔴 | Event-driven | `createCargoDeliveryExceptionRecordedEvent` has `organizationId: ""` | Would publish events for wrong org if ever called |
| 5 | 🟡 | Event-driven | In-memory RxJS Subject has no retry/DLQ/circuit breaker | Handler failures silently lose events |
| 6 | 🟡 | Event-driven | `forwardRef` in `OutboxEventBusAdapter` unnecessary | Masks understanding of dependency graph |
| 7 | 🟡 | Module boundaries | `RpcModule` re-imports all 18 domain modules | Tight coupling; every new domain requires RpcModule change |
| 8 | 🟡 | Error handling | Error string codes are untyped ("cargo.reference_conflict") | Typo risk at runtime; no compile-time safety |
| 9 | 🟡 | Error handling | Response is double-wrapped: `{ json: envelope }` | Clients must unwrap extra property |
| 10 | 🟡 | Build | `db:generate` runs every build (no cache) | 5-15s added to every build |
| 11 | 🟡 | Build | `@saptm/database` has complex build with 3 post-processing scripts | Brittle; ESM patching adds friction |
| 12 | 🔵 | Code quality | `createCargo*Event()` factory functions in `cargo.events.ts` are defined but never called | Dead code; should either be used or removed |
| 13 | 🔵 | Code quality | `cargo.events.ts` constructs events differently from inline code in `cargo.service.ts` | Duplication; inconsistency risk |
| 14 | 🔵 | Code quality | Service methods repetitively construct audit + outbox + event in every method | ~50 lines of boilerplate per method (10+ methods) |

---

## Strengths Worth Preserving ✅

| # | Area | Strength |
|---|------|----------|
| 1 | Architecture | Clear Cargo→EventBus→Tracking→EventBus→Billing event flow with well-defined bounded contexts |
| 2 | Package design | No circular dependencies; clean DAG with 11 focused packages |
| 3 | Idempotency | Comprehensive idempotency key pattern with unique constraints at DB level |
| 4 | Repository pattern | All services inject repository interfaces via DI symbols; no direct Prisma access from services |
| 5 | Multi-tenancy | organizationId consistently threaded through all service and repository methods |
| 6 | Error handling | RPC exception filter properly handles Prisma errors, HTTP exceptions, and unexpected errors |
| 7 | Event metadata | Domain event types centralized in `DomainEventTypes` enum |
| 8 | Tenant context middleware | `TenantContextMiddleware` correctly uses AsyncLocalStorage (even though extension is missing) |
| 9 | Audit trail | All mutations create structured audit records with before/after state |
| 10 | Build pipeline | Clear `dependsOn` graph in turborepo with proper cache configuration |

---

## Recommendations

### Immediate (Before Production)

1. **🔴 Implement Prisma tenant scoping extension**
   - Create `packages/database/src/prisma/tenant-scoping.ts` with `$extends` that reads `getCurrentOrganizationId()` and auto-injects `organizationId` filter
   - Apply it in `factory.ts` via `baseClient.$extends(tenantScopingExtension)`
   - This adds a defense-in-depth layer; manual filtering remains the primary mechanism

2. **🔴 Wire up the outbox worker**
   - Implement a proper outbox worker that polls `outboxEvent` table for `pending` events
   - Process events with idempotency guarantees
   - Add retry with exponential backoff and dead-letter queue after N failures
   - Remove the `echo 'disabled'` stub

3. **🔴 Add `cargo.released` event handler**
   - Subscribe to `"cargo.released"` in `CargoTrackingEventHandler`
   - At minimum, create a tracking event/log entry
   - Check if billing needs to track usage

4. **🔴 Remove `organizationId: ""` from `cargo.events.ts`**
   - Either fix the factory to accept organizationId parameter, or delete the dead code

### Short-term (Next Sprint)

5. 🟡 **Type error string codes**
   - Define a shared enum or const object in `packages/rpc/src/errors.ts`
   - Use typed error codes instead of raw strings in service `throw` statements

6. 🟡 **Fix response double-wrapping**
   - Change `{ json: envelope }` to just `envelope` in `exception.filter.ts`

7. 🟡 **Add retry/circuit-breaker to EventBus handlers**
   - Wrap handler execution with retry logic (2-3 attempts with backoff)
   - Add dead-letter queue for persistently failing events

8. 🟡 **Clean up unused code**
   - Remove `createCargo*Event()` factories if not used (or integrate them)
   - Remove unnecessary `forwardRef` in `OutboxEventBusAdapter`

### Medium-term (Next Phase)

9. 🔵 **Extract repetitive audit+event pattern**
   - Create a decorator or middleware that handles: audit creation, event publication, idempotency check
   - Each service method would only contain business logic, not infrastructure boilerplate

10. 🔵 **Consider event sourcing for critical domains**
    - The outbox table + event types already resemble an event store
    - Consider making cargo status transitions event-sourced rather than state-updated

11. 🔵 **Segregate RpcModule**
    - Consider per-domain RPC modules that domain modules export themselves
    - Replace monolithic `RpcModule` import chain with domain-owned router exports

---

## Appendix: Dependencies Verified

```
packages/database/src/prisma/factory.ts       ✅ createPrismaClient, getPrismaClient
packages/database/src/tenant-context.ts        ✅ AsyncLocalStorage, getCurrentOrganizationId, runWithTenantContext
packages/database/src/domain-events.ts          ✅ DomainEvent, EventBus interfaces
packages/database/src/outbox-event-bus.ts       ✅ OutboxEventBus implementation
apps/api/src/event-bus/event-bus.service.ts     ✅ In-memory Subject-based event bus
apps/api/src/event-bus/outbox-event-bus.adapter.ts  ✅ Adapter implementing EventBus
apps/api/src/rpc/exception.filter.ts            ✅ RPC exception handler
apps/api/src/rpc/rpc-http.middleware.ts          ✅ oRPC HTTP middleware
apps/api/src/auth/tenant-context.middleware.ts   ✅ Tenant context via AsyncLocalStorage
apps/api/src/cargo/cargo.service.ts              ✅ Repository pattern + EventBus
apps/api/src/tracking/tracking.service.ts        ✅ Repository pattern + EventBus
apps/api/src/billing/usage.service.ts            ✅ Usage tracking
apps/api/src/tracking/events/cargo-event.handler.ts  ✅ Event-driven integration
apps/api/src/billing/events/usage-event-handler.ts   ✅ Event-driven integration
```
