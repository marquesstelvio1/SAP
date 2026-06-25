# Design System Audit Plugin

**ID:** `design-system-audit`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 25
**Mandatory:** true
**Runs On:** pre-frontend, post-frontend
**Blocking:** false

## Mission

Validate design system consistency, detect visual regressions, ensure shadcn/ui best practices, and enforce design token usage.

## Audit Checklist

### 1. shadcn/ui Validation

- [ ] `components.json` exists and is valid
- [ ] All components use `@radix-ui/*` primitives
- [ ] No custom components when shadcn/ui equivalent exists
- [ ] Component variants follow shadcn/ui conventions
- [ ] Component composition over props pattern used
- [ ] No direct DOM manipulation (use Radix primitives)

### 2. Design Tokens

- [ ] All colors use CSS variables (not hardcoded hex)
- [ ] All spacing uses scale values (4/8/12/16/24/32/48/64/96)
- [ ] Typography uses predefined classes (not arbitrary values)
- [ ] Border radius uses sm/md/lg/xl/full
- [ ] Shadows use predefined token classes
- [ ] No hardcoded z-index values

### 3. Theming

- [ ] CSS variables defined for all theme colors
- [ ] Dark mode implemented via `class` strategy
- [ ] All components respect dark mode
- [ ] Color contrast maintained in dark mode
- [ ] No hardcoded light-only or dark-only colors

### 4. Component Audit

- [ ] No duplicate components (same functionality, different names)
- [ ] No unused components
- [ ] All components have proper TypeScript types
- [ ] All components have displayName
- [ ] All icon-only buttons have aria-labels
- [ ] All form elements have associated labels

### 5. Inconsistency Detection

- [ ] Consistent button variants across app
- [ ] Consistent spacing patterns
- [ ] Consistent typography scale usage
- [ ] Consistent color usage
- [ ] Consistent border radius usage
- [ ] Consistent icon sizes

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| DS01 | error | Hardcoded color value |
| DS02 | error | Duplicate component |
| DS03 | error | Missing dark mode support |
| DS04 | warning | Missing CSS variable |
| DS05 | warning | Inconsistent spacing |
| DS06 | warning | Custom component when shadcn exists |
| DS07 | error | No aria-label on icon button |
| DS08 | warning | Missing displayName |
| DS09 | error | Direct DOM manipulation |
| DS10 | warning | Inconsistent token usage |

## Output

Generate `design-system-report.md` in `docs/design-system/`:

```markdown
# Design System Audit Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- Components Audited: {n}
- Violations: {n}
- Errors: {n}
- Warnings: {n}

## Findings

### {rule-id} — {severity}
**Component:** {component}
**Issue:** {description}
**Current:** {current-value}
**Expected:** {expected-value}
**Fix:** {recommendation}

## Token Usage
- Colors defined: {n}, used: {n}, unused: {n}
- Spacing tokens used: {n}
- Typography tokens used: {n}

## Recommendations
1. {recommendation}
```

## Success Criteria

- No DS01, DS02, DS03, DS07, DS09 errors
- Dark mode implemented for all components
- Design tokens used consistently
- No duplicate components
