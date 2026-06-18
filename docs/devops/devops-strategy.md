# Phase 5 — DevOps Strategy

## Position

DevOps exists to make every change repeatable, testable, observable, and releasable. The first release target is a governed SaaS foundation, not a feature-complete product.

## Tooling

| Tool | Purpose |
| --- | --- |
| PNPM | Workspace dependency management |
| Turborepo | Task graph and build orchestration |
| Biome | Formatting and linting |
| tsup | Shared package bundling |
| dotenvx | Environment loading and secret-safe local execution |
| Changesets | Versioning and release notes |
| Playwright | End-to-end and smoke testing |
| GitHub Actions | CI, quality gates, release checks |

## Environments

| Environment | Purpose |
| --- | --- |
| Local | Developer iteration with `.env.example` guidance |
| CI | Install, lint, typecheck, test, build |
| Preview | Branch-level deployment and smoke testing |
| Staging | Release candidate validation |
| Production | Customer-facing SaaS runtime |

## CI Pipeline

1. Checkout.
2. Enable Corepack.
3. Install PNPM dependencies.
4. Run foundation validation.
5. Validate environment contract.
6. Validate migration coverage.
7. Validate container packaging contract.
8. Validate deployment manifests and environment contract.
9. Validate production input and URL rendering contracts.
10. Validate observability manifests, metrics endpoint, dashboards, and alerts.
11. Validate Alertmanager routing and incident receiver contracts.
12. Validate secret materialization and network policy contracts.
13. Validate supply chain security contracts.
14. Validate runtime resilience contracts.
15. Validate namespace resource governance contracts.
16. Validate cluster readiness and admission policy contracts.
17. Validate cluster baseline input contracts.
18. Validate release evidence contract.
19. Validate Prisma schema.
20. Generate Prisma client.
21. Run Biome checks.
22. Run typecheck.
23. Run unit/integration tests.
24. Run Playwright smoke tests.
25. Run package/app builds.
26. Generate and upload release evidence.

The CI build uses non-secret validation values for `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_APP_URL`. Production, staging,
and preview deployments must use environment-scoped secrets instead.

## Release Strategy

- Changesets tracks package and release metadata.
- Release branch requires architecture, security, test, observability, and docs gates.
- Production deployment requires rollback plan.
- Database migration release requires dry-run, backup, and expand-migrate-contract plan.
- Production database rollout uses `pnpm db:migrate:deploy`, never `pnpm db:migrate:dev`.
- Production data rollout requires current backup evidence and a restore plan.
- Runtime rollout must pass `/health/live` and `/health/ready` checks before receiving traffic.
- Production observability rollout must pass Prometheus target, alert routing, and Grafana dashboard checks.
- Production Alertmanager config must come from `saptm-alertmanager-config`, not a committed receiver URL.
- Production deployment must pass runtime smoke checks before release acceptance.
- Production ingress must present a valid TLS certificate and redirect HTTP to HTTPS.
- Production ingress hosts must be rendered from real GitHub environment URLs before apply.
- API and Web responses must include baseline HTTP security headers.
- Production rollout must validate generated runtime secrets before applying workloads.
- Production rollout must preserve Kubernetes NetworkPolicy ingress isolation.
- Production release requires vulnerability scan, SBOM/provenance, image signature, and signature verification evidence.
- Production app rollout must pass cluster preflight and admission policy checks.
- Production cluster baseline must render cert-manager issuer email from `SAPTM_ACME_EMAIL`.
- Production rollout must apply ResourceQuota and LimitRange budgets before workloads scale.
- Production release requires generated evidence plus target-cluster external evidence.
- Rollback uses `.github/workflows/environment-rollback.yml` and Kubernetes rollout history.
- Production image rollout must use immutable `sha-<commit>` GHCR tags.

## Secrets Strategy

- `.env` files are never committed.
- `.env.example` documents required variables.
- dotenvx loads local environment values.
- CI uses environment-scoped secrets.
- Service credentials rotate and are audited.

## Deployment Roadmap

| Stage | Deployment Shape |
| --- | --- |
| Foundation | Monorepo CI, runtime health, Docker packaging |
| MVP | Web + API + PostgreSQL + baseline observability |
| Scale | API replicas, read replicas, queue workers |
| Enterprise | Regional deployment, SSO roadmap, dedicated tenant options |

## Local Runtime

- `compose.yaml` provides PostgreSQL, API, Web, OTel Collector, Prometheus, Alertmanager, and Grafana.
- `pnpm infra:up` starts PostgreSQL for migration and readiness validation.
- `pnpm infra:stack` builds and starts Web, API, and PostgreSQL.
- `pnpm infra:down` stops local runtime dependencies.
- `pnpm validate:env` verifies `.env.example` against the shared runtime schemas.
- `pnpm validate:containers` verifies Dockerfiles, Compose, and Container CI contracts.
- `pnpm validate:deploy` verifies Kubernetes overlays, deploy workflow, and secrets docs.
- `pnpm validate:production-inputs` verifies production URL rendering and placeholder rejection.
- `pnpm validate:observability` verifies metrics, Prometheus, Alertmanager, Grafana, and OTel Collector contracts.
- `pnpm validate:alert-routing` verifies Alertmanager Secret-based incident routing contracts.
- `pnpm validate:secrets-network` verifies external secret templates and NetworkPolicy contracts.
- `pnpm validate:supply-chain` verifies image scanning, signing, provenance, and SBOM contracts.
- `pnpm validate:resource-governance` verifies namespace ResourceQuota and LimitRange contracts.
- `pnpm validate:cluster` verifies cluster preflight, baseline, and admission policy contracts.
- `pnpm validate:cluster-baseline-inputs` verifies ACME email rendering before issuer apply.
- `pnpm validate:evidence` verifies release evidence generation and artifact contracts.
- `pnpm smoke:runtime` verifies deployed health and metrics endpoints when runtime URLs are provided.

## Acceptance Criteria

- Root workspace scripts exist.
- CI workflow exists.
- CI runs foundation, database, lint, typecheck, test, e2e, and build gates.
- Container CI builds API and Web images and publishes only outside pull requests.
- Observability deploy workflow applies the runtime monitoring stack.
- Alertmanager routing is secret-managed and validated before observability rollout.
- Rollback workflow exists for API and Web deployments.
- Deploy workflow rejects placeholder or non-HTTPS runtime URLs.
- Runtime secret preflight exists for application and observability deployments.
- NetworkPolicy constrains API and Web ingress.
- Container CI scans, signs, and verifies published image digests.
- Cluster baseline and deploy workflows run preflight checks.
- Cluster baseline workflow rejects placeholder ACME email values.
- Admission policies block unsafe SAPTM deployments.
- ResourceQuota and LimitRange budgets exist for application and observability namespaces.
- Platform CI generates and uploads release evidence.
- Environment variable contract exists.
- Release governance and rollback expectations are documented.
