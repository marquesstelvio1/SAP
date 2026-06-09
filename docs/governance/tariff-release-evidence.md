# Tariff Release Evidence

## Purpose

This document defines the local release evidence required for the Tariff / Pricing P10 slice.

## Module Scope

- Tenant-scoped tariff overview.
- governed tariff rate card registration.
- governed tariff rate rule addition.
- governed tariff quote calculation.
- governed tariff quote tax model calculation.
- governed tariff quote approval.
- Idempotent rate card, rule, quote calculation, and quote approval commands.
- Audit trail and outbox event for every critical tariff mutation.
- Protected Tariff / Pricing UI.

## Required Gates

- `pnpm validate:tariff-foundation`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/tariff-pricing.md`
- `packages/rpc/src/tariff.ts`
- `packages/rpc/tests/tariff.test.mjs`
- `apps/api/src/tariff/tariff.service.ts`
- `apps/api/src/tariff/tariff-rpc.router.ts`
- `apps/api/tests/tariff-rpc.test.mjs`
- `apps/web/app/(platform)/app/tariffs/page.tsx`
- `apps/web/app/(platform)/app/tariffs/actions.ts`
- `apps/web/app/(platform)/app/tariffs/form-state.ts`
- `apps/web/components/tariff-rate-card-register-form.tsx`
- `apps/web/components/tariff-rate-rule-add-form.tsx`
- `apps/web/components/tariff-quote-calculate-form.tsx`
- `apps/web/components/tariff-quote-approve-form.tsx`
- `scripts/validate-tariff-foundation.mjs`

## Acceptance Criteria

- governed tariff overview is available through `tariff.overview.read`.
- governed tariff rate card registration is available through `tariff.rate_card.register`.
- governed tariff rate rule addition is available through `tariff.rate_rule.add`.
- governed tariff quote calculation is available through `tariff.quote.calculate`.
- governed tariff quote approval is available through `tariff.quote.approve`.
- idempotent tariff rate card registration is enforced per organization.
- idempotent tariff rate rule addition is enforced per organization.
- idempotent tariff quote calculation is enforced per organization.
- idempotent tariff quote approval is enforced per organization.
- tariff quote calculation requires active rate card, applicable rules, required metrics, and positive amount.
- tariff quote calculation validates tax rate percentage and persists taxable amount, tax rate, tax amount, and final total.
- tariff quote approval requires calculated state, approval reference, approver, notes, and approval timestamp.
- Tariff permissions exist in runtime auth and RBAC seed catalogs.
- Backend rate card, rule, quote calculation, and quote approval operations persist audit and outbox transactionally.
- Frontend Tariff UI is protected by session, organization, and permissions.
- E2E validates anonymous redirect for `/app/tariffs` and authenticated governed quote calculation.

## Production Evidence Still Required

- Registry image digest for API and Web after Tariff changes.
- Staging smoke output for `/app/tariffs`.
- Runtime logs/metrics showing tariff RPC operations.
- Human go/no-go approval for Tariff P10 release.
