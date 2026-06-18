# Warehouse WMS Adapter

## Purpose

Warehouse WMS Adapter is the sixth local external-adapter slice after Integration Gateway. It
processes warehouse, dock, yard, handling-unit, and inventory activities into governed Operational
Tracking events without calling an external WMS, yard system, scanner network, or warehouse
automation provider.

## Scope

- `/app/integrations` exposes the Warehouse/WMS adapter form.
- `POST /rpc/integrations/processWarehouseWmsActivity` processes warehouse activities
  synchronously.
- `integration.adapter.warehouse_wms.activity.process` requires both `integration.event.ingest` and
  `tracking.event.record`.
- The selected service account must be active and must include both `integration.event.ingest` and
  `tracking.event.record`.
- The adapter resolves a shipment by `referenceCode` or `externalReference`.
- The adapter records a `warehouse_wms.activity` integration event and a mapped tracking event in
  one transaction.
- The adapter marks the integration event as processed only after the tracking event is created.

## Activity Mapping

| Warehouse/WMS activity | Tracking event |
| --- | --- |
| `received_at_warehouse` | `arrived` |
| `putaway_completed` | `location_updated` |
| `picked_for_dispatch` | `location_updated` |
| `loaded_for_dispatch` | `departed` |
| `yard_check_in` | `location_updated` |
| `yard_check_out` | `departed` |
| `inventory_exception` | `exception` |
| `damage_reported` | `exception` |
| `handover_completed` | `handover_completed` |

## Business Rules

- External warehouse activity identity is idempotent by `organizationId + sourceSystem + externalId`.
- Tracking event identity is idempotent by `warehouse-wms + sourceSystem + externalId`.
- Duplicate external warehouse activity replay returns previous processed integration and tracking
  evidence.
- A conflicting existing external event type blocks adapter processing.
- Warehouse receipt creates governed arrival tracking evidence.
- Dispatch loading and yard check-out create governed departure tracking evidence.
- Inventory and damage exceptions create governed exception tracking evidence.
- Handover completion creates governed handover tracking evidence.
- Shipment status transitions reuse the Operational Tracking state model.
- Terminal shipments remain terminal when adapter events arrive.
- Warehouse code, zone, dock door, container, handling unit, operator, pallet count, location, and
  payload are preserved as operational evidence.
- Every processed activity writes audit trail and outbox evidence.
- The adapter is local and synchronous; real WMS authentication, mobile scanner ingestion,
  inventory reconciliation, yard automation, robotics events, high-volume queues, and provider
  retries remain production integration tasks.

## Local Evidence

- `packages/rpc/src/integrations.ts`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/web/components/integration-warehouse-wms-activity-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
