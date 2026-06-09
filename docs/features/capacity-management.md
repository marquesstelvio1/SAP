# Capacity / Slot Constraints

## Scope

Capacity Management is the P9 business slice after Cargo Management P8. It adds governed capacity
resources, operational slots, slot reservations, and reservation cancellation for rail, port, yard,
terminal, berth, gate, and carrier-slot operations.

This module does not introduce generic CRUD. Every write is a command with RBAC, idempotency,
tenant scoping, business-rule validation, audit trail, and outbox event.

## Business Capability

- Register tenant-scoped operational resources.
- Open time-bounded capacity slots against registered resources.
- Reserve slot units for eligible cargo movements.
- Prevent overbooking with atomic reserved-unit updates.
- Cancel active reservations without deleting history.
- Expose tenant-scoped capacity overview for operations.
- Expose tenant-scoped capacity optimization advisory without autonomous execution.
- Record human approval or rejection for advisory recommendations without autonomous execution.

## Security Model

- Required read permission: `capacity.read`.
- Required resource/slot management permission: `capacity.manage`.
- Required reservation permission: `capacity.slot.reserve`.
- Required cancellation permission: `capacity.slot.cancel`.
- Advisory reads reuse `capacity.read`.
- Required advisory decision permission: `capacity.advisory.decide`.
- Every RPC operation requires a resolved organization context.
- Frontend checks permissions before calling the API.
- Backend revalidates session, organization, and permission through `RpcContextService`.
- Resource registration, slot opening, reservation, and cancellation require idempotency keys.

## Business Rules

- Resource code is unique per tenant.
- Resource registration is idempotent per tenant.
- Resource capacity limit must be positive.
- Slot reference is unique per tenant.
- Slot opening is idempotent per tenant.
- Slot window end must be after window start.
- Slot capacity cannot exceed the resource concurrent booking limit.
- Reservation reference is unique per tenant.
- Reservation is idempotent per tenant.
- Reservation requires an eligible cargo state for its purpose.
- Departure reservations require cargo `ready_for_transport`.
- Arrival, delivery, and handoff reservations require cargo `in_transport`.
- Storage reservations are blocked only for cancelled cargo.
- Other reservations are blocked for cancelled or delivered cargo.
- Reservation requires slot status `open`.
- Reservation timestamp must be inside the slot window.
- Reservation units cannot exceed available slot capacity.
- Duplicate cargo-slot-purpose reservation is blocked.
- Cancellation is idempotent per tenant.
- Cancellation requires an active reservation.
- Cancellation timestamp cannot precede reservation timestamp.
- Cancellation releases reserved slot units and preserves historical reservation state.
- Advisory is read-only, tenant-scoped, and cannot execute capacity commands.
- Advisory recommendations require human approval and declare the governed command permission needed
  for follow-up.
- Advisory decision requires a traceable recommendation, slot or reservation reference, decider,
  reason, idempotency key, and approval reference when approved.
- Advisory decision blocks duplicate decisions for the same recommendation.

## Contracts

- RPC operation: `capacity.overview.read`.
- Transport path: `GET /rpc/capacity/overview`.
- RPC operation: `capacity.resource.register`.
- Transport path: `POST /rpc/capacity/registerResource`.
- RPC operation: `capacity.slot.open`.
- Transport path: `POST /rpc/capacity/openSlot`.
- RPC operation: `capacity.slot.reserve`.
- Transport path: `POST /rpc/capacity/reserveSlot`.
- RPC operation: `capacity.slot.cancel`.
- Transport path: `POST /rpc/capacity/cancelSlotReservation`.
- RPC operation: `capacity.optimization.advisory.read`.
- Transport path: `GET /rpc/capacity/advisory`.
- RPC operation: `capacity.advisory.decision.record`.
- Transport path: `POST /rpc/capacity/recordAdvisoryDecision`.

## Data Model

- `CapacityResource` stores tenant-scoped operational resources.
- `CapacityResource.recordIdempotencyKey` prevents duplicate resource commands per organization.
- `CapacityResource.organizationId + resourceCode` enforces tenant-local resource identity.
- `CapacitySlot` stores time-bounded capacity windows.
- `CapacitySlot.recordIdempotencyKey` prevents duplicate slot opening per organization.
- `CapacitySlot.organizationId + slotReference` enforces tenant-local slot identity.
- `CapacitySlot.reservedUnits` tracks allocated capacity units.
- `CapacitySlotReservation` stores immutable reservation lifecycle history.
- `CapacitySlotReservation.reserveIdempotencyKey` prevents duplicate reserve commands per
  organization.
- `CapacitySlotReservation.cancelIdempotencyKey` prevents duplicate cancellation commands per
  organization.
- `CapacitySlotReservation.organizationId + cargoId + slotId + reservationPurpose` blocks duplicate
  cargo-slot-purpose reservations.

## Delivered Tasks

- `capacity.overview.read`: protected read-only overview.
- `capacity.resource.register`: governed idempotent resource registration.
- `capacity.slot.open`: governed idempotent slot opening.
- `capacity.slot.reserve`: governed idempotent slot reservation with no-overbooking guard.
- `capacity.slot.cancel`: governed idempotent reservation cancellation with unit release.
- `capacity.optimization.advisory.read`: rule-based advisory for saturation, expiry, unused
  capacity, reservation imbalance, and cancellation review.
- `capacity.advisory.decision.record`: governed human approval/rejection evidence for an advisory
  recommendation.
- `capacity.advisory.decision.analytics.read`: read-only approval metrics, recommendation-type
  groups, required-permission groups, and recent human decisions.
- Prisma capacity models and migration.
- Backend authorization, audit trail, and outbox for all commands.
- Authenticated Capacity UI backed by all capacity commands.
- Authenticated Capacity Advisory Decision UI backed by `capacity.advisory.decision.record`.
- Authenticated Capacity Advisory Decision Analytics UI backed by
  `capacity.advisory.decision.analytics.read`.
- E2E anonymous redirect coverage for `/app/capacity`.

## Explicit Non-Goals

- No generic resource CRUD.
- No autonomous optimization execution.
- No external terminal operating system integration yet.
- No automated dispatch changes without human approval.

## Next Task

Capacity optimization advisory, advisory decision recording, and advisory decision analytics are
closed locally. The next modular task can be the next approved logistics bounded context or the next
approved external adapter.
