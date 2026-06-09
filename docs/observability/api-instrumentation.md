# API Observability Instrumentation

## Purpose

`apps/api` owns HTTP request telemetry for the NestJS runtime. This instrumentation exists before business modules so every future feature inherits correlation, logging, span, and metric conventions.

## Components

| Component | Responsibility |
| --- | --- |
| `ObservabilityModule` | Registers global middleware and interceptor |
| `ObservabilityMiddleware` | Creates `TraceContext`, attaches response headers, and request logger |
| `ObservabilityInterceptor` | Records request completion/failure telemetry around handlers |
| `ObservabilityService` | Builds vendor-neutral records using `@saptm/observability` |
| `MetricsController` | Exposes Prometheus text metrics through `/metrics` |
| `HealthModule` | Exposes liveness and readiness probes without business behavior |

## Runtime Contract

Every HTTP request receives:

- `x-correlation-id`
- `x-request-id`
- `x-operation-name`
- `x-source-system`
- `x-resource-type`
- `x-resource-id`

If inbound trace headers exist, they are propagated. If not, the API creates new identifiers.

## Health Probes

| Probe | Path | Use |
| --- | --- | --- |
| Liveness | `/health/live` | Confirms the API process is accepting requests |
| Readiness | `/health/ready` | Confirms environment validation and PostgreSQL connectivity |

Readiness returns HTTP `503` when a critical dependency is unavailable. Health payloads use
`RuntimeHealthReport` from `@saptm/types` so future monitoring, smoke tests, and deployment checks
share the same contract.

## Metrics Endpoint

`GET /metrics` returns Prometheus text format using the shared `@saptm/observability` registry.

Initial metrics:

- `http_server_duration_ms` histogram by route, method, status code, and status class.
- `authorization_decisions_total` counter by outcome, actor type, and permission mode.
- `rpc_authorization_decisions_total` counter by RPC operation metadata.
- `process_uptime_seconds` gauge.

Raw paths, tenant IDs, actor IDs, and resource IDs must not be used as Prometheus labels.

## Exporter Boundary

The implementation writes structured records through the shared console logger contract and exposes
Prometheus-compatible metrics through the API boundary. OpenTelemetry exporters, long-term metrics
backends, alerting sinks, and audit persistence must be added without changing `@saptm/observability`
record shapes.

## Adoption Rules

- New NestJS modules must not create ad-hoc correlation IDs.
- New oRPC handlers must use metadata from `@saptm/rpc`.
- Critical mutations must emit audit records in addition to operational telemetry.
- External integrations must propagate trace headers.
