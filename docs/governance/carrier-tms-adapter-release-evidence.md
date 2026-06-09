# Carrier TMS Adapter Release Evidence

## Release Candidate

Carrier TMS Adapter P16 is a local integration release candidate. It proves that road carrier
movement data can enter the platform through the Integration Gateway and become an auditable
Operational Tracking event without bypassing RBAC, service-account scope, idempotency, audit, or
outbox rules.

## Required Contracts

- RPC operation: `integration.adapter.carrier_tms.movement.process`.
- Transport path: `POST /rpc/integrations/processCarrierTmsMovement`.
- Required user permissions: `integration.event.ingest` and `tracking.event.record`.
- Required service-account scopes: `integration.event.ingest` and `tracking.event.record`.
- Idempotency model: `organizationId + sourceSystem + externalId`.
- Tracking idempotency key: `carrier-tms + sourceSystem + externalId`.

## Acceptance Criteria

- Carrier TMS adapter requires tenant-scoped authenticated access.
- Carrier TMS adapter requires an active service account with integration and tracking scopes.
- Carrier TMS adapter resolves shipments by tracking reference or external reference.
- Carrier TMS adapter records a `carrier_tms.movement` integration event.
- Carrier TMS adapter maps road carrier movement types into governed tracking event types.
- Carrier TMS adapter creates the tracking event and updates shipment state transactionally.
- Carrier TMS adapter marks integration events processed only after tracking event creation.
- Carrier TMS adapter replays duplicate external movements without duplicate side effects.
- Carrier TMS adapter writes audit and outbox evidence.
- Protected integration UI submits a real Carrier TMS movement form.
- Authenticated integration E2E provisions a service account and processes a Carrier TMS movement.

## Evidence Files

- `docs/features/carrier-tms-adapter.md`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/web/components/integration-carrier-tms-movement-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
