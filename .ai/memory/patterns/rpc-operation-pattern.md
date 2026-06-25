# Pattern: RPC Operation Definition

**Category:** architecture
**Approved:** 2026-06-23
**Status:** active

## Context
When defining a new RPC operation in `@saptm/rpc`, follow this pattern.

## Structure

```typescript
import { createRpcOperationMetadata } from './metadata'
import { z } from 'zod'

const MyOperationInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
})

const MyOperationOutput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.date(),
})

const myOperation = createRpcOperation({
  metadata: createRpcOperationMetadata({
    name: 'myModule.myOperation',
    version: '1.0.0',
    kind: 'mutation',
    auth: 'session',
    permissions: ['myModule.write'],
    audit: true,
    idempotency: true,
    criticality: 'medium',
  }),
  input: MyOperationInput,
  output: MyOperationOutput,
  handler: async ({ input, context }) => {
    // implementation
  },
})
```

## Rules
- Always declare metadata
- Mutations must be idempotent
- Mutations must be audited
- Public operations have no permissions
