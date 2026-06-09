# Telematics GPS Adapter Release Evidence

## Release Candidate

Telematics GPS Adapter P17 is a local integration release candidate. It proves that GPS and
telemetry data can enter the platform through the Integration Gateway and become an auditable
Operational Tracking event without bypassing RBAC, service-account scope, idempotency, audit, or
outbox rules.

## Required Contracts

- RPC operation: `integration.adapter.telematics_gps.position.process`.
- Transport path: `POST /rpc/integrations/processTelematicsGpsPosition`.
- Required user permissions: `integration.event.ingest` and `tracking.event.record`.
- Required service-account scopes: `integration.event.ingest` and `tracking.event.record`.
- Idempotency model: `organizationId + sourceSystem + externalId`.
- Tracking idempotency key: `telematics-gps + sourceSystem + externalId`.

## Acceptance Criteria

- Telematics GPS adapter requires tenant-scoped authenticated access.
- Telematics GPS adapter requires an active service account with integration and tracking scopes.
- Telematics GPS adapter resolves shipments by tracking reference or external reference.
- Telematics GPS adapter records a `telematics_gps.position` integration event.
- Telematics GPS adapter maps position and alert types into governed tracking event types.
- Telematics GPS adapter validates coordinates, optional speed, and optional heading.
- Telematics GPS adapter creates the tracking event and updates shipment state transactionally.
- Telematics GPS adapter marks integration events processed only after tracking event creation.
- Telematics GPS adapter replays duplicate external positions without duplicate side effects.
- Telematics GPS adapter writes audit and outbox evidence.
- Protected integration UI submits a real Telematics/GPS position form.
- Authenticated integration E2E provisions a service account and processes a Telematics/GPS
  position.

## Evidence Files

- `docs/features/telematics-gps-adapter.md`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/web/components/integration-telematics-gps-position-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
