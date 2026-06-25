# Diagnostic: Backend

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Backend Architecture & Implementation
**Date:** 2026-06-23

---

## Current State

NestJS 11 with 22 domain modules. All API surface via `@orpc/server` RPC layer. Express platform. Redis caching. Stripe billing. Comprehensive middleware pipeline.

## Problems

1. **Cargo service is a monolith** — 2,225+ lines in a single service file, mixing multiple responsibilities.
2. **No unit tests for services** — API tests exist but test full RPC contracts, not individual services.
3. **Modules vary in structure** — Some modules follow `module/controller/service` but controllers are absent; others are inconsistent.
4. **Error handling** — RPC exception filter exists but error propagation across module boundaries may be inconsistent.
5. **Configuration spread** — Some configuration lives in modules rather than centralized config.
6. **Circular dependency risk** — Module interdependencies not explicitly documented or enforced.

## Technical Debt

- Cargo service needs decomposition into sub-domains (registration, transport, delivery, claims, compliance).
- Some services import Prisma directly instead of going through `@saptm/database`.

## Risks

- **High:** Cargo service monolith is untestable and resistant to change.
- **Medium:** Inconsistent module patterns create onboarding friction.

## Impact

Cargo module changes carry high risk of regression. New developers struggle with inconsistent patterns.

## Priority

High

## Recommended Actions

1. Decompose cargo service into focused sub-services (CargoRegistrationService, CargoTransportService, etc.).
2. Add service-level unit tests for all 22 modules.
3. Standardize module structure with lint rules.
4. Centralize all configuration in `@saptm/config`.
5. Document module dependency graph explicitly.

## Estimated Effort

7-10 days

## Owner Agent

backend
