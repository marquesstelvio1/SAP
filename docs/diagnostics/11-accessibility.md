# Diagnostic: Accessibility

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Accessibility Compliance
**Date:** 2026-06-23

---

## Current State

Root layout has skip-to-content link. WCAG 2.2 AA is declared standard. Storybook a11y addon installed. aXe-core + Playwright for E2E accessibility scanning.

## Problems

1. **Accessibility tests not in CI** — `lint:a11y` script exists but accessibility scanning is not enforced in CI pipeline.
2. **No accessibility audit** — No formal audit against WCAG 2.2 AA criteria has been performed.
3. **Color contrast unverified** — Design tokens exist but contrast ratios not validated programmatically.
4. **Keyboard navigation** — No keyboard navigation testing for complex components (tables, modals, dropdowns).
5. **ARIA labels** — Not all interactive elements may have proper ARIA labels.
6. **Focus management** — No focus management strategy for modals, dialogs, and dynamic content.

## Technical Debt

- aXe Playwright integration exists but may not cover all page states.
- Design tokens lack accessible color palette documentation.

## Risks

- **Medium:** Legal risk in regulated markets (EU Accessibility Act, ADA).
- **Low:** Reduced user base (15-20% of users have some disability).

## Impact

Excludes users with disabilities. Potential legal liability in regulated markets.

## Priority

Medium

## Recommended Actions

1. Add aXe accessibility tests to CI pipeline as blocking gate.
2. Perform formal WCAG 2.2 AA audit.
3. Validate all color token combinations meet WCAG AA contrast ratios (4.5:1 normal, 3:1 large).
4. Test keyboard navigation for all interactive components.
5. Audit and fix ARIA labels across all components.
6. Implement focus management for modals and dynamic content.

## Estimated Effort

5-7 days

## Owner Agent

accessibility-expert
