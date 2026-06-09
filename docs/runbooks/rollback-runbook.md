# Rollback Runbook

## Purpose

This runbook defines how to roll back SAPTM API and Web deployments without changing business data
or introducing unreviewed hotfixes.

## Preconditions

- `KUBE_CONFIG_B64` exists in the GitHub environment.
- Rollout history exists for `saptm-api` and `saptm-web`.
- Database rollback impact is understood before rolling back an API version after migrations.

## Workflow

Use `.github/workflows/environment-rollback.yml`.

Inputs:

| Input | Value |
| --- | --- |
| `environment` | `staging` or `production` |
| `component` | `both`, `api`, or `web` |
| `target_revision` | Optional Kubernetes rollout revision |

If `target_revision` is empty, Kubernetes rolls back to the previous revision.

## Manual Commands

```bash
kubectl rollout history deployment/saptm-api -n saptm-production
kubectl rollout undo deployment/saptm-api -n saptm-production
kubectl rollout status deployment/saptm-api -n saptm-production --timeout=180s
```

## Post-Rollback Checks

1. Run `scripts/smoke-runtime.mjs` against the target environment.
2. Confirm `/health/live`, `/health/ready`, `/metrics`, and `/api/health`.
3. Confirm Prometheus target is up.
4. Confirm no new critical alerts are firing.
5. Record rollback reason, target revision, and residual risks.

## Rules

- Do not roll back database migrations without a specific migration rollback plan.
- Do not roll back to mutable image tags.
- Do not close the incident until smoke checks and observability checks pass.
