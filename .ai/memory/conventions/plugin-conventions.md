# Convention: Plugin Execution

**Domain:** plugin-system
**Approved:** 2026-06-23
**Enforced By:** workflow-enforcer

## Rule
All plugins must execute in their defined order. Blocking plugins halt the pipeline on failure.

## Rationale
Ensures product design happens before architecture, architecture before implementation, and security before release.

## Example
```
context-loader (order 0) → product-design (10) → architecture-audit (20) → ... → workflow-enforcer (999)
```

## Enforcement
Workflow enforcer plugin checks pipeline state at end of every task.

---

# Convention: Report Generation

**Domain:** plugin-system
**Approved:** 2026-06-23
**Enforced By:** all plugins

## Rule
Every plugin must generate a report in `.ai/reports/` with PASS/FAIL/WARNING status.

## Rationale
Reports provide audit trail and evidence for release readiness decisions.

## Example
```markdown
# Security Audit Report
**Date:** 2026-06-23
**Status:** PASS
```

## Enforcement
Release readiness plugin checks for existence of all required reports before approving release.
