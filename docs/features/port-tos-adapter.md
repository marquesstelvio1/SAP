# Port TOS Adapter

## Purpose

Port TOS Adapter is the first local external-adapter slice after Integration Gateway. It processes
terminal operating system movement messages into governed Operational Tracking events without
calling an external provider.

## Scope

- `/app/integrations` exposes the adapter form.
- `POST /rpc/integrations/processPortTosMovement` processes movements synchronously.
- `integration.adapter.port_tos.movement.process` requires both `integration.event.ingest` and
  `tracking.event.record`.
- The selected service account must be active and must include both `integration.event.ingest` and
  `tracking.event.record`.
- The adapter resolves a shipment by `referenceCode` or `externalReference`.
- The adapter records a `port_tos.movement` integration event and a mapped tracking event in one
  transaction.
- The adapter marks the integration event as processed only after the tracking event is created.

## Movement Mapping

| Port TOS movement | Tracking event |
| --- | --- |
| `gate_in` | `location_updated` |
| `loaded` | `location_updated` |
| `departed` | `departed` |
| `arrived` | `arrived` |
| `delayed` | `delayed` |
| `customs_hold` | `customs_hold` |
| `handover_completed` | `handover_completed` |

## Business Rules

- External movement identity is idempotent by `organizationId + sourceSystem + externalId`.
- Tracking event identity is idempotent by `port-tos + sourceSystem + externalId`.
- Duplicate external movement replay returns the previous processed integration and tracking
  evidence.
- A conflicting existing external event type blocks adapter processing.
- Shipment status transitions reuse the Operational Tracking state model.
- Terminal shipments remain terminal when adapter events arrive.
- Every processed movement writes audit trail and outbox evidence.
- The adapter is local and synchronous; real TOS authentication, polling, webhooks, and EDI
  transformation remain production integration tasks.

## Local Evidence

- `packages/rpc/src/integrations.ts`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/web/components/integration-port-tos-movement-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
