# Smoke Test Strategy

## Purpose

Smoke tests validate that a deployed SAPTM runtime is reachable, healthy, and scrapeable before
traffic cutover or release acceptance.

## Runtime Smoke Script

`scripts/smoke-runtime.mjs` validates:

| Check | Endpoint | Expected |
| --- | --- | --- |
| API liveness | `${SAPTM_API_URL}/health/live` | HTTP 200 and `status: ok` |
| API readiness | `${SAPTM_API_URL}/health/ready` | HTTP 200 and `status: ok` |
| API metrics | `${SAPTM_API_URL}/metrics` | HTTP 200 and `process_uptime_seconds` |
| Web health | `${SAPTM_WEB_URL}/api/health` | HTTP 200 and `status: ok` |

The script accepts either `SAPTM_API_URL`/`SAPTM_WEB_URL` or
`NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_APP_URL`.

## CI/CD Usage

The environment deployment workflow runs smoke checks after Kubernetes rollout status succeeds.
If smoke fails, the workflow captures rollout history and pod state for diagnostics.

## Local Usage

```bash
SAPTM_API_URL=http://localhost:4000 SAPTM_WEB_URL=http://localhost:3000 pnpm smoke:runtime
```

## Rules

- Smoke checks must not create business data.
- Smoke checks must not require product pages.
- Smoke checks must validate health, readiness, and metrics before release acceptance.
- Failed smoke checks block production cutover.
