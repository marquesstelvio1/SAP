# SAPTM Test Automation Improvement Plan

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Owner:** QA Agent

---

## Phase Overview

```
Phase 1 (Immediate)     ── Week 1-2: Coverage tooling, flakiness, foundation
Phase 2 (Short-term)    ── Week 3-6: Frontend testing, E2E expansion
Phase 3 (Medium-term)   ── Week 7-14: Visual, performance, accessibility
Phase 4 (Long-term)     ── Month 4-8: Contract, chaos, load testing
```

---

## Phase 1 — Immediate (Weeks 1-2)

### 1.1 Add Code Coverage Tooling

**Gap:** G01 — No coverage metrics

**Actions:**
- Add `--experimental-test-coverage` to `@saptm/rpc` and `@saptm/api` test scripts in their respective `package.json`
- Configure `turbo.json` to propagate `--coverage` argument:
  ```json
  "test": {
    "dependsOn": ["^build", "build"],
    "outputs": [],
    "passThroughEnv": ["COVERAGE"]
  }
  ```
- Set initial thresholds in CI: 80% lines, 75% branches, 70% functions
- Generate LCOV reports via `node --test --experimental-test-coverage --test-reporter=lcov`
- Integrate with CI pipeline to fail PRs below threshold

**Tools required:** Node.js built-in (`--experimental-test-coverage`)

**Effort:** 2 days

**Success criteria:**
- Coverage reports generated on every `turbo run test` with `--coverage`
- CI gate blocks PRs below threshold (thresholds documented in CI config)
- Coverage trend tracked weekly

---

### 1.2 Fix Flaky E2E Tests

**Gap:** G12 — E2E reliability

**Actions:**
- Audit existing flaky tests (known: idempotency key race conditions, form hydration timeouts)
- Add `waitForHydratedForm` stability improvement: increase stable reads threshold, add network idle check before form interaction
- Implement test data isolation: unique command suffix per run (already done via `createCommandSuffix()`)
- Add `test.describe.configure({ mode: "serial" })` (already applied)
- Log test artifacts (trace, video) on failure for debugging
- Split `mvp-complete-journey.spec.ts` into 3-4 focused specs for better failure isolation

**Tools required:** Playwright trace viewer (already enabled: `trace: "on-first-retry"`)

**Effort:** 3 days

**Success criteria:**
- Zero intermittent failures across 10 consecutive CI runs
- <2% flake rate on any individual spec
- Test artifacts (traces) available for all failed runs

---

### 1.3 Add Initial Frontend Unit Tests (Seed)

**Gap:** G02 — No frontend testing

**Actions:**
- Install Vitest + `@testing-library/react` + `jsdom` in `apps/web`
- Create `apps/web/src/__tests__/` directory structure matching source
- Add test for 3 seed targets: a utility function, a React hook, a page-level component
- Add `test:web` task to `turbo.json`
- Update root `package.json` to include `test:web` in CI

**Tools required:** Vitest, `@testing-library/react`, `jsdom`

**Effort:** 3 days

**Success criteria:**
- Vitest runs successfully in CI
- 3 seed tests passing
- `turbo run test:web` registered in pipeline

---

### 1.4 Add Missing API Business Rule Tests

**Gap:** G05 — Partial business rule coverage

**Actions:**
- Add business rule tests for: `planning`, `tariff`, `notifications`, `integrations`, `audit`
- Follow pattern in `cargo-service-business-rules.test.mjs`: mock database, test valid + invalid state transitions, test rejection paths

**Tools required:** Node.js `node:test`

**Effort:** 5 days

**Success criteria:**
- Each missing module has a `*-service-business-rules.test.mjs` file
- All modules pass with minimum 80% branch coverage

---

## Phase 2 — Short-term (Weeks 3-6)

### 2.1 Full Frontend Unit Testing Framework

**Gap:** G02 — No frontend testing

**Actions:**
- Expand Vitest setup with full `@testing-library/user-event` integration
- Add test configuration for: `apps/web/test-setup.ts` (providers, mocks)
- Write tests for all custom hooks, context providers, data formatting utilities
- Add component tests for all page-level components (structural + interaction)
- Achieve 60% frontend coverage baseline

**Tools required:** Vitest, `@testing-library/react`, `@testing-library/user-event`, `msw` (for API mocking)

**Effort:** 2 weeks

**Success criteria:**
- All hooks and utilities have >80% line coverage
- All pages have at least one rendering test
- `msw` handlers mock all RPC endpoints used by frontend
- CI gate passes with 60% baseline

---

### 2.2 Expand E2E Coverage

**Gap:** G12 — Limited E2E scenarios

**Actions:**
- Add E2E test for 2FA setup and login (P07 critical path)
- Add E2E test for password reset flow
- Add E2E test for multi-tenant data isolation (verify user from org A cannot see org B data)
- Add E2E test for concurrent session revocation
- Split `mvp-complete-journey.spec.ts` into: cargo-lifecycle, exception-handling, tracking-events
- Add negative tests: invalid form submission, expired token handling, unauthorized resource access

**Tools required:** Playwright, TOTP library (`otplib` for programmatic 2FA code generation)

**Effort:** 2 weeks

**Success criteria:**
- 5+ new spec files added
- 2FA flow automated end-to-end
- Negative test coverage for all major modules
- All tests pass consistently across 10 CI runs

---

### 2.3 Add Permission Edge Case Tests

**Gap:** G08 — Permission edge cases

**Actions:**
- Extend `auth-policy.test.mjs` with: cross-tenant access, compound permission intersection, role hierarchy, revoked session, expired token
- Add integration test: call RPC endpoint with insufficient permissions, verify 403 + audit event
- Add E2E test: create low-permission user, attempt restricted operations, verify error

**Tools required:** Node.js `node:test`, Playwright

**Effort:** 1 week

**Success criteria:**
- 50+ auth policy test cases (up from 22)
- Integration tests verify error responses for all auth modes
- E2E confirms UI enforcement matches backend enforcement

---

### 2.4 Add Error Boundary and Form Validation Tests

**Gaps:** G06, G07

**Actions:**
- Add rendering test for each `error.tsx` page: verify fallback UI, retry button
- Add integration test: trigger API error, verify boundary catches it
- Add form validation alignment tests: extract Zod schemas, verify client validation rules match

**Tools required:** Vitest, `@testing-library/react`

**Effort:** 1 week

**Success criteria:**
- Every route's `error.tsx` has at least one rendering test
- Form validation tests exist for all major forms

---

## Phase 3 — Medium-term (Weeks 7-14)

### 3.1 Visual Regression Testing

**Gaps:** G11 — Dark mode, visual coverage

**Actions:**
- Expand Playwright visual snapshot coverage to all major pages
- Add dark mode snapshots for each page (programmatic `.dark` class toggle)
- Add component-level visual regression via Storybook or Playwright component testing
- Implement snapshot diff thresholds per component (some may be inherently variable)
- Store approved baselines in VCS alongside spec files (pattern already used: `*-snapshots/` directories)

**Tools required:** Playwright `toHaveScreenshot()`, `pixelmatch` (built-in)

**Effort:** 2 weeks

**Success criteria:**
- Visual snapshots for all 10+ protected routes (light + dark)
- Baseline snapshots stored in `tests/e2e/*.spec.ts-snapshots/`
- CI validates snapshots with <2% maxDiffPixelRatio

---

### 3.2 Performance Testing

**Actions:**
- Add Lighthouse CI to E2E pipeline
- Set performance budgets: FCP < 2s, LCP < 3s, TBT < 200ms, CLS < 0.1
- Add custom Playwright performance markers for critical RPC calls
- Profile heavy RPC operations (cargo overview with pagination, audit search with filters)

**Tools required:** Lighthouse CI (`@lhci/cli`), Playwright `metrics` API

**Effort:** 2 weeks

**Success criteria:**
- Lighthouse scores: Performance > 90, Accessibility > 90, Best Practices > 90, SEO > 90
- RPC p95 response times documented and tracked
- Performance regression gate in CI

---

### 3.3 Accessibility Testing

**Gap:** G10 — No accessibility tests

**Actions:**
- Add `@axe-core/playwright` to E2E configuration
- Run `injectAxe()` + `checkA11y()` on every page load in E2E tests
- Create dedicated a11y spec: tab order, focus management, ARIA labels, color contrast
- Fix violations iteratively: component library first, then pages
- Add keyboard navigation tests: Tab through all interactive elements

**Tools required:** `@axe-core/playwright`, Playwright

**Effort:** 3 weeks

**Success criteria:**
- 0 critical/serious axe violations on all major pages
- Keyboard navigation covers all interactive elements
- ARIA labels present on all icon-only buttons (constitutional requirement)
- CI gate blocks PRs introducing new critical/serious violations

---

## Phase 4 — Long-term (Month 4-8)

### 4.1 Contract Testing

**Actions:**
- Implement consumer-driven contract tests for RPC endpoints using Pact or Zod-based contract testing
- Verify backward compatibility when modifying RPC contracts
- Document client expectations per contract version

**Tools required:** Pact (`@pact-foundation/pact-js`) or custom Zod-based contract test runner

**Effort:** 6 weeks

**Success criteria:**
- All 11 RPC packages have consumer-driven contract tests
- Breaking changes detected in CI before deployment
- Contract version negotiation enforced at runtime

---

### 4.2 Chaos Engineering

**Actions:**
- Add chaos experiment scenarios: database connection loss, Redis failure, API instance termination
- Validate graceful degradation: error boundaries render, retry mechanism activates, queued operations persist
- Run chaos experiments in staging only
- Measure: recovery time, data loss, error rate during failure

**Tools required:** `chaoskube`, `litmus`, or custom Node.js chaos scripts

**Effort:** 4 weeks

**Success criteria:**
- All chaos experiments pass: no data loss, recovery within SLA
- Graceful degradation paths validated
- Runbook updated with failure recovery procedures

---

### 4.3 Load Testing

**Actions:**
- Design load test scenarios reflecting peak operational patterns: concurrent cargo registrations, batch tracking updates, report generation
- Run ramp-up tests: 10 → 50 → 100 → 200 concurrent users
- Measure: response times, error rates, resource utilization (CPU, memory, DB connections)
- Identify bottlenecks and establish autoscaling thresholds

**Tools required:** `k6` (Grafana), `autocannon`, or `artillery`

**Effort:** 4 weeks

**Success criteria:**
- Target: 100 concurrent users with p95 < 2s for all RPC operations
- Target: 0% error rate under load
- Autoscaling policies validated and documented

---

## Resource Summary

| Phase | Duration | Effort (person-weeks) | Key tools |
|---|---|---|---|
| Phase 1 — Immediate | 2 weeks | 2 | Node.js `--experimental-test-coverage`, Vitest seed |
| Phase 2 — Short-term | 4 weeks | 6 | Vitest, Playwright, `msw`, `otplib` |
| Phase 3 — Medium-term | 8 weeks | 7 | Playwright snapshots, Lighthouse CI, `@axe-core/playwright` |
| Phase 4 — Long-term | 16 weeks | 14 | Pact, `chaoskube`, `k6` |
| **Total** | **~30 weeks** | **29** | |

---

## Success Criteria Summary

| Metric | Current | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|---|
| Code coverage (API/RPC) | 0% (unmeasured) | 80% | 85% | 90% | 90%+ |
| Frontend test files | 0 | 3 | 30+ | 50+ | 80+ |
| E2E spec files | 4 | 4 | 9+ | 12+ | 15+ |
| Auth policy test cases | 22 | 22 | 50+ | 60+ | 70+ |
| E2E flake rate | Unknown | <2% | <1% | <0.5% | <0.1% |
| Visual snapshots | 6 | 6 | 10+ | 25+ | 40+ |
| a11y violations | Unmeasured | Unmeasured | Unmeasured | 0 critical | 0 critical |
| Performance LCP | Unmeasured | Unmeasured | Baselines | < 3s | < 2s |
| Load capacity | Untested | Untested | Untested | Baselines | 100 concurrent |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Flaky coverage tooling on Windows | Delayed Phase 1 | Medium | Test on CI first, iterate locally |
| Vitest/jsdom mismatch with Next.js 16 | Blocked Phase 2 | Low | Use `@vitejs/plugin-react-swc`, test early |
| E2E 2FA automation complexity | Delayed Phase 2 | Medium | Use `otplib` + `page.evaluate` for TOTP generation |
| Visual snapshot maintenance burden | Slow Phase 3 | High | Set generous `maxDiffPixelRatio`, audit monthly |
| Chaos experiments cause staging outage | Data loss | Low | Run in isolated namespace, auto-rollback |
| Load testing infrastructure cost | Budget overrun | Medium | Use serverless k6, share infra with staging |
