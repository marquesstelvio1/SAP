# Diagnostic: Design System

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Design System & UI Consistency
**Date:** 2026-06-23

---

## Current State

shadcn/ui (new-york style) with Radix UI primitives. Design tokens in `@saptm/ui/tokens`. CVA for component variants. Tailwind CSS v4. Storybook configured. Dark mode via next-themes.

## Problems

1. **Token adoption** — Not all components may use design tokens consistently; hardcoded values may exist.
2. **Storybook incomplete** — Storybook is configured but many components lack stories.
3. **Component composition** — Some compound components (tables with sorting, filtering, pagination) lack documented composition patterns.
4. **Dark mode gaps** — Some custom components may not fully support dark mode.
5. **No design token documentation** — Design tokens lack documentation for what each token represents and when to use it.
6. **Responsive patterns** — No standardized responsive layout patterns documented.

## Technical Debt

- `@saptm/ui` exports multiple entry points (components, hooks, tokens, styles) — versioning strategy unclear.
- Radix UI 1.4.3 is a single package import — individual sub-packages not versioned independently.

## Risks

- **Medium:** Visual inconsistency as more components are added without design system governance.
- **Low:** Dark mode issues affect user experience for a significant subset of users.

## Impact

UI inconsistency erodes professional appearance. Development velocity slows without clear component patterns.

## Priority

Medium

## Recommended Actions

1. Audit all components for design token compliance; replace hardcoded values.
2. Complete Storybook stories for all components with all variants documented.
3. Create component composition documentation for complex patterns.
4. Dark mode audit and fix for all custom components.
5. Create design token documentation with usage guidelines.
6. Define responsive layout patterns and add to design system.

## Estimated Effort

7-10 days

## Owner Agent

design-system
