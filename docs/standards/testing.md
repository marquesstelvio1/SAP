# Standard: Testing

**Phase:** 4 — Engineering Standards

---

## Required

- Test files use `.test.mjs` extension (ESM)
- Node `--test` runner for API/RPC/package tests
- Playwright for E2E tests (chromium only, serial)
- Tests must be deterministic — no shared mutable state
- Every new page must have loading and error boundary tests
- All RPC contracts must have unit tests in `packages/rpc/tests/`
- All API modules must have integration tests in `apps/api/tests/`

## Test Categories

| Category | Runner | Location | Scope |
|---|---|---|---|
| Contract | `node --test` | `packages/rpc/tests/` | Input validation, metadata, errors |
| Integration | `node --test` | `apps/api/tests/` | Module RPC flows, business rules |
| Component | `node --test` | `packages/ui/__tests__/` | Rendering, variants, interactions |
| E2E | Playwright | `tests/e2e/` | Critical user journeys |
| Load | k6/bash | `tests/load/` | Performance thresholds |

## Recommended

- Use test fixtures from `@saptm/testing` for auth/permission setup
- Use structured testing: `describe()` blocks with `it()` functions
- Test happy path, error cases, and edge cases
- Test permission enforcement (both allowed and denied)
- Mock external services (Stripe, Resend) in integration tests

## Forbidden

- `test.only` in committed code
- Shared mutable state between tests
- Hardcoded timeouts (use proper async patterns)
- Testing implementation details instead of behavior
- Skipping tests without justification

## Coverage Requirements

| Area | Minimum |
|---|---|
| RPC contracts | 90% |
| API services | 80% |
| Auth/policy engine | 95% |
| E2E critical paths | 100% of journeys |

## Validation

- `pnpm test` passes before commit
- E2E tests pass in CI
- Coverage meets minimum thresholds
- No flaky tests (investigate and fix immediately)

## Migration

- When adding a new runner, document in this standard
- Migrate legacy tests to `.test.mjs` format
- Ensure all CI workflows include test execution
