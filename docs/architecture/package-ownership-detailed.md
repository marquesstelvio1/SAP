# Detailed Package Ownership

## 1. `@saptm/api` (apps/api)

| Attribute | Value |
|---|---|
| **Owner** | Backend Platform Team |
| **Type** | Application (NestJS) |
| **Runtime** | Node.js (ESM) |

### Responsibility Boundaries
- Hosts all RPC operation handlers (procedures) organized by domain module
- Registers global NestJS infrastructure: `RpcExceptionFilter`, security headers, CSRF middleware, CORS, cookie parser
- Manages HTTP-to-oRPC bridge via `RpcHttpMiddleware` that creates an `RPCHandler` from the `createPlatformRpcRouter`
- Provides domain services: AdminService, AuditService, BillingService, CargoService, CapacityService, etc.
- Holds ObservabilityModule for tracing, metrics at `/metrics`, and health probes at `/health/live`, `/health/ready`
- Handles rate limiting (`@nestjs/throttler`), caching (`@nestjs/cache-manager`), event bus outbox processing

### Can Import
- All `@saptm/*` packages (auth, config, database, observability, rpc, types)
- External dependencies: `@nestjs/*`, `@orpc/server`, `zod`, `stripe`, `cookie-parser`, `csrf-csrf`, `ioredis`

### Cannot Import
- `@saptm/web` (cross-app boundary)
- `@saptm/ui` (frontend-only package)
- `@saptm/testing` (test utilities for tests only)

### What Can Import It
- Nothing — it is an application entry point (not published)

### Public API Surface
- `POST/GET /rpc/*` — oRPC HTTP handler
- `POST/GET /v1/rpc/*` — versioned oRPC HTTP handler
- `GET /metrics` — Prometheus metrics
- `GET /health/live` — liveness probe
- `GET /health/ready` — readiness probe
- `POST /billing/webhook` — Stripe webhook ingress

### Internal Dependencies
- 21 feature modules (admin, audit, auth, billing, cache, capacity, cargo, event-bus, health, integrations, notifications, observability, planning, rate-limit, reports, rpc, security, tariff, teams, tracking, webhooks)

### External Dependencies
- @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/cache-manager, @nestjs/throttler
- @orpc/server, zod, stripe, cookie-parser, csrf-csrf, ioredis, cache-manager, cache-manager-redis-yet
- reflect-metadata, rxjs

---

## 2. `@saptm/web` (apps/web)

| Attribute | Value |
|---|---|
| **Owner** | Frontend Platform Team |
| **Type** | Application (Next.js) |
| **Runtime** | Node.js + Browser (ESM) |

### Responsibility Boundaries
- Hosts all user-facing pages using Next.js App Router
- Server Components for data fetching by default; Client Components minimized
- Authentication UI via `@saptm/auth/client` and `better-auth` browser client
- RPC client communication via `@saptm/rpc` contracts (TanStack Query for caching)
- Error boundaries (`error.tsx`) and loading boundaries (`loading.tsx`) for every route
- Sentry error tracking via `@sentry/nextjs`
- Security headers via `next.config.ts` (HSTS, CSP, XFO, COOP, CORP, Permissions-Policy, Referrer-Policy)
- Theme support via `next-themes`

### Can Import
- `@saptm/auth`, `@saptm/auth/client`, `@saptm/auth/server` (auth context and client)
- `@saptm/config` (client-side env parsing)
- `@saptm/rpc` (type contracts and Zod schemas)
- `@saptm/types` (shared types)
- `@saptm/ui`, `@saptm/ui/components`, `@saptm/ui/tokens`, `@saptm/ui/styles.css` (UI components and design tokens)
- External: `next`, `react`, `@sentry/nextjs`, `@tanstack/react-query`, `better-auth`

### Cannot Import
- `@saptm/api` (backend-only)
- `@saptm/database` (direct DB access from frontend prohibited — goes through API only)
- `@saptm/testing` (test utilities)
- `@saptm/email` (email is backend-only)

### What Can Import It
- Nothing — it is an application entry point (not published)

### Public API Surface
- HTML pages via Next.js routes
- `GET /api/health` — health endpoint for frontend
- `POST /api/auth/*` — Better Auth route handler (via `@saptm/auth/server`)

### Internal Dependencies
- App Router pages directory: `app/` with route groups `(platform)`, `app/`, domain sections

### External Dependencies
- next, react, react-dom, @sentry/nextjs, @tanstack/react-query, better-auth, next-themes

### Dev Dependencies
- @saptm/tsconfig, tailwindcss, @tailwindcss/postcss, @types/react, @types/react-dom, @types/node, typescript

---

## 3. `@saptm/auth`

| Attribute | Value |
|---|---|
| **Owner** | Security Team |
| **Type** | Package |
| **Subpath Exports** | `.` (main), `./client`, `./server` |

### Responsibility Boundaries
- Authentication and authorization logic: context creation, session resolution, API key validation
- Policy evaluation engine (`evaluateAuthorization`) with ALL/ANY permission modes
- Better Auth server and client creation and configuration
- Platform permission definitions (40 permissions across all domains)
- Invitation token creation, hashing, and acceptance
- Session governance (revoke other sessions)
- Cross-tenant access enforcement (via `organizationId` filtering in auth context)

### Can Import
- `@saptm/config` (env vars for Better Auth setup)
- `@saptm/database` (Prisma adapter for Better Auth, RBAC bootstrap)
- `@saptm/email` (invitation and verification emails)
- `@saptm/observability` (trace context enrichment, actor type mapping)
- External: `better-auth`

### Cannot Import
- `@saptm/rpc` (RPC is domain layer that imports auth, not the reverse)
- `@saptm/api` or `@saptm/web` (app boundary)
- `@saptm/ui` (frontend-only)

### What Can Import It
- `@saptm/api` (auth guards, context resolution)
- `@saptm/web` (auth client for browser, auth server for route handler)
- `@saptm/rpc` (authorization helpers, auth type usage)
- `@saptm/testing` (test auth context creation)

### Public API Surface (`.`)
- `AuthContext`, `AuthActorType`, `CreateAuthContextInput`, `createAuthContext`
- `AuthorizationDecision`, `AuthorizationMode`, `AuthorizationRequirement`, `evaluateAuthorization`
- `PlatformPermission`, `platformPermissions` (40 permissions)
- `hasPlatformPermission`, `enrichTraceContextWithAuth`, `filterPlatformPermissions`
- `ApiKeyMaterial`, `hashApiKey`, `validateApiKeyCredential`, `createApiKeyMaterial`
- `BetterAuthSessionRecord`, `BetterAuthSessionResult`, `resolveAuthContextFromBetterAuthSession`
- `acceptPlatformInvitation`, `createPlatformInvitationToken`, `createInvitationAcceptUrl`

### Public API Surface (`./client`)
- `createAuthClient`, `BetterAuthClient` type

### Public API Surface (`./server`)
- `createAuthServer`, `auth` (configured Better Auth instance)

### Internal Dependencies
- 5 modules: api-key.ts, context.ts, invitations.ts, permissions.ts, policy.ts, session.ts, session-governance.ts

### External Dependencies
- better-auth

---

## 4. `@saptm/config`

| Attribute | Value |
|---|---|
| **Owner** | Platform Team |
| **Type** | Package (Infrastructure) |

### Responsibility Boundaries
- Single source of truth for environment variable schema (`serverEnvSchema`, `clientEnvSchema`)
- Environment parsing and validation (`parseServerEnv`, `parseClientEnv`)
- Trusted origins computation for CORS (`getTrustedOrigins`)

### Can Import
- External: `zod`

### Cannot Import
- Any `@saptm/*` package (must remain dependency-free to avoid circular imports)

### What Can Import It
- Every other package and application (except `@saptm/tsconfig`, `@saptm/types`, `@saptm/observability`, `@saptm/ui`)

### Public API Surface
- `ServerEnv`, `ClientEnv` types
- `parseServerEnv(source)`, `parseClientEnv(source)`
- `getServerEnv()`, `getClientEnv()`
- `getTrustedOrigins(env)`
- `serverEnvSchema`, `clientEnvSchema` (Zod schemas)

### External Dependencies
- zod

---

## 5. `@saptm/database`

| Attribute | Value |
|---|---|
| **Owner** | Data Platform Team |
| **Type** | Package (Infrastructure) |

### Responsibility Boundaries
- Prisma schema, migrations, and client factory (`createPrismaClient`, `getPrismaClient`)
- Outbox event bus implementation (`OutboxEventBus`) for reliable async message delivery
- Audit trail writer (`AuditTrailWriter`, `createAuditTrailWriter`)
- RBAC bootstrap seeding (`seedRbacBootstrap`)
- Cursor-based pagination utility (`paginateWithCursor`)
- Transaction with retry (`withTransactionRetry`)
- Domain event bus interface (`EventBus`, `DomainEvent`)

### Can Import
- `@saptm/config` (database URL and pool size)
- `@saptm/email` (email templates for transactional emails — used in seed)
- `@saptm/observability` (trace context for audit records)
- External: `@prisma/client`, `@prisma/adapter-pg`, `dotenv`

### Cannot Import
- `@saptm/auth` (auth depends on database, not the reverse)
- `@saptm/rpc`, `@saptm/types`, `@saptm/ui` (domain/app layer)
- `@saptm/api`, `@saptm/web` (app boundary)

### What Can Import It
- `@saptm/auth` (Prisma adapter, RBAC bootstrap)
- `@saptm/api` (Prisma client, outbox event bus, audit trail)
- `@saptm/web` (resolved via webpack alias — used in server components)

### Public API Surface
- `SaptmPrismaClient`, `PrismaTx`, `createPrismaClient()`, `getPrismaClient()`
- `withTransactionRetry()`, `paginateWithCursor()`
- `OutboxEventBus`, `EventBus`, `DomainEvent`
- `AuditTrailClient`, `AuditTrailWriter`, `createAuditTrailWriter()`
- `seedRbacBootstrap()`, `RbacBootstrapClient`
- `CursorPaginationInput`, `CursorPaginationResult`

### External Dependencies
- @prisma/client, @prisma/adapter-pg, dotenv

---

## 6. `@saptm/email`

| Attribute | Value |
|---|---|
| **Owner** | Platform Team |
| **Type** | Package (Infrastructure) |

### Responsibility Boundaries
- Email sending via Resend API (`sendInvitationEmail`, `sendVerificationEmail`, `sendPasswordResetEmail`)
- Email template generation (HTML strings for invitation, verification, password reset)

### Can Import
- `@saptm/config` (RESEND_API_KEY, EMAIL_FROM env vars)
- `@saptm/observability` (could be used for telemetry)
- External: `resend`

### Cannot Import
- Any domain or application layer packages

### What Can Import It
- `@saptm/auth` (invitation email sending)
- `@saptm/database` (seed scripts use email)
- `@saptm/api` (if any direct email sending from API)

### Public API Surface
- `sendInvitationEmail(input)`, `sendVerificationEmail(input)`, `sendPasswordResetEmail(input)`
- `invitationEmailHtml()`, `verificationEmailHtml()`, `passwordResetEmailHtml()`
- `getResendClient()`, `resetResendClient()`

### External Dependencies
- resend

---

## 7. `@saptm/observability`

| Attribute | Value |
|---|---|
| **Owner** | Platform Team |
| **Type** | Package (Infrastructure) |

### Responsibility Boundaries
- Telemetry type definitions: `TraceContext`, `LogRecord`, `MetricRecord`, `SpanRecord`, `AuditRecord`
- Structured console logger (`createConsoleLogger`) with level filtering
- Trace context creation, serialization, and parsing (`serializeTraceHeaders`, `parseTraceHeaders`)
- Error normalization (`normalizeError`)
- Sensitive attribute redaction (`redactSensitiveAttributes`)
- Prometheus-compatible metrics registry (`InMemoryPrometheusRegistry`, `createPrometheusRegistry`)

### Can Import
- Nothing internal (leaf package)

### Cannot Import
- Any `@saptm/*` package (must be dependency-free)

### What Can Import It
- Every package and application that needs telemetry

### Public API Surface
- `TraceContext`, `TraceContextInput`, `createTraceContext()`, `mergeTraceContext()`
- `LogRecord`, `Logger`, `createConsoleLogger()`, `createLogRecord()`
- `MetricRecord`, `createMetricRecord()`
- `SpanRecord`, `createSpanRecord()`
- `AuditRecord`, `createAuditRecord()`
- `serializeTraceHeaders()`, `parseTraceHeaders()`
- `normalizeError()`, `redactSensitiveAttributes()`
- `createCorrelationId()`, `createRequestId()`
- `InMemoryPrometheusRegistry`, `createPrometheusRegistry()`, `PrometheusRegistryOptions`

### External Dependencies
- None

---

## 8. `@saptm/rpc`

| Attribute | Value |
|---|---|
| **Owner** | Backend Platform Team |
| **Type** | Package (Domain) |

### Responsibility Boundaries
- RPC contract definitions: input/output Zod schemas for every operation
- RPC operation metadata system (`RpcOperationMetadata`, `createRpcOperationMetadata`)
- Authorization helpers for RPC operations (`evaluateRpcAuthorization`, `createRpcAuthorizationRequirement`)
- Error catalog and envelope (`rpcErrorCatalog`, `RpcErrorEnvelope`, `createRpcErrorEnvelope`)
- Trace header serialization for RPC context propagation
- All domain contract files: admin.ts, audit.ts, billing.ts, capacity.ts, cargo.ts, integrations.ts, notifications.ts, planning.ts, reports.ts, settings.ts, tariff.ts, teams.ts, tracking.ts, webhooks.ts

### Can Import
- `@saptm/auth` (authorization types and evaluation)
- `@saptm/observability` (trace context types)
- `@saptm/types` (runtime types used in contracts)
- External: `@orpc/server`, `zod`

### Cannot Import
- `@saptm/database`, `@saptm/config`, `@saptm/email` (infra packages are not needed for contracts)
- `@saptm/api`, `@saptm/web` (app boundary)
- `@saptm/ui` (frontend-only)

### What Can Import It
- `@saptm/api` (RPC router creation, error handling)
- `@saptm/web` (type-safe client usage)
- `@saptm/testing` (RPC fixture creation)

### Public API Surface
- `RpcErrorEnvelope`, `RpcErrorCode`, `rpcErrorCatalog`, `createRpcErrorEnvelope`
- `RpcOperationMetadata`, `RpcAuthMode`, `RpcAuditClassification`, `RpcIdempotencyMode`, `RpcOperationCriticality`, `createRpcOperationMetadata`
- `evaluateRpcAuthorization()`, `isRpcAuthenticationRequired()`, `createRpcAuthorizationRequirement()`
- `RpcRequestContext`, `serializeRpcTraceHeaders()`, `parseRpcTraceHeaders()`
- Domain contracts (types + Zod schemas) for: admin, audit, billing, capacity, cargo, integrations, notifications, planning, reports, settings, tariff, teams, tracking, webhooks

### External Dependencies
- @orpc/server, zod

---

## 9. `@saptm/testing`

| Attribute | Value |
|---|---|
| **Owner** | QA Team |
| **Type** | Package (Application) |
| **Scope** | Dev dependency only |

### Responsibility Boundaries
- Test fixture creation for auth contexts (user, service account, platform admin)
- Authorization test assertions (`assertAuthorizationAllowed`, `assertAuthorizationDenied`)
- RPC test fixture creation (`createTestRpcOperationMetadata`, `assertRpcAuthorizationAllowed`)
- Trace context test fixtures (`createTestTraceContext`)
- Permission test set utilities

### Can Import
- `@saptm/auth` (auth context types, evaluation)
- `@saptm/observability` (trace context types)
- `@saptm/rpc` (RPC metadata creation)
- External: `@playwright/test`

### Cannot Import
- `@saptm/api`, `@saptm/web` (app boundary)
- `@saptm/database`, `@saptm/config`, `@saptm/email` (infra — not needed for fixtures)

### What Can Import It
- Test files in `apps/api/tests/`, `packages/*/tests/`, `tests/e2e/`

### Public API Surface
- `createTestAuthContext()`, `createTestUserAuthContext()`, `createTestServiceAccountAuthContext()`, `createTestPlatformAuthContext()`
- `assertAuthorizationAllowed()`, `assertAuthorizationDenied()`
- `createTestTraceContext()`
- `createTestRpcOperationMetadata()`, `assertRpcAuthorizationAllowed()`, `assertRpcAuthorizationDenied()`
- `createPermissionSet()`, `createPermissionSubset()`

### External Dependencies
- @playwright/test

---

## 10. `@saptm/tsconfig`

| Attribute | Value |
|---|---|
| **Owner** | Platform Team |
| **Type** | Package (Configuration) |

### Responsibility Boundaries
- Shared TypeScript configuration presets: `base.json`, `next.json`, `nest.json`
- Extends the root `tsconfig.base.json` with framework-specific overrides

### Can Import
- Nothing — contains only JSON configuration files

### What Can Import It
- Every other package and application (as devDependency)

### Public API Surface
- `./base` → base.json (strict mode, ES2022, Bundler resolution)
- `./next` → next.json (jsx preserve, noEmit, incremental, Next.js plugin)
- `./nest` → nest.json (NodeNext resolution, decorator metadata)
- `./package` → package.json (for TypeScript project references)

---

## 11. `@saptm/types`

| Attribute | Value |
|---|---|
| **Owner** | Platform Team |
| **Type** | Package (Domain) |

### Responsibility Boundaries
- Shared runtime types used across multiple packages: `RuntimeEnvironment`, `RuntimeHealthStatus`, `RuntimeHealthCheck`, `RuntimeHealthReport`

### Can Import
- Nothing internal (leaf package)

### What Can Import It
- `@saptm/rpc` (health check types)
- `@saptm/api` (health endpoint types)
- `@saptm/web` (type usage)

### Public API Surface
- `RuntimeEnvironment`, `RuntimeHealthStatus`, `RuntimeHealthCheck`, `RuntimeHealthReport`, `RuntimeHealthDetail`, `RuntimeHealthDetails`
- `runtimeEnvironments`, `runtimeHealthStatuses`

### External Dependencies
- None

---

## 12. `@saptm/ui`

| Attribute | Value |
|---|---|
| **Owner** | Design System Team |
| **Type** | Package (Application) |

### Responsibility Boundaries
- Shared UI components (50+ components): Button, Card, Dialog, DataTable, Sidebar, etc.
- Design tokens: density, elevation, semantic color, operational status, radius, typography
- CN utility (clsx + tailwind-merge)
- Hooks: toast/sonner notifications
- Global CSS: `styles/globals.css`
- Built on Radix UI primitives with shadcn/ui patterns (`cva()`, `tailwind-merge`)
- Dark mode support via `next-themes` provider

### Can Import
- External: react, react-dom, class-variance-authority, clsx, tailwind-merge, lucide-react, radix-ui, sonner, @tanstack/react-table, recharts, date-fns, react-day-picker, next-themes, cmdk

### Cannot Import
- Any `@saptm/*` package (must be framework-agnostic UI package)

### What Can Import It
- `@saptm/web` (all UI pages)
- External consumers (if published)

### Public API Surface
- `./tokens` → design tokens (DensityToken, SemanticColorToken, etc.)
- `./components` → all component re-exports
- `./components/*` → individual component access
- `./hooks` → custom hooks
- `./lib/utils` → cn utility
- `./styles.css` → global stylesheet

### External Dependencies
- react, react-dom, class-variance-authority, clsx, tailwind-merge, lucide-react, radix-ui, sonner, @tanstack/react-table, recharts, date-fns, react-day-picker, next-themes, cmdk
