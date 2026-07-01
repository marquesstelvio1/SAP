# UI Consistency Plugin

**ID:** `ui-consistency`
**Version:** 1.0.0
**Kind:** validation
**Execution Order:** 27
**Mandatory:** false
**Runs On:** post-frontend
**Blocking:** false

## Mission

Ensure UI consistency across all pages and components. Detect visual drift, inconsistent patterns, and UX fragmentation.

## Validation Areas

### 1. Component Consistency

- [ ] Buttons use consistent variants for same actions
  - Primary: primary actions (1 per section)
  - Secondary: secondary actions
  - Outline: tertiary actions
  - Ghost: subtle actions (toolbar, table)
  - Destructive: destructive actions
- [ ] Form inputs have consistent styles
- [ ] Cards have consistent layout
- [ ] Dialogs/Modals have consistent structure
- [ ] Loading states have consistent skeleton patterns

### 2. Spacing Consistency

- [ ] Page padding consistent (±2px tolerance)
- [ ] Section spacing consistent
- [ ] Card padding consistent
- [ ] Gap between elements consistent
- [ ] List/table cell padding consistent

### 3. Typography Consistency

- [ ] Headings use consistent hierarchy (h1-h6)
- [ ] Body text consistent size across pages
- [ ] Label/caption consistent size
- [ ] Line height consistent
- [ ] Font weights consistent per element type

### 4. Color Consistency

- [ ] Primary actions use primary color
- [ ] Destructive actions use destructive color
- [ ] Success messages use success color
- [ ] Warning messages use warning color
- [ ] Error messages use destructive color
- [ ] Info messages use info color (or primary)
- [ ] Links consistent color across app

### 5. Interaction Consistency

- [ ] Hover states consistent
- [ ] Active/pressed states consistent
- [ ] Focus rings consistent
- [ ] Transitions consistent (duration, easing)
- [ ] Click targets adequate size

### 6. Layout Consistency

- [ ] Page headers consistent pattern
- [ ] Action buttons consistent placement
- [ ] Sidebar navigation consistent
- [ ] Breadcrumbs consistent pattern
- [ ] Empty states consistent design

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| UC01 | warning | Inconsistent button variant usage |
| UC02 | warning | Inconsistent spacing pattern |
| UC03 | warning | Inconsistent heading hierarchy |
| UC04 | info | Inconsistent color usage |
| UC05 | info | Inconsistent interaction pattern |
| UC06 | warning | Inconsistent empty state design |
| UC07 | info | Missing consistent page header |
| UC08 | warning | Inconsistent loading pattern |

## Output

Generate `ui-consistency-report.md` in `.ai/reports/`:

```markdown
# UI Consistency Report
**Date:** {date}

## Summary
- Status: PASS | WARNING | INFO
- Pages Audited: {n}
- Component Inconsistencies: {n}
- Spacing Issues: {n}
- Typography Issues: {n}
- Color Issues: {n}

## Findings
### {screen-name}
1. {rule-id} — {description}

## Screenshots
{comparisons}

## Recommendations
1. {recommendation}
```

## Success Criteria

- Consistent component variant usage
- Consistent spacing across all pages
- Consistent typography hierarchy
- Consistent color usage for semantic meaning
