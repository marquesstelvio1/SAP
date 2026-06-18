# Port TOS Adapter Release Evidence

## Release Candidate

Port TOS Adapter P14 is a local integration release candidate. It proves that an external terminal
movement can enter the platform through the Integration Gateway and become an auditable
Operational Tracking event without bypassing RBAC, service-account scope, idempotency, audit, or
outbox rules.

## Required Contracts

- RPC operation: `integration.adapter.port_tos.movement.process`.
- Transport path: `POST /rpc/integrations/processPortTosMovement`.
- Required user permissions: `integration.event.ingest` and `tracking.event.record`.
- Required service-account scopes: `integration.event.ingest` and `tracking.event.record`.
- Idempotency model: `organizationId + sourceSystem + externalId`.
- Tracking idempotency key: `port-tos + sourceSystem + externalId`.

## Acceptance Criteria

- Port TOS adapter requires tenant-scoped authenticated access.
- Port TOS adapter requires an active service account with integration and tracking scopes.
- Port TOS adapter resolves shipments by tracking reference or external reference.
- Port TOS adapter records a `port_tos.movement` integration event.
- Port TOS adapter maps TOS movement types into governed tracking event types.
- Port TOS adapter creates the tracking event and updates shipment state transactionally.
- Port TOS adapter marks integration events processed only after tracking event creation.
- Port TOS adapter replays duplicate external movements without duplicate side effects.
- Port TOS adapter writes audit and outbox evidence.
- Protected integration UI submits a real Port TOS movement form.
- Authenticated integration E2E provisions a service account and processes a Port TOS movement.

## Evidence Files

- `docs/features/port-tos-adapter.md`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/web/components/integration-port-tos-movement-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
