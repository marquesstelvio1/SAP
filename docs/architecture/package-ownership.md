# PACKAGE OWNERSHIP — SAPTM

**Version:** 1.0.0
**Last Updated:** 2026-06-22

---

## 1. @saptm/config

| Attribute | Value |
|---|---|
| **Owner Team** | Platform Engineering |
| **Location** | `packages/config/` |
| **Responsibility** | Centralized environment configuration loading, validation with Zod schemas, typed configuration objects |
| **Boundaries** | Must not import any other `@saptm/*` package. Zero runtime dependencies except `zod`. |
| **Public API** | `index.ts` — `getConfig()`, typed config interfaces derived from environment variables |
| **Consumers** | All packages and apps |

---

## 2. @saptm/observability

| Attribute | Value |
|---|---|
| **Owner Team** | Platform Engineering |
| **Location** | `packages/observability/` |
| **Responsibility** | OpenTelemetry SDK initialization, trace context propagation, Prometheus metrics registry |
| **Boundaries** | Must not import any other `@saptm/*` package. Zero workspace dependencies. |
| **Public API** | `index.ts` — `TraceContext`, `TraceHeaderMap`, `TelemetrySignal`, `parseTraceHeaders()`, `serializeTraceHeaders()`, `telemetrySignals`; `prometheus.ts` — metric exports |
| **Consumers** | `@saptm/database`, `@saptm/auth`, `@saptm/email`, `@saptm/rpc`, `@saptm/api` |

---

## 3. @saptm/types

| Attribute | Value |
|---|---|
| **Owner Team** | Platform Engineering |
| **Location** | `packages/types/` |
| **Responsibility** | Shared TypeScript utility types, brand types, and runtime type helpers |
| **Boundaries** | Zero workspace dependencies. Must not import from any `@saptm/*` package. |
| **Public API** | `index.ts` — `Brand<T, B>`, type utilities; `runtime.ts` — runtime helpers |
| **Consumers** | `@saptm/rpc` |

---

## 4. @saptm/email

| Attribute | Value |
|---|---|
| **Owner Team** | Platform Engineering |
| **Location** | `packages/email/` |
| **Responsibility** | Email sending via Resend API, template rendering for transactional emails (invitations, notifications, password reset) |
| **Boundaries** | May import `@saptm/config` and `@saptm/observability` only. Must not know about domain concepts. |
| **Public API** | `index.ts` — `sendEmail()`, email client; `resend-client.ts` — Resend SDK wrapper; `templates.ts` — email template rendering |
| **Consumers** | `@saptm/database`, `@saptm/auth` |

---

## 5. @saptm/database

| Attribute | Value |
|---|---|
| **Owner Team** | Platform Engineering |
| **Location** | `packages/database/` |
| **Responsibility** | Prisma client initialization, schema migrations, outbox event bus implementation, domain event types, audit persistence, RBAC bootstrap seeding |
| **Boundaries** | May import `@saptm/config`, `@saptm/email`, `@saptm/observability`. Owns the Prisma schema and all migrations. Must not import domain-specific packages. |
| **Public API** | `index.ts` — `getPrismaClient()`, `PrismaTx`, database type exports; `domain-events.ts` — `DomainEvent`, `EventBus` interface; `outbox-event-bus.ts` — outbox implementation; `audit.ts` — `AuditJsonValue`; `constants.ts` — shared constants; `rbac-bootstrap.ts` — seed function |
| **Consumers** | `@saptm/auth`, `@saptm/api` |

---

## 6. @saptm/auth

| Attribute | Value |
|---|---|
| **Owner Team** | Security & Identity |
| **Location** | `packages/auth/` |
| **Responsibility** | Better Auth server/client configuration, authentication flows (email/password, 2FA, OAuth), session management, permission system with authorization engine, RBAC role evaluation, API key authentication, service account auth |
| **Boundaries** | May import `@saptm/config`, `@saptm/database`, `@saptm/email`, `@saptm/observability`. Must not import `@saptm/rpc` or any domain-specific package. |
| **Public API** | `index.ts` — `AuthContext`, `AuthActorType`; `server.ts` — `createAuthServer()`; `client.ts` — `createAuthClient()`; `context.ts` — context types and helpers; `policy.ts` — `evaluateAuthorization()`, `AuthorizationRequirement`, `AuthorizationDecision`; `permissions.ts` — `PlatformPermission` union with 40 permissions; `session.ts` — session management; `api-key.ts` — API key hashing; `invitations.ts` — invitation flows; `user-authorization.ts` — user permission checks; `session-governance.ts` — session lifecycle |
| **Subpath Exports** | `.` (main), `./server`, `./client` |
| **Consumers** | `@saptm/rpc`, `@saptm/api`, `@saptm/web`, `@saptm/testing` |

---

## 7. @saptm/rpc

| Attribute | Value |
|---|---|
| **Owner Team** | API Platform |
| **Location** | `packages/rpc/` |
| **Responsibility** | RPC contract definitions (Zod input/output schemas), operation metadata (auth mode, permissions, audit classification, criticality), error catalog and envelope types, authorization requirement extraction, trace header serialization |
| **Boundaries** | May import `@saptm/auth` (for permission/type references), `@saptm/observability`, `@saptm/types`. Must not import `@saptm/database` or any application module. |
| **Public API** | 18 domain contract files exported via barrel `index.ts`. Key exports: input/output schema types, metadata creators, error catalog (`rpcErrorCodes`, `rpcErrorCatalog`, `RpcErrorEnvelope`), `createRpcOperationMetadata()`, `evaluateRpcAuthorization()`, `serializeRpcTraceHeaders()` |
| **Consumers** | `@saptm/api`, `@saptm/web`, `@saptm/testing` |

### Contract File Inventory
| File | Domain | Operations |
|---|---|---|
| `admin.ts` | Identity & Access | member invite, role CRUD, org overview |
| `audit.ts` | Audit | search, export |
| `billing.ts` | Billing | overview, checkout session, portal session |
| `capacity.ts` | Capacity | resource register, slot open/reserve/cancel, advisory decision |
| `cargo.ts` | Cargo | register, release, transport plan/depart/arrive, delivery complete, exception, claim, handoff, compliance |
| `foundation.ts` | Health | health report |
| `integrations.ts` | Integrations | event ingest, movement processing, GPS, customs |
| `notifications.ts` | Notifications | inbox, mark read |
| `planning.ts` | Planning | transport order CRUD, dispatch, reschedule |
| `reports.ts` | Reports | export |
| `settings.ts` | Settings | org update, branding |
| `tariff.ts` | Tariff | rate card, rate rule, quote calculate/approve |
| `teams.ts` | Teams | team CRUD, members |
| `tracking.ts` | Tracking | overview, event record, exception, advisory |
| `webhooks.ts` | Webhooks | endpoint CRUD, delivery log, retry |
| `errors.ts` | Cross-cutting | error codes, catalog, envelope |
| `metadata.ts` | Cross-cutting | operation metadata creator |
| `authorization.ts` | Cross-cutting | auth requirement extraction |

---

## 8. @saptm/ui

| Attribute | Value |
|---|---|
| **Owner Team** | Design System |
| **Location** | `packages/ui/` |
| **Responsibility** | Shared UI component library based on shadcn/ui patterns, design tokens, styling utilities, hooks |
| **Boundaries** | Zero workspace dependencies. Peer dependency on `react` and `react-dom`. Must use design tokens and `cva()` for all components. |
| **Public API** | `.` (index barrel), `./components` (component barrel), `./components/*` (individual components), `./hooks` (custom hooks), `./lib/utils` (classname utilities), `./styles.css` (global CSS), `./tokens` (design tokens) |
| **Consumers** | `@saptm/web` |

### Component Inventory
- shadcn/ui-based components: button, input, dialog, dropdown, table, card, badge, etc.
- Custom domain-specific components
- Design tokens: `--space-*`, `--shadow-*`, `--primary`, `--muted`, `--destructive`
- Hooks: custom React hooks
- Style utilities via tailwind-merge + clsx

---

## 9. @saptm/testing

| Attribute | Value |
|---|---|
| **Owner Team** | QA |
| **Location** | `packages/testing/` |
| **Responsibility** | Shared test utilities, Playwright test fixtures, RPC test helpers, auth context mocks |
| **Boundaries** | May import `@saptm/auth`, `@saptm/observability`, `@saptm/rpc`. Must not import application modules. |
| **Public API** | Test fixtures, mock factories, helper utilities |
| **Consumers** | E2E tests in `tests/e2e/` |

---

## 10. @saptm/tsconfig

| Attribute | Value |
|---|---|
| **Owner Team** | Platform Engineering |
| **Location** | `packages/tsconfig/` |
| **Responsibility** | Shared TypeScript configuration base files |
| **Boundaries** | No runtime code. Configuration only. |
| **Public API** | `tsconfig.json` base config(s) |
| **Consumers** | All packages and apps (as devDependency) |
