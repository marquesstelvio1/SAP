# Decision Log

**Phase:** 11 — AI Memory Layer

---

## Architecture Decisions

| Date | Decision | Rationale | Status |
|---|---|---|---|
| 2026-06-23 | RPC-first API | Uniform contract layer, typed schemas, metadata | active |
| 2026-06-23 | Multi-tenant by org | Industry standard for enterprise SaaS | active |
| 2026-06-23 | Flat permissions | Simplicity over hierarchy for current scale | active |
| 2026-06-23 | Transactional outbox | Reliable event delivery | active |
| 2026-06-23 | Immutable audit trail | Compliance + forensic capability | active |

## Diagnostic Decisions

| Date | Decision | Rationale | Status |
|---|---|---|---|
| 2026-06-23 | CSRF on RPC must be enabled | Critical security vulnerability | pending |
| 2026-06-23 | Prisma tenant middleware needed | Prevent cross-tenant data leak | pending |
| 2026-06-23 | Full test coverage required | Safety net for refactoring | pending |

## Format

Each decision entry should follow:
- **Date:** YYYY-MM-DD
- **Decision:** What was decided
- **Rationale:** Why this choice
- **Alternatives:** Options considered (optional)
- **Status:** active | superseded | pending
