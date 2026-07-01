# Incident To Diagnostic Runbook

## Flow

1. Capture incident symptoms and impact.
2. Create a diagnostic artifact.
3. Classify severity and domain.
4. Generate a task bundle from the diagnostic.
5. Add prevention tests and observability follow-up.
6. Publish stabilization report.

## Command

```bash
node ./scripts/new-ai-diagnostic.mjs --domain observability --title "error-rate-spike" --severity high --impact "Critical flow degradation" --evidence "Incident report or telemetry link"
```

