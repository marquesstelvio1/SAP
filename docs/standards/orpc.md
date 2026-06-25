# Standard: oRPC

**Phase:** 4 — Engineering Standards

---

## Required

- All API-to-client communication through RPC contracts
- Every operation has metadata (name, version, kind, auth, permissions, audit)
- Mutations MUST explicitly declare auth mode
- Public operations MUST NOT have permissions
- Zod schemas for all input/output types
- Error catalog for all error codes
- Idempotency keys on all mutation operations

## RPC Metadata

```typescript
createRpcOperationMetadata({
  name: "cargo.register",
  version: 1,
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.register"] as const,
  audit: "standard",
  idempotency: "required",
  criticality: "high",
});
```

## Required Fields

| Field | Required | Notes |
|---|---|---|
| name | Yes | Unique dot-notation identifier |
| version | Default 1 | Increment on breaking changes |
| kind | Default query | query | mutation | subscription |
| auth | Default session | public | session | service |
| permissions | Default [] | Array of PlatformPermission |
| permissionMode | Default "all" | "all" | "any" |
| audit | Default "standard" | none | standard | sensitive | critical |
| idempotency | Default "none" | none | required | recommended |

## Error Handling

- Define errors in `@saptm/rpc/errors.ts`
- Use typed error codes
- Return errors via RPC error envelope

## Forbidden

- Direct HTTP endpoints for business logic
- RPC operations without metadata
- Breaking schema changes without version bump
- Returning raw database errors to clients

## Validation

- RPC contract tests in `packages/rpc/tests/`
- Metadata validation at build time
- Input/output Zod schema validation at runtime
- Authorization check on every operation

## Migration

- Version increment on breaking input/output changes
- Backward-compatible additions (new fields) don't require version bump
- Deprecate old version before removal
- Document migration in changelog
