# Orchestrator Plugin

**ID:** `orchestrator`
**Version:** 1.0.0
**Kind:** system
**Execution Order:** 1
**Mandatory:** true
**Runs On:** task-start

## Mission

Orchestrate the entire plugin pipeline. Ensure all plugins execute in the correct order, block when necessary, and report results.

## Pipeline

```
0. Context Loader ──────────► Load all context
1. Product Design ──────────► Requirements & wireframes
2. Architecture Audit ──────► Validate architecture
3. Design System Audit ─────► Validate design system
4. Backend Implementation ──► Execute backend work
5. Frontend Implementation ─► Execute frontend work
6. Testing Audit ───────────► Validate tests
7. Security Audit ──────────► Validate security
8. Performance Audit ───────► Validate performance
9. Documentation Generator ─► Update docs
10. Release Readiness ──────► Final validation
```

## Plugin Execution Rules

| Rule | Description |
|---|---|
| Blocking plugins stop the pipeline on failure | If a blocking plugin fails, pipeline halts with report |
| Non-blocking plugins log warnings | Warnings are collected for release readiness |
| All critical failures block release | Release readiness checks all prior results |

## Output

```
Pipeline status: {stage, plugin, status, issues[]}
```

## Handling Failures

If a blocking plugin fails:

1. Generate detailed failure report
2. List all gaps found
3. Propose specific corrections
4. Wait for corrections to be applied
5. Re-run the failed plugin
6. Continue pipeline only after passing

## Success Criteria

- All plugins executed in order
- No blocking plugin failures
- Release readiness approved
