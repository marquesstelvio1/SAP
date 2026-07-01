# Schema Alignment Report

**Date:** 2026-06-23
**Task:** A-03 — Database model alignment (from CLEANUP_PLAN.md)
**Status:** ✅ Docs aligned to actual Prisma schema

---

## Summary

The Prisma schema was audited against architecture documentation to identify and fix discrepancies. The actual schema has grown beyond what the docs described.

| Metric | Docs (Before) | Actual Schema | Docs (After) |
|--------|--------------|---------------|--------------|
| Models | 22 | **41** | 41 |
| Enums | 28 | **33** | 33 |
| Relations | 35+ | 45+ | 45+ |
| Indices | 80+ | 75 | 75 |
| Unique Constraints | 60+ | 55 | 55 |

---

## Docs Changed

| Document | Changes Made |
|----------|-------------|
| `docs/architecture/domain-map.md` | Fixed all aggregate attributes to match actual schema. Removed phantom models (`TrackingException`, `TrackingAdvisory`) marked as "not yet implemented". Fixed `CapacityReservation` → `CapacitySlotReservation`, `RateCard` → `TariffRateCard`, `Usage` → `UsageRecord`. Added missing models (`TransportOrderDispatch`, `TransportOrderScheduleRevision`). Fixed status machines, removed nonexistent fields (`coordinates`, `locked`), fixed enum values (`closed` → `archived`). |
| `docs/database/database-strategy.md` | Replaced outdated "Core Data Domains" table with accurate listing showing ✓ implemented models and ⏳ planned models. |
| `docs/architecture/repository-analysis.md` | Updated model count (22→41), enum count (28→33), added full model listing by domain category. |
| `docs/architecture/stack-analysis.md` | Updated schema metrics (models: 22→41, enums: 28→33, relations: 35+→45+, indices: 80+→75, unique constraints: 60+→55, composite keys: 8→2). |
| `docs/enterprise/discovery.md` | Added implementation status column to Principal Entities table (✅ Implemented / ⏳ Planned). |
| `docs/FINAL_SUMMARY.md` | Updated database models count (22→41) and enums count (28→33). |
| `docs/enterprise/CLEANUP_PLAN.md` | Marked A-03 as ✅ Fixed with reference to this report. |

---

## Phantom Models Removed from Docs (Marked as "Planned")

These models existed in documentation but have no corresponding Prisma model. They represent aspirational/growth-phase entities:

| Phantom Model | Document | Current Status |
|---------------|----------|----------------|
| `TrackingException` | domain-map.md | Not implemented — exception lifecycle handled via `CargoDeliveryException` and tracking commands |
| `TrackingAdvisory` | domain-map.md | Not implemented — advisory logic is rule-based in service layer, no dedicated model |
| `Plan` | domain-map.md | Not implemented — plan is a string field on `Subscription` |
| `Facility` | database-strategy.md, discovery.md | Not implemented — planned for future Organizations expansion |
| `PartnerRelationship` | database-strategy.md | Not implemented — planned |
| `Consignment` | database-strategy.md, discovery.md | Not implemented — planned |
| `CargoUnit` | database-strategy.md | Not implemented — planned |
| `CargoCustodyEvent` | database-strategy.md | Not implemented — custody tracked via `CargoOperationalHandoff` |
| `Shipment` (standalone) | database-strategy.md | Implemented as `TrackingShipment` |
| `RoutePlan` | database-strategy.md | Not implemented — planned |
| `ScheduleWindow` | database-strategy.md | Not implemented — planned |
| `RailMovement` | database-strategy.md, discovery.md | Not implemented — planned |
| `PortCall` | database-strategy.md, discovery.md | Not implemented — planned |
| `HandlingJob` | database-strategy.md, discovery.md | Not implemented — planned |
| `OperationalEvent` | database-strategy.md | Implemented as `TrackingEvent` |
| `OperationalException` | database-strategy.md | Implemented via `CargoDeliveryException` + tracking exception commands |
| `ExceptionAssignment` | database-strategy.md | Not implemented — planned |
| `ExceptionResolution` | database-strategy.md | Not implemented — planned |
| `Document` | database-strategy.md, discovery.md | Implemented as `CargoComplianceEvidence` |
| `DocumentValidation` | database-strategy.md | Not implemented — planned |
| `DocumentRetentionPolicy` | database-strategy.md | Not implemented — planned |
| `Charge` | database-strategy.md | Not implemented — planned |
| `BillingEvent` | database-strategy.md | Not implemented — planned |
| `Settlement` | database-strategy.md | Implemented as `CargoClaimSettlement` |
| `NotificationPreference` | database-strategy.md | Not implemented — planned |
| `NotificationDelivery` | database-strategy.md | Not implemented — planned |
| `KpiSnapshot` | database-strategy.md | Not implemented — planned |
| `ReportDefinition` | database-strategy.md | Not implemented — planned |
| `ReportExport` | database-strategy.md | Not implemented — planned |
| `AiRecommendation` | database-strategy.md | Not implemented — planned |
| `SupportAccessGrant` | database-strategy.md | Not implemented — planned |
| `WebhookSubscription` | database-strategy.md | Implemented as `WebhookEndpoint` |

---

## Remaining Discrepancies (Deliberately Not Changed)

The following models are referenced in `domain-map.md` aggregate descriptions with deliberately simplified attribute lists. This is acceptable for a high-level architecture document:

| Model | Doc Attributes | Actual Additional Fields | Rationale |
|-------|---------------|------------------------|-----------|
| `Cargo` | ~7 key fields | ~40 fields total | Doc shows identity + status fields; detailed lifecycle fields documented in `docs/features/cargo-management.md` |
| `Organization` | id, name, slug, status | Also has 25+ relation fields | Doc shows identity attributes; relations are documented elsewhere |
| `AuditRecord` | ~8 key fields | ~12 fields total | Doc shows identification fields; `before`/`after` Json noted |

---

## Commitment

No Prisma schema files were modified during this alignment. All changes were to documentation only.

The Prisma schema at `packages/database/prisma/schema.prisma` (41 models, 33 enums) is the single source of truth for the database model. Documentation now accurately reflects this reality, with planned models clearly marked as ⏳ not yet implemented.
