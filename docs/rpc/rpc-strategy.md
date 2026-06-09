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

- Operation kind.
- Auth mode.
- Required permissions.
- Permission evaluation mode.
- Optional organization scope.
- Audit classification.
- Idempotency mode.
- Observability criticality, span name, metric name, and required telemetry signals.

Trace headers are serialized and parsed through `serializeRpcTraceHeaders` and `parseRpcTraceHeaders`, both backed by `@saptm/observability`.

RPC contracts must be created through `defineRpcContract`. This applies metadata validation before input/output schemas are attached.

## Authorization Boundary

`apps/api` exposes `RpcContextService` as the mandatory boundary for future oRPC handlers.

- Handlers pass the request and `RpcOperationMetadata` to `authorizeRequest`.
- The service rejects auth resolution errors with `401`.
- Protected operations without auth context fail with `401`.
- RBAC or ABAC denial fails with `403`.
- Allowed protected calls emit `rpc.authorization.evaluate` audit records.
- Public calls are allowed only when metadata has no permissions or tenant scope.

Full rules are defined in `docs/rpc/rpc-authorization.md`.

## Foundation Transport

The first executable oRPC transport is intentionally non-business:

| Operation | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `system.health` | `/rpc/system/health` | public | Prove oRPC routing, output validation, metadata, and API middleware wiring before product contracts |

Rules:

- Foundation transport may expose only system/runtime operations.
- Business contracts must not be added until foundation gates are accepted.
- `@saptm/rpc` owns the public metadata and output schema.
- `apps/api` owns the executable oRPC router and handler implementation.
- Future protected handlers must pass operation metadata through `RpcContextService`.
- Contract tests must cover every exposed oRPC operation before release.

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
- `@saptm/rpc` exposes metadata, authorization, error, trace, and contract helpers.
- `@saptm/rpc` exposes public `system.health` metadata and output schema.
- `apps/api` exposes RPC context authorization before domain modules are implemented.
- `apps/api` mounts the oRPC HTTP middleware at `/rpc`.
- `apps/api` exposes `foundationRpcRouter` with public `system.health`.
- First feature consumes contracts from `@saptm/rpc`.
- API errors are typed and observable.
- Contract tests exist for each exposed operation.
