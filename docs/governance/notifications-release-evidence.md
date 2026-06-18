# Notifications / Inbox Release Evidence

## Release Candidate

Notifications / Inbox is a governance module release candidate for local production readiness. It
does not replace external messaging infrastructure; it proves the local outbox-to-inbox lifecycle.

## Contract Evidence

- `notification.inbox.read` requires `notification.read`, session auth, and organization scope.
- `notification.mark_read` requires `notification.read`, session auth, organization scope, and
  writes `notification.marked_read` audit evidence.
- RPC schemas validate inbox filters, totals, notification summaries, and acknowledgement payloads.

## Backend Evidence

- `/rpc/notifications/inbox` reads only tenant-scoped notifications.
- `/rpc/notifications/markRead` rejects missing organization scope.
- Mark-read updates unread notifications to read and stores before/after status in audit.
- `packages/database/scripts/process-outbox.mjs` processes pending outbox events into notifications.
- Worker skips events without organization scope and avoids `notification.*` loops.

## Frontend Evidence

- `/app/notifications` is protected by `requirePlatformSession`.
- The UI requires `notification.read`.
- The UI displays totals, status filters, severity, event metadata, and generated timestamp.
- The UI submits a real mark-read Server Action instead of mutating state locally.

## Acceptance Criteria

- Tenant-scoped operational notification inbox.
- Outbox worker publishes pending events into notifications.
- Notification inbox requires `notification.read`.
- Notification acknowledgement writes audit evidence.
- Protected notifications UI with filters, totals, and mark-read action.
- Authenticated notifications E2E processes outbox and marks notification read.

## Validation Phrases

- tenant-scoped operational notification inbox
- outbox worker publishes pending events into notifications
