# Phase 6 — Database Strategy

## Position

PostgreSQL is the system of record. Prisma manages schema, migrations, generated access types, and controlled data access through `@saptm/database`.

The platform must model multi-tenancy and operational traceability from day one. No business module may write to the database without tenant scope, validation, authorization, and audit classification.

## Persistence Principles

- Every tenant-owned table includes `organizationId`.
- Every mutable business table includes `createdAt`, `updatedAt`, and actor metadata where applicable.
- Critical lifecycle transitions are represented as events or append-only history.
- Integration writes are idempotent.
- Audit records are append-only and immutable.
- Analytics tables are derived read models, not sources of truth.

## Core Data Domains

| Domain | Main Tables (✓ = implemented, ⏳ = planned) |
| --- | --- |
| Auth | ✓ `User`, ✓ `TwoFactor`, ✓ `Session`, ✓ `Account`, ✓ `Verification`, ✓ `ServiceAccount`, ✓ `ApiKey` |
| Organizations | ✓ `Organization`, ✓ `Membership`, ✓ `Role`, ✓ `Permission`, ✓ `RolePermission`, ✓ `MembershipRole`, ✓ `Team`, ✓ `TeamMember`, ⏳ `Facility`, ⏳ `PartnerRelationship` |
| Cargo | ✓ `Cargo`, ✓ `CargoDeliveryException`, ✓ `CargoClaimSettlement`, ✓ `CargoOperationalHandoff`, ✓ `CargoComplianceEvidence`, ⏳ `Consignment`, ⏳ `CargoUnit` |
| Tracking | ✓ `TrackingShipment`, ✓ `TrackingEvent`, ✓ `Cargo` (via FK) |
| Planning | ✓ `TransportOrder`, ✓ `TransportOrderScheduleRevision`, ✓ `TransportOrderDispatch`, ⏳ `RoutePlan`, ⏳ `ScheduleWindow` |
| Capacity | ✓ `CapacityResource`, ✓ `CapacitySlot`, ✓ `CapacitySlotReservation`, ✓ `CapacityAdvisoryDecision` |
| Exceptions | (handled via ✓ `CargoDeliveryException` and tracking exception management commands; ⏳ dedicated `OperationalException` table planned) |
| Documents | ⏳ `Document`, ⏳ `DocumentValidation`, ⏳ `DocumentRetentionPolicy` — currently handled via ✓ `CargoComplianceEvidence` |
| Tariff | ✓ `TariffRateCard`, ✓ `TariffRateRule`, ✓ `TariffQuote` |
| Billing | ✓ `Subscription`, ✓ `Invoice`, ✓ `UsageRecord`, ⏳ `BillingEvent`, ⏳ `Settlement`, ⏳ `Charge` |
| Notifications | ✓ `Notification`, ✓ `OutboxEvent`, ⏳ `NotificationPreference`, ⏳ `NotificationDelivery` |
| Analytics | ⏳ `KpiSnapshot`, ⏳ `ReportDefinition`, ⏳ `ReportExport`, ⏳ `AiRecommendation` |
| Audit | ✓ `AuditRecord`, ✓ `OutboxEvent`, ⏳ `SupportAccessGrant` |
| Integrations | ✓ `IntegrationEvent`, ✓ `OutboxEvent`, ✓ `WebhookEndpoint`, ✓ `WebhookDelivery` |

## Tenancy Strategy

| Layer | Enforcement |
| --- | --- |
| API | Authenticated context must include active organization |
| Policy | ABAC verifies membership, role, facility, corridor, ownership, and support mode |
| Database | Tenant indexes and required tenant predicates for business queries |
| Audit | All sensitive audit records include tenant and actor context |
| Analytics | Aggregations are scoped by tenant and data classification |

Row-level security can be introduced later for defense in depth, but application-level policy is mandatory from the first database implementation.

## Entity Lifecycle Patterns

| Pattern | Applies To | Rule |
| --- | --- | --- |
| Soft delete | Organizations, facilities, documents | Preserve operational history |
| Append-only | Audit records, operational events, custody events | Never update business evidence |
| Versioned records | Documents, contracts, route plans | Preserve previous approved state |
| Idempotent ingestion | Integration events | Unique external source + external id |
| Derived read models | Reports, KPIs, AI features | Rebuildable from source records |

## Audit Trail Contract

`@saptm/database` exposes the persistable audit contract and safe Prisma mutation audit helpers.

Audit helpers are explicit by design. Global implicit Prisma middleware must not record arbitrary payloads because critical operations require redaction, severity, subject classification, actor context, tenant context, and failure behavior decisions.

## RBAC Bootstrap

`@saptm/database` exposes a local-safe RBAC bootstrap seed for the platform permission catalog.

- `pnpm db:seed` upserts permission keys only.
- `SAPTM_BOOTSTRAP_ORGANIZATION_ID=<id> pnpm db:seed` also applies tenant role templates.
- The seed does not create users, organizations, memberships, or product data.
- Runtime permission names remain governed by `@saptm/auth`.
- `pnpm auth:seed-local-admin` is a separate local-only onboarding seed for authenticated testing.
- The local admin seed refuses `NODE_ENV=production`, creates a verified Better Auth user, creates a local organization, applies RBAC templates, and assigns `tenant.admin`.

Full seed rules are defined in `docs/database/rbac-bootstrap.md`.

## Migration Strategy

- All schema changes are committed through Prisma migrations.
- Migrations must include rollback notes even when Prisma cannot auto-generate rollback.
- Breaking schema changes require expand-migrate-contract sequencing.
- Production migrations require dry-run and backup plan.
- Seed data must be limited to reference data and local development fixtures.

The current baseline migration is `packages/database/prisma/migrations/20260602160000_initial_foundation/migration.sql`.
Operational migration rules are defined in `docs/database/migration-runbook.md`.

## Backup and Restore Strategy

- Kubernetes deploys `saptm-database-backup` as a logical `pg_dump` CronJob per environment.
- Backup retention is controlled by `DATABASE_BACKUP_RETENTION_DAYS`.
- Restore uses `deploy/kubernetes/jobs/database-restore-job.example.yaml`, which is suspended by default.
- Production migrations require evidence of the latest successful backup.
- Offsite backup replication is mandatory before business data goes live.

Operational backup and restore rules are defined in `docs/database/backup-restore-runbook.md`.

## Indexing Strategy

Initial index families:

- Tenant scope: `organizationId`.
- Operational lookup: `organizationId + status`.
- Timeline lookup: `organizationId + createdAt`.
- Cargo tracking: `organizationId + cargoReference`.
- Shipment tracking: `organizationId + shipmentReference`.
- Movement tracking: `organizationId + movementReference`.
- Integration idempotency: `sourceSystem + externalId`.
- Audit retrieval: `organizationId + subjectType + subjectId + createdAt`.

## Data Classification

| Class | Examples | Controls |
| --- | --- | --- |
| Public | Marketing-safe metadata | Normal access |
| Internal | Facility names, corridor metadata | Tenant membership required |
| Confidential | Cargo details, shipment terms, invoices | Role + ABAC required |
| Restricted | Compliance documents, audit exports, support access | Explicit permission + audit |
| Critical | API keys, auth secrets, security events | Secret handling + restricted audit |

## Acceptance Criteria

- Prisma package exists before domain modules persist data.
- Tenant scope is present in every tenant-owned entity.
- Audit classification exists before critical mutations.
- Integration tables support idempotency and replay.
- Database strategy is referenced by each bounded-context implementation task.
- Backup and restore runbook exists before production data is created.
