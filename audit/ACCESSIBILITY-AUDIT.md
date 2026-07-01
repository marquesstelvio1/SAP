# SAPTM — Accessibility Audit (Opção B / Governance Cleanup)

**Scope:** 13 UI files changed during the Opção B / governance cleanup effort.  
**Standard:** WCAG 2.2 Level A and AA.  
**Method:** Code-based static review of React/Next.js components and underlying `@saptm/ui` primitives.  
**Date:** 2026-06-30

---

## 1. Executive Summary

The audited files follow several accessibility good practices: tables carry `aria-label`, blocked/error states use live regions, and form-authorisation badges are exposed as visible text rather than raw permission names. However, three systemic issues affect orientation and screen-reader usability across multiple pages:

1. **Heading hierarchy is broken.** Every audited page relies on `CardTitle`, which renders an `<h3>`, as its primary title. The platform layout does not supply an `<h1>` or `<h2>`, so screen-reader users navigating by heading jump straight to `h3` with no top-level landmark.
2. **Non-unique link text.** The Dashboard card contains four links labelled only "Abrir". The visible module name is in a sibling `<span>` and is not programmatically associated with the link, so a tabbing screen-reader user hears the same destination text four times.
3. **Inappropriate ARIA live region for loading.** `TrackingOverviewClient` renders the loading state with `role="alert"` / `aria-live="assertive"`. A routine data load is not an error or emergency; this interrupts screen-reader output aggressively.

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Major    | 3 (systemic, spanning multiple files) |
| Minor    | 9 |

---

## 2. Per-File Findings

| File | WCAG Criterion | Severity | Issue | Recommendation |
|------|----------------|----------|-------|----------------|
| `apps/web/app/(platform)/app/page.tsx` | 2.4.4 Link Purpose (In Context) | Major | The "Módulos operacionais" card contains four `<Link>Abrir</Link>` elements with identical link text. The module name (Cargas, Tracking, Planeamento, Admin) lives in a sibling `<span>` and is not associated with the link. | Add `aria-label` to each `Link`/`Button`, e.g. `aria-label="Abrir Cargas"`, or include the module name in the visible link text. |
| `apps/web/app/(platform)/app/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | The page title "Dashboard" is rendered via `CardTitle`, which is hard-coded to `<h3>`. The platform layout provides no `<h1>` or `<h2>`. | Render the page title as `<h1>` (e.g. wrap `CardTitle` in a semantic heading override or add a visually-hidden `<h1>`). |
| `apps/web/app/(platform)/app/cargo/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Blocked-state page returns `AccessState` with title "Gestao de cargas bloqueada", rendered internally as `<h3>`. No `<h1>` is present for the full-page state. | Make the `AccessState` title an `<h1>` when it is the sole content of the page, or supply a visually-hidden `<h1>` above it. |
| `apps/web/app/(platform)/app/tracking/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Same heading-hierarchy issue: blocked-state title rendered as `<h3>` with no page `<h1>`. | Same as cargo page. |
| `apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Main shipment title (`shipment.cargoDescription`) and all card titles render as `<h3>` via `CardTitle`. No `<h1>` or `<h2>` exists in page or layout. | Use `<h1>` for the shipment description title and nest card headings logically (`h2` for sections, `h3` for cards). |
| `apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx` | 2.4.4 Link Purpose (In Context) | Minor | The link text "Auditoria" and "Reports" appears twice on the page in different cards. In context the cards differ, but when tabbing quickly the destination is ambiguous. | Add `aria-label` with context, e.g. `aria-label="Auditoria da remessa"`, `aria-label="Reports da remessa"`. |
| `apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Minor | The "Excecao operacional vinculada a carga" advisory card uses `<CardTitle className="text-lg">` (`<h3>`) and contains inline `<Link>` chips; nested advisory content below uses plain text headings without structured hierarchy. | Ensure nested card headings are one level deeper than their parent (`h4` inside an `h3` card). |
| `apps/web/app/(platform)/app/planning/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Page title "Planeamento" rendered as `<h3>` via `CardTitle`; no `<h1>` or `<h2>` in page or layout. | Provide an `<h1>` for the page (override `CardTitle` or add a visually-hidden heading). |
| `apps/web/app/(platform)/app/capacity/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Page title "Capacidade operacional" rendered as `<h3>` via `CardTitle`; no `<h1>` or `<h2>`. | Provide an `<h1>` for the page. |
| `apps/web/app/(platform)/app/capacity/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Minor | Advisory recommendation cards render the title as a raw `<h3>` while the parent card already uses `CardTitle` (`<h3>`), flattening the heading outline. | Use `CardTitle` or an `<h4>` for nested recommendation titles. |
| `apps/web/app/(platform)/app/capacity/page.tsx` | 1.3.1 Info and Relationships | Minor | Empty advisory state `"Sem recomendacoes de capacidade..."` is a static `<div>` with no `role="status"`; screen readers may not announce the empty state when the region updates. | Add `role="status"` to the empty-state `<div>`. |
| `apps/web/app/(platform)/app/capacity/page.tsx` | 2.4.4 Link Purpose (In Context) | Minor | "Auditoria" and "Reports" links in the "Reservas e slots" card are generic and could be ambiguous when tabbing. | Add `aria-label` with context, e.g. `aria-label="Auditoria de capacidade"`. |
| `apps/web/app/(platform)/app/tariffs/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Page title "Pricing operacional" rendered as `<h3>` via `CardTitle`; no `<h1>` or `<h2>`. | Provide an `<h1>` for the page. |
| `apps/web/app/(platform)/app/integrations/page.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Page title "Integration Gateway" rendered as `<h3>` via `CardTitle`; no `<h1>` or `<h2>`. | Provide an `<h1>` for the page. |
| `apps/web/components/cargo/cargo-overview-header.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Section title "Cargas" rendered as `<h3>` via `CardTitle`; no higher-level heading exists in the component or layout. | Render the section title as `<h1>` or ensure the parent page supplies an `<h1>`. |
| `apps/web/components/cargo/cargo-overview-header.tsx` | 1.4.1 Use of Color | Minor | Counts for "Bloqueadas", "Inspeccao pendente" and "Mercadorias perigosas" use `text-destructive`, `text-warning` and `text-risk`. The numeric values are readable, but colour is the only additional cue for risk severity. | Add an accessible text indicator (e.g. a `Badge` or `aria-label`) when counts are non-zero, or keep current colour as a supplementary cue only. |
| `apps/web/components/tracking/tracking-overview-header.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Section title "Tracking" rendered as `<h3>` via `CardTitle`; no higher-level heading. | Render the section title as `<h1>` or ensure the parent page supplies an `<h1>`. |
| `apps/web/components/tracking/tracking-events-section.tsx` | 1.3.1 Info and Relationships | Minor | If `analytics.eventTypeCounts` is empty, the table renders only headers with no body rows and no status message. | Render a `TableRow` with `colSpan={3}` and `role="status"` stating that no events exist. |
| `apps/web/components/tracking/tracking-analytics-section.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Section titles "Agregados de risco e SLA" and "Recomendacoes operacionais assistidas" rendered as `<h3>` via `CardTitle`; no page `<h1>` or `<h2>`. | Provide an `<h1>` at page level and nest section headings logically. |
| `apps/web/components/tracking/tracking-analytics-section.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Minor | Advisory recommendation cards render the title as a raw `<h3>` while the parent card already uses `CardTitle` (`<h3>`). | Use `CardTitle` or an `<h4>` for nested recommendation titles. |
| `apps/web/components/tracking/tracking-analytics-section.tsx` | 1.3.1 Info and Relationships | Minor | Empty advisory state `"Sem recomendacoes operacionais..."` is a static `<div>` without `role="status"`. | Add `role="status"` to the empty-state `<div>`. |
| `apps/web/components/tracking/tracking-analytics-section.tsx` | 1.3.1 Info and Relationships | Minor | If `analytics.modeDistribution` is empty, the table renders only headers with no body rows and no status message. | Render a `TableRow` with `colSpan={5}` and `role="status"` stating no data exists. |
| `apps/web/app/(platform)/app/tracking/TrackingOverviewClient.tsx` | 4.1.2 Name, Role, Value<br>1.3.1 Info and Relationships | Major | Loading state returns `AccessState` with `role="alert"` and `aria-live="assertive"`. A loading indicator is not an error and should not interrupt the user. | Remove `role="alert"` from the loading state; use `role="status"` if a live announcement is required, or rely on the visible spinner/text alone. |
| `apps/web/app/(platform)/app/tracking/TrackingOverviewClient.tsx` | 1.3.1 Info and Relationships<br>2.4.6 Headings and Labels | Major | Error and empty states render `AccessState` / `EmptyState` titles as `<h3>`. When these replace the entire page content, they function as the page title but are not `<h1>`. | Promote full-page state titles to `<h1>` or add a visually-hidden `<h1>` above them. |

---

## 3. Top 10 Priority Fixes

1. **Provide a page-level `<h1>`** on every audited page (or override `CardTitle` to render `h1` for page headers). This is the single most impactful fix for screen-reader orientation.
2. **Remove `role="alert"` from the `TrackingOverviewClient` loading state** and use `role="status"` only if a live announcement is necessary.
3. **Distinguish the four "Abrir" links on the Dashboard** with `aria-label` that includes the module name, e.g. `aria-label="Abrir Cargas"`.
4. **Promote full-page `AccessState` / `EmptyState` titles to `<h1>`** in blocked/error/empty states so the page has a proper top-level heading.
5. **Nest advisory recommendation titles one level below their parent card** (use `h4` or the `CardTitle` component inside nested cards).
6. **Add empty-state rows** to `tracking-events-section` and `tracking-analytics-section` mode-distribution table with `role="status"`.
7. **Add `role="status"`** to the empty advisory-message `<div>`s in `capacity/page.tsx` and `tracking-analytics-section.tsx`.
8. **Clarify ambiguous link text** for repeated "Auditoria" / "Reports" links with context-specific `aria-label` values.
9. **Audit the `ContextRow` primitive** for semantic association (consider `<dl>`/`<dt>`/`<dd>`) and ensure value/label pairs are announced coherently by screen readers.
10. **Run axe DevTools / Lighthouse** on the rendered pages to confirm contrast ratios for `text-muted-foreground` and `text-2xs` link text against card backgrounds.

---

## 4. Verification Checklist

- [ ] Each page has exactly one `<h1>` that describes the page topic.
- [ ] Heading levels follow a logical order (`h1` → `h2` → `h3` …) with no skipped levels.
- [ ] All links have descriptive, unique link text or an `aria-label` that makes the destination clear out of context.
- [ ] Loading states do not use `role="alert"` / `aria-live="assertive"`.
- [ ] Error, blocked and empty states use appropriate live regions (`role="alert"` only for errors, `role="status"` for informational updates).
- [ ] All data tables have an accessible name (`aria-label`) and column headers.
- [ ] Empty tables display a status message with `role="status"`.
- [ ] Advisory / recommendation empty states use `role="status"`.
- [ ] Interactive elements are reachable and operable by keyboard only.
- [ ] Focus order follows the visual order of the page.
- [ ] Color is not the sole means of conveying information (status badges, numeric values, labels).
- [ ] Text/background contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text).
- [ ] Verified with a screen reader (NVDA/VoiceOver) and axe DevTools on the rendered pages.

---

## 5. Notes

- No **Critical** issues were identified in the audited code (i.e., no complete blockers that prevent task completion for assistive-technology users).
- Contrast could not be fully verified from code alone because it depends on the runtime colour tokens. The reported tokens (`text-muted-foreground`, `text-destructive`, `text-warning`, `text-risk`) should be tested with a contrast analyser.
- Form primitives embedded in the audited pages (e.g. `TransportOrderConfirmForm`, `CapacitySlotReserveForm`, `TrackingEventRecordForm`) were not audited in depth; they should be reviewed separately for label association, error announcement, and focus management.
