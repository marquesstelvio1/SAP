# SAPTM Design Principles

## 1. Clarity First

Complex logistics data must be immediately understandable without external context.

**Rules:**
- Every status value displays a human-readable label with semantic color coding (`success`, `warning`, `destructive`, `info`).
- Cargo states (`registered`, `ready_for_transport`, `in_transport`, `held`, `delivered`, `cancelled`) are always accompanied by the timestamp of the last state transition.
- Tracking events show event type icon, event type label, location name, and relative time ("2h ago", "yesterday").
- Data tables show column totals and summary badges (e.g., "5 held cargo", "3 open exceptions") in the table header.
- Abbreviations (TOS, TMS, ETA, SLA) are expanded on first hover or include subtle tooltip definitions.

**Examples:**
- `cargo.overview.read` output renders status counts as colored MetricTile badges with trend indicators.
- Tracking timeline events show a vertical progress line with distinct node icons per event type (departed, arrived, exception, handover).
- Capacity slots display utilization as a progress bar with "X of Y units reserved" text.

---

## 2. Actionable States

Every state must have a clear next action. Users must never encounter a dead-end state without guidance.

**Rules:**
- Every cargo status card includes a primary action button (e.g., "Register Transport", "Record Departure", "Complete Delivery").
- Blocked states display the reason as a CollapsibleAlert with the action needed to unblock (e.g., "Customs clearance required — record compliance evidence").
- Empty states show an illustration, explanation, and a call-to-action button (e.g., "No cargo registered yet — register your first cargo").
- Error states from API responses map to user-facing messages with a suggested action or retry option.
- Exception states show a "Resolve Exception" button that opens the resolution flow with pre-filled context.

**Examples:**
- Held cargo shows: "Cargo is held due to customs block. Record compliance evidence or update customs status to release."
- Empty tracking overview shows: "No shipments in transit. Plan transport for released cargo to begin tracking."
- Notification inbox empty shows: "All caught up. Notifications appear here when events require your attention."

---

## 3. Data Integrity

Show source, timestamp, and confidence for all operations data.

**Rules:**
- Every displayed data point includes its source system label (`saptm`, `port_tos`, `rail_tms`, `carrier_tms`, `telematics_gps`, `customs_erp`, `warehouse_wms`).
- Every event in the tracking timeline shows the `sourceSystem` that recorded it.
- Compliance evidence records show `issuerName`, `issuedAt`, `expiresAt`, and verification status (`pending_review`, `approved`, `rejected`).
- Capacity advisory recommendations show `confidenceScore` (0-1) and `source` ("rule_based_capacity_optimizer").
- Tracking AI advisory recommendations show `confidenceScore` and `source` ("rule_based_operational_advisor").
- Idempotency results display `replayed: true/false` to indicate whether the operation was a retry.

**Examples:**
- Event timeline entry: "Departed from Santos Port — recorded by rail_tms — 2h ago" with source icon.
- Advisory card: "Slot saturation risk at Terminal 3 — 85% confidence — rule_based_capacity_optimizer".
- Compliance evidence badge: "Bill of Lading #BL-2024-8932 — Approved by A. Costa — source: saptm".

---

## 4. Error Recovery

Never dead-end the user. Every error must provide recovery options.

**Rules:**
- API errors with code `VALIDATION_ERROR` display inline field-level messages with the exact Zod validation failure.
- `CONFLICT` errors (duplicate reference, duplicate reservation) display the conflicting value and offer to navigate to the existing record.
- `RATE_LIMITED` errors show retry-after countdown with auto-retry on expiration.
- `INTEGRATION_ERROR` errors distinguish between "adapter unavailable" (retry later) and "invalid data received" (fix and resend).
- Network failures show a persistent banner with "Retry" button and offline indicator.
- Session expiry redirects to sign-in with a toast "Your session has expired. Please sign in again." and preserves the intended destination URL.
- Form submission failures preserve all entered data — never clear forms on error.

**Examples:**
- Duplicate cargo reference: "Reference SAO-2024-123 already exists. [View existing cargo] or [use a different reference]."
- Rate limited: "Too many requests. Retry available in 12 seconds. [Retry now] or [dismiss]."
- Integration adapter down: "Port TOS adapter is unavailable. Events queued for retry. [Check integration status]."

---

## 5. Context Persistence

Maintain operational context across navigation. The platform must feel like a continuous workspace, not disconnected pages.

**Rules:**
- Breadcrumb navigation reflects the current domain path and preserves the trail (e.g., `Cargo > SAO-2024-8932 > Exceptions > Exception #EX-001`).
- Active filters, sort order, and pagination state persist when navigating between list views and detail views (return to same scroll position).
- Sidebar navigation highlights the current section and sub-section.
- Tab state within a page persists when navigating away and back within the same session.
- Selected items in data tables persist across async refresh cycles (selection is by ID, not by index).
- Interstitial operations (exceptions, handoffs, claims) open in side panels or slide-overs rather than full-page navigations, keeping parent context visible.
- Global search accessible from any page, scoped to current organization.

**Examples:**
- Operator reviews cargo list with "held" filter active, clicks into a cargo, records an exception, closes side panel — returns to cargo list with "held" filter still applied.
- Manager views capacity overview, clicks into slot details, opens advisory panel — breadcrumb: `Capacity > Terminal 3 > Slot #SL-004 > Advisory Recommendations`.
- User navigates from tracking to cargo to planning — all three domain tabs remain open in sidebar with active indicator on current page.
