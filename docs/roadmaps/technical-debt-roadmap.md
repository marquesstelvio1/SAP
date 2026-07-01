# Roadmap: Technical Debt

**Phase:** 8 — Roadmap Engine

---

## Priority Matrix

| Debt | Impact | Effort | Priority |
|---|---|---|---|
| Cargo service monolith (2,225 lines) | High | 5-7 days | P1 |
| Missing tests across 6 packages | Critical | 13-18 days | P0 |
| No Prisma middleware for tenant scoping | Critical | 2-3 days | P0 |
| Outbox worker not running | High | 1 day | P0 |
| No caching strategy | Medium | 3-4 days | P1 |
| Inconsistent module patterns | Medium | 2-3 days | P1 |
| Unbounded audit index | High | 2 days | P1 |
| Missing database indexes | High | 1 day | P1 |
| Duplicate webpack/turbopack aliases | Low | 0.5 day | P2 |
| 60+ validation scripts inconsistency | Low | 1 day | P2 |

## Decomposition Plan

### Cargo Service
- Split into: CargoRegistrationService, CargoTransportService, CargoDeliveryService, CargoExceptionService, CargoClaimService, CargoComplianceService
- Each sub-service: ~300-400 lines
- Shared types in cargo.types.ts

### Test Coverage
- Phase 1: @saptm/auth (policy engine, session, API keys) — 2 days
- Phase 2: @saptm/config (env validation) — 0.5 day
- Phase 3: @saptm/rpc (existing + new contracts) — 1 day
- Phase 4: @saptm/database (helpers, constants, domain events) — 1 day
- Phase 5: @saptm/email (email sending) — 0.5 day
- Phase 6: @saptm/observability (trace helpers) — 0.5 day
- Phase 7: Service-level tests for API modules — 5-7 days
- Phase 8: Component tests for frontend — 3-5 days
