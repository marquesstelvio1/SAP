# Operational Reports / Export Release Evidence

## Purpose

This document defines local release evidence for governed operational report exports.

## Module Scope

- `report.export.generate` operation.
- `report.exported` audit and outbox evidence.
- Protected `/app/reports` UI.
- Tracking, Cargo, Capacity, Planning, and Tariff CSV export coverage.

## Required Gates

- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/operational-reports.md`
- `packages/rpc/tests/reports.test.mjs`
- `apps/api/tests/reports-rpc.test.mjs`
- `apps/web/app/(platform)/app/reports/page.tsx`
- `apps/web/app/(platform)/app/reports/export/route.ts`
- `apps/web/lib/report-exports.ts`
- `tests/e2e/authenticated-platform.spec.ts`
- `tests/e2e/runtime-health.spec.ts`

## Acceptance Criteria

- Reports export requires `report.export`.
- Reports export requires the selected domain read permission.
- Reports export supports Tracking, Cargo, Capacity, Planning, and Tariff CSV.
- Reports export writes `report.exported` audit and outbox evidence.
- UI exposes domain-specific export cards from `/app/reports`.
- Anonymous users are redirected from `/app/reports`.
- Authenticated E2E downloads operational report CSV.

## Production Evidence Still Required

- Runtime logs/metrics showing report export operations.
- Retention policy for generated reports.
- Security review for `report.export` grants and domain read permission combinations.
