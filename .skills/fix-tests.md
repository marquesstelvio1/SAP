---
name: fix-tests
description: Test fix skill for diagnosing and resolving test failures in the SAPTM monorepo. Covers RPC unit tests, API integration tests, UI structural tests, and E2E tests.
metadata:
  origin: SAPTM CONSTITUTION — Article III, VI
---

# Fix: Tests

Systematic approach to diagnose and resolve test failures in the SAPTM monorepo.

## Purpose

Quickly identify the root cause of test failures, apply targeted fixes, and ensure the full test suite passes deterministically.

## Inputs

- Test failure output from `turbo run test` or CI logs
- Test file path and test name
- Source code for the module/component under test
- Mock definitions and test fixtures
- AGENTS.md testing rules (Article VI)

## Execution Steps

### Step 1 — Identify Failing Tests
1. Run `turbo run test --filter=<package>` to reproduce the failure locally.
2. Note the exact test file path and test name.
3. Run the failing test in isolation: `node --test <path-to-test>`.
4. Capture the full error output including stack trace.

### Step 2 — Read Error Messages
1. Read the assertion error — identify expected vs actual values.
2. Read the stack trace — identify the exact line that threw.
3. Determine the failure category:
   - Assertion failure (wrong expected value)
   - Runtime exception (unhandled error, timeout)
   - Mock mismatch (missing or incorrect mock)
   - Shared state pollution (test order dependency)
   - External dependency unavailable (network, database)

### Step 3 — Check for Shared Mutable State
1. Review all `test.before` and `test.beforeEach` hooks for shared state (6.5).
2. Check if global variables, module-level singletons, or database state persist between tests.
3. Verify that `test.after` and `test.afterEach` properly clean up state.
4. If tests fail only when run as a suite but pass in isolation → shared mutable state is the likely cause.
5. Fix by isolating state per test or using fresh fixtures in `test.beforeEach`.

### Step 4 — Verify Mocks
1. Check that all required mocks are defined and return correct shapes.
2. Check that unmocked functions do not reach real implementations (3.2.4).
3. For API integration tests, verify mock Prisma service returns expected data.
4. For E2E tests, verify Playwright fixtures and routes are correctly defined.
5. Check mock call expectations (`assert.strictEqual(mock.callCount, expected)`).

### Step 5 — Fix
1. Apply the minimum fix needed to resolve the failure.
2. Do not change unrelated tests or implementation code unless necessary.
3. If the test expectation is incorrect (e.g., API behavior changed), update the test.
4. If the implementation is incorrect, fix the implementation and verify other tests still pass.
5. For flaky tests, add proper cleanup in `test.afterEach` (6.6).

### Step 6 — Run Test in Isolation
1. `node --test <path-to-failing-test>`
2. Confirm the test passes in isolation 3 consecutive times.
3. Verify no test pollution by running twice: `node --test <path> && node --test <path>`.

### Step 7 — Run Full Test Suite
1. `turbo run test --filter=<package>`
2. Verify all tests in the package pass.
3. If the fix affects multiple packages: `turbo run test`.
4. Run test suite 3 times to check for flakiness (6.6).

## Validation Steps

- [ ] Failing test identified and reproduced in isolation (Step 1)
- [ ] Error message and stack trace fully understood (Step 2)
- [ ] No shared mutable state between tests (Step 3)
- [ ] Mocks correctly defined and returning expected values (Step 4)
- [ ] Fix applied and test passes in isolation (Step 5–6)
- [ ] Full test suite passes (Step 7)
- [ ] Test passes consistently (no flakiness)

## Definition of Done

- All failing tests pass in isolation and as part of the full suite.
- Test suite run 3 times consecutively without failure (no flakiness).
- If implementation was changed, related tests still pass.
- If test was changed, PR description notes the test modification.
- QA agent signs off on the fix (Article X, 10.4).

## Failure Conditions

- Test passes in isolation but fails in suite → shared mutable state not fully isolated.
- Test fails intermittently → flaky test; must be quarantined or fixed immediately (6.6).
- Fix requires changing test framework configuration → coordinate with QA agent.
- Fix requires changing source code that breaks other tests → revert and re-approach.
- External dependency unavailable in test environment → mock the dependency (3.2.4).
- More than 3 consecutive suite runs show flakiness → quarantine test and file issue.

## Required Reports

- Root cause summary (failure category, file, line number).
- Changes made (test file, source file, or both).
- Test results showing before/after status.
- Flakiness assessment (pass 3/3, 5/5, etc.).
