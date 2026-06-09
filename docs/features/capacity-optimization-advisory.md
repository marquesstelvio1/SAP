# Capacity Optimization Advisory

## Scope

Capacity Optimization Advisory is the P11 follow-up slice after Capacity Management P9. It adds a
tenant-scoped, rule-based recommendation layer for capacity usage without creating autonomous
dispatch, automated slot changes, or generic CRUD.

The advisory reads current slots and reservations, detects operational risks, and returns
recommendations that require human approval before any command is executed.

## Business Capability

- Detect slot saturation before new reservations are blocked.
- Detect open capacity windows that are close to expiry.
- Detect low-utilization capacity that should be consolidated or reviewed.
- Detect concentrated reservations that can create operational bottlenecks.
- Detect recurring cancellation patterns by resource.
- Display advisory recommendations inside the protected Capacity UI.

## Security Model

- Required read permission: `capacity.read`.
- RPC operation: `capacity.optimization.advisory.read`.
- Transport path: `GET /rpc/capacity/advisory`.
- Source: `rule_based_capacity_optimizer`.
- Automation policy: blocked.
- Human approval: mandatory.
- Advisory output never mutates resource, slot, reservation, cargo, audit, or outbox state.

## Business Rules

- Advisory is tenant-scoped by organization.
- Advisory is read-only and cannot execute capacity commands.
- Slot saturation is recommended when utilization reaches at least 85%.
- Critical saturation is recommended when a slot has no available units.
- Expiring-slot review is recommended when an open slot has available units and the window ends
  within 24 hours.
- Low-utilization review is recommended when a material open slot has 25% or lower utilization.
- Reservation imbalance is recommended when multiple active reservations are concentrated in a
  highly utilized slot.
- Cancellation review is recommended when multiple recent cancellations occur on the same resource.
- Every recommendation declares the required human-approved command permission.

## Delivered Tasks

- `capacity.optimization.advisory.read` RPC contract.
- Backend advisory service with deterministic rule-based recommendations.
- API route `GET /rpc/capacity/advisory`.
- Frontend server-side RPC client `getCapacityAdvisory`.
- Protected Capacity UI section for advisory recommendations and automation policy.
- P12 decision command `capacity.advisory.decision.record` for human approval/rejection evidence.
- Protected decision form `CapacityAdvisoryDecisionForm`.
- RPC contract tests and API router authorization tests.
- Dedicated `pnpm validate:capacity-advisory` governance gate.

## Explicit Non-Goals

- No autonomous execution.
- No external AI provider integration.
- No automated slot creation, reservation, cancellation, or dispatch.
- No new persistence table until recommendation acceptance/rejection workflows are approved.

## Next Task

The next modular slice can be a separately approved logistics bounded context or analytics over
recorded advisory decisions.
