# Cargo Management

## Scope

Cargo Management is the second business module after Operational Tracking. The implemented local
scope includes P0 governed registration, P1 governed release/readiness, P2 Cargo-to-Tracking
linkage, P3 compliance evidence, P4 departure lifecycle, P5 arrival/delivery lifecycle, P6
delivery exception lifecycle, P7 port/rail operational handoff, and P8 claims settlement
accounting. It does not introduce generic
CRUD. It registers, releases, links, records evidence, verifies evidence, starts movement, transfers
custody in transit, confirms arrival, opens delivery exceptions, resolves delivery exceptions, and
records accepted claim settlements before completing tenant-scoped cargo delivery only after
applying business rules, RBAC, idempotency, audit trail, and outbox.

## Business Capability

- Register cargo before transport planning and operational tracking.
- Maintain a unique cargo identity per tenant.
- Capture shipper, consignee, custody owner, origin, and destination.
- Validate gross weight, package count, cargo type, customs state, condition, and hazardous context.
- Block cargo movement when customs, inspection, damage, or hazardous rules require human handling.
- Release cargo to `ready_for_transport` only after customs and inspection blockers are cleared.
- Create a planned Operational Tracking shipment from a released cargo record.
- Record compliance evidence for cargo documents before operational automation.
- Approve or reject pending compliance evidence through an auditable review command.
- Start cargo departure only after approved compliance evidence and planned tracking exist.
- Record port/rail, terminal/carrier, yard, or customs/operations custody handoffs while cargo is
  still in transit.
- Confirm arrival only after governed departure and active in-transit tracking.
- Complete delivery only after governed arrival and sound handover condition.
- Open delivery exceptions for damaged, missing, temperature, documentation, seal, or other
  non-sound handover attempts.
- Resolve delivery exceptions after inspection, claim, waiver, recovery, or equivalent controlled
  resolution before final handover.
- Record accounting settlement for accepted delivery claims without mutating operational tracking.
- Expose a tenant-scoped overview of registered cargo and operational blockers.

## Security Model

- Required read permission: `cargo.read`.
- Required registration permission: `cargo.register`.
- Required release permission: `cargo.release`.
- Required transport planning permission: `cargo.transport.plan`.
- Required transport departure permission: `cargo.transport.depart`.
- Required transport arrival permission: `cargo.transport.arrive`.
- Required operational handoff permission: `cargo.handoff.record`.
- Required claim settlement permission: `cargo.claim.settle`.
- Required delivery completion permission: `cargo.delivery.complete`.
- Required delivery exception record permission: `cargo.delivery.exception.record`.
- Required delivery exception resolve permission: `cargo.delivery.exception.resolve`.
- Required compliance evidence record permission: `cargo.compliance.record`.
- Required compliance evidence verify permission: `cargo.compliance.verify`.
- Every RPC operation requires a resolved organization context.
- Frontend checks permissions before calling the API.
- Backend revalidates session, organization, and permission through `RpcContextService`.
- Registration, release, transport planning, transport departure, transport arrival, delivery
  operational handoff, claim settlement, delivery completion, delivery exception record/resolution,
  evidence record, and evidence verification require idempotency keys and write audit/outbox records
  transactionally.

## Business Rules

- Cargo reference is unique per tenant.
- Cargo registration is idempotent per tenant.
- Cargo must include description, shipper, consignee, origin, destination, and custody owner.
- Gross weight must be positive.
- Package count must be positive.
- `cargoType=hazardous` requires `hazardous=true`.
- Hazardous cargo requires `unNumber` and `hazardClass`.
- Hazardous cargo requires inspection before unrestricted movement.
- `customsStatus=held` requires `customsReference`.
- `conditionStatus=damaged` requires inspection.
- Cargo with customs hold, inspection requirement, or damage is registered as `held`.
- Cargo release is idempotent per tenant.
- Cargo can be released only from `registered` or `held`.
- Pending or held customs state requires final `customsStatus=cleared`.
- `customsStatus=cleared` requires a release reference.
- Damaged or inspection-required cargo requires `inspectionOutcome=passed`.
- Hazardous cargo cannot be released without `unNumber` and `hazardClass`.
- Successful release sets status to `ready_for_transport`, clears inspection blockers, writes audit,
  and emits `cargo.released`.
- Cargo transport planning is idempotent per tenant.
- Cargo transport planning requires `status=ready_for_transport`.
- Cargo transport planning requires a completed governed release.
- Cargo transport planning requires no open inspection and customs state `cleared` or `not_required`.
- Cargo transport planning requires a unique tracking reference per tenant.
- Cargo transport planning creates exactly one `TrackingShipment` link per cargo.
- Cargo transport planning creates an initial `TrackingEvent` with `eventType=created`.
- Cargo transport planning writes audit and emits `cargo.transport_planned`.
- Compliance evidence record is idempotent per tenant.
- Compliance evidence document reference is unique per cargo and evidence type.
- Compliance evidence cannot be recorded for cancelled cargo.
- Compliance evidence cannot be recorded when already expired.
- `hazardous_goods_declaration` can only be recorded for hazardous cargo.
- Compliance evidence starts as `pending_review`.
- Compliance evidence verification is idempotent per tenant.
- Only `pending_review` evidence can be approved or rejected.
- Approval is blocked when evidence is expired at review time.
- Rejection requires an explicit rejection reason.
- Compliance evidence record writes audit and emits `cargo.compliance_evidence.recorded`.
- Compliance evidence verification writes audit and emits `cargo.compliance_evidence.verified`.
- Cargo transport departure is idempotent per tenant.
- Cargo transport departure requires `status=ready_for_transport`.
- Cargo transport departure requires governed release and governed transport planning.
- Cargo transport departure requires linked tracking shipment still in `planned`.
- Cargo transport departure requires at least one approved compliance evidence.
- Cargo transport departure blocks pending or rejected compliance evidence.
- Cargo transport departure cannot precede release or transport planning timestamps.
- Successful departure sets cargo to `in_transport`, shipment to `in_transit`, creates a
  `departed` tracking event, writes audit, and emits `cargo.transport_departed`.
- Operational handoff record is idempotent per tenant.
- Operational handoff requires cargo `status=in_transport`.
- Operational handoff requires a governed departure and linked shipment in `in_transit`.
- Operational handoff cannot precede the departure timestamp or follow arrival.
- Operational handoff requires `fromCustodyOwnerName` to match the current cargo custody owner.
- Operational handoff requires `toCustodyOwnerName` to differ from the current custody owner.
- Operational handoff accepts only `conditionStatus=sound`; non-sound transfers must use the
  delivery exception workflow or a future exception slice.
- Operational handoff blocks duplicate `handoffReference` per tenant.
- Successful handoff updates cargo custody owner, creates a `location_updated` tracking event,
  writes audit, and emits `cargo.operational_handoff.recorded`.
- Cargo transport arrival is idempotent per tenant.
- Cargo transport arrival requires cargo `status=in_transport`.
- Cargo transport arrival requires a governed departure.
- Cargo transport arrival requires linked tracking shipment in `in_transit`.
- Cargo transport arrival cannot precede the departure timestamp.
- Successful arrival keeps cargo in transport, sets shipment to `arrived`, sets `actualArrivalAt`,
  creates an `arrived` tracking event, writes audit, and emits `cargo.transport_arrived`.
- Cargo delivery completion is idempotent per tenant.
- Cargo delivery completion requires governed arrival.
- Cargo delivery completion requires linked tracking shipment in `arrived`.
- Cargo delivery completion cannot precede the arrival timestamp.
- Cargo delivery completion requires final condition `sound`; damaged or inspection-required
  handovers must go through exception/inspection resolution before closure.
- Successful delivery sets cargo to `delivered`, shipment to `completed`, creates a
  `handover_completed` tracking event, writes audit, and emits `cargo.delivery_completed`.
- Delivery exception record is idempotent per tenant.
- Delivery exception record requires governed arrival and shipment `arrived`.
- Delivery exception record blocks duplicate open exceptions per cargo.
- Delivery exception record cannot precede the arrival timestamp.
- Delivery exception record sets cargo to `held`, sets condition to `damaged` or
  `requires_inspection`, requires inspection, moves shipment to `exception`, creates a tracking
  `exception` event, writes audit, and emits `cargo.delivery_exception.recorded`.
- Delivery exception resolution is idempotent per tenant.
- Delivery exception resolution requires an open exception, held cargo, and shipment `exception`.
- Delivery exception resolution cannot precede exception occurrence.
- Delivery exception resolution restores final condition to `sound`, clears inspection, returns
  cargo to `in_transport`, returns shipment to `arrived`, creates tracking `released`, writes audit,
  and emits `cargo.delivery_exception.resolved`.
- Claim settlement record is idempotent per tenant.
- Claim settlement requires a resolved delivery exception.
- Claim settlement requires the exception to contain a claim reference.
- Claim settlement requires the input claim reference to match the exception claim reference.
- Claim settlement requires `resolutionCode=claim_accepted`.
- Claim settlement cannot precede the exception resolution timestamp.
- Claim settlement blocks duplicate settlements per delivery exception.
- Claim settlement blocks duplicate settlement references per tenant.
- Successful claim settlement writes audit and emits `cargo.claim_settlement.recorded`.
- Claim settlement does not mutate cargo status, tracking shipment status, or tracking events.

## Contracts

- RPC operation: `cargo.overview.read`.
- Transport path: `GET /rpc/cargo/overview`.
- Output includes:
  - tenant organization id
  - cargo totals
  - active, held, hazardous, and inspection-required counts
  - status distribution
  - recent cargo records
- RPC operation: `cargo.register`.
- Transport path: `POST /rpc/cargo/register`.
- Input includes:
  - cargo identity and description
  - shipper, consignee, origin, destination, and custody owner
  - type, weight, package count, customs, condition, hazardous, and inspection fields
  - idempotency key
- Output includes:
  - registered cargo record
  - applied business rules
  - movement and inspection blockers
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.release`.
- Transport path: `POST /rpc/cargo/release`.
- Input includes:
  - cargo id
  - final customs status
  - inspection outcome
  - release reference and reason
  - idempotency key
- Output includes:
  - released cargo record
  - applied release business rules
  - movement blocker result
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.transport.plan`.
- Transport path: `POST /rpc/cargo/planTransport`.
- Input includes:
  - cargo id
  - optional tracking reference
  - transport mode
  - planned departure and ETA
  - operations owner team
  - optional planning reference and first checkpoint
  - idempotency key
- Output includes:
  - linked cargo record
  - planned tracking shipment
  - applied planning business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.transport.depart`.
- Transport path: `POST /rpc/cargo/departTransport`.
- Input includes:
  - cargo id
  - departure timestamp
  - departure location
  - responsible operator
  - optional departure and carrier references
  - idempotency key
- Output includes:
  - departed cargo record
  - tracking shipment transition to `in_transit`
  - generated `departed` tracking event
  - applied departure business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.transport.arrive`.
- Transport path: `POST /rpc/cargo/arriveTransport`.
- Input includes:
  - cargo id
  - arrival timestamp
  - arrival location
  - responsible operator
  - optional arrival reference
  - idempotency key
- Output includes:
  - arrived cargo evidence
  - tracking shipment transition to `arrived`
  - generated `arrived` tracking event
  - applied arrival business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.handoff.record`.
- Transport path: `POST /rpc/cargo/recordOperationalHandoff`.
- Input includes:
  - cargo id
  - handoff type
  - handoff timestamp and location
  - current custody owner and target custody owner
  - responsible operator
  - handoff reference, optional seal reference, and optional notes
  - idempotency key
- Output includes:
  - cargo custody owner after transfer
  - operational handoff summary
  - tracking shipment preserved in `in_transit`
  - generated `location_updated` tracking event
  - applied handoff business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.delivery.complete`.
- Transport path: `POST /rpc/cargo/completeDelivery`.
- Input includes:
  - cargo id
  - delivery timestamp
  - receiver name
  - delivery reference
  - final delivery condition and optional notes
  - idempotency key
- Output includes:
  - delivered cargo record
  - tracking shipment transition to `completed`
  - generated `handover_completed` tracking event
  - applied delivery business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.delivery.exception.record`.
- Transport path: `POST /rpc/cargo/recordDeliveryException`.
- Input includes:
  - cargo id
  - exception type
  - non-sound delivery condition
  - occurrence timestamp
  - reporter, summary, evidence reference, and optional claim reference
  - idempotency key
- Output includes:
  - held cargo state
  - open delivery exception summary
  - tracking shipment transition to `exception`
  - generated `exception` tracking event
  - applied exception business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.delivery.exception.resolve`.
- Transport path: `POST /rpc/cargo/resolveDeliveryException`.
- Input includes:
  - exception id
  - resolution code
  - resolution timestamp
  - resolver, reference, and summary
  - final condition `sound`
  - idempotency key
- Output includes:
  - restored cargo state
  - resolved delivery exception summary
  - tracking shipment transition back to `arrived`
  - generated `released` tracking event
  - applied resolution business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.claim.settle`.
- Transport path: `POST /rpc/cargo/recordClaimSettlement`.
- Input includes:
  - delivery exception id
  - claim reference and settlement reference
  - settlement type, currency, amount, counterparty, settlement owner, summary, and timestamp
  - idempotency key
- Output includes:
  - cargo and resolved delivery exception summary
  - accounting settlement summary
  - applied settlement business rules
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.compliance.evidence.record`.
- Transport path: `POST /rpc/cargo/recordComplianceEvidence`.
- Input includes:
  - cargo id
  - evidence type
  - document reference, title, optional URI, issuer, issue date, and expiry date
  - idempotency key
- Output includes:
  - evidence summary
  - applied record business rules
  - review-required state
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `cargo.compliance.evidence.verify`.
- Transport path: `POST /rpc/cargo/verifyComplianceEvidence`.
- Input includes:
  - evidence id
  - approval or rejection decision
  - reviewer, review reference, review summary, and optional rejection reason
  - idempotency key
- Output includes:
  - verified evidence summary
  - applied verification business rules
  - approved/rejected decision state
  - idempotency replay state
  - audit subject
  - outbox aggregate

## Data Model

- `Cargo` stores tenant-scoped cargo registration state.
- `Cargo.registrationIdempotencyKey` prevents duplicate registration per organization.
- `Cargo.releaseIdempotencyKey` prevents duplicate release per organization.
- `Cargo.releasedAt`, `Cargo.releaseReference`, and `Cargo.releaseReason` capture release evidence.
- `Cargo.transportPlanIdempotencyKey` prevents duplicate transport planning per organization.
- `Cargo.trackingShipmentId` stores the one-to-one link to `TrackingShipment`.
- `Cargo.transportPlannedAt`, `Cargo.transportPlanningReference`, and `Cargo.transportOwnerTeam`
  capture planning evidence.
- `Cargo.departureIdempotencyKey` prevents duplicate departure per organization.
- `Cargo.departedAt`, `Cargo.departureReference`, `Cargo.departureLocationName`,
  `Cargo.departureOperatorName`, and `Cargo.carrierReference` capture departure evidence.
- `Cargo.arrivalIdempotencyKey` prevents duplicate arrival per organization.
- `Cargo.arrivedAt`, `Cargo.arrivalReference`, `Cargo.arrivalLocationName`, and
  `Cargo.arrivalOperatorName` capture arrival evidence.
- `Cargo.deliveryIdempotencyKey` prevents duplicate delivery completion per organization.
- `Cargo.deliveredAt`, `Cargo.deliveryReference`, `Cargo.receivedByName`, and
  `Cargo.deliveryNotes` capture final handover evidence.
- `CargoOperationalHandoff` stores tenant-scoped in-transit custody transfers.
- `CargoOperationalHandoff.recordIdempotencyKey` prevents duplicate handoff commands per
  organization.
- `CargoOperationalHandoff.organizationId + handoffReference` prevents duplicate handoff references.
- `CargoOperationalHandoff.handoffType`, custody fields, location, operator, seal, condition, and
  timestamp capture port/rail operational transfer evidence.
- `CargoDeliveryException` stores non-sound delivery attempts and their resolution evidence.
- `CargoDeliveryException.recordIdempotencyKey` prevents duplicate exception record commands per
  organization.
- `CargoDeliveryException.resolveIdempotencyKey` prevents duplicate exception resolution commands
  per organization.
- `CargoDeliveryException.status` captures `open` or `resolved`.
- `CargoClaimSettlement` stores tenant-scoped accounting settlement for accepted claims.
- `CargoClaimSettlement.recordIdempotencyKey` prevents duplicate settlement commands per
  organization.
- `CargoClaimSettlement.organizationId + settlementReference` prevents duplicate settlement
  references.
- `CargoClaimSettlement.organizationId + deliveryExceptionId` enforces one settlement per delivery
  exception.
- `CargoClaimSettlement.settlementType`, currency, amount, counterparty, settlement owner, summary,
  and timestamp capture accounting evidence.
- `Cargo.organizationId + cargoReference` enforces tenant-local cargo identity.
- `CargoComplianceEvidence` stores tenant-scoped cargo evidence documents.
- `CargoComplianceEvidence.recordIdempotencyKey` prevents duplicate evidence recording per
  organization.
- `CargoComplianceEvidence.verifyIdempotencyKey` prevents duplicate evidence verification per
  organization.
- `CargoComplianceEvidence.organizationId + cargoId + evidenceType + documentReference` prevents
  duplicate document evidence per cargo.
- `CargoComplianceEvidence.status` captures `pending_review`, `approved`, or `rejected`.

## Explicit Non-Goals

- No generic cargo CRUD.
- No tariff, pricing, capacity planning, or external accounting integration in this slice.
- No direct external customs authority integration in this slice; Customs ERP Adapter P18 provides
  local governed customs status ingestion through Integration Gateway.

## Delivered Tasks

- `cargo.overview.read`: protected read-only overview.
- `cargo.register`: governed idempotent registration command.
- `cargo.release`: governed idempotent release/readiness command.
- `cargo.transport.plan`: governed idempotent Cargo-to-Tracking command.
- `cargo.transport.depart`: governed idempotent departure lifecycle command.
- `cargo.handoff.record`: governed idempotent operational custody handoff command.
- `cargo.claim.settle`: governed idempotent claims settlement accounting command.
- `cargo.transport.arrive`: governed idempotent arrival lifecycle command.
- `cargo.delivery.complete`: governed idempotent final handover command.
- `cargo.delivery.exception.record`: governed idempotent delivery exception command.
- `cargo.delivery.exception.resolve`: governed idempotent delivery exception resolution command.
- `cargo.compliance.evidence.record`: governed idempotent compliance evidence record command.
- `cargo.compliance.evidence.verify`: governed idempotent compliance evidence verification command.
- Prisma `Cargo` model and migration.
- Prisma `CargoComplianceEvidence` model and migration.
- Prisma `CargoClaimSettlement` model and migration.
- Backend authorization, audit trail, and outbox for registration, release, transport planning, and
  compliance evidence.
- Backend authorization, audit trail, and outbox for cargo departure with tracking state transition.
- Backend authorization, audit trail, and outbox for cargo operational handoffs with tracking
  location update and custody transfer.
- Backend authorization, audit trail, and outbox for cargo arrival and delivery completion with
  tracking state transitions.
- Backend authorization, audit trail, and outbox for cargo delivery exceptions and resolutions with
  tracking state transitions.
- Backend authorization, audit trail, and outbox for cargo claim settlements without tracking state
  mutation.
- Authenticated Cargo UI backed by `cargo.overview.read`, `cargo.register`, and `cargo.release`.
- Cargo transport planning UI backed by `cargo.transport.plan`.
- Cargo departure UI backed by `cargo.transport.depart`.
- Cargo operational handoff UI backed by `cargo.handoff.record`.
- Cargo claim settlement UI backed by `cargo.claim.settle`.
- Cargo arrival UI backed by `cargo.transport.arrive`.
- Cargo delivery completion UI backed by `cargo.delivery.complete`.
- Cargo delivery exception UI backed by `cargo.delivery.exception.record` and
  `cargo.delivery.exception.resolve`.
- Cargo compliance evidence UI backed by record and verify commands.
- E2E anonymous redirect coverage for `/app/cargo`.

## Next Task

The next modular cargo-adjacent task is a governed recommendation approval workflow or the next
approved business module if product priority changes.
