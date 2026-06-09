# Rail TMS Adapter

## Purpose

Rail TMS Adapter is the second local external-adapter slice after Integration Gateway. It processes
rail transportation management system movement messages into governed Operational Tracking events
without calling an external provider.

## Scope

- `/app/integrations` exposes the Rail TMS adapter form.
- `POST /rpc/integrations/processRailTmsMovement` processes movements synchronously.
- `integration.adapter.rail_tms.movement.process` requires both `integration.event.ingest` and
  `tracking.event.record`.
- The selected service account must be active and must include both `integration.event.ingest` and
  `tracking.event.record`.
- The adapter resolves a shipment by `referenceCode` or `externalReference`.
- The adapter records a `rail_tms.movement` integration event and a mapped tracking event in one
  transaction.
- The adapter marks the integration event as processed only after the tracking event is created.

## Movement Mapping

| Rail TMS movement | Tracking event |
| --- | --- |
| `train_departed` | `departed` |
| `train_arrived` | `arrived` |
| `yard_departure` | `departed` |
| `yard_arrival` | `location_updated` |
| `delay_reported` | `delayed` |
| `infrastructure_hold` | `exception` |
| `handover_completed` | `handover_completed` |

## Business Rules

- External rail movement identity is idempotent by `organizationId + sourceSystem + externalId`.
- Tracking event identity is idempotent by `rail-tms + sourceSystem + externalId`.
- Duplicate external rail movement replay returns the previous processed integration and tracking
  evidence.
- A conflicting existing external event type blocks adapter processing.
- Shipment status transitions reuse the Operational Tracking state model.
- Terminal shipments remain terminal when adapter events arrive.
- Train number, rail corridor, wagon count, location, and payload are preserved as operational
  evidence.
- Every processed movement writes audit trail and outbox evidence.
- The adapter is local and synchronous; real Rail TMS authentication, polling, webhooks, EDI
  transformation, and railway network integration remain production integration tasks.

## Local Evidence

- `packages/rpc/src/integrations.ts`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/web/components/integration-rail-tms-movement-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
