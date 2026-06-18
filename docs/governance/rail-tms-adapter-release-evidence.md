# Rail TMS Adapter Release Evidence

## Release Candidate

Rail TMS Adapter P15 is a local integration release candidate. It proves that railway movement data
can enter the platform through the Integration Gateway and become an auditable Operational Tracking
event without bypassing RBAC, service-account scope, idempotency, audit, or outbox rules.

## Required Contracts

- RPC operation: `integration.adapter.rail_tms.movement.process`.
- Transport path: `POST /rpc/integrations/processRailTmsMovement`.
- Required user permissions: `integration.event.ingest` and `tracking.event.record`.
- Required service-account scopes: `integration.event.ingest` and `tracking.event.record`.
- Idempotency model: `organizationId + sourceSystem + externalId`.
- Tracking idempotency key: `rail-tms + sourceSystem + externalId`.

## Acceptance Criteria

- Rail TMS adapter requires tenant-scoped authenticated access.
- Rail TMS adapter requires an active service account with integration and tracking scopes.
- Rail TMS adapter resolves shipments by tracking reference or external reference.
- Rail TMS adapter records a `rail_tms.movement` integration event.
- Rail TMS adapter maps railway movement types into governed tracking event types.
- Rail TMS adapter creates the tracking event and updates shipment state transactionally.
- Rail TMS adapter marks integration events processed only after tracking event creation.
- Rail TMS adapter replays duplicate external movements without duplicate side effects.
- Rail TMS adapter writes audit and outbox evidence.
- Protected integration UI submits a real Rail TMS movement form.
- Authenticated integration E2E provisions a service account and processes a Rail TMS movement.

## Evidence Files

- `docs/features/rail-tms-adapter.md`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/web/components/integration-rail-tms-movement-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
