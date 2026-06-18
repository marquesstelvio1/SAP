# Operational Tracking Overview

## Scope

Operational Tracking is the first business feature after the local foundation gate. The first slice was read-only and tenant-scoped. The second slice introduced a controlled auditable write command. The third slice adds authenticated event-recording UI for operations users. The fourth slice adds shipment detail and timeline UI backed by a governed read RPC. The fifth slice adds a governed exception-management command. The sixth slice adds authenticated exception-management UI backed by that command. The seventh slice adds a governed exception-resolution command. The eighth slice adds authenticated exception-resolution UI backed by that command. The ninth slice exposes authenticated dashboard data states in the Control Center using the same governed overview contract. The tenth slice adds operator evidence and approval context to exception lifecycle changes. The eleventh slice adds exception workflow completion states and release evidence for the first business module. The twelfth slice adds operational analytics aggregates. The thirteenth slice adds local AI advisory recommendations with mandatory human approval and Playwright visual regression coverage.

## Business Capability

- Track cargo movements across rail, port, road, and multimodal operations.
- Provide a governed operational overview by organization.
- Surface shipment status, recent movement events, delays, and exceptions.
- Record operational events through an idempotent command with audit and outbox events.
- Provide a protected UI for operations users to record events without exposing generic CRUD.
- Inspect a tenant-scoped shipment timeline with event payload, source, location, and correlation id.
- Manage operational exceptions through a dedicated idempotent command with audit and outbox records.
- Provide protected exception-management UI without exposing generic shipment update screens.
- Resolve active operational exceptions through a dedicated idempotent command with audit and outbox records.
- Provide protected exception-resolution UI without exposing generic shipment update screens.
- Expose tenant-scoped operational snapshot states in the authenticated Control Center.
- Capture operator evidence, evidence reference, approval status, approval reference, and approver context for exception changes.
- Expose exception workflow states on timeline events and close the workflow after approved release.
- Include Operational Tracking in generated release evidence as the first business module release candidate.
- Expose operational analytics aggregates for SLA risk, event volume, modal distribution, and workflow states.
- Provide local AI advisory recommendations for SLA risk, exception recovery, priority review, and workflow review.
- Keep advisory output consultative only; any operational change still uses human-approved governed commands.

## Security Model

- Required permission: `tracking.shipment.read`.
- Event recording permission: `tracking.event.record`.
- Exception management permission: `tracking.exception.manage`.
- Exception resolution permission: `tracking.exception.resolve`.
- Every RPC operation requires a resolved organization context.
- Frontend checks permissions before calling the API.
- Backend revalidates session, organization, and permission through `RpcContextService`.
- Event recording requires an idempotency key and writes audit/outbox records transactionally.
- Event recording UI is disabled unless the session has `tracking.event.record`.
- Shipment detail uses the same `tracking.shipment.read` permission and backend organization filter.
- Exception management requires `tracking.exception.manage`.
- Exception management requires explicit operator evidence before status impact is recorded.
- Exception management records status impact, recovery plan, ownership context, audit trail, and outbox event transactionally.
- Exception-management UI is disabled unless the session has `tracking.exception.manage`.
- Exception resolution requires `tracking.exception.resolve`.
- Exception resolution is rejected unless the shipment is currently delayed or in exception state.
- Exception resolution requires approved evidence with approval reference and approver name.
- Exception resolution emits the terminal `closed` workflow state.
- Exception resolution records a release event, status recovery, audit trail, and outbox event transactionally.
- Exception-resolution UI is disabled unless the session has `tracking.exception.resolve` and the shipment is delayed or in exception state.
- Analytics and advisory reads use `tracking.shipment.read` and remain tenant-scoped.
- Advisory recommendations set `automationAllowed=false` and `humanApprovalRequired=true`.

## Contracts

- RPC operation: `tracking.overview.read`.
- Transport path: `GET /rpc/tracking/overview`.
- Output includes:
  - tenant organization id
  - shipment totals
  - status distribution
  - recent shipments with latest event summary
- RPC operation: `tracking.analytics.read`.
- Transport path: `GET /rpc/tracking/analytics`.
- Output includes:
  - analytics window
  - operational KPIs
  - SLA risk counts
  - modal distribution
  - event type aggregates
  - exception workflow state aggregates
- RPC operation: `tracking.ai.advisory.read`.
- Transport path: `GET /rpc/tracking/advisory`.
- Output includes:
  - advisory policy
  - consultative recommendations
  - affected shipment context
  - confidence score
  - required human approval permission
- RPC operation: `tracking.event.record`.
- Transport path: `POST /rpc/tracking/events`.
- Input includes:
  - shipment id
  - event type
  - occurred timestamp
  - idempotency key
  - optional location, notes, source system, and JSON payload
- Output includes:
  - recorded event
  - current shipment status
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `tracking.shipment.detail.read`.
- Transport path: `GET /rpc/tracking/shipmentDetail`.
- Input includes:
  - shipment id
  - event limit
- Output includes:
  - shipment detail
  - latest known state
  - timeline events
  - source system, correlation id, idempotency key, and payload per event
  - exception workflow state per lifecycle event
- RPC operation: `tracking.exception.manage`.
- Transport path: `POST /rpc/tracking/exceptions`.
- Input includes:
  - shipment id
  - exception category and severity
  - occurred timestamp
  - idempotency key
  - summary and recovery plan
  - operator evidence, evidence reference, evidence summary, and approval status
  - optional owner team, expected resolution timestamp, location, source system, and payload
- Output includes:
  - managed exception details
  - operator evidence and approval context
  - tracking event
  - previous/current shipment status
  - idempotency replay state
  - audit subject
  - outbox aggregate
- RPC operation: `tracking.exception.resolve`.
- Transport path: `POST /rpc/tracking/exceptionResolution`.
- Input includes:
  - shipment id
  - occurred timestamp
  - idempotency key
  - resolution code
  - resolution summary
  - next shipment status
  - approved operator evidence, approval reference, and approver name
  - optional owner team, location, source system, and payload
- Output includes:
  - resolution details
  - approved evidence and approval context
  - terminal workflow state
  - release event
  - previous/current shipment status
  - idempotency replay state
  - audit subject
  - outbox aggregate

## Data Model

- `TrackingShipment` stores tenant-scoped cargo movement state.
- `TrackingEvent` stores the operational event timeline for each shipment.
- `TrackingEvent.idempotencyKey` prevents duplicate event recording per organization.
- Both models are scoped to `Organization`.

## Explicit Non-Goals

- No generic CRUD.
- No shipment create/update/delete UI yet.
- No external AI provider integration yet.
- No autonomous AI action execution.
- No multi-domain expansion until this module has tests, audit, and release evidence.

## Delivered Tasks

- `tracking.overview.read`: protected read-only overview.
- `tracking.event.record`: auditable idempotent event recording command.
- Authenticated event-recording UI backed by `tracking.event.record`.
- `tracking.shipment.detail.read`: protected shipment detail and event timeline.
- Authenticated timeline UI linked from the tracking overview.
- `tracking.exception.manage`: governed exception command with idempotency, audit, outbox, and status impact.
- Authenticated exception-management UI backed by `tracking.exception.manage`.
- `tracking.exception.resolve`: governed exception resolution command with idempotency, audit, outbox, and status recovery.
- Authenticated exception-resolution UI backed by `tracking.exception.resolve`.
- Authenticated Control Center data states backed by `tracking.overview.read`.
- Operator evidence and approval context for exception management and resolution.
- Exception workflow completion states in timeline, command output, audit, and outbox.
- Operational Tracking release evidence artifact.
- `tracking.analytics.read`: protected operational aggregates for SLA, events, modal mix, and workflow states.
- `tracking.ai.advisory.read`: local advisory recommendations with mandatory human approval.
- Tracking overview UI renders analytics aggregates and advisory policy/recommendations.
- Playwright visual regression covers sign-in and protected tracking redirect states.

## Next Task

The local product backlog for the current Operational Tracking module is closed. The next work is production/cloud cutover or a separately approved next business module.
