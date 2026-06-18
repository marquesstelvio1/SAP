# Local Production Closure

## Status

Date: 2026-06-06

The local production-like foundation is closed. P0 local has zero open tasks for the current baseline.

This means the platform can run locally with API, Web, PostgreSQL, Redis, migrations, RBAC seed, local tenant admin onboarding, health checks, smoke checks, E2E checks, typed RPC contracts, authenticated dashboard data states, the first protected read-only business slice, the first protected event-recording UI slice, the first protected shipment timeline UI slice, the first governed exception command, authenticated exception-management UI, the governed exception-resolution command, authenticated exception-resolution UI, operator evidence with approval context for exception lifecycle changes, exception workflow completion states, operational analytics aggregates, local advisory recommendations with mandatory human approval, visual regression coverage, release evidence for the first business module, Cargo Management P0 registration, Cargo Management P1 governed release/readiness, Cargo Management P2 Cargo-to-Tracking linkage, Cargo Management P3 compliance evidence, Cargo Management P4 departure lifecycle, Cargo Management P5 arrival/delivery lifecycle, Cargo Management P6 delivery exception lifecycle, Cargo Management P7 operational handoff lifecycle, Cargo Management P8 claims settlement accounting, Capacity Management P9 capacity/slot constraints, Capacity Optimization Advisory P11, Capacity Advisory Decision P12, Capacity Advisory Decision Analytics P20, Transport Planning P26 confirmation, replaneamento, dispatch, cancellation, and post-dispatch guard lifecycle, Tariff / Pricing P10 rate cards, rate rules, tax-aware quotes, and approvals, Admin Identity/RBAC user invitation plus role assignment, Audit Query/Export search, detail, and CSV export, Operational Reports export for Tracking, Cargo, Capacity, Planning, and Tariff, Notifications / Inbox with outbox worker processing, Integration Gateway P13 service accounts plus idempotent external events, Port TOS Adapter P14 local movement processing into Operational Tracking, Rail TMS Adapter P15 local railway movement processing into Operational Tracking, Carrier TMS Adapter P16 local road carrier movement processing into Operational Tracking, Telematics GPS Adapter P17 local GPS position processing into Operational Tracking, Customs ERP Adapter P18 local customs status processing into Operational Tracking, and Warehouse WMS Adapter P19 local warehouse activity processing into Operational Tracking.

## Closed Locally

### Frontend

- Next.js runtime builds successfully.
- Authenticated app shell exists before business UI expansion.
- Anonymous users are redirected from `/app` to `/sign-in`.
- Anonymous users are redirected from `/app/tracking` to `/sign-in?next=%2Fapp%2Ftracking`.
- Tracking overview route exists as a protected read-only entry point.
- Control Center renders real authenticated session, tenant, RBAC, and tracking overview states when authorized.
- E2E covers web health, sign-in, protected shell redirect, and protected tracking redirect.
- Event recording UI exists and is disabled without `tracking.event.record`.
- Tracking UI calls the secure backend command instead of direct database writes.
- Tracking overview links to shipment detail without creating generic CRUD.
- Shipment detail/timeline UI shows event source, payload, correlation, and tenant-scoped state.
- Exception-management UI exists on the shipment detail route and is disabled without `tracking.exception.manage`.
- Exception-resolution UI exists on the shipment detail route and is disabled without `tracking.exception.resolve` or an active delayed/exception status.
- Exception lifecycle forms capture operator evidence, evidence references, approval status, approval references, and approver context.
- Shipment timeline displays exception workflow state and closes the workflow after approved release.
- Tracking overview displays operational analytics aggregates for SLA, modal distribution, event counts, and workflow state counts.
- Tracking overview displays local advisory recommendations and automation policy.
- Advisory UI states clearly that AI/local recommendations do not execute operations without human approval.
- Cargo overview route exists as a protected business module entry point.
- Cargo registration UI exists and is disabled without `cargo.register`.
- Cargo release UI exists and is disabled without `cargo.release`.
- Cargo transport planning UI exists and is disabled without `cargo.transport.plan`.
- Cargo transport departure UI exists and is disabled without `cargo.transport.depart`.
- Cargo transport arrival UI exists and is disabled without `cargo.transport.arrive`.
- Cargo operational handoff UI exists and is disabled without `cargo.handoff.record`.
- Cargo claim settlement UI exists and is disabled without `cargo.claim.settle`.
- Cargo delivery completion UI exists and is disabled without `cargo.delivery.complete`.
- Cargo delivery exception record UI exists and is disabled without `cargo.delivery.exception.record`.
- Cargo delivery exception resolution UI exists and is disabled without `cargo.delivery.exception.resolve`.
- Cargo compliance evidence record UI exists and is disabled without `cargo.compliance.record`.
- Cargo compliance evidence verification UI exists and is disabled without `cargo.compliance.verify`.
- Cargo UI calls the secure backend command instead of direct database writes.
- Anonymous users are redirected from `/app/cargo` to `/sign-in?next=%2Fapp%2Fcargo`.
- Capacity overview route exists as a protected business module entry point.
- Capacity resource registration UI exists and is disabled without `capacity.manage`.
- Capacity slot opening UI exists and is disabled without `capacity.manage`.
- Capacity slot reservation UI exists and is disabled without `capacity.slot.reserve`.
- Capacity slot cancellation UI exists and is disabled without `capacity.slot.cancel`.
- Capacity optimization advisory UI displays rule-based recommendations and blocked automation policy.
- Capacity advisory decision UI exists and is disabled without `capacity.advisory.decide`.
- Capacity advisory decision analytics UI exists and is read-only under `capacity.read`.
- Capacity UI calls the secure backend command instead of direct database writes.
- Anonymous users are redirected from `/app/capacity` to `/sign-in?next=%2Fapp%2Fcapacity`.
- Planning overview route exists as a protected business module entry point.
- Planning transport order confirmation UI exists and is disabled without `planning.order.confirm`.
- Planning transport order replaneamento UI exists and is disabled without
  `planning.order.reschedule`.
- Planning transport order dispatch UI exists and is disabled without `planning.order.dispatch`.
- Planning transport order cancellation UI exists and is disabled without `planning.order.cancel`.
- Planning UI calls secure backend commands instead of direct database writes.
- Planning E2E submits governed confirmation, reschedule, dispatch, and cancellation commands
  through the authenticated UI.
- Anonymous users are redirected from `/app/planning` to `/sign-in?next=%2Fapp%2Fplanning`.
- Tariff overview route exists as a protected business module entry point.
- Tariff rate card registration UI exists and is disabled without `tariff.manage`.
- Tariff rate rule addition UI exists and is disabled without `tariff.manage`.
- Tariff quote calculation UI exists and is disabled without `tariff.quote.calculate`.
- Tariff quote calculation UI accepts an optional tax percentage and displays tax amount with the final total.
- Tariff quote approval UI exists and is disabled without `tariff.quote.approve`.
- Tariff UI calls the secure backend command instead of direct database writes.
- Anonymous users are redirected from `/app/tariffs` to `/sign-in?next=%2Fapp%2Ftariffs`.
- Admin Identity/RBAC route exists as a protected administrative module entry point.
- Admin user invitation UI exists and is disabled without `identity.user.invite`.
- Admin role assignment UI exists and is disabled without `identity.role.assign`.
- Admin UI displays tenant organization, memberships, users, roles, and permission catalog.
- Admin UI calls the secure backend commands instead of direct database writes.
- Anonymous users are redirected from `/app/admin` to `/sign-in?next=%2Fapp%2Fadmin`.
- Audit Query/Export route exists as a protected governance module entry point.
- Audit search UI supports action, subject, actor, correlation, severity, date, and limit filters.
- Audit detail UI displays metadata, before/after payloads, and raw payload evidence.
- Audit CSV export is available only to users with `report.export`.
- Anonymous users are redirected from `/app/audit` to `/sign-in?next=%2Fapp%2Faudit`.
- Reports route exists as a protected governance module entry point.
- Reports UI exposes governed CSV export cards for Tracking, Cargo, Capacity, Planning, and Tariff.
- Reports export links are available only when `report.export` and domain read permissions are present.
- Anonymous users are redirected from `/app/reports` to `/sign-in?next=%2Fapp%2Freports`.
- Notifications route exists as a protected governance module entry point.
- Notifications UI exposes inbox filters, totals, severity, event metadata, and mark-read action.
- Notifications UI is available only when `notification.read` is present.
- Anonymous users are redirected from `/app/notifications` to `/sign-in?next=%2Fapp%2Fnotifications`.
- Integrations route exists as a protected governance module entry point.
- Integrations UI exposes service accounts, API key prefixes, scopes, security model, and recent external events.
- Integrations UI provisions service accounts only when `integration.api_key.manage` is present.
- Integrations UI registers external events only when `integration.event.ingest` is present.
- Integrations UI processes Port TOS movements only when `integration.event.ingest` and `tracking.event.record` are present.
- Integrations UI processes Rail TMS movements only when `integration.event.ingest` and `tracking.event.record` are present.
- Integrations UI processes Carrier TMS movements only when `integration.event.ingest` and `tracking.event.record` are present.
- Integrations UI processes Telematics GPS positions only when `integration.event.ingest` and `tracking.event.record` are present.
- Integrations UI processes Customs ERP statuses only when `integration.event.ingest` and `tracking.event.record` are present.
- Anonymous users are redirected from `/app/integrations` to `/sign-in?next=%2Fapp%2Fintegrations`.
- Playwright visual regression covers sign-in and protected tracking redirect states.
- Authenticated Playwright E2E covers the platform shell, Tracking, Cargo, Capacity, Tariff, Admin, Audit, and Reports with a real local admin session.
- Authenticated Playwright E2E covers the platform shell, Tracking, Cargo, Capacity, Tariff, Admin, Audit, Reports, Notifications, and Integrations with a real local admin session.
- Authenticated Playwright E2E submits real governed forms for Cargo registration, Capacity advisory decision, Tariff rate card registration, Tariff quote calculation, Admin user invitation, Admin role assignment, Audit CSV export, Reports CSV export, outbox worker processing, notification acknowledgement, integration service account provisioning, integration event registration, Port TOS movement processing, Rail TMS movement processing, Carrier TMS movement processing, Telematics GPS position processing, and Customs ERP status processing.
- Business module visual regression covers stable Cargo, Capacity, Planning, and Tariff rule/policy cards.
- Local admin onboarding exists through `pnpm auth:seed-local-admin` for authenticated browser testing.

### Backend

- NestJS runtime builds successfully.
- API exposes liveness, readiness, and Prometheus metrics endpoints.
- oRPC foundation transport is active.
- Web server actions use the canonical oRPC procedure paths exposed by the local `RPCHandler`.
- Tracking overview RPC is registered under `/rpc/tracking/overview`.
- Tracking event recording RPC is registered under `/rpc/tracking/events`.
- Tracking shipment detail RPC is registered under `/rpc/tracking/shipmentDetail`.
- Tracking exception management RPC is registered under `/rpc/tracking/exceptions`.
- Tracking exception resolution RPC is registered under `/rpc/tracking/exceptionResolution`.
- Tracking analytics RPC is registered under `/rpc/tracking/analytics`.
- Tracking advisory RPC is registered under `/rpc/tracking/advisory`.
- Cargo overview RPC is registered under `/rpc/cargo/overview`.
- Cargo registration RPC is registered under `/rpc/cargo/register`.
- Cargo release RPC is registered under `/rpc/cargo/release`.
- Cargo transport planning RPC is registered under `/rpc/cargo/planTransport`.
- Cargo transport departure RPC is registered under `/rpc/cargo/departTransport`.
- Cargo transport arrival RPC is registered under `/rpc/cargo/arriveTransport`.
- Cargo operational handoff RPC is registered under `/rpc/cargo/recordOperationalHandoff`.
- Cargo claim settlement RPC is registered under `/rpc/cargo/recordClaimSettlement`.
- Cargo delivery completion RPC is registered under `/rpc/cargo/completeDelivery`.
- Cargo delivery exception record RPC is registered under `/rpc/cargo/recordDeliveryException`.
- Cargo delivery exception resolution RPC is registered under `/rpc/cargo/resolveDeliveryException`.
- Cargo compliance evidence record RPC is registered under `/rpc/cargo/recordComplianceEvidence`.
- Cargo compliance evidence verification RPC is registered under `/rpc/cargo/verifyComplianceEvidence`.
- Capacity overview RPC is registered under `/rpc/capacity/overview`.
- Capacity resource registration RPC is registered under `/rpc/capacity/registerResource`.
- Capacity slot opening RPC is registered under `/rpc/capacity/openSlot`.
- Capacity slot reservation RPC is registered under `/rpc/capacity/reserveSlot`.
- Capacity slot cancellation RPC is registered under `/rpc/capacity/cancelSlotReservation`.
- Capacity optimization advisory RPC is registered under `/rpc/capacity/advisory`.
- Capacity advisory decision RPC is registered under `/rpc/capacity/recordAdvisoryDecision`.
- Capacity advisory decision analytics RPC is registered under `/rpc/capacity/advisoryDecisionAnalytics`.
- Planning overview RPC is registered under `/rpc/planning/overview`.
- Planning transport order confirmation RPC is registered under `/rpc/planning/confirmTransportOrder`.
- Planning transport order replaneamento RPC is registered under
  `/rpc/planning/rescheduleTransportOrder`.
- Planning transport order dispatch RPC is registered under `/rpc/planning/dispatchTransportOrder`.
- Planning transport order cancellation RPC is registered under `/rpc/planning/cancelTransportOrder`.
- Tariff overview RPC is registered under `/rpc/tariff/overview`.
- Tariff rate card registration RPC is registered under `/rpc/tariff/registerRateCard`.
- Tariff rate rule addition RPC is registered under `/rpc/tariff/addRateRule`.
- Tariff quote calculation RPC is registered under `/rpc/tariff/calculateQuote`.
- Tariff quote approval RPC is registered under `/rpc/tariff/approveQuote`.
- Admin overview RPC is registered under `/rpc/admin/overview`.
- Admin user invitation RPC is registered under `/rpc/admin/inviteUser`.
- Admin role assignment RPC is registered under `/rpc/admin/assignRole`.
- Audit search RPC is registered under `/rpc/audit/search`.
- Audit export RPC is registered under `/rpc/audit/export`.
- Reports export RPC is registered under `/rpc/reports/export`.
- Notifications inbox RPC is registered under `/rpc/notifications/inbox`.
- Notifications mark-read RPC is registered under `/rpc/notifications/markRead`.
- Integrations overview RPC is registered under `/rpc/integrations/overview`.
- Integrations service account creation RPC is registered under `/rpc/integrations/createServiceAccount`.
- Integrations event record RPC is registered under `/rpc/integrations/recordEvent`.
- Port TOS adapter RPC is registered under `/rpc/integrations/processPortTosMovement`.
- Rail TMS adapter RPC is registered under `/rpc/integrations/processRailTmsMovement`.
- Carrier TMS adapter RPC is registered under `/rpc/integrations/processCarrierTmsMovement`.
- Telematics GPS adapter RPC is registered under `/rpc/integrations/processTelematicsGpsPosition`.
- Customs ERP adapter RPC is registered under `/rpc/integrations/processCustomsErpStatus`.
- Backend authorization resolves session, organization, and permission before tracking access.
- Backend authorization resolves session, organization, and permission before cargo access.
- Backend authorization resolves session, organization, and identity permissions before administrative access.
- Backend authorization resolves session, organization, `audit.read`, and `report.export` before audit export.
- Backend authorization resolves session, organization, `report.export`, and domain read permission before operational reports export.
- Shipment detail is filtered by organization before timeline events are returned.
- Event recording writes the tracking event, shipment status update, audit record, and outbox event transactionally.
- Exception management writes the exception event, status impact, audit record, and outbox event transactionally.
- Exception resolution writes the release event, recovered shipment status, audit record, and outbox event transactionally.
- Exception management and resolution persist operator evidence and approval context in event payloads, audit records, and outbox payloads.
- Exception management and resolution persist workflow state in event payloads, audit records, and outbox payloads.
- Analytics reads aggregate tenant-scoped shipments, events, SLA risk, modal distribution, and workflow states.
- Advisory reads generate tenant-scoped rule-based recommendations without mutating operational state.
- Cargo registration writes the cargo record, audit record, and outbox event transactionally.
- Cargo registration applies P0 business rules for unique identity, idempotency, hazardous cargo, customs holds, damaged cargo, and inspections.
- Cargo release updates cargo readiness, audit record, and outbox event transactionally.
- Cargo release applies P1 business rules for releasable status, customs clearance, inspection outcome, hazardous compliance, and idempotency.
- Cargo transport planning creates a tenant-scoped tracking shipment, initial tracking event, cargo link, audit record, and outbox event transactionally.
- Cargo transport planning applies P2 business rules for readiness, release evidence, customs/inspection blockers, unique tracking reference, one shipment per cargo, and ETA after departure.
- Cargo compliance evidence record writes the evidence record, audit record, and outbox event transactionally.
- Cargo compliance evidence verification updates the evidence decision, audit record, and outbox event transactionally.
- Cargo compliance evidence applies P3 business rules for tenant scope, idempotency, duplicate document prevention, expiry, pending review, hazardous declarations, approval, and rejection.
- Cargo departure updates cargo, tracking shipment, tracking event, audit record, and outbox event transactionally.
- Cargo departure applies P4 business rules for approved compliance evidence, no open compliance review, ready cargo, planned tracking shipment, release/planning timestamps, idempotency, audit, and outbox.
- Cargo arrival updates cargo, tracking shipment, tracking event, audit record, and outbox event transactionally.
- Cargo arrival applies P5 business rules for departed cargo, in-transit tracking, arrival timestamp ordering, idempotency, audit, and outbox.
- Cargo delivery completion updates cargo, tracking shipment, tracking event, audit record, and outbox event transactionally.
- Cargo delivery completion applies P5 business rules for arrived cargo, arrived tracking, sound handover condition, delivery timestamp ordering, idempotency, audit, and outbox.
- Cargo delivery exception record and resolution update cargo, tracking shipment, tracking event, audit record, and outbox event transactionally.
- Cargo delivery exception applies P6 business rules for non-sound handover attempts, held cargo, tracking exception state, inspection/claim resolution, idempotency, audit, and outbox.
- Cargo operational handoff updates custody owner, tracking event, audit record, and outbox event transactionally.
- Cargo operational handoff applies P7 business rules for in-transit cargo, in-transit tracking, current custody match, custody transfer, sound condition, duplicate handoff reference blocking, idempotency, audit, and outbox.
- Cargo claim settlement writes accounting settlement, audit record, and outbox event transactionally without mutating tracking state.
- Cargo claim settlement applies P8 business rules for resolved exceptions, accepted claims, matching claim references, settlement timestamps, duplicate settlement blocking, idempotency, audit, and outbox.
- Capacity resource registration writes the resource, audit record, and outbox event transactionally.
- Capacity slot opening writes the slot, audit record, and outbox event transactionally.
- Capacity slot reservation writes the reservation, updates reserved units atomically, writes audit
  record, and emits outbox transactionally.
- Capacity slot reservation applies P9 business rules for eligible cargo state, open slot, valid
  reservation window, duplicate blocking, and no overbooking.
- Capacity slot cancellation updates reservation state, releases reserved units, writes audit record,
  and emits outbox transactionally.
- Capacity advisory reads apply P11 business rules for slot saturation, expiring slots, unused
  capacity, reservation imbalance, cancellation review, human approval, and no autonomous execution.
- Capacity advisory decision writes the decision, audit record, and outbox event transactionally
  without executing operational commands.
- Capacity advisory decision analytics reads tenant-scoped decisions, approval rates,
  recommendation-type groups, required-permission groups, and recent human decisions without
  executing operational commands.
- Transport Planning confirmation writes the order, audit record, and outbox event transactionally.
- Transport Planning replaneamento updates the schedule, writes an immutable schedule revision,
  records audit, and emits outbox transactionally.
- Transport Planning dispatch writes an immutable execution handoff record, records audit, and
  emits outbox transactionally.
- Transport Planning cancellation updates confirmed orders, records cancellation evidence, writes
  audit, and emits outbox transactionally.
- Transport Planning replaneamento applies P24 rules for confirmed state, pre-departure timing,
  actual schedule change, unique revision reference, capacity-window alignment, no existing
  dispatch, idempotency, and downstream tracking signals.
- Transport Planning dispatch applies P25 rules for confirmed state, post-confirmation/latest
  schedule timing, pre-departure timing, responsible operator, operational instructions, unique
  dispatch reference, one dispatch per order, capacity readiness, idempotency, and downstream
  tracking signals.
- Transport Planning cancellation applies P23 rules for confirmed state, pre-departure timing,
  operational reason, unique cancellation reference, no existing dispatch, idempotency, and
  downstream capacity/tracking signals.
- Tariff rate card registration writes the rate card, audit record, and outbox event transactionally.
- Tariff rate rule addition writes the pricing rule, audit record, and outbox event transactionally.
- Tariff quote calculation writes the quote, calculation payload, audit record, and outbox event
  transactionally.
- Tariff quote approval updates quote approval evidence, audit record, and outbox event
  transactionally.
- Tariff / Pricing applies P10 business rules for unique rate card codes, valid validity windows,
  rate basis requirements, active rate card checks, applicable rules, required cargo metrics,
  positive quote amount, calculated-state approval, idempotency, audit, and outbox.
- Admin Identity/RBAC reads tenant-scoped organization, users, memberships, roles, and permissions
  without platform-wide leakage.
- Admin user invitation creates or reactivates a tenant membership, assigns an optional bootstrap
  role, writes audit, and emits outbox transactionally.
- Admin role assignment validates tenant-scoped membership and role, writes audit, and emits outbox
  transactionally.
- Audit search reads only tenant-scoped audit records with explicit filters.
- Audit export writes export audit evidence and outbox evidence transactionally.
- Reports export reads only tenant-scoped operational records for Tracking, Cargo, Capacity, Planning, and Tariff.
- Reports export writes `report.exported` audit evidence and outbox evidence transactionally.
- Notifications inbox reads only tenant-scoped notifications.
- Notifications mark-read updates unread notifications and writes `notification.marked_read` audit evidence.
- Outbox worker publishes pending events into one notification per source outbox event and marks events published.
- Integration Gateway reads only tenant-scoped service accounts and integration events.
- Integration Gateway provisions service accounts and API keys transactionally with hash-only secret storage.
- Integration Gateway records external events transactionally with audit and outbox evidence.
- Integration Gateway enforces idempotency by organization, source system, and external ID.
- Port TOS adapter reads only tenant-scoped service accounts and tracking shipments.
- Port TOS adapter requires active service accounts with integration and tracking scopes.
- Port TOS adapter records `port_tos.movement` integration events and mapped tracking events transactionally.
- Port TOS adapter marks integration events processed only after tracking event creation.
- Port TOS adapter enforces idempotency by organization, source system, and external ID.
- Port TOS adapter writes audit and outbox evidence for processed terminal movements.
- Rail TMS adapter reads only tenant-scoped service accounts and tracking shipments.
- Rail TMS adapter requires active service accounts with integration and tracking scopes.
- Rail TMS adapter records `rail_tms.movement` integration events and mapped tracking events transactionally.
- Rail TMS adapter marks integration events processed only after tracking event creation.
- Rail TMS adapter enforces idempotency by organization, source system, and external ID.
- Rail TMS adapter writes audit and outbox evidence for processed railway movements.
- Carrier TMS adapter reads only tenant-scoped service accounts and tracking shipments.
- Carrier TMS adapter requires active service accounts with integration and tracking scopes.
- Carrier TMS adapter records `carrier_tms.movement` integration events and mapped tracking events transactionally.
- Carrier TMS adapter marks integration events processed only after tracking event creation.
- Carrier TMS adapter enforces idempotency by organization, source system, and external ID.
- Carrier TMS adapter writes audit and outbox evidence for processed road carrier movements.
- Telematics GPS adapter reads only tenant-scoped service accounts and tracking shipments.
- Telematics GPS adapter requires active service accounts with integration and tracking scopes.
- Telematics GPS adapter records `telematics_gps.position` integration events and mapped tracking events transactionally.
- Telematics GPS adapter validates coordinates, optional speed, and optional heading before persistence.
- Telematics GPS adapter marks integration events processed only after tracking event creation.
- Telematics GPS adapter enforces idempotency by organization, source system, and external ID.
- Telematics GPS adapter writes audit and outbox evidence for processed GPS positions.
- Customs ERP adapter reads only tenant-scoped service accounts and tracking shipments.
- Customs ERP adapter requires active service accounts with integration and tracking scopes.
- Customs ERP adapter records `customs_erp.status` integration events and mapped tracking events transactionally.
- Customs ERP adapter preserves customs, document, declaration, broker, and authority evidence before persistence.
- Customs ERP adapter marks integration events processed only after tracking event creation.
- Customs ERP adapter enforces idempotency by organization, source system, and external ID.
- Customs ERP adapter writes audit and outbox evidence for processed customs statuses.
- Warehouse WMS adapter reads only tenant-scoped service accounts and tracking shipments.
- Warehouse WMS adapter requires active service accounts with integration and tracking scopes.
- Warehouse WMS adapter records `warehouse_wms.activity` integration events and mapped tracking events transactionally.
- Warehouse WMS adapter preserves warehouse, zone, dock, container, handling unit, operator, and pallet evidence before persistence.
- Warehouse WMS adapter marks integration events processed only after tracking event creation.
- Warehouse WMS adapter enforces idempotency by organization, source system, and external ID.
- Warehouse WMS adapter writes audit and outbox evidence for processed warehouse activities.

### Database

- PostgreSQL local runtime is available on host port `25432`.
- Redis local runtime is available on host port `26379`.
- Prisma schema includes tenant, auth, RBAC, audit, outbox notification, tracking foundation models, Cargo Management P0+P1+P2+P3+P4+P5+P6+P7+P8 models, Capacity Management P9 models, and Tariff / Pricing P10 models.
- Prisma schema includes Capacity Advisory Decision P12 models for human approval/rejection evidence.
- Tracking migration is applied locally.
- Tracking event idempotency migration is applied locally.
- Cargo foundation migration is available locally.
- Cargo release governance migration is available locally.
- Cargo tracking linkage migration is available locally.
- Cargo compliance evidence migration is available locally.
- Cargo departure lifecycle migration is available locally.
- Cargo arrival/delivery lifecycle migration is available locally.
- Cargo delivery exception lifecycle migration is available locally.
- Cargo operational handoff lifecycle migration is available locally.
- Cargo claim settlement lifecycle migration is available locally.
- Capacity slot constraints migration is available locally.
- Capacity advisory decision migration is available locally.
- Tariff pricing foundation migration is available locally.
- Notifications inbox migration is available locally.
- Integration Gateway migration is available locally.
- Better Auth two-factor migration is available locally with `twoFactorEnabled` and `TwoFactor`.
- RBAC bootstrap seed runs locally.
- Database seed creates deterministic local demo data for Tracking, Cargo, Capacity, Planning, Tariff, audit, and outbox evidence.
- Local admin seed creates a verified Better Auth user, local organization, active membership, and `tenant.admin` role assignment.

### Security

- Better Auth foundation is present.
- Better Auth two-factor plugin is present for TOTP, trusted devices, encrypted backup codes, and
  sign-in challenges.
- RBAC permissions include tracking read and governed tracking write permissions.
- RBAC permissions include cargo read, governed cargo registration, governed cargo release, governed cargo transport planning, governed cargo departure, governed cargo arrival, governed cargo operational handoff, governed cargo claim settlement, governed cargo delivery completion, governed cargo delivery exception record/resolution, compliance evidence record, and compliance evidence verification permissions.
- RBAC permissions include capacity read, capacity management, capacity reservation, and capacity cancellation permissions.
- RBAC permissions include planning read, transport order confirmation, transport order
  replaneamento, transport order dispatch, and transport order cancellation permissions.
- RBAC permissions include tariff read, tariff management, tariff quote calculation, and tariff quote approval permissions.
- RBAC permissions include tenant management, user invitation, and role assignment permissions for Admin Identity/RBAC.
- RBAC permissions include audit read and report export permissions for Audit Query/Export.
- RBAC permissions include notification read permission for Notifications / Inbox.
- RBAC permissions include integration API key management and integration event ingest permissions.
- Backend permission enforcement exists for tracking overview.
- Backend permission enforcement exists for tracking shipment detail.
- Backend permission enforcement exists for event recording.
- Backend permission enforcement exists for exception management.
- Backend permission enforcement exists for exception resolution.
- Event recording requires an idempotency key per organization.
- Exception management requires an idempotency key per organization.
- Exception management requires explicit operator evidence.
- Exception resolution requires an idempotency key per organization and an active delayed/exception state.
- Exception resolution requires approved operator evidence with approval reference and approver name.
- Exception resolution emits terminal workflow state `closed`.
- Analytics and advisory reads reuse `tracking.shipment.read`.
- Advisory recommendations require human approval and set automation to blocked.
- Cargo overview requires `cargo.read`.
- Cargo registration requires `cargo.register`, idempotency, audit trail, and outbox.
- Cargo release requires `cargo.release`, idempotency, audit trail, and outbox.
- Cargo transport planning requires `cargo.transport.plan`, idempotency, audit trail, and outbox.
- Cargo transport departure requires `cargo.transport.depart`, idempotency, audit trail, and outbox.
- Cargo transport arrival requires `cargo.transport.arrive`, idempotency, audit trail, and outbox.
- Cargo operational handoff requires `cargo.handoff.record`, idempotency, audit trail, and outbox.
- Cargo claim settlement requires `cargo.claim.settle`, idempotency, audit trail, and outbox.
- Cargo delivery completion requires `cargo.delivery.complete`, idempotency, audit trail, and outbox.
- Cargo delivery exception record requires `cargo.delivery.exception.record`, idempotency, audit trail, and outbox.
- Cargo delivery exception resolution requires `cargo.delivery.exception.resolve`, idempotency, audit trail, and outbox.
- Cargo compliance evidence record requires `cargo.compliance.record`, idempotency, audit trail, and outbox.
- Cargo compliance evidence verification requires `cargo.compliance.verify`, idempotency, audit trail, and outbox.
- Hazardous cargo requires UN number and hazard class.
- Customs-held cargo requires customs reference.
- Damaged cargo requires inspection.
- Cargo release requires registered/held state, cleared customs when applicable, and passed inspection when applicable.
- Cargo transport planning requires ready cargo, completed release, no open inspection, cleared/not-required customs, one shipment per cargo, and ETA after departure.
- Cargo compliance evidence prevents duplicate document references per cargo and evidence type.
- Cargo compliance evidence approval blocks expired evidence and requires pending review state.
- Cargo compliance evidence rejection requires explicit rejection reason.
- Cargo departure requires approved compliance evidence and blocks pending/rejected evidence.
- Cargo departure creates `tracking.departed` and moves shipment to `in_transit`.
- Cargo operational handoff requires in-transit cargo and creates `tracking.location_updated` without completing shipment.
- Cargo claim settlement requires accepted claim resolution and does not mutate tracking state.
- Cargo arrival requires departed cargo and creates `tracking.arrived` with shipment `arrived`.
- Cargo delivery completion requires arrived cargo, sound handover condition, and creates `tracking.handover_completed` with shipment `completed`.
- Cargo delivery exception record requires arrived cargo, creates `tracking.exception`, and moves shipment to `exception`.
- Cargo delivery exception resolution requires open exception, restores sound condition, creates `tracking.released`, and returns shipment to `arrived`.
- Capacity overview requires `capacity.read`.
- Capacity advisory requires `capacity.read`, human approval, and blocked automation.
- Capacity advisory decision requires `capacity.advisory.decide`, idempotency, decision evidence,
  duplicate decision blocking, audit trail, and outbox.
- Capacity advisory decision analytics requires `capacity.read`, tenant scope, read-only access, and
  blocked automation.
- Capacity resource and slot management require `capacity.manage`, idempotency, audit trail, and outbox.
- Capacity reservation requires `capacity.slot.reserve`, idempotency, audit trail, outbox, eligible cargo, open slot, valid window, and available units.
- Capacity cancellation requires `capacity.slot.cancel`, idempotency, audit trail, outbox, active reservation, valid cancellation timestamp, and reserved-unit release.
- Tariff overview requires `tariff.read`.
- Tariff rate card and rule management require `tariff.manage`, idempotency, audit trail, and outbox.
- Tariff quote calculation requires `tariff.quote.calculate`, idempotency, active rate card, applicable rules, required cargo metrics, positive amount, valid tax model, audit trail, and outbox.
- Tariff quote approval requires `tariff.quote.approve`, idempotency, calculated quote state, human approval evidence, audit trail, and outbox.
- Audit search requires `audit.read` and tenant scope.
- Audit export requires `audit.read`, `report.export`, tenant scope, export audit evidence, and outbox.
- Reports export requires `report.export`, tenant scope, domain read permission, export audit evidence, and outbox.
- Notifications inbox requires `notification.read` and tenant scope.
- Notifications mark-read requires `notification.read`, tenant scope, and audit evidence.
- Integration Gateway overview requires `integration.api_key.manage` or `integration.event.ingest`.
- Integration service account provisioning requires `integration.api_key.manage`, idempotency, tenant scope, hash-only storage, audit trail, and outbox.
- Integration event registration requires `integration.event.ingest`, active service account scope, tenant idempotency, audit trail, and outbox.
- Port TOS adapter processing requires `integration.event.ingest`, `tracking.event.record`, active service account scopes, tenant idempotency, audit trail, and outbox.
- Rail TMS adapter processing requires `integration.event.ingest`, `tracking.event.record`, active service account scopes, tenant idempotency, audit trail, and outbox.
- Carrier TMS adapter processing requires `integration.event.ingest`, `tracking.event.record`, active service account scopes, tenant idempotency, audit trail, and outbox.
- Telematics GPS adapter processing requires `integration.event.ingest`, `tracking.event.record`, active service account scopes, tenant idempotency, audit trail, and outbox.
- Customs ERP adapter processing requires `integration.event.ingest`, `tracking.event.record`, active service account scopes, tenant idempotency, audit trail, and outbox.
- Warehouse WMS adapter processing requires `integration.event.ingest`, `tracking.event.record`, active service account scopes, tenant idempotency, audit trail, and outbox.
- Exception-resolution UI calls the backend command and never updates shipment state directly.
- Frontend route protection preserves the target `next` path.
- No business write workflow exists without audit/idempotency gates.
- Local admin seed refuses `NODE_ENV=production`.

### DevOps

- Docker Compose stack is healthy locally.
- API container is healthy on port `4000`.
- Web container is healthy on port `3000`.
- PostgreSQL and Redis containers use non-conflicting host ports.
- Docker, Compose, Buildx, and `compose.yaml` validation pass.

### Testing Gates

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- `pnpm test:e2e` passes.
- Playwright screenshot assertions protect local visual regression states.
- Authenticated E2E bootstraps `pnpm db:seed`, `pnpm auth:seed-local-admin`, API runtime, and Web runtime before protected module checks.
- Authenticated E2E validates account security governance and MFA enrollment entry point visibility.
- Authenticated E2E filters audit records and validates CSV export download.
- Authenticated E2E validates operational Reports CSV export download.
- Authenticated E2E validates outbox worker processing and notification acknowledgement.
- Authenticated E2E validates Integration Gateway service account provisioning and external event registration.
- Authenticated E2E validates Port TOS movement processing into Operational Tracking.
- Authenticated E2E validates Rail TMS movement processing into Operational Tracking.
- Authenticated E2E validates Carrier TMS movement processing into Operational Tracking.
- Authenticated E2E validates Telematics GPS position processing into Operational Tracking.
- Authenticated E2E validates Customs ERP status processing into Operational Tracking.
- Authenticated E2E validates Warehouse WMS activity processing into Operational Tracking.
- Authenticated E2E validates Capacity Advisory Decision Analytics visibility.
- `pnpm validate:tracking-foundation` passes.
- `pnpm validate:cargo-foundation` passes.
- `pnpm validate:capacity-foundation` passes.
- `pnpm validate:capacity-advisory` passes.
- `pnpm validate:tariff-foundation` passes.
- `pnpm validate:local-readiness` passes.
- `pnpm validate:docker-runtime` passes.
- `pnpm validate:production-handoff` passes.
- `pnpm validate:local-production` passes.
- `pnpm smoke:local-runtime` passes.

## Remaining For Real Production

These are not local blockers. They are cloud/production cutover tasks.

### P0 Production

- Push API and Web images to a real container registry.
- Replace local secrets with managed production secrets.
- Provision staging and production infrastructure.
- Configure production domain, TLS, and ingress.
- Run production migrations through the release runbook.
- Enable external observability backend for logs, metrics, traces, and alerts.
- Configure backup, restore, and disaster recovery validation.
- Execute security tests, dependency scanning, and runtime hardening.
- Execute load and resilience tests.

### P1 Production Hardening

- Optimize API image back to a lean deploy artifact when registry metadata/cache is available.
- Attach generated first-module evidence to the cloud release gate.
- Verify signed image/provenance evidence from Container CI.
- Confirm production alert routing ownership and escalation policy with the environment owner.

## Next Local Backlog

No open P0, P1, or P2 local product tasks remain for the current Operational Tracking module.

Cargo Management P0, P1 release/readiness, P2 Cargo-to-Tracking linkage, P3 compliance evidence,
P4 departure lifecycle, P5 arrival/delivery lifecycle, P6 delivery exception lifecycle, P7
operational handoff lifecycle, and P8 claims settlement accounting are closed locally. Capacity
Management P9 capacity/slot constraints, Capacity Optimization Advisory P11, Capacity Advisory
Decision P12, Capacity Advisory Decision Analytics P20, Tariff / Pricing P10, Admin Identity/RBAC, Audit Query/Export, Operational
Reports / Export, Notifications / Inbox, Integration Gateway P13, Port TOS Adapter P14, Rail TMS Adapter P15, Carrier TMS Adapter P16, Telematics GPS Adapter P17, Customs ERP Adapter P18, and Warehouse WMS Adapter P19 are closed locally.
Open follow-up work must be executed as separate modular slices:

- Next approved external adapter.
- Next approved business module.

## Decision

The local product baseline is complete for Operational Tracking, Cargo Management
P0+P1+P2+P3+P4+P5+P6+P7+P8, Capacity Management P9, Capacity Optimization Advisory P11, Capacity
Advisory Decision P12, Capacity Advisory Decision Analytics P20, Tariff / Pricing P10, Admin Identity/RBAC, Audit Query/Export,
Operational Reports / Export, Notifications / Inbox, Integration Gateway P13, Port TOS Adapter P14,
Rail TMS Adapter P15, Carrier TMS Adapter P16, Telematics GPS Adapter P17, Customs ERP Adapter P18, and Warehouse WMS Adapter P19. The next implementation should be another approved external adapter,
another approved business module, or production/cloud cutover evidence.

Production/cloud cutover evidence now has a local handoff gate in
`docs/devops/production-cutover-handoff.md` and `pnpm validate:production-handoff`. Remaining
production tasks require real registry, secrets, cluster, DNS/TLS, observability, backup/DR,
security, and load-test evidence from the target environment.
