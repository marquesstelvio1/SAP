# Audit Query / Export Release Evidence

## Purpose

This document defines local release evidence for tenant-scoped audit search and governed export.

## Module Scope

- `audit.records.search` read operation.
- `audit.records.export` governed export operation.
- Protected `/app/audit` UI with filters, detail, and CSV export.
- Export audit trail and outbox evidence.

## Required Gates

- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/audit-query-export.md`
- `packages/rpc/tests/audit.test.mjs`
- `apps/api/tests/audit-rpc.test.mjs`
- `apps/web/app/(platform)/app/audit/page.tsx`
- `apps/web/app/(platform)/app/audit/export/route.ts`
- `tests/e2e/authenticated-platform.spec.ts`
- `tests/e2e/runtime-health.spec.ts`
- `packages/database/prisma/seed.ts`

## Acceptance Criteria

- Search provides tenant-scoped audit record search and requires `audit.read`.
- CSV export requires `audit.read` and `report.export`.
- CSV export writes audit and outbox evidence.
- UI supports filters, record detail, and export from `/app/audit`.
- Anonymous users are redirected from `/app/audit`.
- Authenticated E2E filters audit records and downloads CSV.

## Production Evidence Still Required

- Runtime logs/metrics showing audit search and export operations.
- Storage/retention policy for exported audit artifacts.
- Security review for export access and retention.
