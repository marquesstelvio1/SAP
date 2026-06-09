# Production Cutover Handoff

## Purpose

Production cutover handoff defines the remaining non-local work required to promote SAPTM from the
closed local baseline to a real staging or production environment.

The application code, local gates, business modules, security model, E2E coverage, and deployment
manifests are prepared locally. The items below require environment-owned infrastructure,
credentials, domains, or third-party systems.

## Environment Owner Inputs

| Input | Owner | Evidence Required |
| --- | --- | --- |
| `GHCR_IMAGE_NAMESPACE` | Platform / GitHub admin | Approved GHCR namespace for API and Web images |
| `NEXT_PUBLIC_APP_URL` | DNS / platform owner | Real HTTPS Web URL, no placeholder host |
| `NEXT_PUBLIC_API_URL` | DNS / platform owner | Real HTTPS API URL, no placeholder host |
| `SAPTM_ACME_EMAIL` | Platform owner | Real certificate registration email |
| `KUBE_CONFIG_B64` | Cluster owner | Environment-scoped kubeconfig secret |
| `DATABASE_URL` | Database owner | Managed PostgreSQL connection secret |
| `BETTER_AUTH_SECRET` | Security owner | Production-grade Better Auth secret |
| `REDIS_URL` | Platform owner | Managed Redis connection secret when async workers are enabled |
| Observability secrets | SRE owner | Alertmanager, Grafana, OTEL, and storage credentials |

## Handoff Evidence Matrix

| Area | Local Artifact | External Evidence |
| --- | --- | --- |
| Registry Evidence | `.github/workflows/container-ci.yml`, `docs/devops/container-registry.md` | API/Web `sha-<commit>` images pushed, SBOM/provenance available, Trivy reports clean, Cosign signatures verified |
| Secrets Evidence | `docs/devops/external-secrets-strategy.md`, `deploy/kubernetes/external-secrets` | Secret provider path, rotation owner, generated `saptm-runtime-secrets`, and no repository placeholders |
| Cluster Evidence | `.github/workflows/cluster-baseline.yml`, `deploy/kubernetes/cluster`, `scripts/cluster-preflight.mjs` | Cluster preflight output, cert-manager issuers, admission policies, namespaces, quotas, HPAs, and PDBs |
| DNS/TLS Evidence | `docs/devops/tls-ingress-strategy.md`, `deploy/kubernetes/overlays/*/ingress-patch.yaml` | DNS records, certificate readiness, HTTPS redirect, and public smoke URLs |
| Observability Evidence | `deploy/kubernetes/observability`, `docs/observability/alert-routing.md` | Prometheus targets, Grafana dashboard, OTEL pipeline, alert route, and test alert delivery |
| Backup/DR Evidence | `docs/devops/disaster-recovery-strategy.md`, `deploy/kubernetes/base/database-backup-cronjob.yaml` | Latest backup, staging restore drill, migration status, and RPO/RTO record |
| Security/Load Evidence | `docs/security/network-policy.md`, `docs/security/admission-control.md` | NetworkPolicy/admission enforcement, security scan, load test, HPA behavior, and rollback proof |

## Cutover Sequence

1. Run local gates: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`.
2. Run local release validations: `pnpm validate:local-readiness`, `pnpm validate:evidence`,
   `pnpm validate:deploy`, `pnpm validate:production-inputs`, and
   `pnpm validate:production-handoff`.
3. Run Container CI and record immutable API/Web `sha-<commit>` tags.
4. Configure environment variables, managed secrets, External Secrets, and kubeconfig.
5. Apply cluster baseline and capture cluster preflight evidence.
6. Render environment overlays with real HTTPS URLs.
7. Apply migrations through the release workflow or migration runbook.
8. Deploy the immutable image tags to staging.
9. Run `scripts/smoke-runtime.mjs` against staging URLs.
10. Verify TLS, observability, backup, alert routing, and security controls.
11. Promote the same immutable image tags to production after staging acceptance.
12. Monitor stabilization telemetry and record follow-up tasks.

## No-Go Conditions

- Missing immutable API or Web image tag.
- Placeholder or HTTP `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_API_URL`.
- Missing `saptm-runtime-secrets` or unresolved External Secrets.
- Failed `/health/live`, `/health/ready`, `/api/health`, or `/metrics`.
- Missing TLS certificate readiness.
- Missing latest backup evidence before migrations.
- Missing alert route ownership or failed test alert.
- Failed admission, NetworkPolicy, HPA, PDB, ResourceQuota, or LimitRange checks.
- Failed security scan, load test, or rollback verification.

## Acceptance Criteria

- Repository contains the full local cutover handoff package.
- Production-only dependencies are explicit and owner-assigned.
- Every external blocker maps to a local artifact and required evidence.
- Release runbook references the handoff gate before deployment.
- The handoff gate is executable with `pnpm validate:production-handoff`.
