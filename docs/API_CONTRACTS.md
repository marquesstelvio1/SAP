# SAPTM API Contracts

## Overview

The SAPTM platform exposes a unified RPC API surface built on **oRPC** with **Zod** schemas for runtime validation. The architecture follows a **contract-first** approach: every operation is defined by an oRPC contract in `packages/rpc/src/` with its input/output schemas, metadata, and authorization requirements co-located in a single file.

- **Transport:** oRPC over HTTP
- **Base URL:** `/v1/rpc` (alias: `/rpc`)
- **HTTP Mapping:** `query` → `GET`, `mutation` → `POST`
- **Framework:** NestJS 11 (API app) mounts contracts via `RpcModule`

## Authentication

- **Session-based auth** (Better Auth) is required for all operations except `system.health`.
- Operations declare required permissions from the [platform permission catalog](/packages/auth/src/permissions.ts).
- Permission mode can be `"all"` (all required permissions must be held) or `"any"` (at least one).
- Service accounts authenticate via API keys for integration adapter operations.
- Anonymous/unauthorized requests receive a `401 UNAUTHENTICATED` error.

## Error Format

Errors follow a standard envelope:

```json
{
  "code": "UNAUTHENTICATED | FORBIDDEN | VALIDATION_ERROR | CONFLICT | NOT_FOUND | RATE_LIMITED | INTEGRATION_ERROR | INTERNAL_ERROR",
  "message": "Human-readable description",
  "traceId": "optional-trace-id",
  "requestId": "optional-request-id",
  "details": {}
}
```

| Code | HTTP Status | Retryable |
|---|---|---|
| `UNAUTHENTICATED` | 401 | false |
| `FORBIDDEN` | 403 | false |
| `VALIDATION_ERROR` | 400 | false |
| `CONFLICT` | 409 | false |
| `NOT_FOUND` | 404 | false |
| `RATE_LIMITED` | 429 | true |
| `INTEGRATION_ERROR` | 502 | true |
| `INTERNAL_ERROR` | 500 | true |

## Metadata Schema

Every operation carries an `RpcOperationMetadata` object:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Dot-delimited operation identifier |
| `version` | `number` | Contract version (default 1) |
| `kind` | `"query" \| "mutation" \| "subscription"` | RPC operation kind |
| `auth` | `"public" \| "session" \| "service"` | Authentication mode |
| `permissions` | `PlatformPermission[]` | Required platform permissions |
| `permissionMode` | `"all" \| "any"` | Permission evaluation strategy |
| `organizationRequired` | `boolean` | Whether scoped to an organization |
| `audit` | `"none" \| "standard" \| "sensitive" \| "critical"` | Audit classification |
| `idempotency` | `"none" \| "required" \| "recommended"` | Idempotency handling |
| `observability` | `object` | Span/metric names, criticality, telemetry signals |

---

## Foundation

Health check endpoint — no authentication required.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `system.health` | GET | `/foundation/health` | public | — | — | false | 1 | none | none | low |

---

## Admin

Tenant-wide identity and role management.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | `admin.identity.overview.read` | GET | `/admin/overview` | session | `tenant.manage` \| `identity.user.invite` \| `identity.role.assign` | any | true | 1 | sensitive | none | high |
| 3 | `admin.user.invite` | POST | `/admin/user/invite` | session | `identity.user.invite` | all | true | 1 | critical | required | critical |
| 4 | `admin.role.assign` | POST | `/admin/role/assign` | session | `identity.role.assign` | all | true | 1 | critical | required | critical |
| 5 | `admin.role.create` | POST | `/admin/role/create` | session | `tenant.manage` + `identity.role.assign` | all | true | 1 | critical | required | critical |
| 6 | `admin.role.permissions.update` | POST | `/admin/role/permissions/update` | session | `tenant.manage` + `identity.role.assign` | all | true | 1 | critical | required | critical |
| 7 | `admin.role.delete` | POST | `/admin/role/delete` | session | `tenant.manage` + `identity.role.assign` | all | true | 1 | critical | required | critical |
| 8 | `admin.role.revoke` | POST | `/admin/role/revoke` | session | `identity.role.assign` | all | true | 1 | critical | required | critical |
| 9 | `admin.membership.status.update` | POST | `/admin/membership/status/update` | session | `identity.user.invite` + `identity.role.assign` | all | true | 1 | critical | required | critical |
| 10 | `admin.invitation.resend` | POST | `/admin/invitation/resend` | session | `identity.user.invite` | all | true | 1 | critical | required | critical |
| 11 | `admin.invitation.cancel` | POST | `/admin/invitation/cancel` | session | `identity.user.invite` | all | true | 1 | critical | required | critical |

---

## Audit

Audit log search and export.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 12 | `audit.records.search` | GET | `/audit/search` | session | `audit.read` | all | true | 1 | sensitive | none | high |
| 13 | `audit.records.export` | GET | `/audit/export` | session | `audit.read` + `report.export` | all | true | 1 | critical | none | critical |

---

## Billing

Subscription management, invoicing, and usage tracking.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 14 | `billing.overview` | GET | `/billing/overview` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 15 | `billing.checkout` | POST | `/billing/checkout` | session | `tenant.manage` | all | true | 1 | standard | recommended | medium |
| 16 | `billing.portal` | POST | `/billing/portal` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 17 | `billing.subscription` | GET | `/billing/subscription` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 18 | `billing.invoices` | GET | `/billing/invoices` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 19 | `billing.usage` | GET | `/billing/usage` | session | `tenant.manage` | all | true | 1 | standard | none | low |

---

## Capacity

Resource management, slot scheduling, reservations, and advisory decisions.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | `capacity.overview.read` | GET | `/capacity/overview` | session | `capacity.read` | all | true | 1 | standard | none | high |
| 21 | `capacity.optimization.advisory.read` | GET | `/capacity/advisory` | session | `capacity.read` | all | true | 1 | standard | none | high |
| 22 | `capacity.advisory.decision.analytics.read` | GET | `/capacity/advisory/decision/analytics` | session | `capacity.read` | all | true | 1 | standard | none | high |
| 23 | `capacity.resource.register` | POST | `/capacity/resource/register` | session | `capacity.manage` | all | true | 1 | critical | required | critical |
| 24 | `capacity.slot.open` | POST | `/capacity/slot/open` | session | `capacity.manage` | all | true | 1 | critical | required | critical |
| 25 | `capacity.slot.reserve` | POST | `/capacity/slot/reserve` | session | `capacity.slot.reserve` | all | true | 1 | critical | required | critical |
| 26 | `capacity.slot.cancel` | POST | `/capacity/slot/cancel` | session | `capacity.slot.cancel` | all | true | 1 | critical | required | critical |
| 27 | `capacity.advisory.decision.record` | POST | `/capacity/advisory/decision/record` | session | `capacity.advisory.decide` | all | true | 1 | critical | required | critical |

---

## Cargo

Full cargo lifecycle — registration, transport planning, departure/arrival, delivery, exceptions, claims, handoffs, and compliance evidence.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 28 | `cargo.overview.read` | GET | `/cargo/overview` | session | `cargo.read` | all | true | 1 | standard | none | high |
| 29 | `cargo.register` | POST | `/cargo/register` | session | `cargo.register` | all | true | 1 | critical | required | critical |
| 30 | `cargo.release` | POST | `/cargo/release` | session | `cargo.release` | all | true | 1 | critical | required | critical |
| 31 | `cargo.transport.plan` | POST | `/cargo/transport/plan` | session | `cargo.transport.plan` | all | true | 1 | critical | required | critical |
| 32 | `cargo.transport.depart` | POST | `/cargo/transport/depart` | session | `cargo.transport.depart` | all | true | 1 | critical | required | critical |
| 33 | `cargo.transport.arrive` | POST | `/cargo/transport/arrive` | session | `cargo.transport.arrive` | all | true | 1 | critical | required | critical |
| 34 | `cargo.delivery.complete` | POST | `/cargo/delivery/complete` | session | `cargo.delivery.complete` | all | true | 1 | critical | required | critical |
| 35 | `cargo.delivery.exception.record` | POST | `/cargo/delivery/exception/record` | session | `cargo.delivery.exception.record` | all | true | 1 | critical | required | critical |
| 36 | `cargo.delivery.exception.resolve` | POST | `/cargo/delivery/exception/resolve` | session | `cargo.delivery.exception.resolve` | all | true | 1 | critical | required | critical |
| 37 | `cargo.claim.settle` | POST | `/cargo/claim/settle` | session | `cargo.claim.settle` | all | true | 1 | critical | required | critical |
| 38 | `cargo.handoff.record` | POST | `/cargo/handoff/record` | session | `cargo.handoff.record` | all | true | 1 | critical | required | critical |
| 39 | `cargo.compliance.evidence.record` | POST | `/cargo/compliance/evidence/record` | session | `cargo.compliance.record` | all | true | 1 | critical | required | high |
| 40 | `cargo.compliance.evidence.verify` | POST | `/cargo/compliance/evidence/verify` | session | `cargo.compliance.verify` | all | true | 1 | critical | required | critical |

---

## Integrations

Integration gateway — service accounts, event ingestion, and domain-specific adapters (Port TOS, Rail TMS, Carrier TMS, Telematics GPS, Customs ERP, Warehouse WMS).

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 41 | `integration.gateway.overview.read` | GET | `/integrations/overview` | session | `integration.api_key.manage` \| `integration.event.ingest` | any | true | 1 | sensitive | none | high |
| 42 | `integration.service_account.create` | POST | `/integrations/service-account/create` | session | `integration.api_key.manage` | all | true | 1 | critical | required | critical |
| 43 | `integration.event.record` | POST | `/integrations/event/record` | session | `integration.event.ingest` | all | true | 1 | critical | required | critical |
| 44 | `integration.adapter.port_tos.movement.process` | POST | `/integrations/adapter/port-tos/movement` | session | `integration.event.ingest` + `tracking.event.record` | all | true | 1 | critical | required | critical |
| 45 | `integration.adapter.rail_tms.movement.process` | POST | `/integrations/adapter/rail-tms/movement` | session | `integration.event.ingest` + `tracking.event.record` | all | true | 1 | critical | required | critical |
| 46 | `integration.adapter.carrier_tms.movement.process` | POST | `/integrations/adapter/carrier-tms/movement` | session | `integration.event.ingest` + `tracking.event.record` | all | true | 1 | critical | required | critical |
| 47 | `integration.adapter.telematics_gps.position.process` | POST | `/integrations/adapter/telematics-gps/position` | session | `integration.event.ingest` + `tracking.event.record` | all | true | 1 | critical | required | critical |
| 48 | `integration.adapter.customs_erp.status.process` | POST | `/integrations/adapter/customs-erp/status` | session | `integration.event.ingest` + `tracking.event.record` | all | true | 1 | critical | required | critical |
| 49 | `integration.adapter.warehouse_wms.activity.process` | POST | `/integrations/adapter/warehouse-wms/activity` | session | `integration.event.ingest` + `tracking.event.record` | all | true | 1 | critical | required | critical |

---

## Notifications

In-app notification inbox.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 50 | `notification.inbox.read` | GET | `/notifications/inbox` | session | `notification.read` | all | true | 1 | standard | none | high |
| 51 | `notification.mark_read` | POST | `/notifications/mark-read` | session | `notification.read` | all | true | 1 | standard | none | high |

---

## Planning

Transport order lifecycle — confirm, cancel, reschedule, dispatch.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 52 | `planning.overview.read` | GET | `/planning/overview` | session | `planning.order.read` | all | true | 1 | standard | none | high |
| 53 | `planning.transport_order.confirm` | POST | `/planning/transport-order/confirm` | session | `planning.order.confirm` | all | true | 1 | critical | required | critical |
| 54 | `planning.transport_order.cancel` | POST | `/planning/transport-order/cancel` | session | `planning.order.cancel` | all | true | 1 | critical | required | critical |
| 55 | `planning.transport_order.reschedule` | POST | `/planning/transport-order/reschedule` | session | `planning.order.reschedule` | all | true | 1 | critical | required | critical |
| 56 | `planning.transport_order.dispatch` | POST | `/planning/transport-order/dispatch` | session | `planning.order.dispatch` | all | true | 1 | critical | required | critical |

---

## Reports

Data export across domains.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 57 | `report.export.generate` | GET | `/reports/export` | session | `report.export` | all | true | 1 | critical | none | critical |

---

## Settings

Organization profile and branding.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 58 | `settings.organization.update` | POST | `/settings/organization` | session | `tenant.manage` | all | true | 1 | standard | recommended | low |
| 59 | `settings.branding.update` | POST | `/settings/branding` | session | `tenant.manage` | all | true | 1 | standard | none | low |

---

## Tariff

Rate card management, tariff rules, quote calculation, and approval.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 60 | `tariff.overview.read` | GET | `/tariff/overview` | session | `tariff.read` | all | true | 1 | standard | none | high |
| 61 | `tariff.rate_card.register` | POST | `/tariff/rate-card/register` | session | `tariff.manage` | all | true | 1 | critical | required | critical |
| 62 | `tariff.rate_rule.add` | POST | `/tariff/rate-rule/add` | session | `tariff.manage` | all | true | 1 | critical | required | critical |
| 63 | `tariff.quote.calculate` | POST | `/tariff/quote/calculate` | session | `tariff.quote.calculate` | all | true | 1 | critical | required | critical |
| 64 | `tariff.quote.approve` | POST | `/tariff/quote/approve` | session | `tariff.quote.approve` | all | true | 1 | critical | required | critical |

---

## Teams

Team CRUD and member management.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 65 | `team.create` | POST | `/teams/create` | session | `tenant.manage` | all | true | 1 | sensitive | required | medium |
| 66 | `team.update` | POST | `/teams/update` | session | `tenant.manage` | all | true | 1 | sensitive | required | medium |
| 67 | `team.delete` | POST | `/teams/delete` | session | `tenant.manage` | all | true | 1 | sensitive | required | medium |
| 68 | `team.list` | GET | `/teams/list` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 69 | `team.get` | GET | `/teams/get` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 70 | `team.member.add` | POST | `/teams/member/add` | session | `tenant.manage` | all | true | 1 | sensitive | required | medium |
| 71 | `team.member.remove` | POST | `/teams/member/remove` | session | `tenant.manage` | all | true | 1 | sensitive | required | medium |
| 72 | `team.member.role.update` | POST | `/teams/member/role/update` | session | `tenant.manage` | all | true | 1 | sensitive | required | medium |

---

## Tracking

Shipment overview, analytics, AI advisory, event recording, shipment detail, and exception management.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 73 | `tracking.overview.read` | GET | `/tracking/overview` | session | `tracking.shipment.read` | all | true | 1 | standard | none | high |
| 74 | `tracking.analytics.read` | GET | `/tracking/analytics` | session | `tracking.shipment.read` | all | true | 1 | standard | none | high |
| 75 | `tracking.ai.advisory.read` | GET | `/tracking/advisory` | session | `tracking.shipment.read` | all | true | 1 | standard | none | high |
| 76 | `tracking.event.record` | POST | `/tracking/event/record` | session | `tracking.event.record` | all | true | 1 | critical | required | critical |
| 77 | `tracking.shipment.detail.read` | GET | `/tracking/shipment/detail` | session | `tracking.shipment.read` | all | true | 1 | standard | none | high |
| 78 | `tracking.exception.manage` | POST | `/tracking/exception/manage` | session | `tracking.exception.manage` | all | true | 1 | critical | required | critical |
| 79 | `tracking.exception.resolve` | POST | `/tracking/exception/resolve` | session | `tracking.exception.resolve` | all | true | 1 | critical | required | critical |

---

## Webhooks

Webhook endpoint management and delivery monitoring.

| # | Operation | Method | Path | Auth | Required Permissions | Permission Mode | Org Required | Version | Audit | Idempotency | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 80 | `webhook.create` | POST | `/webhooks/create` | session | `tenant.manage` | all | true | 1 | sensitive | none | medium |
| 81 | `webhook.update` | POST | `/webhooks/update` | session | `tenant.manage` | all | true | 1 | sensitive | none | medium |
| 82 | `webhook.delete` | POST | `/webhooks/delete` | session | `tenant.manage` | all | true | 1 | sensitive | none | medium |
| 83 | `webhook.list` | GET | `/webhooks/list` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 84 | `webhook.deliveryLog` | GET | `/webhooks/delivery-log` | session | `tenant.manage` | all | true | 1 | standard | none | low |
| 85 | `webhook.retryDelivery` | POST | `/webhooks/retry-delivery` | session | `tenant.manage` | all | true | 1 | sensitive | none | medium |

---

## Summary

| Domain | Queries | Mutations | Total |
|---|---|---|---|
| Foundation | 1 | 0 | 1 |
| Admin | 1 | 9 | 10 |
| Audit | 2 | 0 | 2 |
| Billing | 4 | 2 | 6 |
| Capacity | 3 | 5 | 8 |
| Cargo | 1 | 12 | 13 |
| Integrations | 1 | 8 | 9 |
| Notifications | 1 | 1 | 2 |
| Planning | 1 | 4 | 5 |
| Reports | 1 | 0 | 1 |
| Settings | 0 | 2 | 2 |
| Tariff | 1 | 4 | 5 |
| Teams | 2 | 6 | 8 |
| Tracking | 4 | 3 | 7 |
| Webhooks | 2 | 4 | 6 |
| **Total** | **25** | **60** | **85** |
