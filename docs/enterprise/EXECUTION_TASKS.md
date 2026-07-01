# EXECUTION TASK LIST — SAPTM MESH AUDIT

> Agent-ready executable tasks organized by sprint and agent type.

---

## SPRINT 1: Design System + Loading Boundaries

### [Design System Agent] Implement design token consumption

**Files:**
- `packages/ui/src/styles/globals.css` — Add `--motion-*` tokens
- `packages/ui/src/tokens/index.ts` — Export motion tokens
- `packages/ui/src/components/button.tsx` — Replace `h-9` with density token
- `packages/ui/src/components/input.tsx` — Replace `h-10` with density token
- `packages/ui/src/components/select-native.tsx` — Replace `h-8` with density token
- `packages/ui/src/components/table.tsx` — Replace `h-10` with density token
- `packages/ui/src/components/skeleton.tsx` — Add density-compliant variants
- `apps/web/components/shell/platform-shell.tsx` — Replace `z-30` with `var(--z-sticky)`

**Expected output:** All components use `--density-*`, `--motion-*`, `--z-*` tokens.
**Validation:** `grep -r "h-9\|h-10\|h-8\b" packages/ui/src/components/` returns 0.
**Rule:** No hardcoded control heights in components.

---

### [Frontend Agent] Add loading.tsx to all domain routes

**Files:** Create `loading.tsx` in:
- `apps/web/app/(platform)/app/admin/`
- `apps/web/app/(platform)/app/audit/`
- `apps/web/app/(platform)/app/capacity/`
- `apps/web/app/(platform)/app/cargo/`
- `apps/web/app/(platform)/app/integrations/`
- `apps/web/app/(platform)/app/notifications/`
- `apps/web/app/(platform)/app/planning/`
- `apps/web/app/(platform)/app/reports/`
- `apps/web/app/(platform)/app/security/`
- `apps/web/app/(platform)/app/tariffs/`
- `apps/web/app/(platform)/app/tracking/`

**Expected output:** Every route segment with `force-dynamic` has sibling `loading.tsx`.
**Validation:** Each `loading.tsx` renders Skeleton components matching the page layout.

---

### [Frontend Agent] Add error.tsx to all domain routes

**Files:** Create `error.tsx` in all 11 routes above.
**Expected output:** Network errors show ErrorCard with retry button.
**Validation:** Simulate network failure, verify recovery UI.

---

## SPRINT 2: Frontend Architecture + Shared Components

### [Frontend Agent] Extract inline components from page files

**Files:**
- `apps/web/app/(platform)/app/cargo/page.tsx` (859 lines)
- `apps/web/app/(platform)/app/tracking/page.tsx` (596 lines)

**Expected output:** 
- `apps/web/components/cargo/cargo-overview-metrics.tsx`
- `apps/web/components/cargo/cargo-lifecycle-section.tsx`
- `apps/web/components/cargo/cargo-business-rules-card.tsx`
- `apps/web/components/tracking/tracking-analytics-section.tsx`
- `apps/web/components/tracking/tracking-advisory-section.tsx`
- `apps/web/hooks/cargo/logic.ts` (business logic extraction)
- `apps/web/hooks/tracking/logic.ts` (business logic extraction)

**Validation:** Each page file ≤200 lines. Business logic functions have unit tests.

---

### [Frontend Agent] Install missing shadcn components

**Command:**
```bash
pnpm dlx shadcn@latest add checkbox radio-group switch avatar tooltip dropdown-menu popover command breadcrumb tabs progress alert -y
```

**Files replaced:**
- `apps/web/app/sign-in/sign-in-form.tsx` — `<input type="checkbox">` → `Checkbox`
- `apps/web/app/(platform)/app/cargo/page.tsx` — CSS tooltip → `Tooltip`
- `apps/web/components/shell/platform-shell.tsx` — inline div → `Avatar`
- `apps/web/app/(platform)/app/admin/` — native selects → `SelectNative`

**Validation:** Zero native `<input type="checkbox">` in app code. Zero CSS `group-hover` tooltips.

---

## SPRINT 3: Backend Architecture

### [Backend Agent] Implement repository pattern (cargo module first)

**Files:**
- `apps/api/src/cargo/domain/cargo.repository.ts` — Interface
- `apps/api/src/cargo/infrastructure/prisma-cargo.repository.ts` — Implementation
- `apps/api/src/cargo/domain/cargo.entity.ts` — Aggregate root
- `apps/api/src/cargo/cargo.service.ts` — Refactor to use repository

**Expected output:** `CargoService` depends on `CargoRepository` interface, not PrismaClient.
**Validation:** `grep -r "prisma.cargo" apps/api/src/cargo/` returns 0 in service files.

---

### [Backend Agent] Implement EventBus abstraction

**Files:**
- `packages/database/src/event-bus.ts` — `DomainEvent` interface, `EventBus` interface
- `packages/database/src/outbox-event-bus.ts` — `OutboxEventBus` implementation
- `apps/api/src/*/` — Replace `prisma.outboxEvent.create()` with `eventBus.publish()`

**Expected output:** Services call `eventBus.publish(domainEvent)`, not `prisma.outboxEvent.create()`.
**Validation:** `grep -r "prisma.outboxEvent" apps/api/src/` returns 0.

---

### [Backend Agent] ✅ Organizations module (already exists)

**Status:** `OrganizationsModule` already exists at `apps/api/src/organizations/`. Maintain repository pattern, service layer, and tenant lifecycle ownership.

**Files:**
- `apps/api/src/organizations/organizations.module.ts` — Module definition
- `apps/api/src/organizations/organizations.service.ts` — Service layer
- `apps/api/src/organizations/domain/organizations.repository.ts` — Repository interface
- `apps/api/src/organizations/infrastructure/prisma-organizations.repository.ts` — Prisma implementation

---

## SPRINT 4: API Versioning + Pagination

### [Backend Agent] Add API versioning

**Files:**
- `apps/api/src/rpc/rpc-http.middleware.ts` — Add `/v1/rpc/` prefix support
- `apps/api/src/rpc/platform-rpc.router.ts` — Mount under `/v1/rpc`
- `packages/rpc/src/metadata.ts` — Add version field to metadata
- `docs/adr/0006-api-versioning-strategy.md` — New ADR

**Expected output:** `POST /v1/rpc/cargo/register` works. `POST /rpc/cargo/register` redirects.
**Validation:** `pnpm test` passes with versioned routes.

---

### [Frontend Agent] Add pagination to data tables

**Files:**
- `packages/rpc/src/*.ts` — Verify all list endpoints support `offset`/`limit`
- `packages/ui/src/components/pagination.tsx` — Already exists, enhance if needed
- `apps/web/app/(platform)/app/*/page.tsx` — Add pagination state

**Expected output:** Tables with >25 rows show pagination controls.
**Validation:** Pages render <25 items with "Next" button.

---

## SPRINT 5: Form Validation + Testing Infrastructure

### [Backend Agent] Write unit tests for business rules

**Files:**
- `apps/api/src/cargo/domain/cargo-business-rules.test.mjs`
- `apps/api/src/tracking/domain/tracking-business-rules.test.mjs`
- `apps/api/src/capacity/domain/capacity-business-rules.test.mjs`

**Expected output:** Pure unit tests for business logic without Prisma dependency.
**Validation:** Tests run with `node --test`, no DB connection required.

---

### [Frontend Agent] Add client-side Zod validation

**Files:**
- `apps/web/app/sign-in/sign-in-form.tsx` — Add Zod schema validation
- `apps/web/app/(platform)/app/cargo/page.tsx` — Add form validation
- `apps/web/hooks/use-validated-form.ts` — Reusable validation hook
- `packages/ui/src/components/form-message.tsx` — Field-level error component

**Expected output:** Form validation on blur before submit.
**Validation:** Invalid input shows inline error message without network round-trip.

---

## SPRINT 6: DevOps + Accessibility

### [DevOps Agent] Rewrite PowerShell scripts to Node.js ✅

**Files:** All 10 `.ps1` files removed — `.mjs` equivalents are the active scripts.
- CI workflows updated from `shell: pwsh` to `shell: bash` with `actions/setup-node@v4`
- All documentation references updated
- `scripts/*.ps1` deleted

**Expected output:** All CI workflow scripts are cross-platform Node.js ESM.
**Validation:** `node scripts/*.mjs` runs on Linux without PowerShell.

---

### [Frontend Agent] Implement skip-to-content + keyboard navigation

**Files:**
- `apps/web/app/layout.tsx` — Skip link already exists, verify
- `apps/web/app/(platform)/layout.tsx` — Add `aria-live="polite"` regions
- `packages/ui/src/components/dialog.tsx` — Verify focus trap
- `packages/ui/src/components/sheet.tsx` — Verify focus trap

**Expected output:** Keyboard-only users can navigate all features.
**Validation:** Tab through all interactive elements, verify visible focus indicators.

---

## Sprint Order

```
Sprint 1: Design tokens + loading/error boundaries (P0 C-02, C-03)
Sprint 2: Frontend extraction + shared components (P0 C-04, H-06)
Sprint 3: Repository + EventBus + Organizations (H-01, H-02, G-01)
Sprint 4: API versioning + pagination (H-03, H-05)
Sprint 5: Unit tests + form validation (H-04, G-04)
Sprint 6: DevOps + accessibility (G-10, H-08)
```
