# Customs ERP Adapter

## Purpose

Customs ERP Adapter is the fifth local external-adapter slice after Integration Gateway. It
processes customs and ERP clearance statuses into governed Operational Tracking events without
calling an external customs authority, ERP, broker, or EDI provider.

## Scope

- `/app/integrations` exposes the Customs/ERP adapter form.
- `POST /rpc/integrations/processCustomsErpStatus` processes clearance statuses synchronously.
- `integration.adapter.customs_erp.status.process` requires both `integration.event.ingest` and
  `tracking.event.record`.
- The selected service account must be active and must include both `integration.event.ingest` and
  `tracking.event.record`.
- The adapter resolves a shipment by `referenceCode` or `externalReference`.
- The adapter records a `customs_erp.status` integration event and a mapped tracking event in one
  transaction.
- The adapter marks the integration event as processed only after the tracking event is created.

## Status Mapping

| Customs/ERP status | Tracking event |
| --- | --- |
| `documents_received` | `location_updated` |
| `customs_hold` | `customs_hold` |
| `inspection_required` | `customs_hold` |
| `duty_paid` | `location_updated` |
| `customs_cleared` | `released` |
| `release_authorized` | `released` |
| `clearance_rejected` | `exception` |

## Business Rules

- External customs status identity is idempotent by `organizationId + sourceSystem + externalId`.
- Tracking event identity is idempotent by `customs-erp + sourceSystem + externalId`.
- Duplicate external customs status replay returns the previous processed integration and tracking
  evidence.
- A conflicting existing external event type blocks adapter processing.
- Customs hold and inspection statuses create governed blocker tracking events.
- Customs clearance and release authorization create governed release tracking events.
- Clearance rejection creates a governed exception tracking event.
- Shipment status transitions reuse the Operational Tracking state model.
- Terminal shipments remain terminal when adapter events arrive.
- Customs reference, document reference, declaration number, broker reference, authority code, and
  payload are preserved as operational evidence.
- Every processed status writes audit trail and outbox evidence.
- The adapter is local and synchronous; real customs authority authentication, ERP connector
  credentials, broker EDI, document validation, sanctions screening, high-volume queues, and
  provider-specific retries remain production integration tasks.

## Local Evidence

- `packages/rpc/src/integrations.ts`
- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/api/src/integrations/integrations-rpc.router.ts`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/web/components/integration-customs-erp-status-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
