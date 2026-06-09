# Capacity Advisory Decision Release Evidence

## Purpose

This document defines local release evidence for Capacity Advisory Decision P12.

## Module Scope

- Human approval/rejection record for advisory recommendations.
- idempotent decision command.
- Audit trail and outbox event.
- Protected Capacity UI form.
- No autonomous execution of operational commands.

## Required Gates

- `pnpm validate:capacity-advisory`
- `pnpm validate:migrations`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/capacity-advisory-decision.md`
- `packages/database/prisma/migrations/20260604230000_capacity_advisory_decision/migration.sql`
- `packages/database/prisma/schema.prisma`
- `packages/auth/src/permissions.ts`
- `packages/database/src/rbac-bootstrap.ts`
- `packages/rpc/src/capacity.ts`
- `packages/rpc/tests/capacity.test.mjs`
- `apps/api/src/capacity/capacity.service.ts`
- `apps/api/src/capacity/capacity-rpc.router.ts`
- `apps/api/tests/capacity-rpc.test.mjs`
- `apps/web/components/capacity-advisory-decision-form.tsx`
- `apps/web/app/(platform)/app/capacity/actions.ts`
- `apps/web/app/(platform)/app/capacity/page.tsx`

## Acceptance Criteria

- `capacity.advisory.decide` exists in runtime auth and RBAC seed catalogs.
- `capacity.advisory.decision.record` requires `capacity.advisory.decide`.
- Approved decisions require approval reference.
- Decision command requires traceable recommendation, slot or reservation reference, decider, and
  reason.
- Duplicate recommendation decisions are blocked per tenant.
- Idempotent replay returns the recorded decision.
- Backend writes decision, audit record, and outbox event transactionally.
- Frontend Capacity UI exposes the decision form only as a governed command.
- No operational capacity command is executed automatically.

## Production Evidence Still Required

- Runtime logs/metrics for `capacity.advisory.decision.record`.
- Staging decision workflow evidence under `/app/capacity`.
- Human go/no-go approval for P12 release.
