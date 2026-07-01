# Audit: Design System

## Purpose
Audit the SAPTM design system for consistency, token usage, dark mode support, component variants, and accessibility compliance. Verify all components use design tokens from `@saptm/ui/tokens` and no hardcoded values exist.

## Inputs
- `packages/ui/src/components/` — all shared UI component source files
- `packages/ui/src/tokens/index.ts` — design token definitions
- `apps/web/app/globals.css` — global styles and CSS custom properties
- `packages/ui/src/styles/` — component-level style files
- `tailwind.config.ts` or equivalent Tailwind configuration

## Execution Steps
1. **Design Token Definitions** (Rule 5.1)
   - Open `packages/ui/src/tokens/index.ts`.
   - Verify the following token categories exist:
     - **Spacing**: `space-*` scale (`--space-{0-32}`) (Rule 5.2)
     - **Semantic colors**: `--primary`, `--muted`, `--destructive`, `--success`, `--warning`, `--info`, `--border`, `--background`, `--foreground` (Rule 5.3)
     - **Density**: `comfortable`, `compact`, `operational` (Rule 5.4)
     - **Elevation/Shadow**: `--shadow-panel`, `--shadow-overlay`, `--shadow-command`, `--shadow-sticky` (Rule 5.5)
     - **Border radius**: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
     - **Typography**: font family, font size scale, font weight, line height
   - Validate that all tokens have both light and dark mode values.
   - Flag missing token categories as design system gaps.

2. **Global CSS Variables** (Rule 5.2, 5.3, 5.4, 5.5)
   - Open `apps/web/app/globals.css`.
   - Verify CSS custom properties match token definitions in `packages/ui/src/tokens/index.ts`.
   - Check `.dark` class selector has overrides for all color tokens.
   - Confirm `@media (prefers-color-scheme: dark)` is handled (or `.dark` class via `next-themes`).
   - Flag missing dark mode overrides as P1.

3. **Component Token Usage** (Rule 5.1)
   - Scan all component files in `packages/ui/src/components/` for hardcoded values:
     - Hardcoded colors (e.g., `#fff`, `#000`, `rgb(...)`, named colors like `red`, `blue`).
     - Hardcoded spacing (e.g., `p-4`, `m-2`, `gap-3` — verify these map to tokens).
     - Hardcoded border radii (e.g., `rounded-lg` — verify maps to `--radius-lg`).
     - Hardcoded shadows (e.g., `shadow-lg`, `shadow-md` — verify maps to shadow tokens).
   - For each hardcoded value found, determine if a token equivalent exists.
   - Flag hardcoded values where a token exists as P2.
   - Flag hardcoded values where no token exists (new value) as P1 (design system gap).

4. **Component Variants** (Rule 5.6)
   - Verify components use `cva()` (Class Variance Authority) for variant management.
   - Confirm `tailwind-merge` is used for class merging (via `cn()` or `twMerge()`).
   - Check that variant definitions use semantic color tokens, not hardcoded colors.
   - Verify each component has at minimum `default` variant.
   - Flag components not using `cva()` or `tailwind-merge`.

5. **Dark Mode** (Rule 5.7)
   - Verify `next-themes` is configured in the app provider.
   - Check that `ThemeProvider` wraps the application.
   - Confirm theme toggle component is present and functional.
   - Verify all color tokens have `.dark` overrides.
   - Test (visually or via snapshot) that key components render correctly in dark mode.
   - Flag components that lack dark mode styling.

6. **Accessibility Properties** (Rule 4.2)
   - Scan components for ARIA attributes:
     - `role` on semantic containers where needed.
     - `aria-label` on icon-only buttons (Rule 4.2.5).
     - `aria-hidden` on decorative icons.
     - `aria-current` on active navigation items.
     - `aria-expanded` on expandable elements.
     - `aria-controls` pointing to controlled element IDs.
   - Verify interactive elements are keyboard accessible (Rule 4.2.3).
   - Check `tabIndex` is not misused (avoid positive values).
   - Flag missing ARIA labels on icon-only buttons as P1.

7. **Typography Scale**
   - Verify typography tokens define a consistent scale (e.g., `--font-size-xs` through `--font-size-4xl`).
   - Check that components use tokenized font sizes, not arbitrary `text-*` classes.
   - Confirm font families use the design token variable.

## Validation Steps
- [ ] All token categories exist: spacing, semantic colors, density, elevation, border radius, typography
- [ ] Global CSS variables match token definitions
- [ ] `.dark` class has complete color token overrides
- [ ] No hardcoded colors, spacing, shadows, or border radii in components
- [ ] Components use `cva()` and `tailwind-merge`
- [ ] `next-themes` configured and theme toggle present
- [ ] All color tokens have dark mode values
- [ ] Icon-only buttons have `aria-label`
- [ ] Interactive elements are keyboard accessible
- [ ] Typography uses tokenized values

## Definition of Done
- Token definitions are complete and documented.
- All components reference design tokens.
- No hardcoded visual values in component code.
- Dark mode is fully supported with `.dark` class overrides.
- Component variants use `cva()` with proper class merging.
- Accessibility properties meet WCAG 2.2 AA.

## Failure Conditions
- Token category missing from definitions — **P1**
- Hardcoded color found in component — **P2** (P1 if universally used)
- Dark mode missing on a component — **P2**
- Icon-only button missing `aria-label` — **P1**
- Component does not use `cva()` — **P2**

## Required Reports
- `audit-design-system-tokens.md` — token completeness and coverage
- `audit-design-system-hardcoded.md` — hardcoded values found per component
- `audit-design-system-dark-mode.md` — dark mode coverage per component
- `audit-design-system-accessibility.md` — ARIA and keyboard accessibility findings
- `audit-design-system-summary.md` — pass/fail per component
