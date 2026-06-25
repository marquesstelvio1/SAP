# Testing Audit Plugin

**ID:** `testing-audit`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 55
**Mandatory:** true
**Runs On:** post-implementation, pre-release
**Blocking:** true

## Mission

Audit test coverage, quality, and execution across all packages. Enforce minimum coverage thresholds and test best practices.

## Audit Checklist

### 1. Coverage Requirements

| Tier | Package | Minimum Coverage |
|---|---|---|
| Critical | `@saptm/rpc` | 90% lines, 80% branches |
| High | `@saptm/auth` | 95% lines, 90% branches |
| High | `@saptm/api` | 80% lines, 70% branches |
| Medium | `@saptm/database` | 70% lines |
| Medium | All other packages | 60% lines |

### 2. Test Existence

- [ ] All services have unit tests
- [ ] All RPC contracts have validation tests
- [ ] All API endpoints have integration tests
- [ ] All guards have auth tests
- [ ] All critical user journeys have E2E tests
- [ ] All mutations have idempotency tests
- [ ] All error cases have tests

### 3. Test Quality

- [ ] No skipped tests (`.skip`)
- [ ] No tests with `.todo` without issue reference
- [ ] No tests that never assert
- [ ] No flaky tests (deterministic assertions)
- [ ] Tests are isolated (no shared mutable state)
- [ ] Proper use of fixtures/factories
- [ ] Mocks are appropriate and minimal

### 4. Test Structure

- [ ] Tests use `.test.mjs` extension (ESM)
- [ ] Tests use Node `--test` runner
- [ ] Playwright E2E tests configured (chromium only)
- [ ] Test files co-located or in `__tests__/`
- [ ] Descriptive test names (user story format)

### 5. CI Integration

- [ ] Tests run in CI pipeline
- [ ] Coverage reports generated
- [ ] Coverage thresholds enforced
- [ ] Test failures block PR merge
- [ ] E2E tests run serially

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| TA01 | error | Below minimum coverage threshold |
| TA02 | warning | Skipped test without reason |
| TA03 | error | Missing test for critical path |
| TA04 | warning | Flaky test pattern detected |
| TA05 | info | Low coverage area identified |
| TA06 | warning | Non-deterministic test |
| TA07 | error | Test with no assertions |

## Output

Generate `testing-report.md` in `.ai/reports/`:

```markdown
# Testing Audit Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- Packages Audited: {n}
- Overall Coverage: {percentage}
- Critical Paths Untested: {n}

## Coverage by Package
| Package | Coverage | Threshold | Status |
|---|---|---|---|
| @saptm/rpc | {n}% | 90% | PASS/FAIL |

## Missing Tests
1. {file}:{line} — {what's missing}

## Quality Issues
1. {issue}

## Recommendations
1. {recommendation}
```

## Success Criteria

- All coverage thresholds met
- All critical paths tested
- No skipped tests without justification
- Test quality standards met
