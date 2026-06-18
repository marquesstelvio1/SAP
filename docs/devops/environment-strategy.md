# Environment Strategy

## Purpose

Environment strategy defines how SAPTM is promoted from staging to production using the same
container images, database migration process, runtime health contract, and observability baseline.

## Environments

| Environment | Namespace | Purpose |
| --- | --- | --- |
| Staging | `saptm-staging` | Release candidate validation with production-like runtime |
| Production | `saptm-production` | Customer-facing SaaS runtime |

## Deployment Workflow

Deployments are initiated manually through `.github/workflows/environment-deploy.yml`.
Observability stack deployment is initiated manually through `.github/workflows/observability-deploy.yml`
and must be completed before production release gates rely on metrics or alerts.

Required inputs:

- `environment`: `staging` or `production`.
- `api_image_tag`: immutable API tag, for example `sha-abc123`.
- `web_image_tag`: immutable Web tag, for example `sha-abc123`.
- `run_migrations`: whether to run `pnpm db:migrate:deploy` before applying manifests.

Required GitHub environment variables:

- `NEXT_PUBLIC_APP_URL`: HTTPS Web URL used for ingress, CORS, Better Auth, and smoke checks.
- `NEXT_PUBLIC_API_URL`: HTTPS API URL used for ingress and smoke checks.
- `GHCR_IMAGE_NAMESPACE`: GHCR image namespace used by the deploy workflow.

## Promotion Rules

1. Platform CI passes.
2. Container CI publishes API and Web `sha-<commit>` tags.
3. Staging deploys both images from the same commit.
4. Staging readiness and smoke checks pass.
5. Staging Prometheus scrape and Grafana runtime dashboard are validated.
6. Production deploys the same image tags.
7. Production rollout waits for API and Web deployment health.
8. Production backup evidence is confirmed before migrations.
9. Production smoke checks validate health and metrics endpoints.
10. Production DNS and rendered ingress hosts are validated.
11. Production TLS certificate and HTTPS redirect are validated.
12. Production runtime secrets and network policy evidence are validated.
13. Production HPA, PDB, and capacity evidence are validated.
14. Production ResourceQuota and LimitRange evidence are validated.
15. Production cluster preflight and admission policy evidence are validated.
16. Production Prometheus scrape and baseline alert rules are validated.

## Kubernetes Shape

| Path | Purpose |
| --- | --- |
| `deploy/kubernetes/base` | Shared API, Web, services, ingress, and runtime config |
| `deploy/kubernetes/overlays/staging` | Staging namespace, hosts, and replica counts |
| `deploy/kubernetes/overlays/production` | Production namespace, hosts, and replica counts |
| `deploy/kubernetes/cluster` | Cluster-level certificate issuers |
| `deploy/kubernetes/external-secrets` | External Secrets Operator provider and secret templates |
| `deploy/kubernetes/networking` | Restricted egress NetworkPolicy template |
| `deploy/kubernetes/observability` | OTel Collector, Prometheus, Alertmanager, and Grafana |

## Acceptance Criteria

- Staging and production use explicit namespaces.
- Production deploys immutable image tags only.
- Migrations run before application rollout when enabled.
- Rollout waits for Kubernetes readiness before completion.
- Rollout runs smoke checks before completion.
- Backup CronJob is deployed per application namespace.
- TLS is enabled per environment ingress.
- Ingress and runtime URLs are rendered from environment variables before apply.
- Runtime secrets are injected by environment, not committed.
- Runtime secrets are validated before application rollout.
- API and Web ingress is constrained by NetworkPolicy.
- Production API and Web use HPA and PDB controls.
- Application and observability namespaces enforce ResourceQuota and LimitRange controls.
- Cluster baseline workflow applies issuers and admission policies before app rollout.
- Observability stack has a separate rollout workflow and required Grafana secret.
