# Carrier TMS Adapter

## Purpose

Carrier TMS Adapter is the third local external-adapter slice after Integration Gateway. It processes
road carrier transportation management system movement messages into governed Operational Tracking
events without calling an external provider.

## Scope

- `/app/integrations` exposes the Carrier TMS adapter form.
- `POST /rpc/integrations/processCarrierTmsMovement` processes movements synchronously.
- `integration.adapter.carrier_tms.movement.process` requires both `integration.event.ingest` and
  `tracking.event.record`.
- The selected service account must be active and must include both `integration.event.ingest` and
  `tracking.event.record`.
- The adapter resolves a shipment by `referenceCode` or `externalReference`.
- The adapter records a `carrier_tms.movement` integration event and a mapped tracking event in one
  transaction.
- The adapter marks the integration event as processed only after the tracking event is created.

## Movement Mapping

| Carrier TMS movement | Tracking event |
| --- | --- |
| `pickup_completed` | `departed` |
| `linehaul_departed` | `departed` |
| `in_transit_update` | `location_updated` |
| `delivery_arrived` | `arrived` |
| `delivery_completed` | `arrived` |
| `delay_reported` | `delayed` |
| `exception_reported` | `exception` |
| `handover_completed` | `handover_completed` |

## Business Rules

- External carrier movement identity is idempotent by `organizationId + sourceSystem + externalId`.
- Tracking event identity is idempotent by `carrier-tms + sourceSystem + externalId`.
- Duplicate external carrier movement replay returns the previous processed integration and tracking
  evidence.
- A conflicting existing external event type blocks adapter processing.
- Shipment status transitions reuse the Operational Tracking state model.
- Terminal shipments remain terminal when adapter events arrive.
- Carrier code, vehicle plate, driver reference, route code, location, and payload are preserved as
  operational evidence.
- Every processed movement writes audit trail and outbox evidence.
- The adapter is local and synchronous; real Carrier TMS authentication, polling, webhooks, EDI
  transformation, telematics integration, and carrier network integration remain production
  integration tasks.

## Local Evidence

- `packages/rpc/src/integrations.ts`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/web/components/integration-carrier-tms-movement-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
