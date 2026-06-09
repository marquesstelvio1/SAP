# Notifications / Inbox

## Purpose

Notifications / Inbox closes the local asynchronous operations loop. Critical outbox events become
tenant-scoped operational notifications that authorized users can read and acknowledge.

## Scope

- `packages/database/scripts/process-outbox.mjs` claims pending or retryable outbox events.
- The worker publishes events by creating one notification per source outbox event.
- Events without organization scope are marked as published without notification fan-out.
- `notification.read` protects inbox reads and acknowledgements.
- Acknowledgements update unread notifications to read and write audit evidence.
- `/app/notifications` shows filters, totals, event metadata, severity, status, and mark-read action.

## Business Rules

- Notifications are always scoped to an organization.
- A source outbox event can create at most one notification.
- Notification acknowledgement is tenant-scoped.
- Notification acknowledgement is audit-backed.
- Mark-read does not emit another outbox event to avoid notification loops.
- Worker retries pending/failed events up to the configured max attempts with bounded backoff.

## Local Evidence

- `packages/rpc/tests/notifications.test.mjs`
- `apps/api/tests/notifications-rpc.test.mjs`
- `packages/database/scripts/process-outbox.mjs`
- `apps/web/app/(platform)/app/notifications/page.tsx`
- `tests/e2e/authenticated-platform.spec.ts`
