# Release Runbook

## Flow

1. Validate AI OS structure.
2. Confirm task and PR evidence.
3. Generate changelog.
4. Run release gate checklist.
5. Deploy through approved pipeline.
6. Monitor telemetry and create stabilization tasks.

## Command

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Invoke-AIWorkflow.ps1 -Workflow release -ReleaseName release-candidate
```

