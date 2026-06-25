# HIGH RISK ISSUES — SAPTM MESH AUDIT

> Issues that will block velocity or create architectural debt.
> Priority P1 — resolve within 2-3 sprints.

---

## H-01: No repository pattern — Prisma coupled to services

**Severity:** HIGH → RESOLVED
**Location:** `apps/api/src/*/` (all domain services)

**Problem:** Every service file imports `@prisma/client` directly. Business logic is coupled to Prisma's query API. Schema changes force service changes extensively.

**Fix:** Introduce repository interfaces per domain, implement Prisma repositories in `infrastructure/` layer.

**Resolution (2026-06-22):** All 14 business domains now have repository interfaces and implementations:
- Existing (10): admin, audit, capacity, cargo, integrations, notifications, planning, reports, tariff, tracking
- Added (4): auth, billing, teams, webhooks
- Each domain has `domain/*.repository.ts` (interface + symbol) and `infrastructure/prisma-*.repository.ts` (implementation)
- System modules (cache, event-bus, health, observability, rate-limit, rpc, security) remain without repositories (intentional — they access Redis/Prisma at infrastructure level)

---

## H-02: Event bus is data-driven, not event-driven

**Severity:** HIGH → PARTIALLY RESOLVED
**Location:** `apps/api/src/*/` (outbox writes), `packages/database/scripts/process-outbox.mjs`

**Problem:** Services write directly to `prisma.outboxEvent.create()`. No domain event interface, no event bus abstraction. This couples all domains to the outbox table schema.

**Fix:** Define `DomainEvent` interface, create `EventBus` abstraction with `OutboxEventBus` implementation.

**Resolution (2026-06-22):**
- `DomainEvent` interface exists in `@saptm/database` (packages/database/src/domain-events.ts)
- `EventBus` interface (`publish(tx, event)`) exists in `@saptm/database`
- `OutboxEventBusAdapter` (implements `EventBus`) registered in global `EventBusModule`, exported for injection
- `AdminEventBus` and `IntegrationsEventBus` now emit to in-memory `EventBusService` (previously had silent in-memory bus — fixed)
- Remaining: 7 duplicate domain-specific event-bus wrappers (admin, cargo, capacity, tracking, planning, tariff, integrations) each duplicate `tx.outboxEvent.create()`; these could be consolidated to inject `OutboxEventBusAdapter` directly. 4 repositories expose `createOutboxEvent()` that bypasses the event bus — these need migration to `EventBus.publish()`. These are non-breaking and can be addressed incrementally.

---

## H-03: API versioning absent

**Severity:** HIGH → RESOLVED
**Location:** `apps/api/src/rpc/rpc-http.middleware.ts`

**Problem:** All RPC routes are flat at `/rpc/*`. No version prefix means breaking changes cannot be communicated. Migration to newer contracts requires coordinated deploys.

**Fix:** Add `/v1/rpc/*` prefix, document versioning strategy in ADR.

**Resolution (2026-06-22):**
- `/v1/rpc` URL prefix exists and works in `RpcHttpMiddleware` (tried before `/rpc` fallback)
- Each operation has a `version: number` field in metadata (default `1`)
- CSRF middleware excludes both `/rpc` and `/v1/rpc`
- See `docs/rpc/rpc-strategy.md` for architecture details

---

## H-04: TanStack Query installed but unused

**Severity:** HIGH → RESOLVED
**Location:** `pnpm-workspace.yaml` (catalog dep), `apps/web/`

**Problem:** `@tanstack/react-query` is a workspace dependency but is never imported anywhere. All data fetching is RSC-only. While correct for current architecture, there is no client-side mutation/refetch capability.

**Fix:** Create `QueryProvider` wrapper, use `useMutation` + `invalidateQueries` for form updates.

**Resolution (2026-06-22):**
- `QueryProvider` exists and is wired in root `layout.tsx`
- 7 hooks use `useQuery` for data fetching on tracking, cargo, dashboard pages
- Removed redundant nested `QueryProvider` from `platform-shell.tsx`
- `useMutation` still unused — mutations go through Server Actions with `revalidatePath()`, which is the recommended RSC pattern

---

## H-05: Page components exceed maintainable size

**Severity:** HIGH → RESOLVED
**Location:** `apps/web/app/(platform)/app/cargo/page.tsx` (859 lines), `tracking/page.tsx` (596 lines)

**Problem:** Page files contain inline logic, inline component definitions, and business rules. Cannot be unit tested. Duplicated patterns across pages.

**Fix:** Extract section components, business logic into separate files. Target <200 lines per page.

**Resolution (2026-06-22):** Cargo page is 71 lines, tracking page is 41 lines. Both pages delegate to extracted components in `components/cargo/` and `components/tracking/`. Business logic is split across dedicated hook files (`hooks/use-cargo-overview.ts`, `hooks/use-tracking-overview.ts`). All pages are well under the 200-line target.

---

## H-06: Missing shared shadcn/components — inline replacements used

**Severity:** HIGH
**Location:** `apps/web/app/` (sign-in, cargo, shell)

**Problem:**
- Sign-in uses native `<input type="checkbox">` instead of `Checkbox` component
- Cargo page uses CSS `group-hover` tooltip instead of `Tooltip` component
- Shell uses inline `div` avatar instead of `Avatar` component
- No `DropdownMenu`, `Popover`, `Breadcrumb`, `Tabs` installed

**Source of truth:** `docs/design-system/design-system-strategy.md`

**Fix:** Install missing shadcn components, replace inline implementations.

---

## H-07: No migration rollback strategy

**Severity:** HIGH
**Location:** `packages/database/` (no rollback capability)

**Problem:** All migration scripts are forward-only. No rollback procedure, no `db:migrate:rollback` script. Database strategy doc requires rollback readiness.

**Fix:** Create rollback scripts, document expand-migrate-contract sequencing.

---

## H-08: CSP may break Tailwind v4 inline styles

**Severity:** HIGH
**Location:** `apps/web/src/middleware.ts`, `apps/web/next.config.ts`

**Problem:** Tailwind v4 generates inline styles. CSP `style-src` with nonce-only blocks Tailwind-generated styles. Previous fix added `unsafe-inline` but this reduces CSP effectiveness.

**Fix:** Use nonce-based approach compatible with Tailwind v4, or use CSP hash for known style blocks.
