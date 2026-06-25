# Release Governance Workflow

**ID:** `release-governance`
**Version:** 1.0.0
**Trigger:** release-candidate

## Pipeline Stages

### Stage 0: Context Load
**Plugin:** context-loader

### Stage 1: Aggregate Plugin Results

Collect results from all plugins that ran during feature delivery:

- [ ] Architecture Audit — `architecture-report.md`
- [ ] Design System Audit — `design-system-report.md`
- [ ] shadcn Inspector — `shadcn-report.md`
- [ ] API Contract Validator — `contract-report.md`
- [ ] Frontend-Backend Validator — `integration-report.md`
- [ ] Testing Audit — `testing-report.md`
- [ ] Security Audit — `security-report.md`
- [ ] Performance Audit — `performance-report.md`
- [ ] Accessibility Audit — `accessibility-report.md`
- [ ] Enterprise Checklist — `enterprise-report.md`

### Stage 2: Documentation Update
**Plugin:** documentation-generator
- [ ] CHANGELOG.md updated
- [ ] ADRs updated
- [ ] Architecture docs updated

### Stage 3: Release Readiness
**Plugin:** release-readiness
- [ ] Build passes
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] All blocking plugins passed
- [ ] Non-blocking warnings documented

### Stage 4: Rollback Validation
- [ ] Rollback plan documented
- [ ] Database migration reversible
- [ ] Feature flag to disable if needed

### Stage 5: Release Approval
**Decision matrix:**

| Condition | Action |
|---|---|
| All blocking gates pass | ✅ APPROVED |
| Critical security issue | ❌ BLOCKED |
| Build/lint/typecheck fail | ❌ BLOCKED |
| Tests fail | ❌ BLOCKED |
| Non-blocking warnings only | ⚠️ APPROVED WITH NOTES |

## Output

Generate `release-report.md` in `.ai/reports/`:

```markdown
# Release Governance Report
**Version:** {version}
**Date:** {date}

## Decision: {APPROVED | BLOCKED}

## Gate Summary
| Gate | Status | Details |
|---|---|---|
| Build | ✅ | {details} |
| Lint | ✅ | {details} |
| Typecheck | ✅ | {details} |
| Tests | ✅ | {details} |
| Security | ✅ | {details} |
| Architecture | ✅ | {details} |
| Documentation | ✅ | {details} |
| Rollback Plan | ✅ | {details} |

## Component Versions
| Package | Version |
|---|---|
| @saptm/web | x.y.z |
| @saptm/api | x.y.z |
| @saptm/rpc | x.y.z |
| ...

## Rollback Plan
{rollback-instructions}

## Sign-off
Required approvals: Architect, Security, QA
```

## Exit Criteria

- [x] Release approved or blocked with clear reason
- [x] All plugin reports reviewed
- [x] Rollback plan validated
- [x] Release report generated
