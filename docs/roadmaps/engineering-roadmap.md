# Roadmap: Engineering

**Phase:** 8 — Roadmap Engine

---

## Sprint 1: Foundation Hardening (Days 1-14)

| Task | Owner | Effort |
|---|---|---|
| Fix CSRF on RPC endpoints | security | 1 day |
| Add Prisma middleware for tenant scoping | database | 2-3 days |
| Add auth package tests | qa | 2 days |
| Deploy outbox worker | devops | 1 day |
| Encrypt OAuth tokens | auth | 0.5 day |
| Remove session IDs from telemetry | observability | 0.25 day |
| Verify Stripe webhook signatures | backend | 0.5 day |
| Add billing webhook idempotency | backend | 0.5 day |

**Total:** ~8-9 days

## Sprint 2: Test Coverage & Service Quality (Days 15-28)

| Task | Owner | Effort |
|---|---|---|
| Add tests for config, email, observability packages | qa | 1.5 days |
| Add database package tests | qa | 1 day |
| Begin cargo service decomposition | backend | 5-7 days |
| Add missing database indexes | database | 1 day |
| Add frontend component tests | frontend | 3-5 days |
| Add service-level tests for API modules | qa | 5-7 days |

**Total:** ~16-22 days

## Sprint 3: Observability & Security (Days 29-42)

| Task | Owner | Effort |
|---|---|---|
| Deploy production monitoring stack | devops | 5-6 days |
| Add per-operation rate limiting | security | 0.5 day |
| Add brute force protection | auth | 1 day |
| Add session revocation audit trail | auth | 0.5 day |
| Add tenant-level rate limiting | security | 2-3 days |
| Implement caching strategy | performance | 3-4 days |

**Total:** ~12-15 days

## Sprint 4: Quality & DX (Days 43-60)

| Task | Owner | Effort |
|---|---|---|
| Accessibility tests in CI | qa | 2-3 days |
| Complete Storybook stories | design-system | 3-4 days |
| Create devcontainer | devops | 1 day |
| Improve database seed | database | 1 day |
| Performance budget definition | performance | 1 day |
| Dark mode audit | design-system | 1 day |

**Total:** ~9-11 days
