# DOMAIN MAP — SAPTM

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Source:** `apps/api/src/*` modules, `packages/rpc/src/*` contracts, `packages/database` schema

---

## 1. CARGO DOMAIN

**Module:** `apps/api/src/cargo/`
**RPC Contracts:** `packages/rpc/src/cargo.ts`

### Bounded Context
Core logistics domain managing the lifecycle of physical freight from registration through delivery, including exceptions, claims, compliance evidence, and operational handoffs.

### Aggregates
| Aggregate | Key Attributes | Status Machine |
|---|---|---|
| `Cargo` | id, organizationId, cargoReference, cargoType, grossWeightKg, packageCount, volumeM3, hazardous, customsStatus, conditionStatus, priority; shipper/consignee/origin/destination/custodyOwner names | registered → ready_for_transport → in_transport → held → delivered → cancelled |
| `CargoDeliveryException` | id, cargoId, exceptionType, deliveryConditionStatus, evidenceReference, claimReference, resolverName, resolutionCode | open → resolved |
| `CargoClaimSettlement` | id, deliveryExceptionId, settlementType, currencyCode, settlementAmount, settledByName, counterpartyName | settled (terminal) |
| `CargoOperationalHandoff` | id, cargoId, handoffType, fromCustodyOwnerName, toCustodyOwnerName, handoffLocationName, operatorName, sealReference, conditionStatus | recorded |
| `CargoComplianceEvidence` | id, cargoId, evidenceType, documentReference, documentUri, issuerName, status, reviewerName, reviewReference | pending_review → approved/rejected |

### Value Objects
`CargoReference`, `GrossWeight` (primitive wrapper + unit), `VolumeM3`

### Domain Events
```
cargo.registered              → triggers tracking shipment creation, audit trail
cargo.released                → triggers customs release notification
cargo.transport_planned       → links cargo to tracking shipment
cargo.transport_departed      → triggers GPS telematics subscription
cargo.transport_arrived       → triggers arrival notification
cargo.delivery_completed      → triggers POD generation, invoice trigger
cargo.delivery_exception.recorded → triggers claim workflow
cargo.delivery_exception.resolved  → restores delivery flow
cargo.claim_settlement.recorded    → triggers financial reconciliation
cargo.operational_handoff.recorded → triggers custody chain update
cargo.compliance_evidence.recorded → triggers compliance review
cargo.compliance_evidence.verified → triggers release gate
```

### Business Rules (1020+ lines in `business-rules.ts`)
- Movement blocked on customs-held, damaged, inspection-required
- Release requires customs clearence or release authorization
- Departure requires: cargo ready, shipment planned, approved compliance evidence, no open compliance review
- Arrival requires: cargo in transport, shipment in_transit, arrival after departure
- Delivery requires: cargo arrived, shipment arrived, delivery after arrival, condition accepted
- Settlement requires: resolved exception, claim reference matched, no duplicate

### External Dependencies
- `@saptm/rpc` for contract types/schemas
- `@saptm/database` for persistence
- `@saptm/observability` for tracing
- Tracking domain for shipment/event creation

---

## 2. TRACKING DOMAIN

**Module:** `apps/api/src/tracking/`
**RPC Contracts:** `packages/rpc/src/tracking.ts`

### Bounded Context
Real-time shipment tracking — manages shipment lifecycle, telematics events, GPS positions, anomalies, and operational advisories.

### Aggregates
| Aggregate | Key Attributes | Status Machine |
|---|---|---|
| `TrackingShipment` | id, organizationId, referenceCode, transportMode, cargoId, plannedDepartureAt, estimatedArrivalAt, actualArrivalAt | planned → in_transit → arrived → completed / exception |
| `TrackingEvent` | id, shipmentId, eventType, occurredAt, locationName, correlationId, payload | immutable log |
| `TrackingException` | _(not yet implemented — planned aggregate for exception lifecycle)_ | planned |
| `TrackingAdvisory` | _(not yet implemented — planned aggregate for AI/rule-based advisory)_ | planned |

### Domain Events
```
tracking.shipment.created     → cargo link established
tracking.shipment.status_changed → status transition (9 possible statuses)
tracking.event.recorded       → telemetry ingestion acknowledged
tracking.exception.raised     → alert dispatch
tracking.exception.resolved   → alert cleared
tracking.advisory.published   → decision required notification
tracking.advisory.decided     → operational action triggered
```

### External Dependencies
- Cargo domain for cargo-to-shipment linking
- Capacity domain for slot reservations on advisories
- Notifications domain for alert dispatch

---

## 3. CAPACITY DOMAIN

**Module:** `apps/api/src/capacity/`
**RPC Contracts:** `packages/rpc/src/capacity.ts`

### Bounded Context
Resource and slot management — registers transport resources (vessels, railcars, trucks), manages booking windows, reservations, and advisory overcapacity decisions.

### Aggregates
| Aggregate | Key Attributes | Status Machine |
|---|---|---|
| `CapacityResource` | id, organizationId, resourceCode, resourceName, resourceType, locationName, maxConcurrentBookings | active (implicit, no status enum) |
| `CapacitySlot` | id, resourceId, slotReference, windowStart, windowEnd, capacityUnits, reservedUnits | open → blocked → closed |
| `CapacitySlotReservation` | id, slotId, cargoId, reservationReference, reservationPurpose, reservedUnits | reserved → cancelled |
| `CapacityAdvisoryDecision` | id, organizationId, recommendationId, recommendationType, decisionStatus, slotId, reservationId | approved / rejected |

### Value Objects
`TimeWindow` (start/end), `CapacityUnit` (TEU, tons, cubic meters)

### Domain Events
```
capacity.resource.registered
capacity.slot.opened
capacity.slot.reserved
capacity.slot.cancelled
capacity.advisory.decision.recorded
capacity.advisory.decision.analytics
```

### External Dependencies
- Tracking domain for advisory-associated shipments
- Cargo domain for reservation cargo context

---

## 4. PLANNING DOMAIN

**Module:** `apps/api/src/planning/`
**RPC Contracts:** `packages/rpc/src/planning.ts`

### Bounded Context
Transport operations planning — manages transport orders, schedule revisions, and dispatch coordination across multimodal networks.

### Aggregates
| Aggregate | Key Attributes | Status Machine |
|---|---|---|
| `TransportOrder` | id, organizationId, cargoId, mode, carrierName, routeSummary, originName, destinationName, plannedDepartureAt, plannedArrivalAt | confirmed → cancelled |
| `TransportOrderScheduleRevision` | id, orderId, previous/new mode, carrier, route, origin, destination, departure, arrival | recorded (immutable) |
| `TransportOrderDispatch` | id, orderId, dispatchReference, dispatchedByName, dispatchInstructions | recorded (immutable) |

### Value Objects
`Route` (origin → destination via checkpoints), `ScheduleWindow`

### Domain Events
```
planning.order.created
planning.order.confirmed
planning.order.cancelled
planning.order.rescheduled
planning.order.dispatched
planning.schedule.revised
```

### External Dependencies
- Tariff domain for rate calculation on dispatch
- Cargo domain for cargo assignment
- Capacity domain for slot reservation

---

## 5. TARIFF DOMAIN

**Module:** `apps/api/src/tariff/`
**RPC Contracts:** `packages/rpc/src/tariff.ts`

### Bounded Context
Pricing and rate management — manages rate cards, rate rules, and customer quote generation for transport services.

### Aggregates
| Aggregate | Key Attributes | Status Machine |
|---|---|---|
| `TariffRateCard` | id, organizationId, rateCardCode, rateCardName, currencyCode, validFrom, validUntil | draft → active → retired |
| `TariffRateRule` | id, rateCardId, ruleCode, chargeName, chargeType, calculationBasis, unitRate/flatAmount/percentageRate | active (status implicit via rate card) |
| `TariffQuote` | id, organizationId, cargoId, rateCardId, quoteReference, currencyCode, quotedAmount, calculationPayload | calculated → approved → rejected → expired |

### Domain Events
```
tariff.rate_card.registered
tariff.rate_rule.added
tariff.quote.calculated
tariff.quote.approved
```

### External Dependencies
- Planning domain for quote-to-order linkage
- Billing domain for invoice generation

---

## 6. IDENTITY & ACCESS DOMAIN

**Module:** `apps/api/src/auth/`, `packages/auth/`
**RPC Contracts:** `packages/rpc/src/admin.ts`

### Bounded Context
Authentication, session management, role-based access control, and service account management.

### Aggregates
| Aggregate | Key Attributes |
|---|---|
| `User` | id, name, email, emailVerified, twoFactorEnabled, image |
| `Role` | id, organizationId, key, name, description; permissions via `RolePermission` join table |
| `ServiceAccount` | id, organizationId, name, scopes, active, apiKeys |

### Platform Permissions (40 total)
- Tenant: `tenant.manage`
- Identity: `identity.user.invite`, `identity.role.assign`
- Integration: `integration.api_key.manage`, `integration.event.ingest`
- Audit: `audit.read`
- Report: `report.export`
- Notification: `notification.read`
- Cargo (13): read, register, release, transport.plan, transport.depart, transport.arrive, handoff.record, claim.settle, delivery.complete, delivery.exception.record, delivery.exception.resolve, compliance.record, compliance.verify
- Tracking (4): shipment.read, event.record, exception.manage, exception.resolve
- Capacity (5): read, manage, slot.reserve, slot.cancel, advisory.decide
- Planning (5): order.read, order.confirm, order.cancel, order.reschedule, order.dispatch
- Tariff (4): read, manage, quote.calculate, quote.approve
- Billing: `billing.read`

### Domain Events
```
auth.user.invited
auth.user.joined
auth.user.removed
auth.role.assigned
auth.role.revoked
auth.session.created
auth.session.expired
```

### External Dependencies
- Better Auth framework (`packages/auth/src/server.ts`)
- `@saptm/database` for Prisma adapter
- `@saptm/email` for invitation emails

---

## 7. ORGANIZATIONS DOMAIN

**Module:** `apps/api/src/organizations/`
**Teams Sub-Module:** `apps/api/src/teams/`
**RPC Contracts:** `packages/rpc/src/teams.ts`

### Bounded Context
Multi-tenant organization management — owns organization lifecycle, memberships, facilities, partner relationships, and team management.

### Aggregates
| Aggregate | Key Attributes |
|---|---|
| `Organization` | id, name, slug, status (active/suspended/archived) |
| `Membership` | userId, organizationId, status (invited/active/suspended/removed); roles via `MembershipRole` join table |
| `Team` | id, organizationId, name, slug, description; members via `TeamMember` join table |

### Domain Events
```
organization.created
organization.updated
organization.suspended
member.invited
member.joined
member.removed
team.created
team.updated
```

### External Dependencies
- `@saptm/database` for persistence
- `@saptm/email` for invitation emails
- Auth module for role/permission integration

---

## 8. BILLING DOMAIN

**Module:** `apps/api/src/billing/`
**RPC Contracts:** `packages/rpc/src/billing.ts`

### Bounded Context
Subscription management, usage tracking, and invoice generation via Stripe integration.

### Aggregates
| Aggregate | Key Attributes |
|---|---|
| `Subscription` | id, organizationId, plan (string name), status, stripeCustomerId, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd |
| `Invoice` | id, organizationId, stripeInvoiceId, amount (int, cents), currency, status (string) |
| `UsageRecord` | id, organizationId, metric, current, limit, periodStart, periodEnd |
| `Plan` | _(not yet implemented — currently modeled as a string on Subscription)_ |

### Domain Events
```
billing.subscription.created
billing.subscription.updated
billing.subscription.canceled
billing.invoice.paid
billing.usage.recorded
```

### External Dependencies
- Stripe API for payment processing
- Tariff domain for usage-based billing triggers

---

## 9. INTEGRATIONS DOMAIN

**Module:** `apps/api/src/integrations/`
**RPC Contracts:** `packages/rpc/src/integrations.ts`

### Bounded Context
External system integration — ingests events from TMS, WMS, GPS telematics, port systems, and customs ERP, translates them into domain events.

### External System Types
| Integration Type | Direction | Protocol |
|---|---|---|
| `CarrierTmsMovement` | Inbound | REST webhook |
| `PortTosMovement` | Inbound | REST webhook |
| `RailTmsMovement` | Inbound | REST webhook |
| `WarehouseWmsActivity` | Inbound | REST webhook |
| `TelematicsGpsPosition` | Inbound | REST webhook |
| `CustomsErpStatus` | Inbound | REST webhook |
| `EventRecord` | Inbound | Generic event API |

### Aggregates
| Aggregate | Key Attributes |
|---|---|
| `ServiceAccount` | id, organizationId, name, scopes, active; credentials via `ApiKey` model |

### Domain Events
```
integration.event.ingested
integration.movement.processed
integration.gps_position.recorded
integration.customs_status.updated
```

### External Dependencies
- Tracking domain for event recording
- Cargo domain for status updates
- Audit domain for integration audit trail

---

## 10. NOTIFICATIONS DOMAIN

**Module:** `apps/api/src/notifications/`
**RPC Contracts:** `packages/rpc/src/notifications.ts`

### Bounded Context
User-facing notification delivery — manages inbox/outbox pattern for internal notifications with severity classification.

### Aggregates
| Aggregate | Key Attributes |
|---|---|
| `Notification` | id, organizationId, eventType, aggregateType, aggregateId, title, message, severity, status (unread/read/archived) |

### Domain Events
```
notification.created
notification.marked_read
notification.batch_delivered
```

### External Dependencies
- Outbox pattern via `@saptm/database` (outbox-event-bus.ts)

---

## 11. DOCUMENTS DOMAIN

**Module:** `apps/api/src/documents/`
**RPC Contracts:** `packages/rpc/src/cargo.ts` (compliance evidence sub-operations)

### Bounded Context
Document metadata management — owns document validation state, compliance evidence lifecycle, and retention rules independently of cargo.

### Aggregates
| Aggregate | Key Attributes |
|---|---|
| `Document` | id, organizationId, referenceType, documentReference, documentUri, issuerName, status, reviewerName, reviewReference |

### Value Objects
`DocumentReference`, `DocumentStatus` (pending_review → approved/rejected)

### Domain Events
```
document.uploaded
document.verified
document.rejected
document.expired
```

### External Dependencies
- `@saptm/database` for persistence
- Cargo domain for linked cargo compliance evidence

---

## 12. AUDIT DOMAIN

**Module:** `apps/api/src/audit/`
**RPC Contracts:** `packages/rpc/src/audit.ts`

### Bounded Context
Immutable audit trail for all critical domain operations — supports search, filtering, and export.

### Aggregates
| Aggregate | Key Attributes |
|---|---|
| `AuditRecord` | id, organizationId, action, subjectType, subjectId, actorId, payload, severity |

### Domain Events
```
audit.record.created
audit.export.requested
```

### External Dependencies
- Every domain module (audit records are created cross-domain)
- `@saptm/database` for persistence

---

## CROSS-CUTTING CONCERNS

### Admin Module (`apps/api/src/admin/`)
- Platform-level administration (user management, system configuration)
- RPC Contracts: `packages/rpc/src/admin.ts`

### Settings Module (`apps/api/src/settings/`)
- Organization-level settings and branding configuration
- RPC Contracts: `packages/rpc/src/settings.ts`

### Health Module (`apps/api/src/health/`)
- Health check endpoints (`/health/live`, `/health/ready`)
- Used by Kubernetes for liveness and readiness probes

### RPC Layer (`apps/api/src/rpc/`)
- Contract-based communication via `@saptm/rpc`
- Context propagation (`RpcRequestWithAuthContext`, `AuthorizedRpcContext`)
- Exception filtering via `RpcErrorEnvelope`

### Event Bus (`apps/api/src/event-bus/`)
- Outbox-based event publishing
- Types: `IntegrationEvent`, `DomainEvent`

### Observability (`apps/api/src/observability/`, `packages/observability/`)
- OpenTelemetry tracing
- Prometheus metrics
- Structured logging

### Cache (`apps/api/src/cache/`)
- Redis-backed cache manager
- Used for rate limiting, session cache

### Rate Limiting (`apps/api/src/rate-limit/`)
- Global NestJS throttler with per-operation granularity

### Reports Module (`apps/api/src/reports/`)
- Cross-domain operational report export — generates CSV exports of domain records with audit trail and outbox event
- Supports cargo, tracking, capacity, planning, and tariff domains
- RPC Contracts: `packages/rpc/src/reports.ts`
- Key Operation: `report.export.generate` — reads domain rows and produces CSV content; requires `report.export` permission

### Security Module (`apps/api/src/security/`)
- CSRF protection via `csrf-csrf` double-submit cookie pattern with signed cookies
- API security headers middleware (CSP, HSTS, XFO, COOP, CORP, Permissions-Policy, Referrer-Policy)

### Webhooks (`apps/api/src/webhooks/`)
- Outbound webhook delivery to external systems
- Event-driven via outbox pattern
