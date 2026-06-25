# Accessibility Audit Plugin

**ID:** `accessibility-audit`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 67
**Mandatory:** true
**Runs On:** pre-release
**Blocking:** false

## Mission

Audit application accessibility against WCAG 2.2 AA standards. Ensure inclusive design for all users.

## Audit Checklist

### 1. WCAG 2.2 AA Compliance

#### Perceivable
- [ ] All images have alt text
- [ ] Color is not the only means of conveying information
- [ ] Color contrast ratio ≥ 4.5:1 (normal text)
- [ ] Color contrast ratio ≥ 3:1 (large text)
- [ ] Text can be resized up to 200% without loss
- [ ] Captions provided for multimedia

#### Operable
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Focus order is logical
- [ ] Visible focus indicators on all interactive elements
- [ ] Skip-to-content link present
- [ ] Target size ≥ 24x24 CSS pixels
- [ ] Motion actuation has alternative

#### Understandable
- [ ] Page language defined (`<html lang="">`)
- [ ] Consistent navigation across pages
- [ ] Consistent identification (same icons = same meaning)
- [ ] Error messages are descriptive
- [ ] Labels and instructions provided for inputs
- [ ] Form validation errors are announced

#### Robust
- [ ] Semantic HTML used
- [ ] ARIA attributes used correctly
- [ ] Landmarks defined (header, nav, main, footer)
- [ ] ARIA labels on icon-only buttons
- [ ] Dynamic content changes announced to screen readers

### 2. Component Accessibility

- [ ] Dialog/Modal traps focus correctly
- [ ] Sheet/Drawer traps focus correctly
- [ ] Dropdown menu keyboard navigable
- [ ] Command menu (⌘K) keyboard accessible
- [ ] Tabs keyboard navigable (arrow keys)
- [ ] DataTable accessible (row selection, sorting)
- [ ] Charts accessible (data table fallback)
- [ ] Forms with proper label associations

### 3. Testing

- [ ] Automated accessibility tests in CI
- [ ] Manual keyboard audit performed
- [ ] Screen reader testing (NVDA/VoiceOver)
- [ ] Contrast ratio tested for all color combinations

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| AX01 | error | Missing alt text on image |
| AX02 | error | Keyboard trap detected |
| AX03 | error | Missing focus indicator |
| AX04 | error | Color contrast failure |
| AX05 | warning | Missing aria-label on icon button |
| AX06 | warning | Missing form label |
| AX07 | error | Missing skip-to-content link |
| AX08 | warning | Non-semantic HTML |
| AX09 | info | Target size too small |
| AX10 | warning | Missing landmarks |

## Output

Generate `accessibility-report.md` in `.ai/reports/`:

```markdown
# Accessibility Audit Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- WCAG 2.2 AA: COMPLIANT | NON-COMPLIANT
- Violations: {n}
- Errors: {n}
- Warnings: {n}
- Info: {n}

## Violations
### {rule-id} — {severity}
**Element:** {selector}
**Issue:** {description}
**WCAG Criteria:** {criteria}
**Fix:** {recommendation}

## Keyboard Audit
- Focus Order: PASS | FAIL
- Keyboard Traps: {n}
- Skip Link: PRESENT | MISSING

## Screen Reader Audit
- Landmarks: {present/missing}
- ARIA Labels: {pass/fail}
- Dynamic Announcements: {pass/fail}

## Recommendations
1. {recommendation}
```

## Success Criteria

- WCAG 2.2 AA compliant
- No keyboard traps
- Focus indicators visible
- Color contrast passes
- Screen reader compatible
