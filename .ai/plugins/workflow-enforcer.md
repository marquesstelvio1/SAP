# Workflow Enforcer Plugin

**ID:** `workflow-enforcer`
**Version:** 1.0.0
**Kind:** system
**Execution Order:** 999
**Mandatory:** true
**Runs On:** always
**Blocking:** true

## Mission

Enforce the mandatory workflow pipeline. No implementation can skip stages. Ensure every feature follows the complete lifecycle from product design to release.

## Mandatory Workflow

```
1  Product Design      — docs/product/*       — BLOCKING
2  Architecture Audit   — architecture-report  — BLOCKING
3  Design System Audit  — design-system-report — NON-BLOCKING
4  Backend Implementation
5  Frontend Implementation
6  Testing Audit       — testing-report       — BLOCKING
7  Security Audit      — security-report      — BLOCKING
8  Performance Audit   — performance-report   — NON-BLOCKING
9  Documentation       — docs updated         — NON-BLOCKING
10 Release Readiness   — release-report       — BLOCKING
```

## Stage Requirements

### Pre-Implementation (Stages 1-3)

| Stage | Artifact | Required Before |
|---|---|---|
| Product Design | `docs/product/vision.md` | Any code |
| Architecture Audit | `architecture-report.md` | Implementation |
| Design System Audit | `design-system-report.md` | Frontend work |

### Implementation (Stages 4-5)

After stages 1-3 pass, implementation can proceed.

### Post-Implementation (Stages 6-10)

| Stage | Artifact | Required Before |
|---|---|---|
| Testing | `testing-report.md` | Security audit |
| Security | `security-report.md` | Release |
| Performance | `performance-report.md` | Release |
| Documentation | Updated docs | Release |
| Release Readiness | `release-report.md` | Release |

## Enforcement Rules

| Rule | Severity | Description |
|---|---|---|
| WE01 | critical | Implementation without product design |
| WE02 | critical | Frontend without design system audit |
| WE03 | error | Release without security audit |
| WE04 | error | Release without testing audit |
| WE05 | error | Release without release readiness |
| WE06 | warning | Skipping non-blocking stage |
| WE07 | critical | Implementation without architecture audit |

## Pipeline State

The enforcer maintains a pipeline state for each feature:

```json
{
  "feature": "feature-name",
  "stages": {
    "product-design": { "status": "pending|running|passed|failed|skipped", "artifact": "path" },
    "architecture-audit": { "status": "pending|...", "artifact": "path" },
    "design-system-audit": { "status": "pending|...", "artifact": "path" },
    "backend-implementation": { "status": "...", "artifact": "path" },
    "frontend-implementation": { "status": "...", "artifact": "path" },
    "testing-audit": { "status": "...", "artifact": "path" },
    "security-audit": { "status": "...", "artifact": "path" },
    "performance-audit": { "status": "...", "artifact": "path" },
    "documentation": { "status": "...", "artifact": "path" },
    "release-readiness": { "status": "...", "artifact": "path" }
  },
  "blocked": false,
  "blockedBy": ["stage-name"]
}
```

## Output

Generate `workflow-status.md` in `.ai/reports/`:

```markdown
# Workflow Enforcement Report
**Date:** {date}
**Feature:** {name}

## Pipeline Status: {BLOCKED | RUNNING | COMPLETED}

## Stage Status
| Stage | Status | Blocking |
|---|---|---|
| Product Design | ✅ PASS | ✓ |
| Architecture Audit | ✅ PASS | ✓ |
| Design System Audit | ✅ PASS | ✗ |
| Backend Implementation | ✅ DONE | — |
| Frontend Implementation | ✅ DONE | — |
| Testing Audit | ✅ PASS | ✓ |
| Security Audit | ❌ FAIL | ✓ |
| Performance Audit | ⏳ PENDING | ✗ |
| Documentation | ⏳ PENDING | ✗ |
| Release Readiness | ⏳ PENDING | ✓ |

## Blockers
1. Security Audit: Missing CSRF protection

## Violations
{any workflow step violations}
```

## Success Criteria

- All mandatory stages completed in order
- No workflow violations
- Pipeline status: COMPLETED
- Release readiness approved
