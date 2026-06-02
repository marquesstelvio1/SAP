# Phase 2 — Business Architecture

## Business Capability Map

| Capability | Description | Primary Context |
| --- | --- | --- |
| Tenant Operations | Tenant lifecycle, partner relationships, facility ownership | Organizations |
| Identity Governance | User lifecycle, sessions, roles, service access | Auth |
| Facility Network Management | Ports, terminals, rail yards, corridors, capacity | Organizations |
| Cargo Lifecycle | Cargo registration, classification, custody, status | Cargo |
| Shipment Orchestration | Shipment intake, planning, transport order lifecycle | Transport Planning |
| Rail Operations | Train, wagon, path, timetable, departure, arrival events | Operations Tracking |
| Port Operations | Port call, berth, cargo handling, yard transfer events | Operations Tracking |
| Exception Management | Delay, disruption, SLA breach, escalation, resolution | Exceptions |
| Compliance Control | Documents, inspections, validations, retention evidence | Documents & Compliance |
| Financial Control | Tariffs, billing events, invoices, settlements | Billing & Settlement |
| Operational Intelligence | KPIs, forecasts, optimization, AI recommendations | Analytics & AI |
| Auditability | Immutable records for sensitive operations | Audit |

## Context Responsibilities

| Context | Responsibilities | Does Not Own |
| --- | --- | --- |
| Auth | Authentication, sessions, user identity, service credentials | Business permissions semantics |
| Organizations | Tenant, membership, facility ownership, partner relationships | Password/session implementation |
| Cargo | Cargo identity, classification, consignment, custody history | Route optimization |
| Transport Planning | Shipment planning, route selection, transport order lifecycle | Live telemetry ingestion |
| Operations Tracking | Operational events, movement state, port/rail execution timelines | Billing approval |
| Exceptions | Exception lifecycle, severity, assignment, resolution | Raw telemetry storage |
| Documents & Compliance | Document metadata, validation state, evidence | Physical cargo movement |
| Billing & Settlement | Charge events, invoice state, reconciliation | Tenant subscription management |
| Notifications | Alerts, escalation messages, delivery status | Business state mutation |
| Analytics & AI | Aggregation, forecasting, recommendations, explainability | Source-of-record writes |
| Audit | Immutable evidence for sensitive actions | Operational decision making |
| Reports | Report definitions, exports, schedules | Metric computation ownership |

## Contracts

| Contract | Producer | Consumers |
| --- | --- | --- |
| `OrganizationContract` | Organizations | Auth, Billing, Audit, Analytics |
| `MembershipContract` | Organizations | Auth, RPC guards, Audit |
| `FacilityContract` | Organizations | Planning, Operations, Analytics |
| `CargoContract` | Cargo | Planning, Documents, Tracking |
| `ShipmentContract` | Transport Planning | Operations, Billing, Analytics |
| `TransportOrderContract` | Transport Planning | Operations, Exceptions, Audit |
| `OperationalEventContract` | Operations Tracking | Exceptions, Analytics, Audit |
| `ExceptionContract` | Exceptions | Notifications, Analytics, Audit |
| `DocumentContract` | Documents & Compliance | Operations, Audit |
| `BillingEventContract` | Billing & Settlement | Reports, Audit |
| `AuditRecordContract` | Audit | Compliance, Reports |

## Integrations

| Integration | Direction | Examples |
| --- | --- | --- |
| Railway systems | inbound/outbound | train movement events, wagon allocation, timetable changes |
| Port community systems | inbound/outbound | vessel arrivals, berth allocation, cargo release |
| Terminal operating systems | inbound/outbound | yard moves, gate events, handling jobs |
| Customs and regulators | inbound/outbound | document validation, inspections, release status |
| IoT/telemetry platforms | inbound | GPS, RFID, scanner, sensor events |
| ERP/finance platforms | outbound/inbound | billing events, invoices, customer records |
| Notification providers | outbound | email, SMS, webhook, in-app alerts |
| AI/optimization services | internal/outbound | ETA prediction, route recommendation, anomaly detection |

## Domain Events

| Event | Meaning | Criticality |
| --- | --- | --- |
| `OrganizationCreated` | Tenant was provisioned | High |
| `UserInvited` | User invitation was created | Medium |
| `RoleAssigned` | Access changed | Critical |
| `FacilityActivated` | Facility can be used operationally | High |
| `CargoRegistered` | Cargo became trackable | High |
| `ShipmentCreated` | Shipment request exists | High |
| `TransportOrderConfirmed` | Movement plan is executable | Critical |
| `RailMovementDeparted` | Train segment started | High |
| `PortCallArrived` | Vessel reached port facility | High |
| `CargoHandoffConfirmed` | Custody changed | Critical |
| `OperationalExceptionRaised` | Operational risk exists | Critical |
| `OperationalExceptionResolved` | Risk was resolved | High |
| `DocumentApproved` | Compliance gate passed | Critical |
| `BillingEventGenerated` | Financial event exists | Medium |
| `AuditRecordCreated` | Sensitive action was recorded | Critical |

## Business Invariants

- Tenant isolation is mandatory unless a partner relationship explicitly allows shared visibility.
- Role grants cannot bypass ABAC constraints.
- Every cargo custody transition must be attributable to an actor or service.
- Every operational event must be idempotent and correlated.
- Every critical mutation must generate an audit record.
- AI output is advisory until explicitly approved by an authorized user.
- Reports are read models and must not become sources of truth.

