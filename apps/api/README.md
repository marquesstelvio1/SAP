# `@saptm/api`

NestJS API application for oRPC endpoints, domain modules, policy enforcement, persistence orchestration, integrations, audit, and observability.

Current status:

- Foundation package with runtime bootstrap.
- Environment validation runs before listening.
- CORS uses the shared trusted-origin contract.
- Health probes exist at `/health/live` and `/health/ready`.
- Prometheus metrics exist at `/metrics`.
- No domain modules implemented.
- No CRUDs.
- No business features.

Allowed next steps:

1. Add durable OpenTelemetry/exporter adapters after the first production backend is selected.
2. Add first bounded-context module only after database and RPC baselines exist.
3. Keep all business endpoints behind authorization metadata and audit rules.
