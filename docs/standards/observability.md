# Standard: Observability

**Phase:** 4 — Engineering Standards

---

## Required

- OpenTelemetry SDK integration for all services
- Trace context propagation across service boundaries
- Correlation ID on every request
- Structured JSON logging
- Health check endpoints: `/health/live` (liveness), `/health/ready` (readiness)
- Metrics for request duration, error rate, and throughput

## Recommended

- Business metrics for domain operations (cargos registered, events recorded)
- Grafana dashboards for service health and business KPIs
- Alertmanager rules for SLI breaches
- Distributed tracing for all RPC operations
- Log level configurable via `LOG_LEVEL` env var
- Sentry for error tracking in frontend

## Forbidden

- `console.log` in production code — Use structured logger
- Logging sensitive data (passwords, tokens, PII)
- Sending session IDs to telemetry without consent
- Unbounded span attributes (may overflow)
- Missing correlation IDs in error responses

## Trace Context

```typescript
type TraceContext = {
  traceId: string;
  spanId: string;
  correlationId: string;
  requestId?: string;
  tenantId?: string;
  actorId?: string;
  actorType?: string;
};
```

## Metrics

| Metric | Description |
|---|---|
| `rpc.{operation}.duration_ms` | Operation execution time |
| `rpc.{operation}.error_count` | Operation error count |
| `rpc.total.requests` | Total request count |
| `db.query.duration_ms` | Database query duration |

## Logging Levels

| Level | Usage |
|---|---|
| `error` | Unhandled errors, system failures |
| `warn` | Recoverable errors, degraded behavior |
| `info` | Business events, state changes |
| `debug` | Detailed diagnostic information (dev only) |

## Validation

- All services export metrics endpoint
- Traces propagate correctly across services
- Logs are structured (JSON) and searchable
- Health checks return correct status
- Alert rules trigger on threshold breaches

## Migration

- When adding new service, include observability setup
- When upgrading OTEL SDK, verify trace propagation
- Add new business metrics with each domain feature
