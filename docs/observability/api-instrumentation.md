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

## Runtime Contract

Every HTTP request receives:

- `x-correlation-id`
- `x-request-id`
- `x-operation-name`
- `x-source-system`
- `x-resource-type`
- `x-resource-id`

If inbound trace headers exist, they are propagated. If not, the API creates new identifiers.

## Exporter Boundary

The current implementation writes structured records through the shared console logger contract. OpenTelemetry exporters, metrics backends, alerting sinks, and audit persistence must be added at the application boundary without changing `@saptm/observability` record shapes.

## Adoption Rules

- New NestJS modules must not create ad-hoc correlation IDs.
- New oRPC handlers must use metadata from `@saptm/rpc`.
- Critical mutations must emit audit records in addition to operational telemetry.
- External integrations must propagate trace headers.
