# SAPTM Coverage Gaps Analysis

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Owner:** QA Agent

---

## 1. Gap Overview

| # | Gap | Severity | Impact | Effort |
|---|---|---|---|---|
| G01 | No code coverage metrics | Critical | Blind to untested code paths | Low |
| G02 | No frontend unit testing framework | Critical | Web app logic untested | Medium |
| G03 | UI component tests: structural only | High | No interaction/behavior coverage | Medium |
| G04 | No DOM interaction tests | High | Event handlers, focus, keyboard unvalidated | Medium |
| G05 | API business rule unit tests: partial | High | 4 of 8 modules have business rule tests | Medium |
| G06 | No form validation tests | High | Client/server validation mismatch risk | Medium |
| G07 | No error boundary tests | High | Crash recovery paths untested | Low |
| G08 | Permission edge cases: missing | High | RBAC combinatorial paths unvalidated | Medium |
| G09 | No mobile responsive tests | Medium | Mobile UX degradation undetected | Medium |
| G10 | No accessibility tests | Medium | WCAG 2.2 AA compliance unverified | High |
| G11 | No dark mode component tests | Low | Dark theme regression undetected | Low |
| G12 | E2E coverage: limited scenarios | Medium | Exception paths, offline, concurrency missing | High |
| G13 | API integration tests: happy-path focused | Medium | Error/edge case responses unvalidated | Medium |

---

## 2. Detailed Gap Analysis

### G01 — No Code Coverage Metrics

**Current state:** No coverage tooling configured. `c8`, `istanbul`, `--experimental-coverage` not in any package.json or turbo.json.

**Risk:** Cannot measure test effectiveness. Untested code paths, dead branches, and uncovered error handlers go undetected. Regression risk increases with each PR.

**Recommendation:**
- Add `node --test --experimental-test-coverage` for `@saptm/rpc` and `@saptm/api` test runs
- Configure `turbo.json` to accept `--coverage` flag
- Set coverage thresholds: 80% lines, 75% branches (initial), ramp to 90%/85% within 3 months
- Generate LCOV reports for CI visualization

**Priority:** P0 — Immediate

---

### G02 — No Frontend Unit Testing

**Current state:** `apps/web` has zero test files. No Vitest, Jest, or testing-library configured. UI component tests in `@saptm/ui` use `node:test` which cannot render in a browser environment.

**Risk:** Frontend business logic (formatting, calculations, hooks, context providers, data transformation) has no automated validation. Client-side regressions require manual verification or slow E2E tests.

**Recommendation:**
- Add Vitest with `@testing-library/react` and `jsdom` environment
- Configure test location: `apps/web/src/__tests__/` mirroring source structure
- Start with: utility functions, custom hooks, context providers, page-level logic
- Add as a new task in `turbo.json`: `"test:web": { "dependsOn": ["^build"], "outputs": [] }`

**Priority:** P0 — Immediate

---

### G03 — UI Component Tests: Structural Only

**Current state:** 5 component test files test structural rendering (React element inspection via `node:test`). No tests verify user interaction outcomes. Example: `button.test.mjs` validates className strings and element shape but never tests click behavior, disabled state behavior, or keyboard navigation.

**Recommendation:**
- Migrate component tests to Vitest + `@testing-library/react` once Vitest is added
- Add interaction tests: click handlers, keyboard events, focus management, aria attribute verification
- Test all exposed states: loading, disabled, error, empty
- Add render-with-provider tests (ThemeProvider, RouterProvider)

**Priority:** P1 — Short-term

---

### G04 — No DOM Interaction Tests

**Current state:** No tests simulate user interactions (click, type, focus, blur, submit) in a browser-like environment. E2E tests cover some interactions but are too slow for component-level validation.

**Recommendation:**
- After Vitest setup, add `@testing-library/user-event` for realistic interaction simulation
- Cover: button clicks, form submissions, dialog open/close, select changes, keyboard escape
- Test async interactions: loading states, toast feedback, navigation side effects

**Priority:** P1 — Short-term

---

### G05 — API Business Rule Unit Tests: Partial

**Current state:** 4 business rule test files exist (`cargo`, `capacity`, `evidence-services`, `tracking` — inferred). Missing modules: `planning`, `tariff`, `notifications`, `integrations`, `audit`.

**Risk:** Business rules in untested modules may have latent defects uncovered only in integration or E2E tests, increasing fix cost.

**Recommendation:**
- Add business rule tests for missing modules
- Each test file should cover: valid transitions, invalid transitions, boundary conditions, state machine edges
- Follow the pattern in `cargo-service-business-rules.test.mjs`: mock database, test lifecycle stages, test all rejection paths

**Priority:** P1 — Short-term

---

### G06 — No Form Validation Tests

**Current state:** Forms use HTML5 validation + server-side Zod schemas. No tests verify that client-side validation rules match server-side rules, or that error messages render correctly.

**Recommendation:**
- Extract form validation schemas into shared packages or test their alignment
- Add integration tests that submit invalid data and verify error responses
- Add component tests for form field error state rendering

**Priority:** P1 — Short-term

---

### G07 — No Error Boundary Tests

**Current state:** Article IV requires error boundaries (`error.tsx`) for every route. No tests verify that error boundaries render correctly when child components throw.

**Recommendation:**
- Add rendering tests for each `error.tsx` page: verify fallback UI, retry button, error message display
- Add integration tests that trigger API errors and verify the boundary catches them

**Priority:** P1 — Short-term

---

### G08 — Permission Edge Cases Untested

**Current state:** `auth-policy.test.mjs` covers 22 scenarios (actor types, permission modes, org scoping). Missing: cross-tenant access attempts, permission inheritance chains, role hierarchy resolution, revoked session edge cases, expired token handling.

**Recommendation:**
- Extend `auth-policy.test.mjs` with: tenant isolation violation scenarios, compound permission evaluation (intersection of multiple required permissions), role hierarchy traversal
- Add E2E test: sign in as low-permission user, attempt restricted operations, verify error response + audit event

**Priority:** P1 — Short-term

---

### G09 — No Mobile Responsive Tests

**Current state:** No viewport size variation tests exist for individual pages. Only `authenticated-platform.spec.ts` uses `setViewportSize` for visual snapshots of planning and tariffs sections.

**Recommendation:**
- Add Playwright tests at common breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)
- Verify: navigation menu renders correctly, forms remain usable, data tables scroll or truncate properly
- Add viewport checks to existing E2E flows

**Priority:** P2 — Medium-term

---

### G10 — No Accessibility Tests

**Current state:** Article IV requires WCAG 2.2 AA compliance. No automated accessibility checks (axe-core, Lighthouse) integrated into any test runner.

**Recommendation:**
- Add `@axe-core/playwright` to E2E tests
- Run `injectAxe` + `checkA11y` on every page render
- Add as a CI gate with severity filtering (critical violations must pass)
- Target: 0 critical/serious violations, <5 minor violations per page

**Priority:** P2 — Medium-term

---

### G11 — No Dark Mode Component Tests

**Current state:** Design system visual regression tests dark mode at page level (`design-system-visual.spec.ts`). Individual components are never rendered and tested in dark mode variants.

**Recommendation:**
- Add component-level dark mode rendering tests after Vitest migration
- Verify: contrast ratios, color token mapping, component visibility in both themes

**Priority:** P3 — Long-term

---

### G12 — E2E Coverage: Limited Scenarios

**Current state:** 4 spec files covering runtime health (auth guards), authenticated platform (10 tests), MVP journey (1 monolithic test), design system visual (6+ tests). Coverage is broad but shallow — each module gets one "happy path" test.

**Recommendation:**
- Add: error/exception flows (network timeout, API 500, validation rejection), concurrent user sessions, browser back/forward navigation, offline mode handling, pagination and filtering
- Split `mvp-complete-journey.spec.ts` into smaller focused specs for debuggability
- Add data cleanup between runs to ensure determinism

**Priority:** P2 — Medium-term

---

### G13 — API Integration Tests: Happy-Path Focused

**Current state:** RPC handler tests validate authorization + successful delegation but rarely test API error responses: invalid input rejection, business rule rejection propagation, Prisma constraint violation handling, rate-limit exceeded responses.

**Recommendation:**
- Add integration tests for each error response status code (400, 401, 403, 404, 409, 429, 500)
- Test idempotency key collision handling
- Test concurrent request ordering

**Priority:** P1 — Short-term

---

## 3. Gap Priority Matrix

```
Priority | Gaps
P0       | G01, G02
P1       | G03, G04, G05, G06, G07, G08, G13
P2       | G09, G10, G12
P3       | G11
```

---

## 4. Known Strengths (preserve)

| Strength | Detail |
|---|---|
| RPC contract validation | All 11 RPC packages have Zod schema tests |
| Auth policy exhaustiveness | 22 test cases covering actor types, modes, org scoping |
| Outbox notification mapping | All 40+ event types tested for title/severity inference |
| E2E auth guard coverage | All 10 protected routes tested for anonymous redirect |
| Visual regression baseline | Sign-in, tracking, business rules, design system snapshots captured |
| Cross-module journey | MVP journey covers 14-step cargo lifecycle end-to-end |
| Windows compatibility | E2E tests handle Win32 port management and process lifecycle |
