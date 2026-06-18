# Runtime Readiness

## Purpose

Runtime readiness defines the minimum deployable API behavior before any business feature is
implemented. The goal is to make the platform observable, fail-fast, and safe to run in local,
CI, preview, staging, and production environments.

## Bootstrap Rules

- The API validates `@saptm/config` server environment schema before listening.
- Invalid environment variables must fail startup, not produce partial runtime behavior.
- CORS origins come from `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, and `API_CORS_ORIGINS`.
- Shutdown hooks are enabled so orchestrators can terminate the API cleanly.

## Health Probes

| Probe | Path | Expected Success | Failure Behavior |
| --- | --- | --- | --- |
| Liveness | `/health/live` | Process can serve HTTP | Container/process restart |
| API readiness | `/health/ready` | Environment and PostgreSQL are ready | Remove API instance from traffic |
| Web readiness | `/api/health` | Web runtime environment is valid | Remove Web instance from traffic |
| API metrics | `/metrics` | Prometheus can scrape runtime metrics | Block observability-dependent cutover |

Readiness is intentionally dependency-aware. It must fail when PostgreSQL is unavailable because
future business modules depend on the database for tenancy, RBAC, audit, and operational state.

## Local Dependency Runtime

Start the full local stack:

```bash
pnpm infra:stack
```

Start only PostgreSQL when validating migrations in isolation:

```bash
pnpm infra:up
```

Apply migrations:

```bash
pnpm db:migrate:deploy
```

Check readiness:

```bash
curl http://localhost:4000/health/ready
```

Check metrics:

```bash
curl http://localhost:4000/metrics
```

Check foundation oRPC transport:

```bash
curl http://localhost:4000/rpc/system/health
```

Run the local readiness gate:

```bash
pnpm validate:local-readiness
```

Validate Docker Desktop, Compose, Buildx, and `compose.yaml` before container smoke:

```bash
pnpm validate:docker-runtime
```

Run browser-level runtime health:

```bash
pnpm test:e2e
```

Run local API+Web runtime smoke against PostgreSQL:

```bash
pnpm smoke:local-runtime
```

The runtime health E2E starts the local web runtime inside the test and terminates the process tree
after the assertion, including on Windows.

Stop local dependencies:

```bash
pnpm infra:down
```

## Local Closure Evidence

As of 2026-06-03, local runtime closure is accepted for the foundation baseline.

- API runs on `http://localhost:4000`.
- Web runs on `http://localhost:3000`.
- PostgreSQL uses host port `25432`.
- Redis uses host port `26379`.
- API, Web, PostgreSQL, and Redis containers report healthy in Docker Compose.
- Local smoke validates `/health/live`, `/health/ready`, `/metrics`, and `/api/health`.
- E2E validates web health, sign-in rendering, protected `/app`, and protected `/app/tracking` redirect behavior.

Final local gate set:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm validate:tracking-foundation
pnpm validate:local-readiness
pnpm validate:docker-runtime
pnpm validate:local-production
pnpm smoke:local-runtime
pnpm test:e2e
```

## Production Rules

- Deploy migrations before routing traffic to a new API version.
- Only route traffic after `/health/live` and `/health/ready` return HTTP `200`.
- Only accept production monitoring after `/metrics` is scrapeable by Prometheus.
- Treat readiness HTTP `503` as a deployment blocker.
- Do not expose secrets or raw connection errors in health payloads.
- Add external monitors for liveness, readiness, latency, error rate, and migration drift.
- Verify runtime secrets exist before rollout rather than waiting for pods to fail.
- Verify NetworkPolicy still allows ingress, metrics, and required app-to-app communication.
- Verify HPA and PDB status before production cutover.
- Verify ResourceQuota and LimitRange status before production cutover.

## Acceptance Criteria

- Health endpoints exist before any business endpoint.
- Readiness checks critical dependencies, not only process uptime.
- Environment validation is available as a CI gate.
- Local PostgreSQL runtime is reproducible through `compose.yaml`.
- API and Web container healthchecks map to application health endpoints.
- API exposes Prometheus-compatible metrics before business endpoints.
- API exposes foundation oRPC health before business endpoints.
- E2E runtime health test exists and cannot pass with an empty suite.
- Local readiness gate verifies Compose, oRPC, Playwright, and no premature product page.
- Kubernetes deployment preflights required runtime secrets.
- Kubernetes NetworkPolicy is present before business endpoints.
- Kubernetes HPA and PDB are present before business endpoints.
- Kubernetes ResourceQuota and LimitRange are present before business endpoints.
