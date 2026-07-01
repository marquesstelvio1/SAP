# STRUCTURAL GAPS — SAPTM MESH AUDIT

> Gaps in architecture, module boundaries, and system completeness.
> Priority P2 — address after P0/P1 are closed.

---

## G-01: ✅ RESOLVED — BACKEND module: Organizations

**Status:** `apps/api/src/organizations/` now exists with `OrganizationsModule`, repository interface, Prisma repository implementation, and dedicated service. Organization logic owns tenant lifecycle, facility management, and partner relationships.

---

## G-02: ✅ RESOLVED — BACKEND module: Documents & Compliance

**Status:** `apps/api/src/documents/` now exists with `DocumentsModule` and dedicated service. Document lifecycle, validation state, and retention rules are independently owned.

---

## G-03: ⚠️ PARTIAL — BACKEND module: Billing

**Gap:** `apps/api/src/billing/` exists with `BillingModule` but it's a thin Stripe integration (checkout sessions, portal). The full charge/invoice lifecycle is not implemented.

**Impact:** No subscription management, invoice generation, or settlement tracking.

---

## G-04: API domain services missing unit test files

**Gap:** All 16 API test files are integration tests hitting RPC endpoints. No pure unit tests exist for business rules, use cases, or domain logic.

**Impact:** Testing edge cases is slow and requires full Prisma setup. Business logic changes risk regression.

---

## G-05: No coverage tooling configured

**Gap:** `CURRENT_STATE.md` explicitly lists this as known issue. No `c8`, `nyc`, `istanbul`, or `vitest --coverage`.

**Impact:** Cannot measure test quality or identify untested code paths.

---

## G-06: `@saptm/ui` hooks directory is empty

**Gap:** `packages/ui/src/hooks/` exists but contains zero files. `components.json` configures `hooks: "@saptm/ui/hooks"`.

**Impact:** Custom hooks pattern is established but unused.

---

## G-07: No backup/restore for database

**Gap:** Database strategy doc defines backup retention and restore procedures. No actual backup scripts exist.

**Impact:** Production data loss has no recovery procedure.

---

## G-08: Web health endpoint inconsistency

**Gap:** Web's health endpoint at `/api/health` expects a response, but web has no health route handler. The `apps/web/src/proxy.ts` (if that's a proxy) would need to forward to the API.

**Impact:** Health checks may false-positive.

---

## G-09: No cache invalidation strategy

**Gap:** RPC queries use stale-while-revalidate or force-dynamic but no documented cache invalidation strategy.

**Impact:** Stale data may be served after mutations.

---

## G-10: PowerShell scripts incompatible with Linux CI

**Gap:** `scripts/Invoke-AIWorkflow.ps1`, `New-AIChangelog.ps1`, etc. are PowerShell-only. CI runs on Linux.

**Impact:** AI workflow automation cannot run in CI.

---

## G-11: No robots.ts / sitemap.ts

**Gap:** FINAL-ENTERPRISE-REPORT.md flags missing `robots.ts` and `sitemap.ts`.

**Impact:** SEO gap. Minor.

---

## G-12: Email templates only in Portuguese

**Gap:** `@saptm/email` package has templates only in PT-BR. No i18n infrastructure.

**Impact:** Internationalization barrier for non-PT markets.
