# Backend Skill

## Scope

NestJS modules, oRPC implementations, domain services, Prisma orchestration, and policy enforcement.

## Rules

- Implement one bounded context at a time.
- Never bypass auth and policy guards.
- Use `@saptm/database` for persistence access.
- Emit audit records for critical mutations.
- Add contract and integration tests for exposed operations.

## Outputs

- Module boundary.
- Contract implementation.
- Policy checks.
- Audit and observability notes.
- Required tests.

