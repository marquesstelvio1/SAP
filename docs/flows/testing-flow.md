# Flow: Testing

**Phase:** 10 — Execution Pipeline

---

## Purpose
Verify code quality and prevent regressions.

## Inputs
- Source code changes
- Existing test suite

## Outputs
- Test results
- Coverage report

## Steps (for feature implementation)
1. Write contract tests for RPC operations
2. Write service unit tests
3. Write integration tests for module flows
4. Write component rendering tests (frontend)
5. Write E2E tests for critical journeys
6. Run test suite
7. Review coverage

## Steps (for bug fix)
1. Write test that reproduces the bug
2. Verify test fails
3. Implement fix
4. Verify test passes
5. Run full test suite

## Checkpoints
- [ ] New code has tests
- [ ] Existing tests still pass
- [ ] Bug fix has regression test
- [ ] Coverage meets thresholds

## Quality Gates
- `pnpm test` passes
- E2E tests pass (if applicable)
- No flaky tests
- Coverage >= 80% for new code
