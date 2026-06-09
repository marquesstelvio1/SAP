# Integration Gateway

## Purpose

Integration Gateway closes the local foundation for external adapters. It allows tenant
administrators to create scoped service accounts, receive hash-only API key material once, and
register idempotent external events before real EDI, ERP, TOS, customs, WMS, or carrier adapters
are connected. Port TOS Adapter P14, Rail TMS Adapter P15, Carrier TMS Adapter P16, Telematics GPS
Adapter P17, Customs ERP Adapter P18, and Warehouse WMS Adapter P19 now use this gateway to convert
external movement, position, clearance status, and warehouse activity messages into governed
tracking events.

## Scope

- `/app/integrations` is protected by `requirePlatformSession`.
- `integration.api_key.manage` protects service account and API key provisioning.
- `integration.event.ingest` protects external event registration.
- Service account API keys are stored as SHA-256 hashes with a non-secret prefix.
- External events are idempotent by `organizationId + sourceSystem + externalId`.
- Every critical command writes audit trail and outbox evidence.
- Port TOS movement processing requires both `integration.event.ingest` and
  `tracking.event.record`.
- Rail TMS movement processing requires both `integration.event.ingest` and
  `tracking.event.record`.
- Carrier TMS movement processing requires both `integration.event.ingest` and
  `tracking.event.record`.
- Telematics GPS position processing requires both `integration.event.ingest` and
  `tracking.event.record`.
- Customs ERP status processing requires both `integration.event.ingest` and
  `tracking.event.record`.
- Warehouse WMS activity processing requires both `integration.event.ingest` and
  `tracking.event.record`.

## Business Rules

- No external event can be registered without an active tenant service account.
- A service account must include `integration.event.ingest` before it can emit events.
- Plaintext API key material is returned only on initial non-replayed provisioning.
- Replayed provisioning by idempotency key never re-displays the plaintext API key.
- External event replay returns the existing event instead of duplicating audit/outbox side effects.
- Integration event payloads are intentionally limited to simple first-level JSON values locally.
- Port TOS adapter processing records the integration event and tracking event transactionally.
- Port TOS adapter replay returns previous processed evidence without duplicate tracking events.
- Rail TMS adapter processing records the integration event and tracking event transactionally.
- Rail TMS adapter replay returns previous processed evidence without duplicate tracking events.
- Carrier TMS adapter processing records the integration event and tracking event transactionally.
- Carrier TMS adapter replay returns previous processed evidence without duplicate tracking events.
- Telematics GPS adapter processing records the integration event and tracking event transactionally.
- Telematics GPS adapter replay returns previous processed evidence without duplicate tracking
  events.
- Customs ERP adapter processing records the integration event and tracking event transactionally.
- Customs ERP adapter replay returns previous processed evidence without duplicate tracking events.
- Warehouse WMS adapter processing records the integration event and tracking event transactionally.
- Warehouse WMS adapter replay returns previous processed evidence without duplicate tracking
  events.

## Local Evidence

- `packages/rpc/tests/integrations.test.mjs`
- `apps/api/tests/integrations-rpc.test.mjs`
- `apps/api/src/integrations/integrations.service.ts`
- `apps/web/components/integration-port-tos-movement-form.tsx`
- `apps/web/components/integration-rail-tms-movement-form.tsx`
- `apps/web/components/integration-carrier-tms-movement-form.tsx`
- `apps/web/components/integration-telematics-gps-position-form.tsx`
- `apps/web/components/integration-customs-erp-status-form.tsx`
- `apps/web/components/integration-warehouse-wms-activity-form.tsx`
- `apps/web/app/(platform)/app/integrations/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
