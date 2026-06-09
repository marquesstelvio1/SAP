# RPC Authorization Contract

## Purpose

Define the mandatory authorization path for all future oRPC handlers before any logistics,
rail, port, analytics, or automation feature is implemented.

## Runtime Flow

1. `ObservabilityMiddleware` creates the request trace context.
2. `AuthContextMiddleware` resolves service-account API keys first and Better Auth sessions second.
3. Future oRPC handlers call `RpcContextService.authorizeRequest(request, metadata)` before domain logic.
4. `RpcContextService` evaluates metadata through `@saptm/rpc` authorization helpers.
5. Allowed protected calls emit `rpc.authorization.evaluate` audit records.
6. Denied protected calls fail closed before domain services are reached.

## Contract Metadata

Every RPC operation must be created with `defineRpcContract` from `@saptm/rpc`.

Required metadata:

| Field | Rule |
| --- | --- |
| `name` | Stable operation name used for telemetry and audit |
| `version` | Positive integer contract version |
| `kind` | `query`, `mutation`, or `subscription` |
| `auth` | `public`, `session`, or `service` |
| `permissions` | Platform permissions required by the operation |
| `permissionMode` | `all` or `any` |
| `organizationRequired` | True when tenant scope is mandatory |
| `audit` | `none`, `standard`, `sensitive`, or `critical` |
| `idempotency` | `none`, `recommended`, or `required` |
| `observability` | Operation, span, metric, criticality, and signal metadata |

## Enforcement Rules

- Public operations cannot declare permissions.
- Public operations cannot require organization scope.
- Mutations must declare `auth` explicitly.
- Critical audit operations cannot use low observability criticality.
- Session operations default to `user` actors.
- Service operations default to `service_account` actors.
- Actor overrides are allowed only for platform-internal contracts reviewed by architecture.

## Failure Model

| Condition | Outcome |
| --- | --- |
| Auth resolution error | `401 rpc.auth_resolution_failed` |
| Protected operation without auth context | `401 rpc.authorization.unauthenticated` |
| Authenticated actor denied by RBAC or ABAC | `403 authorization.denied.*` |
| Public operation without auth context | Allowed when metadata is valid |

## Current Boundary

The platform now has RPC authorization metadata, error catalog, trace propagation, and NestJS
context enforcement services. No business RPC endpoint, page, CRUD, or domain feature exists yet.
