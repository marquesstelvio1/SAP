# Frontend-Backend Validator Plugin

**ID:** `frontend-backend-validator`
**Version:** 1.0.0
**Kind:** validation
**Execution Order:** 50
**Mandatory:** true
**Runs On:** post-implementation
**Blocking:** true

## Mission

Validate the integration between frontend and backend. Ensure all APIs are consumed, all consumption has backend support, and the data flow is correct end-to-end.

## Validation Checklist

### 1. API Consumption Mapping

- [ ] All RPC operations are consumed by frontend
- [ ] All frontend data fetching uses RPC (not direct fetch)
- [ ] All TanStack Query hooks map to RPC operations
- [ ] Mutations use proper invalidation patterns

### 2. Orphan Detection

- [ ] No backend RPC operations without frontend consumers
- [ ] No frontend data calls without backend operation
- [ ] No unused TanStack Query keys
- [ ] No unused query hooks

### 3. TanStack Query Patterns

- [ ] Query keys follow consistent convention
- [ ] Query functions use RPC client (not raw fetch)
- [ ] Mutations use `useMutation` with proper invalidation
- [ ] Optimistic updates where appropriate
- [ ] Error boundaries for query failures
- [ ] Loading states handled
- [ ] Empty states handled

### 4. Type Safety

- [ ] Frontend uses types from `@saptm/rpc` contracts
- [ ] No manual type definitions for API responses
- [ ] No `as` type assertions for API data
- [ ] Schema validation on frontend for forms

### 5. Cache Configuration

- [ ] `staleTime` configured per query type
- [ ] `gcTime` configured appropriately
- [ ] `refetchInterval` for real-time data
- [ ] Cache invalidation on mutations correct
- [ ] Optimistic update rollback handling

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| FV01 | error | Backend operation without frontend consumer |
| FV02 | error | Frontend call without backend operation |
| FV03 | warning | Missing query key convention |
| FV04 | error | Manual API type (not from @saptm/rpc) |
| FV05 | warning | Missing error handling on mutation |
| FV06 | warning | Missing loading state |
| FV07 | error | `as` type assertion on API data |
| FV08 | info | Unused TanStack Query key |
| FV09 | warning | Missing optimistic update rollback |

## Output

Generate `integration-report.md` in `.ai/reports/`:

```markdown
# Frontend-Backend Integration Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- Operations Consumed: {n}/{total}
- Orphan Backend Operations: {n}
- Orphan Frontend Calls: {n}
- Type Safety Issues: {n}

## Consumption Map
| Operation | Backend | Frontend | Status |
|---|---|---|---|
| {name} | ✓ | ✓ | CONNECTED |

## Orphan Backend Operations
{operations not consumed by frontend}

## Orphan Frontend Calls
{calls without backend support}

## Type Safety
- Manual types: {n}
- `as` assertions: {n}
- Missing schema usage: {n}

## Recommendations
1. {recommendation}
```

## Success Criteria

- All backend operations consumed by frontend
- All frontend data fetching uses RPC contracts
- No orphan operations or calls
- Type safety validated
