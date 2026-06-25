# SAPTM Enterprise Logistics Platform

Foundation-first enterprise SaaS platform for rail, port, logistics, cargo tracking, operational analytics, automation, and AI-assisted logistics decisions.

The current repository state is foundation-first with the first controlled business module active:

- No generic CRUDs.
- Operational Tracking exists as the first governed business feature.
- Tracking writes are command-based, idempotent, permissioned, audited, and outbox-backed.
- Architecture, governance, monorepo design, security, observability, roadmap, and tooling remain mandatory gates before feature expansion.

Start with `docs/enterprise/foundation-index.md`.

## AI Engineering OS

This repository now contains a modular AI-assisted engineering operating system for enterprise delivery.

The operating model is:

1. Diagnose the system.
2. Convert findings into roadmap, epics, features, tasks, and subtasks.
3. Execute work through guarded agents, rules, and pipelines.
4. Generate commits, PRs, tests, docs, changelog, and reports automatically.
5. Stabilize continuously through governance and observability.

## Structure

- `diagnóstico.md`: bootstrap diagnostic entrypoint.
- `docs/`: human-readable operating model.
- `.ai/`: machine-readable context, templates, automations, prompts, and execution memory.
- `workflows/`: workflow descriptors.
- `scripts/`: local automation entrypoints.
- `.github/workflows/`: CI/CD and GitHub automation pipelines.
- `github/`, `jira/`, `linear/`: integration-specific operating guides and payload templates.

## Startup Order

1. Read `diagnóstico.md`.
2. Validate `docs/rules/` and `docs/standards/`.
3. Load `.ai/operating-system.json`.
4. Run the appropriate workflow from `workflows/`.
5. Execute scripts from `scripts/`.
6. Review governance gates in `docs/governance/`.

## Core Commands

Seed local admin for authenticated testing:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:25432/saptm"; pnpm auth:seed-local-admin
```

Default local credentials:

- Email: `admin@saptm.local`
- Password: `LocalAdmin!2026`

Override with `SAPTM_LOCAL_ADMIN_EMAIL`, `SAPTM_LOCAL_ADMIN_PASSWORD`, `SAPTM_LOCAL_ORGANIZATION_NAME`, and `SAPTM_LOCAL_ORGANIZATION_SLUG`.

Validate the operating system:

```bash
node ./scripts/test-aios.mjs
```

Create a diagnostic and task bundle:

```bash
node ./scripts/invoke-ai-workflow.mjs --workflow diagnostic --domain frontend --task-id FIN-001 --feature "checkout-loading-states" --priority high
```

Generate delivery artifacts for a task:

```bash
node ./scripts/invoke-ai-workflow.mjs --workflow delivery --domain frontend --task-id FIN-001 --feature "checkout-loading-states"
```

Generate release artifacts:

```bash
node ./scripts/invoke-ai-workflow.mjs --workflow release --release-name release-candidate
```

## Delivery Principles

- AI never starts from raw coding alone.
- Every execution must have context, scope, rules, and done criteria.
- Every change must generate technical memory.
- Every domain must be observable, testable, and traceable.
