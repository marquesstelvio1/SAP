# Phase 7 — Observability Strategy

## Position

Every critical operation must be traceable across user action, API request, domain operation, database mutation, emitted event, and audit record.

Observability and auditability are related but not equivalent:

- Observability explains system behavior.
- Audit records prove sensitive business actions.

## Signals

| Signal | Purpose |
| --- | --- |
| Logs | Structured operational facts and errors |
| Traces | Request and operation flow across services |
| Metrics | Health, performance, throughput, and business indicators |
| Audit | Immutable sensitive action evidence |
| Alerts | Actionable conditions requiring human response |

## Correlation

Every critical operation must carry:

- `correlationId`
- `requestId`
- `tenantId`
- `actorType`
- `actorId`
- `operationName`
- `sourceSystem`
- `resourceType`
- `resourceId`

## Shared Package

`@saptm/observability` is the platform contract package for telemetry metadata.

It defines:

- `TraceContext` for request, tenant, actor, operation, resource, and trace correlation.
- `LogRecord` for structured logs with redaction of sensitive attributes.
- `MetricRecord` for counters, gauges, and histograms.
- `SpanRecord` for timed operation tracing.
- `AuditRecord` for security-sensitive business evidence.

Applications may choose different exporters, but they must emit records that conform to these contracts.

## API Instrumentation

`apps/api` registers `ObservabilityModule` before business modules.

The module provides:

- Request middleware for `TraceContext` creation and header propagation.
- Global interceptor for HTTP request duration, success/failure logging, metric naming, and span naming.
- Shared logger creation based on the same redaction and correlation contract used by `@saptm/observability`.

## Logging Taxonomy

| Level | Use |
| --- | --- |
| `debug` | Local diagnostics and low-risk internal details |
| `info` | Successful significant operations |
| `warn` | Recoverable risk, degraded external dependency, suspicious behavior |
| `error` | Failed operation requiring investigation |
| `critical` | Security, data integrity, or major operational impact |

## Metrics

### Platform Metrics

- API request count, latency, error rate.
- Auth success/failure rates.
- Database query latency.
- Queue/outbox backlog.
- Webhook delivery success/failure.
- CI and deployment status.

### Business Metrics

- Cargo registered per tenant.
- Shipments planned.
- Transport orders confirmed.
- Operational events ingested.
- Exceptions raised/resolved.
- Average dwell time.
- SLA breach rate.
- ETA accuracy.
- Report exports.
- AI recommendations generated/approved/rejected.

## Tracing

Trace spans must cover:

- Next.js request handling.
- oRPC client and server transport.
- NestJS guards, interceptors, and domain services.
- Prisma database calls.
- External integration calls.
- Outbox event publishing.

## Alerts

| Alert | Severity |
| --- | --- |
| Auth failure spike | High |
| Cross-tenant access attempt | Critical |
| API error rate above threshold | High |
| Event ingestion backlog | High |
| Outbox delivery failure | Medium |
| Database latency degradation | High |
| Critical exception unresolved beyond SLA | High |
| Audit write failure | Critical |
| AI recommendation service unavailable | Medium |

## Dashboards

| Dashboard | Audience |
| --- | --- |
| Platform Health | DevOps, platform operators |
| Auth and Security | Auth, security, audit |
| Operational Throughput | Operations managers |
| Exception Management | Operations controllers |
| Integration Health | DevOps, integration owners |
| Release Health | Engineering leadership |

## Acceptance Criteria

- Observability metadata is part of oRPC contract metadata.
- NestJS request lifecycle creates trace context.
- Critical mutations emit logs, metrics, traces, and audit records.
- Alerts are actionable and mapped to runbooks.
- Shared telemetry contracts compile through `@saptm/observability`.
- NestJS API requests pass through `ObservabilityModule` before domain handlers.
