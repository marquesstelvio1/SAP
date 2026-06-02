# Phase 6 — Database Strategy

## Position

PostgreSQL is the system of record. Prisma manages schema, migrations, generated access types, and controlled data access through `@saptm/database`.

The platform must model multi-tenancy and operational traceability from day one. No business module may write to the database without tenant scope, validation, authorization, and audit classification.

## Persistence Principles

- Every tenant-owned table includes `tenantId`.
- Every mutable business table includes `createdAt`, `updatedAt`, and actor metadata where applicable.
- Critical lifecycle transitions are represented as events or append-only history.
- Integration writes are idempotent.
- Audit records are append-only and immutable.
- Analytics tables are derived read models, not sources of truth.

## Core Data Domains

| Domain | Main Tables |
| --- | --- |
| Auth | `User`, `Session`, `Account`, `Verification`, Better Auth tables |
| Organizations | `Organization`, `Membership`, `Role`, `Permission`, `Facility`, `PartnerRelationship` |
| Cargo | `Cargo`, `Consignment`, `CargoUnit`, `CargoCustodyEvent` |
| Planning | `Shipment`, `RoutePlan`, `TransportOrder`, `ScheduleWindow` |
| Operations | `RailMovement`, `PortCall`, `HandlingJob`, `OperationalEvent` |
| Exceptions | `OperationalException`, `ExceptionAssignment`, `ExceptionResolution` |
| Documents | `Document`, `DocumentValidation`, `DocumentRetentionPolicy` |
| Billing | `Charge`, `Invoice`, `BillingEvent`, `Settlement` |
| Notifications | `Notification`, `NotificationPreference`, `NotificationDelivery` |
| Analytics | `KpiSnapshot`, `ReportDefinition`, `ReportExport`, `AiRecommendation` |
| Audit | `AuditRecord`, `SupportAccessGrant` |
| Integrations | `ServiceAccount`, `ApiKey`, `WebhookSubscription`, `IntegrationEvent`, `OutboxEvent` |

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

## Migration Strategy

- All schema changes are committed through Prisma migrations.
- Migrations must include rollback notes even when Prisma cannot auto-generate rollback.
- Breaking schema changes require expand-migrate-contract sequencing.
- Production migrations require dry-run and backup plan.
- Seed data must be limited to reference data and local development fixtures.

## Indexing Strategy

Initial index families:

- Tenant scope: `tenantId`.
- Operational lookup: `tenantId + status`.
- Timeline lookup: `tenantId + createdAt`.
- Cargo tracking: `tenantId + cargoReference`.
- Shipment tracking: `tenantId + shipmentReference`.
- Movement tracking: `tenantId + movementReference`.
- Integration idempotency: `sourceSystem + externalId`.
- Audit retrieval: `tenantId + subjectType + subjectId + createdAt`.

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
