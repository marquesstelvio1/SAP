# Secrets Strategy

## Purpose

Secrets strategy defines the minimum environment-scoped secrets required to deploy SAPTM without
committing sensitive values.

## GitHub Environment Secrets

| Secret | Used By | Purpose |
| --- | --- | --- |
| `KUBE_CONFIG_B64` | Environment Deploy | Base64-encoded kubeconfig for the target cluster |
| `DATABASE_URL` | Environment Deploy | PostgreSQL URL used by Prisma migration deploy |

## Kubernetes Runtime Secret

Each target namespace must contain `saptm-runtime-secrets` before rollout:

| Key | Used By | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | API and Web | PostgreSQL runtime connection string |
| `BETTER_AUTH_SECRET` | API and Web | Better Auth signing/encryption secret |

## Kubernetes Observability Secret

The observability namespace must contain `saptm-observability-secrets` before Grafana rollout:

| Key | Used By | Purpose |
| --- | --- | --- |
| `GRAFANA_ADMIN_USER` | Grafana | Initial admin username |
| `GRAFANA_ADMIN_PASSWORD` | Grafana | Initial admin password |

Create or update the secret through the deployment platform, external secret operator, or a
sealed-secret process. Do not commit generated Secret manifests containing real values.

## External Secrets Operator

The production-preferred workflow uses External Secrets Operator to materialize Kubernetes secrets
from an enterprise secret manager. Example templates exist in
`deploy/kubernetes/external-secrets`.

Required production substitutions:

- Replace `https://vault.example.com` with the approved secret manager endpoint.
- Replace `saptm/<environment>/runtime` and `saptm/<environment>/observability` with real paths.
- Replace the example Vault auth role with the approved workload identity.
- Verify generated Kubernetes secrets before deployment.

## GitHub Environment Variables

| Variable | Purpose |
| --- | --- |
| `GHCR_IMAGE_NAMESPACE` | Optional lowercase image namespace override |
| `NEXT_PUBLIC_APP_URL` | Web image build-time app URL |
| `NEXT_PUBLIC_API_URL` | Web image build-time API URL |

## Rotation Rules

- Rotate `BETTER_AUTH_SECRET` only with a session invalidation plan.
- Rotate `DATABASE_URL` with database credential rollover and readiness monitoring.
- Rotate `GRAFANA_ADMIN_PASSWORD` after operator changes or suspected exposure.
- Rotate `KUBE_CONFIG_B64` after operator changes, cluster changes, or suspected exposure.
- Record every production secret rotation in the audit/change management trail.

## Acceptance Criteria

- Runtime secret names are stable across environments.
- Secrets are injected per environment.
- No real secret values are committed.
- Deployment workflow fails when kubeconfig is missing.
- Deployment workflow fails when `saptm-runtime-secrets` is missing.
- Observability workflow fails when Grafana credentials are missing.
