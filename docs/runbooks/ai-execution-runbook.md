# AI Execution Runbook

## Routine

1. Read `diagnóstico.md`.
2. Run `scripts/Test-AIOS.ps1`.
3. Create or select a diagnostic.
4. Generate task bundle.
5. Generate test plan, docs pack, PR draft, commit draft, and changelog.
6. Review governance gates.
7. Sync approved artifacts to GitHub, Jira, or Linear.

## Local commands

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-AIOS.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\Invoke-AIWorkflow.ps1 -Workflow delivery -Domain frontend -TaskId FIN-001 -Feature ai-bootstrap
```

## Required human review

- auth changes
- API contract changes
- infrastructure permission changes
- critical or high release risk

