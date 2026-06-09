# Cargo Management Release Evidence

## Purpose

This document defines the local release evidence required for the Cargo Management
P0+P1+P2+P3+P4+P5+P6+P7+P8 slice.

## Module Scope

- Tenant-scoped cargo overview.
- Governed cargo registration.
- Idempotent registration command.
- Governed cargo release/readiness.
- Idempotent release command.
- Governed Cargo-to-Tracking linkage.
- Idempotent transport planning command.
- Governed compliance evidence record.
- Governed compliance evidence verification.
- Idempotent evidence record and verification commands.
- governed departure lifecycle.
- Idempotent departure command.
- governed arrival lifecycle.
- Idempotent arrival command.
- governed operational handoff lifecycle.
- Idempotent operational handoff command.
- governed claim settlement accounting.
- Idempotent claim settlement command.
- governed delivery completion lifecycle.
- Idempotent delivery completion command.
- governed delivery exception lifecycle.
- Idempotent delivery exception record and resolution commands.
- Cargo business rule validation.
- Audit trail and outbox event for registration, release, transport planning, and compliance
  evidence.
- Audit trail and outbox event for departure with Cargo and Tracking state transition.
- Audit trail and outbox event for arrival and delivery completion with Cargo and Tracking state
  transitions.
- Audit trail and outbox event for operational handoff with custody transfer and Tracking location
  update.
- Audit trail and outbox event for claim settlement without Tracking state mutation.
- Audit trail and outbox event for delivery exception record and resolution with Cargo and Tracking
  state transitions.
- Protected Cargo UI.

## Required Gates

- `pnpm validate:cargo-foundation`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/cargo-management.md`
- `packages/rpc/src/cargo.ts`
- `packages/rpc/tests/cargo.test.mjs`
- `apps/api/src/cargo/cargo.service.ts`
- `apps/api/src/cargo/cargo-rpc.router.ts`
- `apps/api/tests/cargo-rpc.test.mjs`
- `apps/web/app/(platform)/app/cargo/page.tsx`
- `apps/web/components/cargo-register-form.tsx`
- `apps/web/components/cargo-release-form.tsx`
- `apps/web/components/cargo-transport-plan-form.tsx`
- `apps/web/components/cargo-transport-depart-form.tsx`
- `apps/web/components/cargo-transport-arrive-form.tsx`
- `apps/web/components/cargo-operational-handoff-record-form.tsx`
- `apps/web/components/cargo-claim-settlement-record-form.tsx`
- `apps/web/components/cargo-delivery-complete-form.tsx`
- `apps/web/components/cargo-delivery-exception-record-form.tsx`
- `apps/web/components/cargo-delivery-exception-resolve-form.tsx`
- `apps/web/components/cargo-compliance-evidence-record-form.tsx`
- `apps/web/components/cargo-compliance-evidence-verify-form.tsx`
- `scripts/validate-cargo-foundation.mjs`

## Acceptance Criteria

- governed cargo registration is available through `cargo.register`.
- idempotent registration is enforced per organization.
- governed cargo release is available through `cargo.release`.
- idempotent release is enforced per organization.
- governed cargo transport planning is available through `cargo.transport.plan`.
- idempotent transport planning is enforced per organization.
- governed compliance evidence record is available through `cargo.compliance.evidence.record`.
- governed compliance evidence verification is available through `cargo.compliance.evidence.verify`.
- idempotent evidence record and verification are enforced per organization.
- governed cargo departure is available through `cargo.transport.depart`.
- idempotent departure is enforced per organization.
- governed cargo arrival is available through `cargo.transport.arrive`.
- idempotent arrival is enforced per organization.
- governed cargo operational handoff is available through `cargo.handoff.record`.
- idempotent operational handoff is enforced per organization.
- governed claim settlement accounting is available through `cargo.claim.settle`.
- idempotent claim settlement is enforced per organization.
- governed cargo delivery completion is available through `cargo.delivery.complete`.
- idempotent delivery completion is enforced per organization.
- governed cargo delivery exception record is available through `cargo.delivery.exception.record`.
- governed cargo delivery exception resolution is available through
  `cargo.delivery.exception.resolve`.
- idempotent delivery exception record and resolution are enforced per organization.
- Cargo read, registration, release, transport planning, handoff, claim settlement, evidence record,
  and evidence verification permissions plus departure, arrival, delivery, and delivery exception
  permissions exist in runtime auth and RBAC seed catalogs.
- Cargo registration validates P0 business rules before persistence.
- Cargo registration is idempotent per organization.
- Cargo release validates P1 business rules before readiness.
- Cargo transport planning validates P2 business rules before creating tracking.
- Cargo evidence record validates P3 business rules before persistence.
- Cargo evidence verification validates P3 business rules before approval or rejection.
- Cargo departure validates P4 business rules before movement starts.
- Cargo operational handoff validates P7 business rules before custody transfer.
- Cargo claim settlement validates P8 business rules before accounting settlement.
- Cargo arrival validates P5 business rules before confirming physical arrival.
- Cargo delivery completion validates P5 business rules before final handover closure.
- Cargo delivery exception record validates P6 business rules before opening exception state.
- Cargo delivery exception resolution validates P6 business rules before restoring delivery
  eligibility.
- Backend cargo registration persists cargo, audit record, and outbox event transactionally.
- Backend cargo release updates readiness, audit record, and outbox event transactionally.
- Backend cargo transport planning creates tracking shipment, initial event, cargo link, audit
  record, and outbox event transactionally.
- Backend cargo evidence record and verification persist audit record and outbox event
  transactionally.
- Backend cargo departure updates cargo, tracking shipment, tracking event, audit record, and outbox
  event transactionally.
- Backend cargo operational handoff updates cargo custody, tracking event, audit record, and outbox
  event transactionally.
- Backend cargo claim settlement writes accounting settlement, audit record, and outbox event
  transactionally without mutating tracking state.
- Backend cargo arrival updates cargo, tracking shipment, tracking event, audit record, and outbox
  event transactionally.
- Backend cargo delivery completion updates cargo, tracking shipment, tracking event, audit record,
  and outbox event transactionally.
- Backend cargo delivery exception record and resolution update cargo, tracking shipment, tracking
  event, audit record, and outbox event transactionally.
- Frontend Cargo UI is protected by session, organization, and permissions.
- E2E validates anonymous redirect for `/app/cargo`.

## Production Evidence Still Required

- Registry image digest for API and Web after Cargo changes.
- Staging smoke output for `/app/cargo`.
- Runtime logs/metrics showing cargo RPC operations.
- Human go/no-go approval for Cargo P0+P1+P2+P3+P4+P5+P6+P7+P8 release.
