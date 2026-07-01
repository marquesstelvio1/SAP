# Governance: Architecture

**Phase:** 9 — Governance

---

## Principles

1. **RPC-first** — All communication through contracts
2. **Multi-tenant** — All data scoped to organization
3. **Immutable audit** — All mutations recorded
4. **Idempotent** — All mutations safe to retry
5. **Isolated** — Package boundaries strictly enforced
6. **Secure by design** — Defense in depth

## ADR Process

1. Identify architecture decision need
2. Write ADR in `docs/adr/` with template:
   - Title, Status, Date
   - Context and problem statement
   - Decision
   - Consequences (positive + negative)
   - Compliance
   - Notes
3. Review with architect agent
4. Approve (status: accepted, proposed, deprecated)
5. Update documentation

## Architecture Review Triggers

- New package or app
- New external dependency
- Layer boundary change
- Database schema change exceeding 5 models
- Auth model change
- RPC contract breaking change
- Deployment architecture change

## Architecture Quality Gates

- No circular dependencies
- Package dependency rules enforced
- RPC metadata complete
- Auth metadata declared
- Organization scoping present
- Tests for all new code
- Documentation updated
