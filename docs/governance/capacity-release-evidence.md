# Capacity Release Evidence

## Purpose

This document defines the local release evidence required for the Capacity / Slot Constraints P9
slice.

## Module Scope

- Tenant-scoped capacity overview.
- governed capacity resource registration.
- governed capacity slot opening.
- governed slot reservation with no-overbooking rules.
- governed reservation cancellation with reserved-unit release.
- Idempotent resource, slot, reserve, and cancellation commands.
- Audit trail and outbox event for every critical capacity mutation.
- Protected Capacity UI.
- Capacity optimization advisory with human approval and no autonomous execution.
- Capacity advisory decision recording with idempotency, audit, outbox, and no autonomous execution.

## Required Gates

- `pnpm validate:capacity-foundation`
- `pnpm validate:capacity-advisory`
- `pnpm validate:migrations`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/capacity-management.md`
- `docs/features/capacity-optimization-advisory.md`
- `docs/features/capacity-advisory-decision.md`
- `docs/governance/capacity-advisory-release-evidence.md`
- `docs/governance/capacity-advisory-decision-release-evidence.md`
- `packages/rpc/src/capacity.ts`
- `packages/rpc/tests/capacity.test.mjs`
- `apps/api/src/capacity/capacity.service.ts`
- `apps/api/src/capacity/capacity-rpc.router.ts`
- `apps/api/tests/capacity-rpc.test.mjs`
- `apps/web/lib/capacity-advisory.ts`
- `apps/web/components/capacity-advisory-decision-form.tsx`
- `apps/web/app/(platform)/app/capacity/page.tsx`
- `apps/web/components/capacity-resource-register-form.tsx`
- `apps/web/components/capacity-slot-open-form.tsx`
- `apps/web/components/capacity-slot-reserve-form.tsx`
- `apps/web/components/capacity-slot-cancel-form.tsx`
- `scripts/validate-capacity-foundation.mjs`
- `scripts/validate-capacity-advisory.mjs`

## Acceptance Criteria

- governed capacity overview is available through `capacity.overview.read`.
- governed resource registration is available through `capacity.resource.register`.
- governed slot opening is available through `capacity.slot.open`.
- governed slot reservation is available through `capacity.slot.reserve`.
- governed slot cancellation is available through `capacity.slot.cancel`.
- governed advisory read is available through `capacity.optimization.advisory.read`.
- governed advisory decision is available through `capacity.advisory.decision.record`.
- idempotent capacity resource registration is enforced per organization.
- idempotent slot opening is enforced per organization.
- idempotent slot reservation is enforced per organization.
- idempotent slot cancellation is enforced per organization.
- Capacity permissions exist in runtime auth and RBAC seed catalogs.
- Backend resource registration persists resource, audit record, and outbox event transactionally.
- Backend slot opening persists slot, audit record, and outbox event transactionally.
- Backend slot reservation updates reserved units, writes reservation, audit record, and outbox event
  transactionally.
- Backend slot reservation prevents overbooking with atomic capacity checks.
- Backend slot cancellation updates reservation state, releases units, writes audit record, and
  emits outbox transactionally.
- Frontend Capacity UI is protected by session, organization, and permissions.
- Frontend Capacity UI displays advisory recommendations with automation blocked.
- Capacity advisory requires human approval and does not mutate operational state.
- Capacity advisory decisions require `capacity.advisory.decide`, idempotency, approval evidence,
  audit, and outbox.
- Capacity advisory decisions do not execute capacity management, reservation, or cancellation
  commands automatically.
- E2E validates anonymous redirect for `/app/capacity`.

## Production Evidence Still Required

- Registry image digest for API and Web after Capacity changes.
- Staging smoke output for `/app/capacity`.
- Runtime logs/metrics showing capacity RPC operations.
- Human go/no-go approval for Capacity P9 release.
