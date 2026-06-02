# Phase 6 — Auth and Security Strategy

## Security Position

Authentication and authorization are separate concerns.

Better Auth is used for identity, session lifecycle, secure cookies, auth route handling, and typed user/session access. SAPTM owns business authorization through RBAC, ABAC, permission families, policy guards, and audit trails.

This separation is mandatory because logistics permissions depend on tenant, facility, corridor, cargo ownership, operational role, data classification, and emergency support context.

## Better Auth Strategy

| Concern | Decision |
| --- | --- |
| Server placement | Shared config in `@saptm/auth`; browser auth route exposed by `apps/web` |
| Session transport | Secure HTTP-only cookies managed by Better Auth |
| Session validation | Full session validation for protected API operations |
| Cookie-only checks | Allowed only for optimistic Next.js redirects, never as final authorization |
| Session cache | Disabled or short-lived for sensitive operations; revocation risk must be documented |
| Type sharing | Better Auth inferred session types exported from `@saptm/auth` |
| API usage | NestJS receives authenticated context and applies platform policy guards |
| Service access | Machine-to-machine access uses scoped service credentials/API keys, not forged cookies |

Better Auth documentation does not define a canonical logistics organization/RBAC model. Therefore RBAC and ABAC are platform-owned models.

## Identity Model

| Entity | Purpose |
| --- | --- |
| User | Human identity |
| Session | Browser or device session |
| Account | Auth provider account |
| Organization | Tenant or operating participant |
| Membership | User membership in organization |
| Role | Named set of permissions |
| Permission | Atomic allowed operation |
| Policy | ABAC rule evaluating context |
| Service Account | Machine identity for integrations |
| API Key | Scoped machine credential |

## RBAC Model

RBAC grants coarse capability.

| Role | Core Permissions |
| --- | --- |
| Super Admin | Platform emergency access, tenant support, system audit |
| Platform Operator | Tenant provisioning, incident response, runtime diagnostics |
| Tenant Owner | Organization ownership, subscription, admin delegation |
| Tenant Admin | User management, role assignment, facility administration |
| Operations Manager | Cross-facility operations, exception escalation |
| Planner | Shipment planning, route planning, transport order creation |
| Dispatcher | Movement execution updates, event confirmation |
| Port Operator | Port call, berth, handling, yard operation updates |
| Rail Operator | Rail movement, train/wagon updates |
| Cargo Owner | Own cargo tracking, document visibility, exception visibility |
| Finance User | Charges, invoices, settlement review |
| Compliance User | Document validation, inspection, retention evidence |
| Analyst | Reports, dashboards, AI insights |
| Auditor | Audit records and compliance exports |
| Viewer | Read-only permitted operational data |
| Integration Service | API-specific scoped operations |

## ABAC Model

ABAC restricts access based on runtime attributes.

| Attribute | Example |
| --- | --- |
| `tenantId` | User can only access assigned organization |
| `facilityIds` | User can only operate assigned facilities |
| `corridorIds` | Planner can only plan permitted corridors |
| `cargoOwnerId` | Cargo owner can only view owned cargo |
| `dataClassification` | Restricted documents require compliance role |
| `operationSeverity` | Critical exception actions require manager role |
| `supportMode` | Platform support access requires time-bound approval |
| `serviceScope` | API key can only call assigned integration operations |

## Permissions Matrix

| Capability | Platform Operator | Tenant Admin | Operations Manager | Planner | Dispatcher | Cargo Owner | Analyst | Auditor | Integration |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Manage tenant | Approve | Deny | Deny | Deny | Deny | Deny | Deny | Deny | Deny |
| Manage users | Support | Allow | Deny | Deny | Deny | Deny | Deny | Read | Deny |
| Manage roles | Deny | Allow | Deny | Deny | Deny | Deny | Deny | Read | Deny |
| Configure facilities | Support | Allow | Read | Read | Read | Read | Read | Read | Deny |
| Register cargo | Deny | Allow | Allow | Allow | Deny | Limited | Deny | Read | Scoped |
| Create shipment | Deny | Allow | Allow | Allow | Deny | Limited | Deny | Read | Scoped |
| Confirm transport order | Deny | Deny | Allow | Allow | Deny | Deny | Deny | Read | Deny |
| Update movement event | Deny | Deny | Allow | Deny | Allow | Deny | Deny | Read | Scoped |
| Resolve exception | Support | Deny | Allow | Limited | Limited | Deny | Deny | Read | Deny |
| Validate document | Deny | Deny | Deny | Deny | Deny | Deny | Deny | Read | Deny |
| View analytics | Support | Allow | Allow | Allow | Allow | Limited | Allow | Read | Deny |
| Export reports | Support | Limited | Limited | Limited | Deny | Limited | Allow | Allow | Deny |
| View audit trail | Allow | Limited | Limited | Deny | Deny | Deny | Deny | Allow | Deny |
| Manage API keys | Support | Allow | Deny | Deny | Deny | Deny | Deny | Read | Deny |

Legend:

- `Allow`: permitted when ABAC passes.
- `Limited`: permitted only for owned or assigned scope.
- `Support`: permitted only in approved support mode.
- `Scoped`: permitted only by service account scopes and idempotency rules.
- `Read`: read-only.
- `Deny`: never permitted.

## Session Strategy

- Access sessions are backed by Better Auth session records.
- Session duration must balance enterprise convenience with operational risk.
- Sensitive mutations must re-check session validity server-side.
- Password change or suspected compromise must revoke other sessions.
- Session metadata should include tenant selection and active organization only when safe to cache.
- Server authorization must not trust client-selected tenant without membership verification.

## Auth Context Contract

`@saptm/auth` owns `AuthContext` as the server-resolved authorization context.

`AuthContext` carries actor identity, active organization, resolved platform permissions, session/service identifiers, support grant evidence, and correlation metadata. `apps/api` synchronizes this context with `TraceContext` before policy guards and audit writers run.

The API must not derive `AuthContext` from arbitrary client headers. Better Auth session resolution and service-account verification are the only valid sources.

Browser session resolution rules are defined in `docs/security/session-resolution.md`. API resolution uses the Better Auth session API with cookie cache and session refresh disabled so authorization checks validate identity without owning cookie lifecycle.

Machine identity rules are defined in `docs/security/service-accounts.md`. API keys resolve to `AuthContext.actorType = "service_account"` and must never impersonate Better Auth users.

Human permission resolution rules are defined in `docs/security/permission-resolution.md`. The API only auto-selects an organization when the user has exactly one active membership.

## Authorization Enforcement Contract

`@saptm/auth` owns pure authorization evaluation through `AuthorizationRequirement` and `evaluateAuthorization`.

`apps/api` owns NestJS enforcement through route metadata and a global `AuthorizationGuard`. The guard is passive for routes without authorization metadata and strict for routes that declare requirements.

Every authorization decision is emitted as an observability audit signal. Denied requests must include deterministic reason, missing permissions, failed ABAC attributes, actor type, and route identity.

Full implementation rules are defined in `docs/security/authorization-policy.md`.

## Audit Trail

Audit records are required for:

- Login, logout, session revocation, failed auth attempts.
- User invitation, role assignment, permission changes.
- API key creation, rotation, revocation.
- Tenant, facility, corridor, and integration changes.
- Cargo registration and custody transitions.
- Transport order confirmation and cancellation.
- Exception escalation and resolution.
- Document validation, rejection, export.
- Report export and AI recommendation approval.
- Platform support access.

Audit record minimum fields:

- `tenantId`
- `actorType`
- `actorId`
- `action`
- `subjectType`
- `subjectId`
- `before`
- `after`
- `reason`
- `ipAddress`
- `userAgent`
- `correlationId`
- `createdAt`

`@saptm/database` exposes persistable audit helpers and Prisma mutation hook contracts. Future mutations must use those helpers instead of writing audit rows ad hoc.

## Security Gates

- No feature without permission definition.
- No mutation without server-side policy check.
- No critical mutation without audit classification.
- No integration without service account scope.
- No export without data classification and retention policy.
- No AI action without explainability and approval boundary.
