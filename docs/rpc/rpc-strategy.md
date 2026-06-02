# Phase 5 — RPC Strategy

## Position

oRPC is the contract-first API boundary between `apps/web` and `apps/api`. Contracts live in `@saptm/rpc`; implementations live in NestJS modules.

No frontend code may call backend implementation details directly.

## Contract Principles

- Contracts are typed and versioned.
- Contracts define input, output, errors, auth metadata, and audit classification.
- Mutations declare idempotency requirements.
- Sensitive operations declare permission and policy requirements.
- Contract changes require compatibility review.

## Contract Shape

Every endpoint must define:

| Field | Purpose |
| --- | --- |
| `name` | Stable operation name |
| `version` | Contract version |
| `input` | Validated request payload |
| `output` | Validated response payload |
| `errors` | Known error cases |
| `auth` | Authenticated, service, or public |
| `permissions` | Required permission families |
| `audit` | Audit classification |
| `idempotency` | Required for external mutations |
| `observability` | Span and metric names |

## Shared Metadata

`@saptm/rpc` exposes `RpcOperationMetadata` so every operation declares:

- Auth mode.
- Required permissions.
- Audit classification.
- Idempotency mode.
- Observability criticality, span name, metric name, and required telemetry signals.

Trace headers are serialized and parsed through `serializeRpcTraceHeaders` and `parseRpcTraceHeaders`, both backed by `@saptm/observability`.

## API Layers

```mermaid
flowchart LR
  Web["Next.js + TanStack Query"] --> Client["@saptm/rpc client"]
  Client --> Transport["oRPC transport"]
  Transport --> Server["NestJS oRPC adapter"]
  Server --> Guard["Auth + Policy Guards"]
  Guard --> Domain["Domain Service"]
  Domain --> Database["@saptm/database"]
```

## Error Model

| Error | Use |
| --- | --- |
| `UNAUTHENTICATED` | Missing or invalid session/service credential |
| `FORBIDDEN` | Authenticated but policy denied |
| `VALIDATION_ERROR` | Invalid request payload |
| `CONFLICT` | Version, state, or idempotency conflict |
| `NOT_FOUND` | Resource absent or hidden by scope |
| `RATE_LIMITED` | Tenant, service, or endpoint limit exceeded |
| `INTEGRATION_ERROR` | External system failure |
| `INTERNAL_ERROR` | Unexpected server failure |

## Versioning

- Additive changes may stay in the same version.
- Breaking changes require new contract version.
- Deprecated contracts must define removal milestone.
- Frontend must not depend on undocumented response fields.
- External integration contracts require stronger deprecation windows than internal web contracts.

## Security Rules

- No mutation contract without explicit `auth`.
- No operational mutation without `permissions`.
- No critical mutation without `audit`.
- No service endpoint without service scope.
- No external write without idempotency key.

## TanStack Query Integration

- Query keys derive from contract name and scoped input.
- Mutations invalidate explicitly declared query families.
- Optimistic updates are forbidden for critical operational state until conflict and rollback rules exist.
- Background refetch intervals must be justified for operational dashboards.

## Acceptance Criteria

- `@saptm/rpc` exists before frontend and backend business implementation.
- First feature consumes contracts from `@saptm/rpc`.
- API errors are typed and observable.
- Contract tests exist for each exposed operation.
