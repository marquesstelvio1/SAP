# Capacity Advisory Decision Analytics Release Evidence

## Purpose

This document defines local release evidence for Capacity Advisory Decision Analytics P20.

## Module Scope

- Tenant-scoped analytics over recorded advisory decisions.
- Transport path: `GET /rpc/capacity/advisoryDecisionAnalytics`.
- Read-only decision totals, approval rate, recommendation-type groups, permission groups, and
  recent decisions.
- Protected Capacity UI block.
- No autonomous execution of operational capacity commands.

## Required Gates

- `pnpm validate:capacity-advisory`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/capacity-advisory-decision-analytics.md`
- `packages/rpc/src/capacity.ts`
- `packages/rpc/tests/capacity.test.mjs`
- `apps/api/src/capacity/capacity.service.ts`
- `apps/api/src/capacity/capacity-rpc.router.ts`
- `apps/api/tests/capacity-rpc.test.mjs`
- `apps/web/lib/capacity-advisory-decision-analytics.ts`
- `apps/web/app/(platform)/app/capacity/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`

## Acceptance Criteria

- `capacity.advisory.decision.analytics.read` requires `capacity.read`.
- Analytics reads only tenant-scoped decisions.
- Analytics returns totals, approved count, rejected count, and approval rate.
- Analytics groups decisions by recommendation type.
- Analytics groups decisions by required operational permission.
- Analytics exposes recent human decisions.
- Analytics marks governance as read-only with automation blocked.
- Frontend Capacity UI renders the analytics block.
- No operational capacity command is executed automatically.

## Production Evidence Still Required

- Runtime logs/metrics for `capacity.advisory.decision.analytics.read`.
- Staging read evidence under `/app/capacity`.
- Human go/no-go approval for P20 release.
