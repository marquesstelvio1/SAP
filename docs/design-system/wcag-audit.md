# WCAG 2.2 AA Audit — SAPTM Design System

> Baseline: WCAG 2.2 Level AA per design system strategy.
> Last audit: 2026-06-22
> Scope: Design tokens, shared UI components (`packages/ui/src/components/`), app shell, layout.

---

## Perceivable

### 1.1.1 Non-text Content
All icons, images, and non-text elements must have a text equivalent.

- [ ] All icons in `packages/ui/src/components/` use `aria-label` or have visible text
- [ ] All `<img>` tags have `alt` attributes (empty `alt=""` for decorative)
- [ ] `charts.tsx` — chart data is available as text or via `aria-label`
- [ ] `avatar.tsx` — avatar images have `alt` with initials or name
- [ ] Decorative SVGs have `aria-hidden="true"`

### 1.4.1 Use of Color
Color must not be the sole means of conveying information.

- [ ] Status badges (`badge.tsx`) include text labels, not just color
- [ ] `access-state.tsx` — tenant access state includes icon + text
- [ ] Chart colors are supplemented with patterns or labels
- [ ] Form validation states show icons in addition to color
- [ ] Link underline or icon distinguishes links from body text

### 1.4.3 Contrast (Minimum) — AA
Text and images of text must have a contrast ratio of at least **4.5:1** (normal text) or **3:1** (large text ≥18.5px bold / ≥24px regular).

| Token Pair | Ratio | Pass/Fail |
|---|---|---|
| `--foreground` on `--background` (light) | — | — |
| `--foreground` on `--background` (dark) | — | — |
| `--primary-foreground` on `--primary` (light) | — | — |
| `--primary-foreground` on `--primary` (dark) | — | — |
| `--muted-foreground` on `--muted` (light) | — | — |
| `--muted-foreground` on `--background` (light) | — | — |
| `--muted-foreground` on `--background` (dark) | — | — |
| `--destructive-foreground` on `--destructive` | — | — |

- [ ] Measured all token pairs with a color contrast analyzer
- [ ] `--muted-foreground` on `--background` meets 4.5:1 (common risk area)
- [ ] Placeholder text meets 4.5:1 or is not used
- [ ] High contrast mode (`prefers-contrast: high`) provides sufficient ratios

### 1.4.4 Resize Text
Content must be readable when zoomed to 200%.

- [ ] No viewport-constrained font sizes (no `vw` units for text)
- [ ] All layouts reflow correctly at 200% zoom
- [ ] Text does not clip or overflow containers

### 1.4.10 Reflow
Content must not require horizontal scrolling at **400%** zoom (equivalent to 1280px CSS width at 320px viewport).

- [ ] App shell does not exceed viewport width at 400% zoom
- [ ] Data tables horizontally scroll within their container (no page-level scroll)
- [ ] Sidebar collapses or overlays at narrow viewports

### 1.4.11 Non-text Contrast — AA
UI components and graphical objects must have a contrast ratio of at least **3:1** against adjacent colors.

- [ ] Focus indicators (outline, ring) have 3:1 contrast against background
- [ ] Form input borders have 3:1 contrast against background
- [ ] `--border` token has sufficient contrast on `--background`
- [ ] Checkbox/radio/switch borders have 3:1 contrast
- [ ] Chart graphical elements have 3:1 contrast against chart background
- [ ] Icons have 3:1 contrast against background

### 1.4.12 Text Spacing
No loss of content or functionality when text spacing overrides are applied:
- Line height: 1.5× font size
- Paragraph spacing: 2× font size
- Letter spacing: 0.12× font size
- Word spacing: 0.16× font size

- [ ] Tested with the [Bookmarklet](https://www.w3.org/WAI/WCAG22/Techniques/css/C36.html)
- [ ] No content clipping, overlap, or truncation

### 1.4.13 Content on Hover or Focus
Tooltips and popovers must be:
1. **Dismissable** — user can close (Escape)
2. **Hoverable** — pointer can move over the tooltip without it disappearing
3. **Persistent** — content stays visible until dismissed or no longer hovered/focused

- [ ] `tooltip.tsx` — dismissable via Escape, hover persists
- [ ] `popover.tsx` — dismissable via Escape, click outside
- [ ] `dropdown-menu.tsx` — submenus do not disappear on hover movement

---

## Operable

### 2.1.1 Keyboard
All functionality must be operable through a keyboard interface.

- [ ] All interactive elements are reachable via Tab
- [ ] `button.tsx` uses `<button>` element (not `<div>` with click)
- [ ] Custom controls have appropriate `role` and keyboard handlers
- [ ] `data-table.tsx` — rows are focusable, sortable headers are keyboard-activatable
- [ ] `tabs.tsx` — Arrow keys switch tabs, Tab moves into tab panel
- [ ] `dialog.tsx` / `sheet.tsx` — Escape closes; focus trapped inside
- [ ] `dropdown-menu.tsx` — Arrow keys navigate items, Enter/Space activates
- [ ] `command.tsx` — Arrow keys navigate results, Enter selects
- [ ] `pagination.tsx` — buttons are native `<button>` or have role="button"
- [ ] `date-picker.tsx` — date grid navigable with arrow keys

### 2.1.2 No Keyboard Trap
Keyboard focus must not be trapped in any component.

- [ ] Modals (`dialog.tsx`, `sheet.tsx`) trap focus **only while open** and release on close
- [ ] No other component traps focus

### 2.4.3 Focus Order
Focus order must be logical and preserve meaning.

- [ ] Tab order follows visual reading order
- [ ] `data-table.tsx` — sort controls before row actions
- [ ] Forms follow label → input → hint → error → next field
- [ ] No negative `tabindex` values on visible interactive elements

### 2.4.7 Focus Visible — AA
Every interactive element must have a visible focus indicator with at least **3:1** contrast.

- [ ] All components in `packages/ui/src/components/` have `focus-visible:` ring styles
- [ ] `button.tsx` — focus ring is visible and high-contrast
- [ ] `input.tsx` — focus ring is visible
- [ ] `checkbox.tsx` — focus ring visible on the control
- [ ] `switch.tsx` — focus ring visible
- [ ] `radio-group.tsx` — focus ring visible on each option
- [ ] `select-native.tsx` — focus ring visible
- [ ] `textarea.tsx` — focus ring visible
- [ ] `data-table.tsx` — rows and sortable headers have focus indicators
- [ ] `tabs.tsx` — tab triggers have focus indicators
- [ ] `dropdown-menu.tsx` — items have focus indicators
- [ ] Focus ring uses `--ring` color which has 3:1 contrast against backgrounds
- [ ] High contrast mode does not remove focus indicators

### 2.4.11 Focus Not Obscured — AA (New in 2.2)
The focused element must be fully visible (not obscured by sticky headers, sidebars, or other content).

- [ ] Sticky header does not overlap focused elements
- [ ] `platform-shell.tsx` — main content `id="main-content"` starts below the sticky header
- [ ] Dialogs and sheets are centered/pushed above all content
- [ ] Toast notifications do not obscure focused controls

### 2.5.8 Target Size — AA (New in 2.2)
Pointer targets must be at least **24×24 CSS pixels**.

- [ ] All interactive elements meet 24×24px minimum
- [ ] `button.tsx` — default/minimum size meets 24×24
- [ ] `pagination.tsx` — page buttons are at least 24×24
- [ ] Icon-only buttons have sufficient target size (or spacing)
- [ ] Links in body text are exempt
- [ ] `tooltip.tsx` trigger meets 24×24
- [ ] `data-table.tsx` row actions meet 24×24

---

## Understandable

### 3.2.1 On Focus
Changing focus must not trigger an unexpected context change.

- [ ] No automatic form submissions on focus
- [ ] No focus-triggered navigation
- [ ] `dropdown-menu.tsx` — focus on parent does not open menu (click/Enter does)
- [ ] `tabs.tsx` — focus on tab does not switch panel (Enter or click does)

### 3.3.1 Error Identification
Errors must be described to the user in text.

- [ ] Form validation errors are visible text, not just visual cues
- [ ] `field.tsx` — error message is rendered and linked via `aria-describedby`
- [ ] Error summary appears above form or inline with the field
- [ ] Server-side errors from RPC calls are surfaced in the UI

### 3.3.2 Labels or Instructions
All inputs must have an associated label or instruction.

- [ ] `input.tsx` — always wrapped or paired with `<label>` / `aria-label`
- [ ] `field.tsx` — uses `htmlFor` / `id` association
- [ ] `checkbox.tsx` — has visible label (not just a standalone checkbox)
- [ ] `switch.tsx` — has visible label
- [ ] `radio-group.tsx` — group has `<fieldset>` + `<legend>`
- [ ] `select-native.tsx` — paired with label
- [ ] `textarea.tsx` — paired with label
- [ ] `date-picker.tsx` — has accessible label
- [ ] Search inputs have label (visible or sr-only)

### 3.3.4 Error Prevention (Legal, Financial, Data)
For pages causing legal commitments or financial transactions, submissions must be reversible, checked, or confirmed.

- [ ] Billing/Cargo/Tariff forms include confirmation step or undo capability
- [ ] Destructive actions (`--destructive` buttons) require confirmation dialog
- [ ] Batch operations show summary before executing

---

## Robust

### 4.1.2 Name, Role, Value
All custom UI components must have correct ARIA roles, states, and properties.

- [ ] `dialog.tsx` — has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title)
- [ ] `sheet.tsx` — same as dialog
- [ ] `tabs.tsx` — `role="tablist"`, `role="tab"`, `role="tabpanel"` with `aria-selected`, `aria-controls`, `aria-labelledby`
- [ ] `dropdown-menu.tsx` — `role="menu"`, `role="menuitem"`, `aria-expanded` on trigger
- [ ] `command.tsx` — `role="listbox"`, `role="option"`, `aria-selected`
- [ ] `switch.tsx` — `role="switch"`, `aria-checked`
- [ ] `checkbox.tsx` — `role="checkbox"` (or native `<input type="checkbox">`), `aria-checked`
- [ ] `radio-group.tsx` — `role="radiogroup"`, `role="radio"`, `aria-checked`
- [ ] `progress.tsx` — `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] `alert.tsx` — `role="alert"`
- [ ] `toast.tsx` — `role="status"` or `aria-live="polite"`
- [ ] `breadcrumb.tsx` — `nav` with `aria-label="Breadcrumb"`
- [ ] `pagination.tsx` — `nav` with `aria-label="Pagination"`, `aria-current="page"`
- [ ] `data-table.tsx` — sortable headers have `aria-sort`
- [ ] `avatar.tsx` — `role="img"` with `aria-label`
- [ ] `timeline.tsx` — semantic list structure with proper roles

### 4.1.3 Status Messages — AA
Dynamic content updates must be announced by screen readers without moving focus.

- [ ] `toast.tsx` — uses `aria-live="polite"` or `role="status"`
- [ ] Form submission success/failure announced via `aria-live` region
- [ ] Loading states (`spinner.tsx`, `skeleton.tsx`) announce "Loading..." via `aria-live`
- [ ] Data table row count updates are announced
- [ ] Real-time tracking updates use `aria-live="polite"`
- [ ] Sort/filter results announce updated count

---

## Component Checklist

### Layout & Navigation
- [x] Skip-to-content link present (root layout → `#main-content` in `platform-shell.tsx`)
- [ ] Main landmark is `<main>` with `id="main-content"`
- [ ] Header is `<header>` element
- [ ] Navigation is `<nav>` with `aria-label`
- [ ] Sidebar is `<aside>` or `<nav>` with appropriate label

### Dialog / Sheet / Drawer
- [ ] `aria-labelledby` points to title element
- [ ] `aria-describedby` points to description element
- [x] Focus trap when open
- [ ] Escape key closes
- [ ] Focus returns to trigger on close
- [ ] Scrim/backdrop has `aria-hidden="true"`

### Forms
- [ ] All inputs have labels (visible or sr-only)
- [ ] Required fields marked with `aria-required="true"` or `required`
- [ ] Error messages linked via `aria-describedby`
- [ ] Hint/help text linked via `aria-describedby`
- [ ] Autocomplete attributes on common fields (`given-name`, `email`, `tel`, etc.)

### Data Table
- [ ] Sortable column headers have `aria-sort`
- [ ] Row selection announced
- [ ] Pagination nav has `aria-label`
- [ ] "Page X of Y" announced on change
- [ ] Scrollable container has `role="region"` and `aria-label` or `aria-labelledby`

### Alerts & Toasts
- [ ] Error toasts use `role="alert"`
- [ ] Info/success toasts use `role="status"` or `aria-live="polite"`
- [ ] Toast content is announced without stealing focus

### Images & Icons
- [ ] All `<img>` have `alt` (empty for decorative)
- [ ] Icon-only buttons have `aria-label`
- [ ] Decorative SVGs have `aria-hidden="true"`
- [ ] Avatar images have `alt` with initials/person name

### Motion & Animation
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] No blinking/flashing content (3×/sec max to avoid seizures)
- [ ] Transitions are non-harmful when disabled

### Focus Management
- [ ] Visible focus indicator on all interactive elements
- [ ] No focus traps outside modals
- [ ] Focus order matches visual order
- [ ] Focused element is not obscured (2.4.11)
- [ ] `:focus-visible` used instead of `:focus` to avoid always-visible focus on click

### Color & Contrast
- [ ] All text meets 4.5:1 (normal) / 3:1 (large)
- [ ] UI components meet 3:1 non-text contrast
- [ ] Focus indicators meet 3:1
- [ ] High contrast mode overrides are tested
- [ ] Information not conveyed by color alone

### High Contrast Mode
- [ ] `prefers-contrast: high` overrides `--border`, `--ring`, `--input` tokens
- [ ] `.high-contrast` class provides same overrides for manual toggle
- [ ] All components visually acceptable in high contrast mode
- [ ] Icons and graphical elements remain visible

### Reduced Motion
- [ ] `prefers-reduced-motion: reduce` resets all animations/transitions
- [ ] `motion-reduce:` Tailwind variant available for component-level overrides
- [ ] No essential motion is lost (e.g., progress bars still show progress)

---

## Testing Tools

| Tool | Purpose |
|---|---|
| axe DevTools | Automated rule scanning (browser extension) |
| Lighthouse Accessibility | Automated audit in CI/DevTools |
| WAVE Evaluation Tool | Visual overlay of issues |
| NVDA (Windows) | Screen reader testing |
| VoiceOver (macOS) | Screen reader testing |
| JAWS | Screen reader testing (Windows) |
| Colour Contrast Analyser (TPGi) | Manual contrast measurement |
| Accessibility Insights | FastPass + Ad-hoc testing |
| W3C Contrast Checker | Online contrast ratio tool |
| Bookmarklet (Text Spacing) | C35 text spacing test |

---

## Audit Runbook

1. **Automated scan** — Run axe DevTools on every component page
2. **Keyboard audit** — Tab through every interactive element
3. **Screen reader audit** — Navigate with NVDA/VoiceOver using Tab, Arrow keys, and Browse mode
4. **Contrast measurement** — Measure all token pairs and non-text elements
5. **Zoom testing** — 200% and 400% zoom
6. **Text spacing test** — Apply C35 bookmarklet
7. **Reduced motion test** — Enable `prefers-reduced-motion: reduce` in OS/browser DevTools
8. **High contrast test** — Enable `prefers-contrast: high` and toggle `.high-contrast` class
9. **Target size check** — Measure interactive elements for 24×24px minimum
10. **ARIA validation** — Verify roles, states, and properties with browser dev tools

---

## Results Log

| Date | Auditor | Scope | Issues Found | Issues Fixed | Notes |
|---|---|---|---|---|---|
| 2026-06-22 | — | Design tokens, CSS, skip link | — | — | Initial baseline audit |
| — | — | — | — | — | — |
| — | — | — | — | — | — |
