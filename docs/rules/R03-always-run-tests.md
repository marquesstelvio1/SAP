# Rule R03: Always Run Tests Before Commit

**Purpose:** Prevent regressions and ensure code quality.

**Allowed:**
- Running `pnpm test` locally before commit
- CI running all tests on PR
- Adding tests for new/modified code

**Forbidden:**
- Merging code that breaks existing tests
- Disabling tests without justification
- Committing `test.only` or `test.skip` without reason
- Skipping test execution in CI

**Validation:**
- CI pipeline must include test execution
- PR checks must show all tests passing
- Coverage must meet minimum thresholds

**Failure Consequences:**
- PR blocked by CI
- Retroactive test requirement for merged code

**Severity:** error
