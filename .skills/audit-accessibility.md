# Audit: Accessibility

## Purpose
Audit the SAPTM web application for WCAG 2.2 AA compliance. Verify skip-to-content links, keyboard navigation, ARIA labels, color contrast ratios, and screen reader compatibility across all page components, form elements, and navigation.

## Inputs
- `apps/web/src/app/` — all page components and layouts
- `apps/web/src/components/` — application components
- `packages/ui/src/components/` — shared UI components
- `packages/ui/src/tokens/index.ts` — color tokens (for contrast analysis)
- `apps/web/app/globals.css` — CSS custom properties with color values
- `tailwind.config.ts` — theme configuration

## Execution Steps
1. **Skip-to-Content Link** (Rule 4.2.2)
   - Verify every layout or root component includes a skip-to-content link (`<a href="#main-content">` or similar).
   - Confirm the link is visually hidden by default and becomes visible on keyboard focus.
   - Verify `#main-content` id exists on the main content container.
   - Check that the link is the first focusable element in the DOM.
   - Flag missing skip-to-content link as P0.

2. **Keyboard Navigation** (Rule 4.2.3)
   - Audit all interactive elements for keyboard accessibility:
     - All buttons, links, inputs, selects, and textareas must be reachable via `Tab`.
     - Custom interactive controls (dropdowns, modals, autocompletes) must support `Enter`, `Escape`, arrow keys.
     - Focus must follow a logical DOM order.
     - No positive `tabIndex` values (use 0, -1, or omit).
   - Verify focus indicators are visible (not `outline: none` without replacement).
   - Check that modal/dialog traps focus when open and returns focus on close.
   - Flag missing keyboard support on custom controls as P1.

3. **ARIA Labels** (Rule 4.2.5)
   - Scan all icon-only buttons for `aria-label` attribute.
   - Verify form elements have associated `<label>` elements or `aria-label`/`aria-labelledby`.
   - Check that complex UI elements (tabs, accordions, tree views) have appropriate ARIA roles and states:
     - `role="tablist"`, `role="tab"`, `role="tabpanel"` for tabs.
     - `aria-selected`, `aria-expanded`, `aria-controls` as applicable.
   - Verify decorative icons have `aria-hidden="true"`.
   - Confirm error messages have `role="alert"` or are associated via `aria-describedby`.
   - Flag missing `aria-label` on icon-only buttons as P1.

4. **Color Contrast** (Rule 4.2.4)
   - Extract all foreground/background color pairs from tokens and components.
   - Verify contrast ratios meet WCAG AA:
     - **Normal text (<18px / <14px bold)**: 4.5:1 minimum.
     - **Large text (≥18px / ≥14px bold)**: 3:1 minimum.
     - **UI components and graphical objects**: 3:1 minimum.
   - Check the following semantic pairs:
     - `--primary` on `--background`
     - `--muted` on `--background`
     - `--destructive` on `--background`
     - Text on interactive surfaces (buttons, inputs)
     - Placeholder text against input background
     - Disabled state text against background
   - Validate both light and dark mode contrast.
   - Flag any pair below 4.5:1 for normal text as P1 (P0 for critical UI text).

5. **Screen Reader Compatibility**
   - Verify page structure uses semantic HTML (`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<article>`, `<section>`).
   - Check that heading hierarchy is correct (`h1` → `h2` → `h3`, no skipped levels).
   - Verify each page has exactly one `h1`.
   - Confirm dynamic content changes are announced (use `aria-live` regions, `role="status"`).
   - Check that error summaries are readable by screen readers.
   - Verify that custom components (select, date picker, combobox) follow ARIA authoring practices.

6. **Form Accessibility** (Rule 4.1.4)
   - Verify all form inputs have labels (visible labels preferred over `aria-label`).
   - Check that inline validation errors are programmatically associated with inputs (`aria-describedby` or `aria-invalid`).
   - Confirm server error messages are announced (use `role="alert"` or `aria-live="polite"`).
   - Verify required fields have `aria-required="true"` or `required` attribute.
   - Check that form submission success/failure feedback is screen-reader accessible.

7. **Focus Management**
   - Verify route changes set focus to `h1` or main content container.
   - Check that modal/dialog traps focus and closes on `Escape`.
   - Confirm skip-to-content link moves focus to main content.
   - Verify that toggles (accordions, disclosure widgets) return focus to the trigger on collapse.

## Validation Steps
- [ ] Skip-to-content link present, visually hidden, focusable, targets `#main-content`
- [ ] All interactive elements keyboard accessible
- [ ] No positive `tabIndex` values
- [ ] Focus indicators visible on all interactive elements
- [ ] Modal focus trap works correctly
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels
- [ ] Complex widgets have correct ARIA roles and states
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Semantic HTML structure (`main`, `nav`, `header`, `footer`)
- [ ] Correct heading hierarchy (one `h1`, no skipped levels)
- [ ] Dynamic content uses `aria-live` regions
- [ ] Form errors associated via `aria-describedby`

## Definition of Done
- Skip-to-content link implemented on all layouts.
- Keyboard navigation covers all interactive elements.
- ARIA labels complete on all icon-only buttons and form inputs.
- Color contrast meets WCAG AA in both light and dark modes.
- Screen reader testing (automated) passes without critical errors.
- All P0 and P1 issues resolved.

## Failure Conditions
- Missing skip-to-content link — **P0**
- Color contrast below 3:1 — **P0** (P1 if 3:1–4.5:1 for normal text)
- Icon-only button missing `aria-label` — **P1**
- Form input without label — **P1**
- Focus trap not working in modal — **P1**
- No visible focus indicator — **P1**
- Missing `aria-live` on dynamic content — **P2**

## Required Reports
- `audit-accessibility-skip-link.md` — skip-to-content implementation check
- `audit-accessibility-keyboard.md` — keyboard navigation audit
- `audit-accessibility-aria.md` — ARIA attribute completeness
- `audit-accessibility-contrast.md` — color contrast analysis (light + dark)
- `audit-accessibility-forms.md` — form accessibility findings
- `audit-accessibility-summary.md` — pass/fail with severity
