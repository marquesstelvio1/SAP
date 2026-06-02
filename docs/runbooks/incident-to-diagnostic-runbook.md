# Incident To Diagnostic Runbook

## Flow

1. Capture incident symptoms and impact.
2. Create a diagnostic artifact.
3. Classify severity and domain.
4. Generate a task bundle from the diagnostic.
5. Add prevention tests and observability follow-up.
6. Publish stabilization report.

## Command

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\New-AIDiagnostic.ps1 -Domain observability -Title "error-rate-spike" -Severity high -Impact "Critical flow degradation" -Evidence "Incident report or telemetry link"
```

