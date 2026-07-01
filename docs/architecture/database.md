# Database Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Tech Stack

- PostgreSQL 17
- Prisma ORM v7
- @prisma/adapter-pg
- Redis 7 (cache layer)

## Schema Organization

### Identity & Auth (5 models)
```
User ──┐
  ├── Session        (auth sessions)
  ├── Account        (OAuth + email/password accounts)
  ├── TwoFactor      (TOTP secrets)
  ├── Verification   (email verification tokens)
  └── LoginAttempt   (failed login tracking for account lockout)
```

### Multi-tenancy (7 models)
```
Organization ──┐
  ├── Membership ──┐
  │   └── MembershipRole ──┐
  ├── Role ────────────────┘
  │   └── RolePermission ──┐
  └── Permission ──────────┘
```

### Domain Models (10+)
```
Organization ──┐
  ├── Cargo ──┐
  │   ├── CargoDeliveryException
  │   ├── CargoClaimSettlement
  │   ├── CargoComplianceEvidence
  │   ├── CargoOperationalHandoff
  │   ├── TransportOrder ──┐
  │   │   ├── TransportOrderDispatch
  │   │   └── TransportOrderScheduleRevision
  │   ├── CapacitySlotReservation ──┐
  │   │   └── CapacityAdvisoryDecision
  │   └── TariffQuote
  ├── TrackingShipment ──┐
  │   ├── TrackingEvent
  │   └── Cargo (1:1)
  ├── CapacityResource ──┐
  │   └── CapacitySlot ──┐
  │       └── CapacitySlotReservation
  ├── TariffRateCard ──┐
  │   ├── TariffRateRule
  │   └── TariffQuote
  ├── Team ──┐
  │   └── TeamMember
  └── ...
```

### Supporting (5 models)
- AuditRecord — Immutable audit trail
- OutboxEvent — Transactional outbox
- Notification — User-facing notifications
- ServiceAccount — Integration identities
- ApiKey — Hashed API keys
- IntegrationEvent — External system events
- Subscription — Stripe subscriptions
- Invoice — Billing invoices
- UsageRecord — Resource usage tracking
- WebhookEndpoint — Webhook configuration
- WebhookDelivery — Webhook delivery logs

## Key Patterns

### Multi-tenant Data Isolation
All domain models have `organizationId` foreign key. Queries must filter by this field.

### Idempotency
Mutation tables use unique constraints on idempotency keys:
```prisma
@@unique([organizationId, registerIdempotencyKey])
@@unique([organizationId, releaseIdempotencyKey])
```

### Transactional Outbox
```
Mutation → AuditRecord + OutboxEvent → Notification
```
Events flow: Domain event → OutboxEvent (status: pending) → Processor → Published

### Audit Trail
```
AuditRecord {
  organizationId, actorType, actorId, action,
  subjectType, subjectId, severity,
  before (JSON), after (JSON), correlationId
}
```

## Index Strategy

- All foreign keys indexed
- Composite indexes on frequent query patterns (organizationId + status + date)
- Unique constraints on business keys (cargoReference, orderReference, etc.)
- Unique constraints on idempotency keys
