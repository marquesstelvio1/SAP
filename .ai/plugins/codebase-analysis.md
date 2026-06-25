# Codebase Analysis Plugin

**ID:** `codebase-analysis`
**Version:** 1.0.0
**Kind:** analysis
**Execution Order:** 30
**Mandatory:** false
**Runs On:** pre-implementation
**Blocking:** false

## Mission

Analyze the codebase structure, identify patterns, detect complexity issues, and provide insights before implementation begins.

## Analysis Areas

### 1. File Structure Analysis

- [ ] Directory depth (max 5 levels recommended)
- [ ] File naming conventions consistent
- [ ] Barrel files (index.ts) used where appropriate
- [ ] No files > 500 lines (unless justified)
- [ ] No functions > 50 lines (unless justified)

### 2. Code Complexity

- [ ] Cyclomatic complexity checked in critical paths
- [ ] No deeply nested callbacks (> 3 levels)
- [ ] No long promise chains (> 3 `.then()`)
- [ ] No deeply nested ternaries
- [ ] Component complexity (extract sub-components where > 100 lines)

### 3. Pattern Detection

- [ ] Existing patterns identified and cataloged
- [ ] New code should follow existing patterns
- [ ] No anti-patterns detected (copy-paste code, god objects)
- [ ] Error handling patterns consistent

### 4. Dead Code Detection

- [ ] Unused exports identified
- [ ] Unused components identified
- [ ] Unused utilities identified
- [ ] TODO/FIXME comments counted

### 5. Import Analysis

- [ ] No unused imports
- [ ] No circular imports
- [ ] No deep imports from package internals
- [ ] Barrel files used correctly (no tree-shaking issues)

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| CB01 | warning | File > 500 lines |
| CB02 | warning | Function > 50 lines |
| CB03 | warning | Cyclomatic complexity > 10 |
| CB04 | warning | Nested callbacks > 3 levels |
| CB05 | info | Unused export |
| CB06 | warning | TODO/FIXME without issue reference |
| CB07 | error | Circular import |
| CB08 | info | Inconsistent naming convention |

## Output

Generate `codebase-report.md` in `.ai/reports/`:

```markdown
# Codebase Analysis Report
**Date:** {date}

## Summary
- Total Files: {n}
- Total Lines: {n}
- Complex Files: {n}
- Dead Code: {n} exports
- TODOs: {n}
- FIXMEs: {n}

## Complexity Hotspots
1. {file}:{line} — {issue}

## Dead Code
1. {file}:{line} — {export-name}

## Patterns Identified
- {pattern}: {locations}

## Recommendations
1. {recommendation}
```

## Success Criteria

- No circular imports
- Consistent naming conventions
- Existing patterns cataloged for reuse
- Dead code identified
