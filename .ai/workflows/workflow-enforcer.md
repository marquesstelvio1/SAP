# Workflow Enforcer Configuration

**ID:** `workflow-enforcer-config`
**Version:** 1.0.0

## Enforcement Rules

### Rule 1: No Stage Skipping

Every feature must pass ALL stages in the correct order.

```
product-design → architecture → design-system → backend → frontend → testing → security → performance → accessibility → documentation → release
```

No implementation may skip a preceding stage.

### Rule 2: Blocking Stages

If a blocking stage fails:
- Pipeline MUST halt
- Detailed failure report MUST be generated
- Corrections MUST be proposed
- Corrections MUST be applied
- Stage MUST be re-run
- Pipeline continues only after stage passes

### Rule 3: Non-Blocking Stages

If a non-blocking stage fails:
- Warning MUST be logged
- Issue MUST be added to release notes
- Pipeline MAY continue

### Rule 4: Re-validation on Changes

Any code change after a stage has passed MUST trigger re-validation:
- Architecture changes → re-run architecture audit
- Contract changes → re-run contract validator
- Security changes → re-run security audit
- Test changes → re-run testing audit

### Rule 5: Context Freshness

If the task spans multiple sessions:
- Context loader MUST run at start of each session
- Decision log MUST be read
- Pipeline state MUST be restored

## Violation Detection

| Trigger | Violation | Action |
|---|---|---|
| Code written before product design | WE01 | BLOCK, require product design |
| Frontend code before design audit | WE02 | BLOCK, require design audit |
| PR without security check | WE03 | BLOCK, require security audit |
| PR without tests | WE04 | BLOCK, require testing audit |
| Release without release readiness | WE05 | BLOCK, require release readiness |
| Non-blocking stage skipped | WE06 | WARNING, document in release notes |

## State Persistence

Pipeline state is stored in `.ai/reports/workflow-status.md`.

On session resume:
1. Read workflow-status.md
2. Identify current stage
3. Verify all previous stages passed
4. Continue from current stage

## Exceptions

Emergency hotfixes may bypass non-security stages with written justification:
1. Record in decision log
2. Auto-expire after 30 days
3. Full pipeline required for next release
