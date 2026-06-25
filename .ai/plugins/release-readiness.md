# Release Readiness Plugin

**ID:** `release-readiness`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 80
**Mandatory:** true
**Runs On:** pre-release
**Blocking:** true

## Mission

Execute final release readiness checklist. Aggregate results from all prior plugins and validate that the release is safe to deploy.

## Pre-Flight Checklist

### 1. Build Verification
- [ ] `pnpm build` passes
- [ ] Docker build passes
- [ ] No build warnings (critical)

### 2. Code Quality
- [ ] `pnpm lint` passes (zero errors)
- [ ] `pnpm typecheck` passes (zero errors)
- [ ] `biome` check passes
- [ ] No `any` types introduced
- [ ] No `@ts-ignore` comments

### 3. Test Verification
- [ ] `pnpm test` passes (all tests)
- [ ] Coverage thresholds met
- [ ] Playwright E2E tests pass
- [ ] No flaky tests identified

### 4. Security Verification
- [ ] Security audit plugin passed
- [ ] No critical CVEs in dependencies
- [ ] Secrets scanned (no secrets in code)
- [ ] CSRF protection confirmed

### 5. Architecture Verification
- [ ] Architecture audit passed
- [ ] Monorepo governance passed
- [ ] API contract validation passed
- [ ] Frontend-backend validation passed

### 6. Documentation
- [ ] CHANGELOG.md updated
- [ ] ADRs up-to-date
- [ ] API documentation current
- [ ] Architecture docs reflect changes

### 7. Infrastructure
- [ ] Docker images built and tagged
- [ ] Migration scripts tested
- [ ] Rollback plan defined
- [ ] Health checks verified

### 8. Observability
- [ ] Tracing configured
- [ ] Metrics dashboards updated
- [ ] Alerts configured for new endpoints
- [ ] Log levels appropriate

## Plugin Gate Summary

| Plugin | Status | Blocking |
|---|---|---|
| Architecture Audit | {pass/fail} | ✓ |
| Design System Audit | {pass/fail} | ✗ |
| API Contract Validator | {pass/fail} | ✓ |
| Frontend-Backend Validator | {pass/fail} | ✓ |
| Security Audit | {pass/fail} | ✓ |
| Performance Audit | {pass/fail} | ✗ |
| Testing Audit | {pass/fail} | ✓ |
| Accessibility Audit | {pass/fail} | ✗ |
| Enterprise Checklist | {pass/fail} | ✓ |
| Documentation Generator | {pass/fail} | ✗ |

## Release Decision

| Condition | Decision |
|---|---|
| All blocking plugins pass | ✅ RELEASE APPROVED |
| Any blocking plugin fails | ❌ RELEASE BLOCKED |
| Only non-blocking warnings | ⚠️ RELEASE WITH NOTES |

## Output

Generate `release-report.md` in `.ai/reports/`:

```markdown
# Release Readiness Report
**Date:** {date}
**Release Version:** {version}

## Decision: {APPROVED | BLOCKED}

## Summary
- Build: {pass/fail}
- Lint: {pass/fail}
- Typecheck: {pass/fail}
- Tests: {pass/fail}
- Security: {pass/fail}
- Architecture: {pass/fail}
- Documentation: {pass/fail}

## Gate Results
{gate-details}

## Blocking Issues (if any)
1. {issue} — {plugin}

## Warnings (if any)
1. {warning}

## Release Notes
{notes}
```

## Blocking Rules

- BLOCK release if any blocking plugin fails
- BLOCK release if build/test/lint/typecheck fails
- BLOCK release if security scan finds critical issues
- ALLOW release with non-blocking warnings (documented)

## Success Criteria

- All blocking gates pass
- Build, test, lint, typecheck all green
- Security scan clean
- Documentation current
- Release report generated
