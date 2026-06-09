# Capacity Advisory Decision Analytics

## Scope

Capacity Advisory Decision Analytics is the P20 follow-up slice after Capacity Advisory Decision
P12. It reads recorded human approval/rejection decisions and summarizes governance outcomes without
executing operational capacity commands.

## Business Capability

- Read decision totals for a tenant-scoped time window.
- Calculate approved, rejected, and approval-rate metrics.
- Group decisions by recommendation type.
- Group decisions by required operational permission.
- Show recent decisions with human evidence.
- Preserve no-autonomous-execution policy.

## Security Model

- Required permission: `capacity.read`.
- RPC operation: `capacity.advisory.decision.analytics.read`.
- Transport path: `GET /rpc/capacity/advisoryDecisionAnalytics`.
- Analytics reads do not grant `capacity.manage`, `capacity.slot.reserve`, or
  `capacity.slot.cancel`.
- Analytics never creates audit records, outbox events, slots, reservations, cancellations, or
  cargo mutations.

## Business Rules

- Analytics is tenant-scoped by organization.
- Analytics is read-only.
- Analytics defaults to the last 30 days.
- Recent decisions are limited by request input.
- Approval rate is derived only from recorded human decisions.
- Required-permission groups use governed capacity permissions.
- Human approval remains mandatory for operational follow-up.
- No operational capacity command is executed automatically.

## Delivered Tasks

- RPC contract `capacity.advisory.decision.analytics.read`.
- Backend query `getAdvisoryDecisionAnalytics`.
- Protected Capacity UI analytics block.
- RPC contract tests and API delegation tests.
- Capacity advisory validator coverage.

## Explicit Non-Goals

- No autonomous execution after approval.
- No AI-provider scoring.
- No cross-tenant analytics.
- No write-side mutation.
