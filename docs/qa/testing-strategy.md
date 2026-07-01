# SAPTM Testing Strategy

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Owner:** QA Agent

---

## 1. Test Pyramid

```
              ╱╲
             ╱  ╲
            ╱ E2E╲        3 Playwright spec files (chromium, serial)
           ╱──────╲
          ╱Integration╲   16 API test files + 11 RPC test files
         ╱────────────╲
        ╱  Component   ╲   5 UI component test files (structural rendering)
       ╱────────────────╲
      ╱     Unit Tests    ╲  RPC contract validation, business rules, auth policy
     ╱────────────────────╲
```

---

## 2. Test Levels

### 2.1 Unit Tests

| Property | Detail |
|---|---|
| **Scope** | RPC contract validation (Zod schemas), business rule assertions, utility functions, auth policy engine |
| **Framework** | Node.js `node:test` + `node:assert/strict` |
| **Location** | `packages/rpc/tests/*.test.mjs` (11 files), `apps/api/tests/*-business-rules.test.mjs` (4 files), `apps/api/tests/auth-policy.test.mjs` |
| **When to run** | PR validation (`turbo run test`), CI `test` gate |
| **Coverage target** | 100% of RPC contract schemas validated; 100% of business rule decision branches exercised; 100% of auth policy combinations |
| **Examples** | `foundation.test.mjs` validates contract schema parsing; `cargo-service-business-rules.test.mjs` validates lifecycle state transitions; `auth-policy.test.mjs` tests 22 permission/actor combinations |

### 2.2 Integration Tests

| Property | Detail |
|---|---|
| **Scope** | API endpoint behavior with Prisma, RPC handler authorization + delegation, outbox worker notification generation, cross-module orchestration |
| **Framework** | Node.js `node:test` + `node:assert/strict` + `@orpc/server` test client |
| **Location** | `apps/api/tests/*-rpc.test.mjs` (11 files), `apps/api/tests/outbox-worker.test.mjs` |
| **When to run** | PR validation (`turbo run test`), CI `test` gate |
| **Coverage target** | All RPC handlers tested with mock services; error paths covered (unauthorized, invalid input, business rule rejection); Prisma adapter integration paths exercised |
| **Examples** | `cargo-rpc.test.mjs` tests authorization + delegation through `createRpcRouterClient`; `outbox-worker.test.mjs` validates all 40+ event type notification title mappings |

### 2.3 Component Tests

| Property | Detail |
|---|---|
| **Scope** | Structural rendering of shared UI components: variant coverage, data-slot contract, className merging, prop passthrough, conditional rendering |
| **Framework** | Node.js `node:test` + `node:assert/strict` (no DOM — tests inspect returned React elements statically) |
| **Location** | `packages/ui/src/components/__tests__/*.test.mjs` (5 files) |
| **When to run** | PR validation (`turbo run test`), CI `test` gate |
| **Coverage target** | 100% of exported components tested; all variants executed; all size/color combinations exercised |
| **Current status** | Button (10 tests), Dialog (10 tests), Skeleton, MetricTile, ContextRow — structural only, no interaction testing |
| **Known gap** | No DOM interaction tests (click, keyboard, focus management); no dark mode variant tests per component |

### 2.4 E2E Tests

| Property | Detail |
|---|---|
| **Scope** | Critical user journeys across authentication, cargo lifecycle, capacity, planning, tariff, integrations, notifications, audit, reports, security |
| **Framework** | Playwright (`@playwright/test`), chromium only, fullyParallel=false, workers=1, serial mode |
| **Location** | `tests/e2e/*.spec.ts` (4 files) |
| **When to run** | CI deployment validation (`pnpm test:e2e`), release evidence generation |
| **Coverage target** | All critical user paths mapped; cross-module workflows validated |
| **Retry policy** | 2 retries in CI, 0 locally |
| **Timeout** | 180s default, 120s startup, 360s bootstrap |
| **Snapshot testing** | Visual regression via `toHaveScreenshot()` with `maxDiffPixelRatio: 0.02-0.05` |
| **Current specs** | `runtime-health.spec.ts` (12 tests — auth guards + visual), `authenticated-platform.spec.ts` (10 tests — full module CRUD + integrations + visual), `mvp-complete-journey.spec.ts` (1 test — full lifecycle), `design-system-visual.spec.ts` (6+ tests — visual regression) |

---

## 3. Test Execution Pipeline

```
PR / CI Pipeline:
  1. lint          → biome check
  2. typecheck     → turbo run typecheck (dependsOn: ^build, build)
  3. test          → turbo run test (filter @saptm/api @saptm/rpc)
  4. build         → turbo run build
  5. e2e (CI only) → node scripts/run-e2e.mjs

CI Validation Gates (30+):
  - foundation validation scripts (*-foundation.mjs)
  - security runtime validation (validate-security-runtime.mjs)
  - resilience validation (validate-resilience.mjs)
  - deployment validation (validate-deploy.mjs)
  - Infrastructure validation (validate-containers, -docker-runtime)
```

---

## 4. File Naming Convention

| Test type | Pattern | Example |
|---|---|---|
| RPC contract (package) | `packages/rpc/tests/<domain>.test.mjs` | `cargo.test.mjs` |
| API integration | `apps/api/tests/<domain>-rpc.test.mjs` | `cargo-rpc.test.mjs` |
| Business rules | `apps/api/tests/<domain>-service-business-rules.test.mjs` | `cargo-service-business-rules.test.mjs` |
| Auth policy | `apps/api/tests/auth-policy.test.mjs` | `auth-policy.test.mjs` |
| Outbox | `apps/api/tests/outbox-worker.test.mjs` | `outbox-worker.test.mjs` |
| UI component | `packages/ui/src/components/__tests__/<component>.test.mjs` | `button.test.mjs` |
| E2E spec | `tests/e2e/<name>.spec.ts` | `mvp-complete-journey.spec.ts` |

---

## 5. Coverage Targets by Module

| Module | Unit | Integration | E2E | Current status |
|---|---|---|---|---|
| Foundation/system | 1 file | 1 file | 12 tests | Full |
| Auth/Policy | 1 file | — | — | Full |
| Cargo | 1 file | 2 files | Partial | Full unit + integration, partial E2E |
| Tracking | 1 file | 1 file | Partial | Full unit + integration, partial E2E |
| Capacity | 1 file | 2 files | Partial | Full unit + integration, partial E2E |
| Planning | 1 file | 1 file | Full | Complete |
| Tariff/Pricing | 1 file | 1 file | Full | Complete |
| Admin/Identity | 1 file | 1 file | Full | Complete |
| Audit | 1 file | 1 file | Full | Complete |
| Reports | 1 file | 1 file | Full | Complete |
| Notifications | 1 file | 1 file | Full | Complete |
| Integrations | 1 file | 1 file | Full | Complete |
| Outbox worker | — | 1 file | Partial | Complete |
| UI components | — | — | — | 5 files structural only |

---

## 6. Quality Gates (per Article III)

1. PR validation: `lint → typecheck → test → build` (enforced by `turbo.json`)
2. CI validation: 30+ production validation gates before merge to main
3. E2E run: manual trigger or CI deployment validation
4. All validation gates must pass before deployment to production
