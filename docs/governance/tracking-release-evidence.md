# Operational Tracking Release Evidence

## Purpose

This document defines the release evidence required for the first business module: Operational
Tracking.

## Module Scope

- Tenant-scoped tracking overview.
- Idempotent operational event recording.
- Shipment detail and timeline read.
- Exception management with operator evidence.
- Exception resolution with approved evidence.
- Closed exception workflow state on release events.
- Operational analytics aggregates.
- Local advisory recommendations with mandatory human approval.
- Local visual regression coverage for critical UI states and business rule cards.
- Authenticated local QA across protected business, admin, audit, reports, notifications, and integrations modules with deterministic demo seed data.
- Authenticated local QA submits governed forms for Cargo, Capacity advisory decisions, Planning commands, Tariff commands, Admin Identity/RBAC commands, Audit export, Reports export, Notifications, and Integrations.

## Required Gates

- `pnpm validate:tracking-foundation`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:evidence`

## Evidence Files

- `docs/features/tracking-overview.md`
- `packages/rpc/tests/tracking.test.mjs`
- `apps/api/tests/tracking-rpc.test.mjs`
- `scripts/validate-tracking-foundation.mjs`
- `apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx`
- `apps/web/app/(platform)/app/tracking/page.tsx`
- `apps/web/lib/tracking-analytics.ts`
- `apps/web/lib/tracking-advisory.ts`
- `apps/web/app/(platform)/app/reports/page.tsx`
- `tests/e2e/runtime-health.spec.ts`
- `tests/e2e/authenticated-platform.spec.ts`
- `packages/database/prisma/seed.ts`

## Acceptance Criteria

- Generated release evidence lists Operational Tracking as the first business module release candidate.
- All tracking RPC contracts validate operator evidence and workflow states.
- Tracking RPC contracts validate analytics aggregates and advisory recommendations.
- Backend tracking commands persist event payload, audit record, outbox event, and workflow state.
- Backend analytics reads aggregate tenant-scoped shipment/event data without mutation.
- Backend advisory reads generate consultative recommendations without autonomous execution.
- Frontend tracking exception forms require operator evidence and approval context.
- Shipment timeline displays closed exception workflow state for approved release events.
- Tracking overview displays analytics aggregates and advisory policy.
- Playwright visual regression includes protected tracking redirect evidence and business rule cards for Cargo, Capacity, Planning, and Tariff.
- Authenticated local QA opens Tracking, Cargo, Capacity, Planning, Tariff, Admin, Audit, Reports, Notifications, and Integrations with a real local admin session.
- Authenticated local QA submits governed Cargo, Capacity, Planning, Tariff, Admin Identity/RBAC, Audit export, Reports export, Notifications, and Integrations commands through the UI.

## Production Evidence Still Required

- Registry image digest for API and Web.
- Signed image and vulnerability scan evidence.
- Staging smoke output for `/app/tracking`.
- Runtime logs/metrics showing tracking RPC operations.
- Human go/no-go approval for first module release.
