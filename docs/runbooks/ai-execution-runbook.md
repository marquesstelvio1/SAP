# AI Execution Runbook

## Routine

1. Read `diagnóstico.md`.
2. Run `scripts/test-aios.mjs`.
3. Create or select a diagnostic.
4. Generate task bundle.
5. Generate test plan, docs pack, PR draft, commit draft, and changelog.
6. Review governance gates.
7. Sync approved artifacts to GitHub, Jira, or Linear.

## Local commands

```bash
node ./scripts/test-aios.mjs
node ./scripts/invoke-ai-workflow.mjs --workflow delivery --domain frontend --task-id FIN-001 --feature ai-bootstrap
```

## Required human review

- auth changes
- API contract changes
- infrastructure permission changes
- critical or high release risk

