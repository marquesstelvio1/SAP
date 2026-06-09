# Customs ERP Adapter Release Evidence

## Release Candidate

Customs ERP Adapter P18 is a local integration release candidate. It proves that customs and ERP
clearance statuses can enter the platform through the Integration Gateway and become auditable
Operational Tracking events without bypassing RBAC, service-account scope, idempotency, audit, or
outbox rules.

## Required Contracts

- RPC operation: `integration.adapter.customs_erp.status.process`.
- Transport path: `POST /rpc/integrations/processCustomsErpStatus`.
- Required user permissions: `integration.event.ingest` and `tracking.event.record`.
- Required service-account scopes: `integration.event.ingest` and `tracking.event.record`.
- Idempotency model: `organizationId + sourceSystem + externalId`.
- Tracking idempotency key: `customs-erp + sourceSystem + externalId`.

## Acceptance Criteria

- Customs ERP adapter requires tenant-scoped authenticated access.
- Customs ERP adapter requires an active service account with integration and tracking scopes.
- Customs ERP adapter resolves shipments by tracking reference or external reference.
- Customs ERP adapter records a `customs_erp.status` integration event.
- Customs ERP adapter maps customs status types into governed tracking event types.
- Customs ERP adapter preserves customs, document, declaration, broker, and authority evidence.
- Customs ERP adapter creates the tracking event and updates shipment state transactionally.
- Customs ERP adapter marks integration events processed only after tracking event creation.
- Customs ERP adapter replays duplicate external statuses without duplicate side effects.
- Customs ERP adapter writes audit and outbox evidence.
- Protected integration UI submits a real Customs/ERP status form.
- Authenticated integration E2E provisions a service account and processes a Customs/ERP status.

## Evidence Files

- `docs/features/customs-erp-adapter.md`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/web/components/integration-customs-erp-status-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
