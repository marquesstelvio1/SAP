# Flow: Implementation

**Phase:** 10 — Execution Pipeline

---

## Purpose
Implement features and fixes following architecture rules and standards.

## Inputs
- Task definition
- Architecture documentation
- Standards
- Rules

## Outputs
- Source code changes
- Tests
- Documentation updates

## Steps
1. Understand task requirements
2. Review relevant architecture, standards, rules
3. Implement RPC contracts (if new feature)
4. Implement service layer
5. Wire module
6. Write tests
7. Update documentation
8. Verify typecheck
9. Verify lint
10. Verify tests
11. Create commit

## Checkpoints
- [ ] RPC metadata complete
- [ ] Auth/permissions declared
- [ ] Organization scoping enforced
- [ ] Idempotency implemented (mutations)
- [ ] Audit trail implemented (mutations)
- [ ] Tests written
- [ ] TypeScript typecheck passes
- [ ] Tests pass

## Quality Gates
- Follows module pattern
- No `any` used
- No bypassed RBAC
- No direct Prisma in handlers
- No hardcoded secrets
- Semantic commit message
