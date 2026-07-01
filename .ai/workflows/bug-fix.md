# Bug Fix Workflow

**ID:** `bug-fix`
**Version:** 1.0.0
**Trigger:** bug-report

## Pipeline Stages

### Stage 0: Context Load
**Plugin:** context-loader

### Stage 1: Verify Bug
- [ ] Write regression test that reproduces the bug
- [ ] Confirm test fails (proving the bug exists)

### Stage 2: Implement Fix
- [ ] Apply minimal fix to resolve the bug
- [ ] Confirm regression test passes
- [ ] Ensure no existing tests break

### Stage 3: Testing Audit
**Plugin:** testing-audit
- [ ] All tests pass
- [ ] Coverage thresholds met

### Stage 4: Architecture Audit
**Plugin:** architecture-audit
**Reduced scope:** Only check affected files/modules
- [ ] No architecture violations in fix

### Stage 5: Security Audit
**Plugin:** security-audit
**Reduced scope:** Only check fix for security implications

### Stage 6: Documentation
- [ ] CHANGELOG.md updated
- [ ] Bug fix documented

## Exit Criteria

- [x] Regression test written
- [x] Bug confirmed fixed (test passes)
- [x] All existing tests pass
- [x] Fix is minimal (no scope creep)
- [x] CHANGELOG updated
