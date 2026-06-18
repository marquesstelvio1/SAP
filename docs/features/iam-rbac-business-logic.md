# IAM and RBAC Business Logic Closure

## Closed in Code

- P0: Bootstrap role templates cover admin, security, integration, audit, reporting, finance,
  cargo, capacity, tracking, compliance, operations, and viewer profiles.
- P0: `tenant.report_exporter` can export reportable domains because it now has required domain
  read grants.
- P0: `tenant.integration_admin` can run tracking-producing integration adapters through
  `tracking.event.record`.
- P0: Custom roles can be created only with `tenant.custom.*` keys.
- P0: Bootstrap role templates are protected from UI mutation and deletion.
- P0: Custom role permissions can be replaced transactionally.
- P0: Custom roles can be deleted only when no memberships are attached.
- P0: Membership roles can be assigned and revoked with anti-lockout protection.
- P0: Memberships can be activated, suspended, and removed.
- P0: Invitation resend and cancellation are supported for pending memberships.
- P0: Invitation acceptance uses an opaque token, hashed Better Auth `Verification` storage,
  password policy, email verification, active membership transition, audit, and outbox.
- P0: Local invitation delivery is available through outbox/notifications and privileged Admin UI
  copy link.
- P0: Authenticated users can revoke all other Better Auth sessions with audit and outbox.
- P0: All IAM mutations are organization-scoped, idempotent, audited, and emitted to outbox.
- P1: Better Auth two-factor plugin is configured with TOTP, trusted devices, encrypted backup
  codes, Prisma schema migration, sign-in challenge routing, and authenticated MFA enrollment UI.

## Pending Outside Current Code Scope

- P1: External email delivery provider credentials and domain reputation setup.
- P1: Better Auth organization plugin migration, if the product chooses to delegate organization
  invitation lifecycle to Better Auth instead of the platform-owned RBAC model.
- P2: Facility/corridor ABAC assignments after facility and corridor domain tables are introduced.
