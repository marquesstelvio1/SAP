# Warehouse WMS Adapter Release Evidence

## Release Candidate

Warehouse WMS Adapter P19 is a local integration release candidate. It proves that warehouse,
dock, yard, and handling-unit activities can enter the platform through the Integration Gateway and
become auditable Operational Tracking events without bypassing RBAC, service-account scope,
idempotency, audit, or outbox rules.

## Required Contracts

- RPC operation: `integration.adapter.warehouse_wms.activity.process`.
- Transport path: `POST /rpc/integrations/processWarehouseWmsActivity`.
- Required user permissions: `integration.event.ingest` and `tracking.event.record`.
- Required service-account scopes: `integration.event.ingest` and `tracking.event.record`.
- Idempotency model: `organizationId + sourceSystem + externalId`.
- Tracking idempotency key: `warehouse-wms + sourceSystem + externalId`.

## Acceptance Criteria

- Warehouse WMS adapter requires tenant-scoped authenticated access.
- Warehouse WMS adapter requires an active service account with integration and tracking scopes.
- Warehouse WMS adapter resolves shipments by tracking reference or external reference.
- Warehouse WMS adapter records a `warehouse_wms.activity` integration event.
- Warehouse WMS adapter maps warehouse and yard activity types into governed tracking event types.
- Warehouse WMS adapter preserves warehouse, zone, dock, container, handling unit, operator, and pallet evidence.
- Warehouse WMS adapter creates the tracking event and updates shipment state transactionally.
- Warehouse WMS adapter marks integration events processed only after tracking event creation.
- Warehouse WMS adapter replays duplicate external activities without duplicate side effects.
- Warehouse WMS adapter writes audit and outbox evidence.
- Protected integration UI submits a real Warehouse/WMS activity form.
- Authenticated integration E2E provisions a service account and processes a Warehouse/WMS activity.

## Evidence Files

- `docs/features/warehouse-wms-adapter.md`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/web/components/integration-warehouse-wms-activity-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
