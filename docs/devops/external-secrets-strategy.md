# External Secrets Strategy

## Purpose

SAPTM must never commit Kubernetes `Secret` manifests with real values. Runtime secrets are
materialized in each namespace by an external secret workflow before application rollout.

## Production Pattern

The preferred production pattern is:

1. Store secrets in an enterprise secret manager such as Vault or a cloud-native equivalent.
2. Install External Secrets Operator in the target cluster.
3. Configure a `ClusterSecretStore` with workload identity or Kubernetes auth.
4. Apply one `ExternalSecret` per environment namespace.
5. Verify the generated Kubernetes secret before deployment.

Example templates live in `deploy/kubernetes/external-secrets`.

## Runtime Secrets

| Kubernetes Secret | Namespace | Required Keys |
| --- | --- | --- |
| `saptm-runtime-secrets` | `saptm-staging`, `saptm-production` | `DATABASE_URL`, `BETTER_AUTH_SECRET` |
| `saptm-observability-secrets` | `saptm-observability` | `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD` |
| `saptm-alertmanager-config` | `saptm-observability` | `alertmanager.yml` rendered from `INCIDENT_WEBHOOK_URL` |

## Deployment Contract

- The environment deploy workflow checks `saptm-runtime-secrets` before applying manifests.
- The observability deploy workflow checks `saptm-observability-secrets` before rollout.
- The observability deploy workflow checks `saptm-alertmanager-config` before rollout.
- The workflows fail fast when required secrets are missing.
- External secret templates are examples until a real provider, path, and auth role are selected.

## Rotation Rules

- Rotate `BETTER_AUTH_SECRET` only with session invalidation and rollback planning.
- Rotate `DATABASE_URL` with database credential rollover and readiness monitoring.
- Rotate Grafana credentials after operator changes or suspected exposure.
- Rotate `INCIDENT_WEBHOOK_URL` through the secret manager and verify Alertmanager reload/rollout.
- Record every production rotation in the audit/change trail.

## Acceptance Criteria

- No real secret values are committed.
- Runtime secret names remain stable across environments.
- Deploy workflow validates runtime secret existence before rollout.
- Observability workflow validates Grafana secret existence before rollout.
- Observability workflow validates Alertmanager config secret existence before rollout.
- External secret provider, path, auth method, and rotation owner are documented before production.
