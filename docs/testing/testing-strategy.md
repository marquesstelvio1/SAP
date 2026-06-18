# Phase 5 — Testing Strategy

## Position

Testing must verify contracts, policies, business rules, and operational reliability before UI workflows scale.

No critical feature is complete without tests for authorization, validation, audit, and observability behavior.

## Test Pyramid

| Layer | Purpose |
| --- | --- |
| Static | TypeScript, Biome, dependency boundaries |
| Unit | Pure domain logic, policy evaluation, utility functions |
| Contract | oRPC input/output/errors and compatibility |
| Integration | NestJS modules, Prisma queries, auth guards |
| E2E | Browser flows and critical operational journeys |
| Accessibility | Keyboard, screen reader, color contrast |
| Performance | API latency, query performance, ingestion throughput |
| Security | RBAC/ABAC, session handling, export controls |

## Required Test Coverage by Module

| Module | Required Tests |
| --- | --- |
| Auth | session validation, revocation, tenant selection, service credentials |
| Organizations | membership, role assignment, tenant isolation |
| Cargo | registration validation, custody event integrity |
| Planning | route constraints, transport order state machine |
| Operations | idempotent event ingestion, movement state transitions |
| Exceptions | severity, assignment, escalation, resolution audit |
| Documents | validation state, restricted export, retention |
| Billing | charge generation, invoice transitions |
| Analytics | scoped reports, export governance |
| Audit | immutable record creation and retrieval scope |

## Security Test Rules

- Every mutation must have a forbidden-case test.
- Every tenant-scoped read must have cross-tenant denial test.
- Every export must have data-classification test.
- Every critical action must assert audit record creation.
- Every service account endpoint must test scope enforcement.

## E2E Priority

0. Foundation runtime health without product pages.
1. Login and tenant selection.
2. Role-gated navigation.
3. Facility-scoped operations.
4. Shipment planning happy path.
5. Operational event tracking.
6. Exception escalation and resolution.
7. Report export governance.

E2E tests begin only after design system and first business feature are authorized.
The only allowed pre-feature E2E test is runtime health because it validates deployability without
creating screens, CRUDs, or business workflows.

## Test Data Strategy

- Test factories live in `@saptm/testing`.
- Fixtures are tenant-scoped.
- No production-like secret or customer data is committed.
- Integration tests use isolated schemas or disposable databases.
- Time-dependent tests use controlled clocks.

## Shared Testing Helpers

`@saptm/testing` provides foundation-only helpers for future tests:

- Auth context fixtures for user, service account, and platform actors.
- Trace context fixtures for deterministic telemetry context setup.
- Permission set helpers tied to `@saptm/auth`.
- Authorization assertion helpers independent of a specific test runner.
- RPC metadata and authorization helpers tied to `@saptm/rpc`.
- Foundation oRPC transport tests for `system.health`.

No rail, port, cargo, logistics, analytics, or automation fixture may be added before the
corresponding bounded context is approved.

## Acceptance Criteria

- Testing package exists before first feature tests.
- Shared auth, authorization, trace, and RPC testing helpers compile before first feature tests.
- Foundation RPC contract tests run through `pnpm test`.
- Runtime health E2E exists and `test:e2e` must not pass with an empty suite.
- First feature includes unit, contract, integration, and E2E coverage where applicable.
- Security denial tests exist for every critical mutation.
- CI runs tests by category.
