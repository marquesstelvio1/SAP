# Capacity Advisory Decision

## Scope

Capacity Advisory Decision is the P12 follow-up slice after Capacity Optimization Advisory P11. It
records a human approval or rejection for a generated recommendation without executing operational
capacity commands automatically.

## Business Capability

- Record approval or rejection for a capacity advisory recommendation.
- Require explicit human decision evidence.
- Require approval reference when the decision is approved.
- Prevent duplicate decisions for the same recommendation.
- Preserve idempotent command behavior.
- Emit audit record and outbox event for downstream review.

## Security Model

- Required permission: `capacity.advisory.decide`.
- RPC operation: `capacity.advisory.decision.record`.
- Transport path: `POST /rpc/capacity/recordAdvisoryDecision`.
- Decision recording does not grant permission to execute the follow-up operational command.
- Follow-up commands still require `capacity.manage`, `capacity.slot.reserve`, or
  `capacity.slot.cancel`.

## Business Rules

- Recommendation id must be traceable and start with `capacity-advisory:`.
- Decision must reference a tenant-scoped slot or reservation.
- Human decision evidence requires decider name and decision reason.
- Approved decisions require approval reference.
- A recommendation can be decided only once per tenant.
- Decision recording is idempotent per tenant.
- Decision recording writes decision, audit record, and outbox event transactionally.
- Decision recording never opens slots, reserves capacity, cancels reservations, or mutates cargo.

## Delivered Tasks

- Prisma model `CapacityAdvisoryDecision`.
- Migration `20260604230000_capacity_advisory_decision`.
- Permission `capacity.advisory.decide`.
- RPC contract `capacity.advisory.decision.record`.
- Backend command `recordAdvisoryDecision`.
- Protected UI form `CapacityAdvisoryDecisionForm`.
- Follow-up analytics delivered separately through Capacity Advisory Decision Analytics P20.
- RPC contract tests, API delegation tests, and advisory governance validator coverage.

## Explicit Non-Goals

- No autonomous execution after approval.
- No automatic dispatch.
- No external AI provider.
