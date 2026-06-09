# Telematics GPS Adapter

## Purpose

Telematics GPS Adapter is the fourth local external-adapter slice after Integration Gateway. It
processes GPS positions, geofence transitions, ETA delays, route deviations, and telemetry alerts
into governed Operational Tracking events without calling an external provider.

## Scope

- `/app/integrations` exposes the Telematics/GPS adapter form.
- `POST /rpc/integrations/processTelematicsGpsPosition` processes positions synchronously.
- `integration.adapter.telematics_gps.position.process` requires both `integration.event.ingest`
  and `tracking.event.record`.
- The selected service account must be active and must include both `integration.event.ingest` and
  `tracking.event.record`.
- The adapter resolves a shipment by `referenceCode` or `externalReference`.
- The adapter records a `telematics_gps.position` integration event and a mapped tracking event in
  one transaction.
- The adapter marks the integration event as processed only after the tracking event is created.

## Position Mapping

| Telematics/GPS position | Tracking event |
| --- | --- |
| `position_reported` | `location_updated` |
| `geofence_departure` | `departed` |
| `geofence_arrival` | `arrived` |
| `eta_delay` | `delayed` |
| `route_deviation` | `exception` |
| `sensor_alert` | `exception` |
| `telemetry_lost` | `exception` |

## Business Rules

- External GPS position identity is idempotent by `organizationId + sourceSystem + externalId`.
- Tracking event identity is idempotent by `telematics-gps + sourceSystem + externalId`.
- Latitude must be between -90 and 90; longitude must be between -180 and 180.
- Speed is optional but must be between 0 and 300 KPH when supplied.
- Heading is optional but must be between 0 and 359 degrees when supplied.
- Duplicate external GPS position replay returns the previous processed integration and tracking
  evidence.
- A conflicting existing external event type blocks adapter processing.
- Shipment status transitions reuse the Operational Tracking state model.
- Terminal shipments remain terminal when adapter events arrive.
- Device ID, asset reference, geofence, speed, heading, route, coordinates, and payload are
  preserved as operational evidence.
- Every processed position writes audit trail and outbox evidence.
- The adapter is local and synchronous; real telematics authentication, high-volume ingestion,
  streaming, geospatial indexing, map rendering, dead-letter queues, and device network integration
  remain production integration tasks.

## Local Evidence

- `packages/rpc/src/integrations.ts`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/web/components/integration-telematics-gps-position-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
