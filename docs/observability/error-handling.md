# Error Handling Strategy

## 1. Error Architecture

SAPTM uses a layered error handling architecture with a canonical RPC error envelope that travels from the backend domain layer through the HTTP boundary to the frontend.

```
Domain Service
  │ throws NestJS HttpException
  ▼
RpcExceptionFilter (global)
  │ maps to RpcErrorEnvelope
  ▼
HTTP Response (JSON)
  │
  ├── Web: Sentry capture + error.tsx boundary
  └── API: Structured log + metric recording
```

## 2. RPC Error Contract

**Source:** `packages/rpc/src/errors.ts`

### RpcErrorEnvelope

```typescript
type RpcErrorEnvelope = {
  code: RpcErrorCode;
  message: string;
  traceId?: string;
  requestId?: string;
  details?: unknown;
};
```

### Error Codes (rpcErrorCatalog)

| Code | HTTP Status | Retryable | Default Message |
|------|-------------|-----------|-----------------|
| `UNAUTHENTICATED` | 401 | No | Authentication is required. |
| `FORBIDDEN` | 403 | No | The authenticated actor is not allowed to perform this operation. |
| `VALIDATION_ERROR` | 400 | No | The request payload is invalid. |
| `CONFLICT` | 409 | No | The operation conflicts with the current resource state. |
| `NOT_FOUND` | 404 | No | The requested resource was not found. |
| `RATE_LIMITED` | 429 | Yes | The operation exceeded an applicable rate limit. |
| `INTEGRATION_ERROR` | 502 | Yes | An external integration failed. |
| `INTERNAL_ERROR` | 500 | Yes | An unexpected internal error occurred. |

### Error Creation

```typescript
createRpcErrorEnvelope({ code: "NOT_FOUND", traceId, requestId });
getRpcErrorDefinition("CONFLICT"); // returns RpcErrorDefinition
```

## 3. API Error Handling

**Source:** `apps/api/src/rpc/exception.filter.ts`

### RpcExceptionFilter (global, @Catch())

Registered in `main.ts` via `app.useGlobalFilters(new RpcExceptionFilter())`. Catches all unhandled exceptions and converts them to `RpcErrorEnvelope` responses.

### Exception Mapping Logic

**HTTP Exceptions (NestJS built-in):**

| Thrown Exception | Mapped HTTP Status | RPC Error Code |
|---|---|---|
| `UnauthorizedException` | 401 | `UNAUTHENTICATED` |
| `ForbiddenException` | 403 | `FORBIDDEN` |
| `BadRequestException` | 400 | `VALIDATION_ERROR` |
| `ConflictException` | 409 | `CONFLICT` |
| `NotFoundException` | 404 | `NOT_FOUND` |
| `TooManyRequestsException` | 429 | `RATE_LIMITED` |
| `BadGatewayException` | 502 | `INTEGRATION_ERROR` |
| Any other HttpException | 500 | `INTERNAL_ERROR` |

5xx errors log the full stack trace and replace the message with a generic "An internal server error occurred." to avoid leaking internals.

**Prisma Errors:**

| Prisma Code | HTTP Status | RPC Error Code |
|---|---|---|
| `P2002` (unique constraint) | 409 | `CONFLICT` |
| `P2003` (foreign key) | 409 | `CONFLICT` |
| `P2025` (record not found) | 404 | `NOT_FOUND` |
| Any other P-prefixed code | 500 | `INTERNAL_ERROR` |

Prisma errors are logged at `warn` level with the raw Prisma code and message. For non-mapped codes, the internal message is replaced with "A database error occurred."

**Unhandled Exceptions:**
Any exception that is not an `HttpException` or Prisma error is logged at `error` level with its stack trace. The response is always `500 INTERNAL_ERROR` with the generic message.

### Domain Error Throwing Pattern

Domain services and repositories throw NestJS `HttpException` subclasses with a dot-notation error key:

```typescript
throw new NotFoundException("cargo.not_found");
throw new BadRequestException("cargo.reference_conflict");
throw new ForbiddenException("admin.organization_required");
```

The error key is returned as the `message` in the `RpcErrorEnvelope`. These keys are structured as `{domain}.{reason}` and are documented per module.

### RPC Authorization Errors

**Source:** `apps/api/src/rpc/rpc-context.service.ts`

```typescript
throw new UnauthorizedException("rpc.auth_resolution_failed");   // auth context could not be resolved
throw new UnauthorizedException("rpc.authorization.unauthenticated"); // no auth context but auth required
throw new ForbiddenException("rpc.authorization.denied");           // insufficient permissions
```

## 4. Frontend Error Boundaries

Every route in `@saptm/web` has a corresponding `error.tsx` (23 boundaries) and `loading.tsx` (22 boundaries).

### Error Boundary File Structure

```
apps/web/app/
  error.tsx                                    ← root
  sign-in/error.tsx                            ← auth pages
  two-factor/error.tsx                         ← 2FA pages
  accept-invitation/error.tsx                  ← invitation pages
  (platform)/
    error.tsx                                  ← platform shell
    app/
      error.tsx                                ← app shell
      cargo/error.tsx                          ← domain sections
      tracking/error.tsx
      tracking/[shipmentId]/error.tsx          ← dynamic routes
      capacity/error.tsx
      planning/error.tsx
      notifications/error.tsx
      integrations/error.tsx
      security/error.tsx
      settings/error.tsx
      settings/general/error.tsx
      settings/branding/error.tsx
      settings/billing/error.tsx
      settings/webhooks/error.tsx
      admin/error.tsx
      admin/teams/error.tsx
      tariff/error.tsx
      audit/error.tsx
```

### Error Boundary Pattern

All error boundaries follow a consistent pattern:
- `"use client"` directive (error boundaries must be client components)
- Shown `Error & { digest?: string }` for error + `() => void` for reset
- Uses `@saptm/ui` components (`Card`, `Button`)
- Displays localized error title "Erro inesperado" + error message
- Two actions: "Tentar novamente" (reset) and "Voltar ao inicio" (navigate to `/app`)
- Root-level errors use `min-h-screen` centered layout; nested errors use padded container

### Shared ErrorCard Component

**Source:** `packages/ui/src/components/error-card.tsx`

A reusable component exported from `@saptm/ui/components` that renders a centered card with title, message, and optional retry button. Used by domain sections for inline error states.

## 5. Graceful Degradation Patterns

| Scenario | Degradation Strategy |
|---|---|
| External integration failure | Return `INTEGRATION_ERROR` (502), log at error, alert triggered |
| Database connection failure | Health check reports `down`, returns `503` |
| Redis cache unavailable | Cache module falls through to database, logs warning |
| Rate limit exceeded | Returns `RATE_LIMITED` (429), retryable by client |
| Prisma query timeout | Thrown as `INTERNAL_ERROR`, captured by exception filter |
| Stripe API failure | Caught in billing service, returns `INTEGRATION_ERROR` |
| Email delivery failure | Logged at error, operation proceeds without blocking |

## 6. Error Reporting

### Structured Logging

All errors are logged via `@saptm/observability` `createConsoleLogger` with:
- JSON structured output
- `TraceContext` (correlationId, requestId, tenantId, actorType, actorId)
- `NormalizedError` (name, message, stack)
- Log levels: `debug`, `info`, `warn`, `error`, `critical`
- Sensitive attribute redaction (passwords, tokens, secrets, API keys)

### Sentry (Web)

**Source:** `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`

- Configured via `@sentry/nextjs` with `withSentryConfig` in `next.config.ts`
- DSN from `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` environment variable
- `tracesSampleRate`: 1.0 in development, 0.1 in production
- Tunnel route at `/sentry-tunnel` to bypass ad-blockers
- Server-side and client-side error tracking

### API Observability Interceptor

**Source:** `apps/api/src/observability/observability.interceptor.ts`

Registered globally in `ObservabilityModule`. For every request:
1. Creates or propagates `TraceContext` from headers
2. Attaches trace response headers (`x-correlation-id`, `x-request-id`, etc.)
3. Records HTTP metrics (duration, success/failure)
4. On error: captures the error, logs via structured logger, attaches to metric record
5. Metrics exported at `/metrics` via Prometheus registry in `@saptm/observability`

### Prometheus Metrics for Errors

| Metric | Type | Labels |
|---|---|---|
| `rpc.*.duration_ms` | histogram | operation, status, error_code |
| `http_requests_total` | counter | method, path, status_code |
| `auth_decision_total` | counter | outcome, actor_type |

## 7. Key Files Reference

| File | Purpose |
|---|---|
| `packages/rpc/src/errors.ts` | RPC error catalog, envelope type, creation function |
| `apps/api/src/rpc/exception.filter.ts` | Global exception filter for API |
| `apps/api/src/rpc/rpc-context.service.ts` | Authorization error throwing |
| `apps/api/src/observability/observability.interceptor.ts` | Error capture, metrics, trace context |
| `apps/api/src/observability/observability.service.ts` | Logging, metric recording, span creation |
| `apps/web/app/*/error.tsx` | Per-route error boundary (23 files) |
| `packages/ui/src/components/error-card.tsx` | Shared error display component |
| `apps/web/sentry.client.config.ts` | Sentry client initialization |
| `apps/web/sentry.server.config.ts` | Sentry server initialization |
| `apps/web/next.config.ts` | Sentry plugin configuration |
