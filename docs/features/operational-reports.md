# Operational Reports / Export

## Purpose

Operational Reports / Export provides governed CSV snapshots for the active operational modules:
Tracking, Cargo, Capacity, Planning, and Tariff.

## Scope

- Tenant-scoped CSV export for Tracking shipments.
- Tenant-scoped CSV export for Cargo records.
- Tenant-scoped CSV export for Capacity slots and reservations.
- Tenant-scoped CSV export for Planning transport orders.
- Tenant-scoped CSV export for Tariff rate cards and quotes.
- Audit and outbox evidence for every export.

## Business Rules

- Export requires an authenticated tenant session.
- Export requires `report.export`.
- Export also requires the read permission of the selected domain.
- Supported domains are `tracking`, `cargo`, `capacity`, `planning`, and `tariff`.
- Every export is organization-scoped; no cross-tenant data may be included.
- Exporting does not mutate operational domain state.
- Exporting must create `report.exported` audit and outbox evidence.

## UI Rules

- `/app/reports` is a protected platform route.
- Domain cards must show the read permission required for export.
- Download links must generate CSV through the backend RPC, not direct database access.
- Anonymous access must redirect to `/sign-in?next=%2Fapp%2Freports`.

## Testing

- RPC contracts validate supported domains, CSV output, and evidence.
- API tests verify authorization, domain read permission, and auditable delegation.
- E2E verifies protected navigation and CSV download.
