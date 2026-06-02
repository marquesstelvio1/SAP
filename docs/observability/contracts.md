# Observability Contracts

## Purpose

`@saptm/observability` defines the telemetry contract used by applications and shared packages before any vendor-specific exporter is introduced.

## Required Context

Every critical operation must create or propagate `TraceContext`:

- `correlationId` links all work caused by one business interaction.
- `requestId` identifies one inbound request or command.
- `tenantId` scopes multi-tenant operations.
- `actorType` and `actorId` identify the initiator.
- `operationName` names the platform operation.
- `sourceSystem` identifies the producer.
- `resourceType` and `resourceId` identify the affected resource.
- `traceId`, `spanId`, and `parentSpanId` map to distributed tracing.

## Records

| Record | Use |
| --- | --- |
| `LogRecord` | Structured operational fact or error |
| `MetricRecord` | Counter, gauge, or histogram measurement |
| `SpanRecord` | Timed operation with status and span events |
| `AuditRecord` | Security-sensitive business evidence |

## Redaction

Telemetry attributes are redacted by key before records are emitted. Default redaction covers passwords, secrets, tokens, cookies, credentials, authorization headers, and API keys.

## Exporter Boundary

Applications may export records to OpenTelemetry, logs, metrics stores, SIEM, or audit storage. Exporters must not change the shared contract shape.

## Adoption Order

1. API request context middleware.
2. oRPC metadata propagation.
3. Better Auth session context enrichment.
4. Prisma mutation span and audit hooks.
5. External integration spans and metrics.
6. Alert rules mapped to runbooks.
