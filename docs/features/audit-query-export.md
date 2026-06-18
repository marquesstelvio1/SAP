# Audit Query / Export

## Purpose

Audit Query / Export gives tenant administrators and auditors a governed way to inspect operational
evidence without direct database access.

## Scope

- Tenant-scoped audit record search.
- Filtering by action, subject, actor, correlation ID, severity, and date range.
- Audit record detail view with before/after payload evidence.
- CSV export for authorized users.
- Export evidence written back to audit and outbox.

## Business Rules

- Audit search requires an authenticated tenant session.
- Audit search requires `audit.read`.
- Audit export requires both `audit.read` and `report.export`.
- Every query is organization-scoped; no platform-wide leakage is allowed.
- CSV export is read-only for source records but must write export audit evidence.
- Export evidence must include actor, organization, filters, row count, and correlation ID.

## UI Rules

- `/app/audit` is a protected platform route.
- Filters must be explicit and visible before export.
- Record detail must show metadata and JSON payload evidence.
- Export action must be unavailable without `report.export`.
- Anonymous access must redirect to `/sign-in?next=%2Fapp%2Faudit`.

## Testing

- RPC contracts validate search and export schemas.
- API tests verify authorization and tenant-scoped delegation.
- E2E verifies protected navigation, filtering, and CSV download.
