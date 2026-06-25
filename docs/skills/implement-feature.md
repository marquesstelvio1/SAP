# Skill: implement-feature

**Mission:** Implement a new feature following architecture rules and standards.

**Inputs:**
- Feature specification
- Architecture documentation
- RPC contract patterns
- Existing implementation examples

**Outputs:**
- RPC contracts (Zod schemas + metadata)
- Service implementation
- Module wiring
- Tests
- Documentation updates

**Workflow:**
1. Understand feature requirements
2. Define RPC contracts (input/output schemas, metadata)
3. Implement service layer
4. Wire module in app.module.ts + rpc.module.ts
5. Add integration tests
6. Add frontend components (if applicable)
7. Update documentation
8. Verify with pnpm typecheck + pnpm test

**Validation:**
- Follows module pattern (module.ts, service.ts, types.ts)
- RPC metadata defined (auth, permissions, audit, idempotency)
- Tests pass
- TypeScript typecheck passes
- Documentation updated

**Deliverables:**
- Working feature implementation
- Tests
- Documentation updates
