# Audit: API — RPC Contracts and Operation Metadata

## Purpose
Verify all RPC operation contracts in `@saptm/rpc` have complete metadata (name, version, kind, auth, audit, criticality, signals), Zod schemas are properly structured, error handling is consistent, and idempotency patterns are applied.

## Inputs
- `apps/api/src/rpc/`
- `packages/rpc/src/`
- `packages/rpc/package.json`

## Execution Steps

1. **RPC operation metadata completeness**:
   - For every operation in `packages/rpc/src/operations/`, verify all required metadata fields are present:
     - `name` — unique operation name (reverse domain notation: `saptm.<domain>.<action>`)
     - `version` — semantic version string (`1.0.0`)
     - `kind` — one of: `command`, `query`, `event`
     - `auth` — one of: `public`, `authenticated`, `service`
     - `audit` — boolean: whether operation is audit-logged
     - `criticality` — one of: `low`, `medium`, `high`, `critical`
     - `signals` — array of event signals this operation emits on success/failure
   - Flag any operation missing one or more metadata fields.

2. **Zod schema validation**:
   - Verify every operation has an `input` Zod schema that validates the request payload.
   - Verify every operation has an `output` Zod schema that validates the response payload.
   - Check that schemas use `z.object()` with explicit `.describe()` calls for every field.
   - Ensure sensitive fields (passwords, tokens, secrets) have `.secret()` marking from `@saptm/rpc/zod-extras`.
   - Validate that enums use `z.enum(...)` with the full variant list from the Prisma schema.

3. **Error handling audit**:
   - Verify every operation wraps its handler body in a typed error boundary that produces a `RpcError` response.
   - Check that `RpcError` includes: `code`, `message`, `details` (optional), `requestId`.
   - Ensure domain errors (not found, conflict, unauthorized) are mapped to standard error codes:
     - `NOT_FOUND` → 404
     - `CONFLICT` → 409
     - `UNAUTHORIZED` → 401
     - `FORBIDDEN` → 403
     - `VALIDATION_ERROR` → 400
     - `INTERNAL_ERROR` → 500
   - Validate that unexpected errors are caught and mapped to `INTERNAL_ERROR` (no stack traces leaked).

4. **Idempotency patterns audit**:
   - Verify all `kind: "command"` operations accept an optional `idempotencyKey` in their input schema.
   - Check that idempotency keys are stored with TTL (minimum 24 hours).
   - Ensure duplicate requests with the same `idempotencyKey` return the original response (not a retry).
   - Validate that `kind: "query"` and `kind: "event"` operations do NOT accept idempotency keys.

5. **Auth mode audit**:
   - Verify `auth: "authenticated"` operations require a valid session token.
   - Check that `auth: "service"` operations require a valid service-to-service API key.
   - Ensure `auth: "public"` operations are limited to health checks and public metadata.
   - Validate that `evaluateAuthorization` is called within the handler for `authenticated` operations.

6. **Signal emission audit**:
   - Verify operations that declare `signals` in metadata actually emit those signals on success/failure.
   - Check that emitted signals match the declared signal names exactly.
   - Ensure signal payloads are typed and validated with Zod.

7. **Contract-to-controller mapping**:
   - Verify every RPC operation has a corresponding controller handler in `apps/api/src/rpc/`.
   - Check that controller handlers call the RPC operation's execute function (not inline business logic).

## Validation Steps
- `turbo run build --filter=@saptm/rpc` passes.
- `turbo run test --filter=@saptm/rpc` passes.
- `turbo run lint --filter=@saptm/rpc` passes.
- `turbo run typecheck --filter=@saptm/rpc` passes.
- RPC operation metadata extraction script runs successfully and outputs a complete inventory.
- All controller-handler mappings are 1:1 with defined operations.

## Definition Of Done
- Every operation has all 7 metadata fields populated with valid values.
- Every operation has input and output Zod schemas with descriptions and `secret()` markings.
- All handlers return typed `RpcError` responses; errors map to standard codes.
- All `command` operations support `idempotencyKey` with 24h TTL deduplication.
- Auth mode is correctly scoped per operation; `evaluateAuthorization` is called where needed.
- Declared signals match emitted signals in name and payload shape.
- Controllers are thin wrappers that delegate to RPC operation functions.

## Failure Conditions
- An operation is missing any required metadata field (`name`, `version`, `kind`, `auth`, `audit`, `criticality`, `signals`).
- An operation lacks an input or output Zod schema.
- A `command` operation does not support `idempotencyKey`.
- An unexpected error leaks a stack trace to the error response.
- An `authenticated` operation does not call `evaluateAuthorization`.
- A declared signal is not emitted by the handler.
- A controller handler implements business logic instead of delegating to the RPC operation.
- `turbo run build` fails for `@saptm/rpc`.

## Required Reports
- `reports/audit-api/operation-metadata.json` — complete inventory of all operations with metadata field validation per op.
- `reports/audit-api/schema-coverage.json` — input/output schema validation, field descriptions, secret markings.
- `reports/audit-api/error-handling.json` — error code mapping verification per operation.
- `reports/audit-api/idempotency-audit.json` — idempotency key support and deduplication logic verification.
- `reports/audit-api/auth-mode.json` — auth mode assignment verification per operation.
- `reports/audit-api/controller-mapping.json` — contract-to-controller mapping 1:1 verification.
- `reports/audit-api/summary.json` — pass/fail per step, total violations, remediation priority.
