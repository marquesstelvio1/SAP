# Diagnostic: Testing

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Testing Coverage & Quality
**Date:** 2026-06-23

---

## Current State

API has 16 integration tests. RPC package has 11 contract tests. E2E tests via Playwright. UI tests in `@saptm/ui/src/components/__tests__/`. Load tests in `tests/load/`.

## Problems

1. **Zero tests across most packages** — `@saptm/auth`, `@saptm/config`, `@saptm/database`, `@saptm/email`, `@saptm/observability`, `@saptm/form`, `@saptm/types` have NO tests.
2. **No service-level tests** — API tests are integration-level only; individual services have no unit tests.
3. **No frontend component tests** — `apps/web/components/` has no `__tests__` directories.
4. **E2E coverage narrow** — E2E tests may not cover critical user journeys (signup, org creation, billing).
5. **No accessibility tests in CI** — Accessibility audit is manual (`lint:a11y` script references Playwright but not in PR pipeline).
6. **Load tests not in CI** — Load tests are manual (`tests/load/run-load-tests.sh`).
7. **No API contract tests** — No automated verification that RPC contracts match implementation.

## Technical Debt

- Test runner is Node `--test` (ESM) — diverges from Jest/Vitest conventions; may challenge new contributors.
- Test files use `.test.mjs` extension — consistent but unusual.

## Risks

- **Critical:** Zero test coverage on auth, database, and config packages means regressions go undetected.
- **Medium:** E2E-only testing provides slow feedback loop.

## Impact

Every deployment carries regression risk. Refactoring is dangerous without test safety net.

## Priority

Critical

## Recommended Actions

1. Add unit tests for all packages: `@saptm/auth` (policy engine, session, API keys), `@saptm/config` (env validation), `@saptm/email` (email sending), etc.
2. Add service-level unit tests for all 22 API modules.
3. Add component rendering tests for all frontend components.
4. Expand E2E coverage to include all critical user journeys.
5. Add accessibility (aXe) tests to CI pipeline.
6. Integrate load tests into CI as non-blocking informational gates.
7. Add contract tests verifying RPC implementations match their schemas.

## Estimated Effort

13-18 days phased

## Owner Agent

qa
