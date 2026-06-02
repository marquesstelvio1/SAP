# Flow: Diagnostic To Roadmap

## Input

- diagnostics from `docs/diagnostics/`
- architectural decisions
- production incidents
- telemetry trends

## Flow

1. Consolidate findings by domain.
2. Tag each finding by severity, business impact, and urgency.
3. Convert high-confidence findings into epics.
4. Split epics into features, tasks, and subtasks.
5. Route ownership to the correct execution agent.
6. Add governance gates before implementation.
7. Register outputs in `.ai/tasks/` and roadmap docs.

## Output

- prioritized backlog
- agent assignments
- dependency graph
- stabilization queue

## Automation

Use the diagnostic workflow when a finding should become executable work:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Invoke-AIWorkflow.ps1 -Workflow diagnostic -Domain backend -TaskId FIN-API-001 -Feature "contract-versioning-policy" -Priority high
```
