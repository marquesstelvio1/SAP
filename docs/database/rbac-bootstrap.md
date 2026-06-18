# RBAC Bootstrap Seed

## Purpose

Seed the platform permission catalog and provide tenant role templates before any business
feature or CRUD is implemented.

## Scope

The seed is deliberately limited:

- Always upserts platform permission keys.
- Applies tenant role templates only when `SAPTM_BOOTSTRAP_ORGANIZATION_ID` is provided.
- Does not create users, organizations, cargo records, rail operations, port operations, or product data.
- Does not assign roles to members.

## Permission Catalog

The database seed mirrors the runtime permission catalog exposed by `@saptm/auth`.

Seeded permissions:

- `tenant.manage`
- `identity.user.invite`
- `identity.role.assign`
- `integration.api_key.manage`
- `integration.event.ingest`
- `audit.read`
- `report.export`
- `notification.read`
- `cargo.read`
- `cargo.register`
- `cargo.release`
- `cargo.transport.plan`
- `cargo.transport.depart`
- `cargo.transport.arrive`
- `cargo.handoff.record`
- `cargo.claim.settle`
- `cargo.delivery.complete`
- `cargo.delivery.exception.record`
- `cargo.delivery.exception.resolve`
- `cargo.compliance.record`
- `cargo.compliance.verify`
- `capacity.read`
- `capacity.manage`
- `capacity.slot.reserve`
- `capacity.slot.cancel`
- `capacity.advisory.decide`
- `planning.order.read`
- `planning.order.confirm`
- `planning.order.cancel`
- `planning.order.reschedule`
- `planning.order.dispatch`
- `tariff.read`
- `tariff.manage`
- `tariff.quote.calculate`
- `tariff.quote.approve`
- `tracking.shipment.read`
- `tracking.event.record`
- `tracking.exception.manage`
- `tracking.exception.resolve`

## Role Templates

Templates available for tenant bootstrap:

| Role | Permissions |
| --- | --- |
| `tenant.admin` | All bootstrap permissions |
| `tenant.security_admin` | Invite users, assign roles, read audit |
| `tenant.integration_admin` | Manage API keys, ingest integration events, record tracking events, read audit |
| `tenant.auditor` | Read audit, export reports |
| `tenant.report_exporter` | Export reports and read reportable operational domains |
| `tenant.finance_manager` | Manage tariff, pricing, quote approvals, audit, and exports |
| `tenant.cargo_operator` | Execute cargo, custody, compliance, delivery, and tracking workflows |
| `tenant.capacity_planner` | Manage capacity, reservations, advisory decisions, and planning execution |
| `tenant.tracking_operator` | Operate tracking events, exceptions, and recovery workflows |
| `tenant.compliance_officer` | Review compliance evidence, release readiness, audit, and exports |
| `tenant.integration_operator` | Ingest external events and run tracking-producing adapters |
| `tenant.operations_manager` | Full operational manager role across cargo, tracking, capacity, planning, tariff, audit, reports, and notifications |
| `tenant.operations_viewer` | Read operational dashboards and notifications |

## Runtime IAM Operations

The Admin module now exposes governed local operations for:

- custom role creation with `tenant.custom.*` keys;
- custom role permission replacement;
- custom role deletion when no memberships are attached;
- membership role assignment and revocation;
- membership activation, suspension, and removal;
- invitation resend and cancellation for pending memberships;
- opaque invitation token acceptance with hashed `Verification` storage;
- self-service revocation of other Better Auth sessions.

Bootstrap role templates are protected from UI mutation. Changes to those templates must be made in
code and re-applied by `pnpm db:seed` with `SAPTM_BOOTSTRAP_ORGANIZATION_ID`.

## Pending External Identity Work

The current Better Auth setup uses the minimal email/password provider and platform-owned RBAC.
Invitation delivery is implemented locally through Admin UI copy link plus outbox/notifications.
Better Auth two-factor schema migration is implemented locally through the `TwoFactor` model and
`User.twoFactorEnabled`. External SMTP/transactional email credentials and Better Auth
organization-plugin migration remain production-integration decisions.

## Commands

Seed permission catalog only:

```powershell
pnpm db:seed
```

Seed permissions and roles for an existing organization:

```powershell
$env:SAPTM_BOOTSTRAP_ORGANIZATION_ID="<organization-id>"; pnpm db:seed
```

Seed a local tenant admin for authenticated browser testing:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:25432/saptm"; pnpm auth:seed-local-admin
```

Default local-only credentials:

- Email: `admin@saptm.local`
- Password: `LocalAdmin!2026`

Supported overrides:

- `SAPTM_LOCAL_ADMIN_EMAIL`
- `SAPTM_LOCAL_ADMIN_NAME`
- `SAPTM_LOCAL_ADMIN_PASSWORD`
- `SAPTM_LOCAL_ORGANIZATION_NAME`
- `SAPTM_LOCAL_ORGANIZATION_SLUG`

## Safety Rules

- The script is idempotent.
- Permission descriptions are updated on every seed run.
- Role permissions are upserted, not blindly inserted.
- Organization roles are never created without an explicit organization id.
- User membership assignments remain a separate audited operation.
- The local admin seed is separate from `db:seed` and refuses `NODE_ENV=production`.
- The local admin seed is idempotent and resets the local credential password to the configured value.
