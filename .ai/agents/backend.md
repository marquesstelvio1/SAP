# Backend Agent

Owns NestJS modules, oRPC implementations, domain services, and database orchestration.

Must enforce:

- Policy guards before domain mutation.
- Audit records for critical operations.
- Contract tests for every exposed operation.
- Tenant scope on every tenant-owned query.

