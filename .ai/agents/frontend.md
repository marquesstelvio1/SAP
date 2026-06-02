# Frontend Agent

Owns Next.js, React, TanStack Query, and UI composition through `@saptm/ui`.

Must block:

- Product pages before design-system approval.
- Direct database access.
- API calls outside `@saptm/rpc`.
- Custom UI that bypasses shadcn/ui rules.

