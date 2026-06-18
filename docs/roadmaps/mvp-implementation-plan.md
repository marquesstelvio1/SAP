# SAPTM MVP Implementation Plan

## Objective

Deliver a functional enterprise logistics MVP before expanding infrastructure or secondary modules.

The MVP must prove one coherent operational flow:

Cargo registration -> compliance -> release -> transport planning -> capacity reservation ->
dispatch/departure -> operational tracking -> exception handling -> arrival/delivery -> reports,
audit, and notifications.

## Execution Rule

Implementation order is mandatory:

1. Backend business logic.
2. Backend integration tests.
3. Frontend operational journey.
4. End-to-end local validation.
5. Infrastructure hardening only when the product flow is proven.

Do not prioritize cloud, SMTP, registry, TLS, Kubernetes, DR, or production observability before
the MVP business flow is closed locally.

## MVP Scope

### Included

- Tenant-scoped Cargo Management.
- Compliance evidence and verification.
- Cargo release/readiness.
- Transport Planning.
- Capacity slot reservation.
- Dispatch/departure execution.
- Operational Tracking.
- Exception management and resolution.
- Arrival and delivery completion.
- Operational reports/export.
- Audit trail.
- Outbox notifications.
- IAM/RBAC required for operators and admins.
- Better Auth MFA/two-factor enrollment for authenticated account security.

### Excluded From MVP

- Real SMTP/email provider.
- Cloud production infrastructure.
- External provider integrations beyond local adapters.
- Advanced AI prediction models.
- Billing/subscription.
- Asset maintenance.
- Full optimization engine.

## P0 Backend Business Logic

### P0-BE-01 Cargo Lifecycle Integration

Goal: prove Cargo can move through the full lifecycle without bypassing rules.

Tasks:

- Verify cargo registration blocks duplicate tenant references.
- Verify hazardous cargo requires compliance evidence before release/departure.
- Verify damaged or inspection-required cargo cannot be released without approved evidence.
- Verify release requires valid status, customs clearance, and inspection readiness.
- Verify release emits audit and outbox evidence.

Acceptance criteria:

- Integration tests prove valid and invalid cargo transitions.
- No state transition occurs without tenant scope, idempotency, audit, and outbox.

Status:

- Done: service integration tests now cover duplicate cargo reference blocking, governed release,
  planning blocked before release, departure blocked before approved compliance evidence, and
  audit/outbox evidence across the Cargo -> Planning -> Compliance -> Departure path.
- Remaining: add explicit invalid-status release tests and damaged-only inspection edge cases.

### P0-BE-02 Cargo to Planning Linkage

Goal: prove released cargo can become an executable transport plan.

Tasks:

- Verify transport planning requires released cargo.
- Verify ETA is after departure.
- Verify one tracking shipment is created per planned cargo.
- Verify duplicate planning is idempotent or blocked by business identity.

Acceptance criteria:

- Integration tests prove planning creates tracking linkage and audit/outbox evidence.

Status:

- Done: service integration tests prove released cargo creates one tracking shipment, idempotent
  planning replay works, duplicate replanning is blocked, duplicate tracking references are blocked,
  and audit/outbox evidence is emitted.
- Remaining: none for Cargo-to-Tracking planning linkage; capacity/transport-order linkage is covered
  under the next backend sections.

### P0-BE-03 Capacity Reservation Rules

Goal: prove capacity is reserved only for eligible operational work.

Tasks:

- Verify resource codes are unique per tenant.
- Verify slot windows are valid.
- Verify slot reservation blocks overbooking.
- Verify reservation requires eligible cargo/planning state.
- Verify cancellation restores availability semantics.

Acceptance criteria:

- Integration tests prove no overbooking and correct cancellation/audit/outbox behavior.

Status:

- Done: service integration tests prove resource uniqueness, valid slot windows, slot capacity
  limits, cargo eligibility for departure reservations, duplicate reservation blocking, overbooking
  blocking, cancellation timestamp rules, capacity release after cancellation, and audit/outbox events.
- Remaining: integrate capacity reservation directly into the guided frontend journey.

### P0-BE-04 Dispatch, Departure, Arrival, Delivery

Goal: prove execution lifecycle moves cargo and tracking consistently.

Tasks:

- Verify dispatch requires confirmed transport order.
- Verify departure requires released/planned cargo and approved compliance.
- Verify arrival requires in-transport cargo and in-transit tracking.
- Verify delivery completion requires arrived cargo, sound condition, and timestamp ordering.

Acceptance criteria:

- Integration tests prove cargo, transport order, and tracking states remain consistent.

Status:

- Done: service integration tests prove departure, arrival, and delivery update cargo/tracking
  consistently, enforce timestamp ordering, block damaged delivery completion, and emit audit/outbox.
- Remaining: add transport order dispatch integration coverage.

### P0-BE-05 Exception and Recovery Flow

Goal: prove operational exceptions are controlled, auditable, and recoverable.

Tasks:

- Verify delivery exception requires non-sound condition or explicit exception evidence.
- Verify exception moves cargo/tracking to held/exception states.
- Verify resolution requires active exception and valid resolution evidence.
- Verify accepted claims can be settled and cannot be duplicated.

Acceptance criteria:

- Integration tests prove exception creation, resolution, settlement, audit, and outbox.

Status:

- Done: service integration tests prove exception recording only after arrival, cargo/tracking move
  to held/exception, duplicate open exceptions are blocked, resolution requires sound final condition,
  claim settlement requires matching accepted claim, duplicate settlements are blocked, delivery can
  resume after resolution, and audit/outbox evidence is emitted.
- Remaining: expose this recovery journey as a guided frontend workflow.

### P0-BE-06 Reports, Audit, Notifications

Goal: prove the MVP produces operational evidence.

Tasks:

- Verify reports can export Cargo, Tracking, Capacity, Planning, and Tariff domains.
- Verify audit search/export returns critical events.
- Verify outbox worker creates notifications for critical events.
- Verify notification acknowledgement is audit-backed.

Acceptance criteria:

- Integration/E2E tests prove evidence generation after the MVP flow.

### P0-BE-07 IAM/RBAC Enforcement

Goal: prove operators cannot bypass permissions.

Tasks:

- Verify cargo operator grants are sufficient for cargo lifecycle but not admin operations.
- Verify tracking operator grants can update tracking but not release cargo.
- Verify report exporter can export only allowed domains.
- Verify suspended/removed members are denied.

Acceptance criteria:

- Authorization tests cover allow and deny paths for all MVP operations.

## P1 Frontend MVP Journey

### P1-FE-01 Operational Control Journey

Goal: convert separate pages/forms into a guided operational workflow.

Tasks:

- Add an operational journey panel on Cargo/Control Center.
- Show next valid actions per cargo state.
- Show blocked actions with rule explanation.
- Link cargo to tracking, planning, capacity, audit, and reports.

Acceptance criteria:

- User can understand what to do next without knowing internal module order.

### P1-FE-02 Cargo Lifecycle UX

Tasks:

- Group cargo actions by lifecycle stage.
- Show compliance readiness state.
- Show release blockers.
- Show transport/tracking linkage.
- Show delivery/exception status.

Acceptance criteria:

- Cargo page behaves as an operational workspace, not a list of unrelated forms.

### P1-FE-03 Planning and Capacity UX

Tasks:

- Show capacity availability before reservation.
- Show linked cargo and transport order context.
- Surface overbooking and eligibility errors clearly.

Acceptance criteria:

- Operator can reserve and dispatch without leaving blind state.

### P1-FE-04 Tracking and Exception UX

Tasks:

- Show timeline, current state, next action, exception status, and recovery plan.
- Link tracking exception back to cargo delivery exception where relevant.

Acceptance criteria:

- Operator can follow disrupted movement from exception to resolution.

### P1-FE-05 Evidence UX

Tasks:

- Surface audit trail, outbox notification, and report export from the journey.
- Show generated evidence after critical commands.

Acceptance criteria:

- MVP demo can prove traceability without database inspection.

## P2 Local E2E Validation

Tasks:

- Run full MVP flow with local Postgres/Redis.
- Seed tenant admin and demo baseline.
- Submit real forms through the UI.
- Verify final cargo delivered state.
- Verify tracking completed state.
- Verify report export.
- Verify audit events.
- Verify notifications.

Acceptance criteria:

- One Playwright flow proves the complete MVP journey.

## P3 Deferred Infrastructure

These are real production tasks, but not blockers for MVP business closure:

- SMTP/transactional email.
- Cloud registry push.
- Staging/production cluster.
- Domain, TLS, ingress.
- Managed secrets.
- External observability.
- Backup and DR.
- Security scan and load tests.

## Current Execution Priority

Start with P0 backend validation and close gaps in this order:

1. P0-BE-01 Cargo Lifecycle Integration.
2. P0-BE-02 Cargo to Planning Linkage.
3. P0-BE-03 Capacity Reservation Rules.
4. P0-BE-04 Dispatch, Departure, Arrival, Delivery.
5. P0-BE-05 Exception and Recovery Flow.
6. P0-BE-06 Reports, Audit, Notifications.
7. P0-BE-07 IAM/RBAC Enforcement.

Only after P0 backend is closed, move to P1 frontend journey.

## Execution Log

- 2026-06-08: created this MVP implementation plan and started P0 backend execution.
- 2026-06-08: added Cargo service business-rule integration coverage without requiring Docker,
  proving Cargo registration, duplicate-reference blocking, release, tracking planning, compliance
  verification, departure blockers, audit records, and outbox events.
- 2026-06-08: expanded Cargo service coverage for planning replay, duplicate tracking-reference
  blocking, arrival ordering, delivery ordering, damaged delivery blockers, and completed delivery.
- 2026-06-08: added Capacity service business-rule integration coverage for resource uniqueness,
  slot opening, reservation eligibility, overbooking prevention, cancellation, capacity restoration,
  audit records, and outbox events.
- 2026-06-08: expanded Cargo service coverage for delivery exception recording, duplicate open
  exception blocking, exception resolution, claim settlement, duplicate settlement blocking, and
  delivery completion after recovery.
