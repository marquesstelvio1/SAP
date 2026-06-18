# Capacity Advisory Release Evidence

## Purpose

This document defines the local release evidence required for the Capacity Optimization Advisory
P11 slice.

## Module Scope

- Tenant-scoped capacity optimization advisory.
- Rule-based recommendations from current slots and reservations.
- Mandatory human approval for any operational change.
- Protected Capacity UI rendering advisory state and automation policy.
- No autonomous execution and no persistence mutation from the advisory read.

## Required Gates

- `pnpm validate:capacity-advisory`
- `pnpm validate:capacity-foundation`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/capacity-optimization-advisory.md`
- `packages/rpc/src/capacity.ts`
- `packages/rpc/tests/capacity.test.mjs`
- `apps/api/src/capacity/capacity.service.ts`
- `apps/api/src/capacity/capacity-rpc.router.ts`
- `apps/api/tests/capacity-rpc.test.mjs`
- `apps/web/lib/capacity-advisory.ts`
- `apps/web/app/(platform)/app/capacity/page.tsx`
- `scripts/validate-capacity-advisory.mjs`

## Acceptance Criteria

- Governed advisory read is available through `capacity.optimization.advisory.read`.
- Transport is available through `GET /rpc/capacity/advisory`.
- Advisory requires `capacity.read` and resolved organization context.
- Advisory recommendations use source `rule_based_capacity_optimizer`.
- Advisory policy sets automation to blocked.
- Advisory policy requires human approval.
- Backend advisory reads current slots and reservations without creating audit, outbox, slot,
  reservation, or cargo mutations.
- Recommendations cover slot saturation, expiring slots, unused capacity, reservation imbalance,
  and cancellation review.
- Frontend Capacity UI displays advisory recommendations and policy under `/app/capacity`.
- Tests validate RPC schema, metadata, router authorization, and service delegation.

## Production Evidence Still Required

- Runtime logs/metrics showing `capacity.optimization.advisory.read`.
- Staging smoke output for `/app/capacity`.
- Human go/no-go approval for Capacity Advisory P11 release.
