# Architecture Rules

1. Do not implement product features before the foundation index is accepted.
2. Do not create a new module without a bounded-context owner.
3. Do not reverse dependency direction between apps and packages.
4. Do not put business rules in `apps/web`.
5. Do not put database access in `@saptm/rpc` or `@saptm/ui`.
6. Do not expose an API operation without contract metadata.
7. Do not extract a microservice without an ADR.

