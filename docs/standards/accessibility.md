# Standard: Accessibility

**Phase:** 4 — Engineering Standards

---

## Required

- WCAG 2.2 AA compliance minimum
- Skip-to-content link on all pages
- All interactive elements keyboard accessible
- Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- ARIA labels on all icon-only buttons
- Form elements have associated labels
- Focus indicators visible on all interactive elements

## Recommended

- Run aXe accessibility tests in CI
- Use semantic HTML elements (`<nav>`, `<main>`, `<aside>`, etc.)
- Provide alt text for all images
- Use `aria-live` regions for dynamic content updates
- Support reduced motion (`prefers-reduced-motion`)
- Test with screen readers (VoiceOver, NVDA)
- Maintain logical heading hierarchy (`h1` → `h2` → `h3`)

## Forbidden

- Removing focus outlines without providing alternatives
- Only using color to convey information
- Trapping keyboard focus without escape mechanism
- Using `aria-hidden="true"` on interactive elements
- Auto-playing media without user control

## Component Patterns

### Modals
- Focus trap within modal
- Escape key closes modal
- `aria-labelledby` referencing modal title
- Focus returns to trigger element on close

### Forms
- All inputs have associated `<label>`
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required`
- Inline validation with clear error messages

### Tables
- `<th>` elements with `scope` attribute
- `aria-sort` on sortable columns
- Summary for complex tables

## Validation

- aXe tests pass in CI
- Manual keyboard navigation test for all pages
- Color contrast validation for all token combinations
- Screen reader test for critical user journeys

## Migration

- When adding new components, verify accessibility patterns
- Upgrade aXe rules when updating Playwright
- Document accessible patterns in design system
