# SAPTM Interaction Patterns

## 1. Data Table Patterns

All domain list views (cargo, tracking, capacity, planning, tariff, admin, audit) share consistent data table behaviors.

### Sorting
- All columns are sortable by default except action columns.
- Click column header to sort ascending (indicated by upward arrow); click again for descending (downward arrow); click again to clear sort.
- Multi-column sort is not supported in initial implementation — single-column sort only.
- Sorted column header is highlighted with the active sort direction icon.
- Sort state persists when returning from detail view to list view within the same session.

### Filtering
- Each table has a filter bar above the header row.
- Filter types per domain:
  - **Cargo:** status (`registered`, `ready_for_transport`, `in_transport`, `held`, `delivered`, `cancelled`), cargo type, customs status, condition status, hazardous (boolean)
  - **Tracking:** status (`planned`, `in_transit`, `delayed`, `exception`, `arrived`, `completed`), transport mode, priority, date range
  - **Capacity:** status (`open`, `blocked`, `closed`), resource type, location
  - **Planning:** status (`confirmed`, `cancelled`), mode, carrier name
  - **Tariff:** rate card status (`draft`, `active`, `retired`), currency, date range
  - **Admin:** membership status (`invited`, `active`, `suspended`, `removed`), role key
  - **Audit:** action, user, date range, criticality, audit classification
- Active filters displayed as removable chips below the filter bar.
- "Clear all filters" button appears when any filter is active.
- Filter state persists in URL query parameters for shareable filtered views.

### Pagination
- Server-side pagination with configurable limit (default 10, options: 10, 25, 50).
- Pagination controls at bottom of table: "Showing 1-10 of 247" with page navigation.
- Offset-based pagination matching API contracts (`limit`, `offset`, `totalCount`).
- Page size selector aligned right in pagination bar.

### Selection
- Checkbox column on the left for row selection.
- "Select all" checkbox in header selects all visible rows on current page.
- Selected row count displayed in floating action bar: "3 selected" with "Clear selection" link.
- Selection persists across page navigation within the same session (but not across filter changes — selection clears on filter).
- Selection cleared on page refresh.

### Bulk Actions
- Floating action bar appears when 1+ rows selected.
- Bulk actions depend on domain:
  - **Cargo:** "Release selected", "Plan transport selected" (only enabled when all selected items are eligible)
  - **Tracking:** "Record event for selected", "Manage exception for selected"
  - **Capacity:** "Cancel selected reservations"
  - **Admin:** "Resend invitation", "Suspend selected", "Assign role to selected"
- Action bar shows count of ineligible items: "3 selected (1 ineligible — hover for reason)".
- Bulk confirmation dialog lists all affected items with their current state before execution.

---

## 2. Form Patterns

All data entry forms (cargo register, slot open, rate card register, user invite, etc.) follow consistent behaviors.

### Inline Validation
- Validate on blur for individual fields.
- Validate on change for dependent fields (e.g., `hazardous=true` triggers UN number and hazard class validation).
- Validation rules mirror Zod schemas exactly — same error messages as API `VALIDATION_ERROR` responses.
- Required fields marked with asterisk or subtle "required" badge.
- Character count shown for max-length fields (`max(240)`, `max(500)`, etc.).
- Conditional fields shown/hidden with smooth transition based on dependent field values.

### Idempotent Submission
- Every mutation form requires an idempotency key (min 12 chars, supplied by client or auto-generated).
- Submit button shows loading spinner and "Submitting..." text.
- Button is disabled after first click — prevents double submission.
- On successful submission:
  - Show success toast with operation result summary.
  - Reset idempotency key for next submission (generate new key).
  - Navigate to detail view or stay on form with "View result" link.
- On idempotent replay (`replayed: true`):
  - Show "Already submitted" info toast with previous result timestamp.
  - Do not show as error — replay is expected behavior.

### Confirmation Dialogs
- Destructive actions (cancel reservation, revoke role, suspend member) show confirmation dialog.
- Dialog includes:
  - Warning icon with "Are you sure?" heading.
  - Description of what will happen.
  - Affected item identifier (cargo reference, user name, slot reference).
  - Required text input for confirmation reason (min 8 characters for cancellations).
  - "Cancel" (secondary) and "Confirm" (destructive/primary) buttons.
- Critical operations (role change, membership status update) require additional confirmation: type "CONFIRM" to enable the confirm button.
- Non-destructive mutations (register cargo, open slot) skip confirmation — submit directly.

---

## 3. Navigation Patterns

### Contextual Breadcrumbs
- Breadcrumbs appear at the top of every platform page below the global header.
- Format: `Domain > Sub-section > [Item label] > [Action]`
- Each segment is a clickable link except the current page.
- Domain level links to the overview page (e.g., `Cargo` → `/app/cargo`).
- Item label links to the item detail view.
- Action segment is the current page and not linked.
- Breadcrumbs truncate with ellipsis for deep nesting (max 4 visible segments).

Examples:
- `Cargo > SAO-2024-8932 > Exceptions`
- `Capacity > Terminal 3 > Slot #SL-004 > Advisory`
- `Admin > Users > maria.santos@logistics.com > Roles`

### Multi-Level Navigation
- **Global sidebar** (left rail): Platform sections — Cargo, Tracking, Capacity, Planning, Tariffs, Admin, Audit, Security, Settings, Integrations, Notifications.
- **Section tabs** (below breadcrumbs): Sub-sections within each domain.
  - Cargo: Overview, Register, Compliance
  - Tracking: Overview, Analytics, Advisory
  - Capacity: Overview, Resources, Slots, Reservations, Advisory
  - Tariff: Overview, Rate Cards, Rules, Quotes
  - Admin: Overview, Users, Roles, Permissions
- **Contextual actions** (right of breadcrumbs): Primary action button for the current context (e.g., "Register Cargo" on cargo overview, "Open Slot" on capacity overview).
- Sidebar section is highlighted based on current route prefix.
- Section tabs change the URL path but keep sidebar context.

---

## 4. Feedback Patterns

### Toast Notifications
- **Success toast:** Green, checkmark icon, shows after successful mutation. Auto-dismiss after 5 seconds.
- **Error toast:** Red, X icon, shows after failed mutation or API error. Persistent until dismissed or clicked.
- **Info toast:** Blue, info icon, shows for informational events (idempotent replay, background refresh). Auto-dismiss after 3 seconds.
- **Warning toast:** Yellow, warning icon, shows for rate limit approaching, session expiring, or advisory triggers. Auto-dismiss after 8 seconds.
- All toasts stack in top-right corner with max 3 visible (older toasts collapse into "N more" indicator).
- Toast content: icon + title + description (max 2 lines) + optional action link.

### Inline Errors
- Field-level errors appear below the input in red text with error icon.
- Form-level errors appear in an alert banner above the submit button.
- API validation errors map 1:1 to field-level inline errors using the error `path` array.
- Network errors show as form-level banner: "Connection lost. [Retry]" with auto-retry countdown.
- Server errors (500) show: "Something went wrong. [Try again] or [contact support]."

### Loading Skeletons
- All list views show skeleton rows while data is loading (matching column count).
- Detail views show skeleton cards matching the layout structure.
- Mutation buttons show inline spinner without layout shift.
- Initial page load shows full-page skeleton (header + sidebar + content area).
- Refresh operations show skeleton overlay on the refreshed section only.
- Skeleton animation: shimmer effect with 1.5s cycle.

---

## 5. Timeline Patterns

### Cargo Lifecycle Timeline
- Displayed on cargo detail page.
- Vertical timeline with connected nodes for each lifecycle stage.
- Stages in order: Registered → Ready for Transport → In Transport → Arrived → Delivered.
- Held state shown as orange warning node between stages.
- Cancelled shown as red node terminating the timeline early.
- Each node shows:
  - Stage icon (circle with status color).
  - Stage label (e.g., "In Transport").
  - Timestamp with relative time (e.g., "22 Jun 2026, 14:30 — 3h ago").
  - Responsible operator name.
  - Location name (for depart/arrive/handoff nodes).
  - Optional reference number (departure reference, delivery reference).
- Non-sound delivery exception nodes appear as branching off the timeline between Arrived and Delivered nodes.
- Compliance evidence nodes appear as side nodes attached to the relevant stage (e.g., evidence attached to Release stage).
- Clicking a node expands to show metadata: source system, idempotency key, audit action.

### Tracking Event Timeline
- Displayed on tracking shipment detail page.
- Reverse chronological order (newest first) or chronological order (oldest first) toggled by user.
- Events displayed as cards in a vertical stack, not connected nodes.
- Each event card shows:
  - Event type icon with semantic color (e.g., `departed` = blue plane, `arrived` = green flag, `exception` = red exclamation).
  - Event type label.
  - Timestamp with relative time.
  - Location name (if present).
  - Source system badge.
  - Notes (if present, truncated to 3 lines with "Show more").
- Exception events show additional fields:
  - Severity badge (medium/high/critical).
  - Category label.
  - Resolution code (if resolved).
  - Approval status badge (pending_review/approved).
- Event detail expandable panel shows full payload data as key-value pairs.
- Timeline includes "Record Event" button at the top for authorized users.
- Scroll anchoring: when new events arrive, timeline stays at current scroll position.

### Combined View (Cargo + Tracking)
- On cargo detail page, the tracking timeline is embedded below the cargo lifecycle timeline.
- The two timelines are visually connected: the cargo lifecycle's "In Transport" node expands to show the tracking timeline inline.
- This gives operators a unified view of: cargo state + all tracking events for the linked shipment.
- Handoff events appear in both timelines with consistent iconography.
