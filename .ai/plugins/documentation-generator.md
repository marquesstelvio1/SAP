# Documentation Generator Plugin

**ID:** `documentation-generator`
**Version:** 1.0.0
**Kind:** automation
**Execution Order:** 70
**Mandatory:** true
**Runs On:** post-implementation, pre-release
**Blocking:** false

## Mission

Automatically update all documentation to reflect code changes. Ensure documentation stays in sync with implementation.

## Documents to Update

### 1. README.md

- [ ] Project description up-to-date
- [ ] Architecture diagram current
- [ ] Tech stack accurate
- [ ] Setup instructions verified
- [ ] Development workflow documented
- [ ] Contribution guide updated

### 2. Architecture Decision Records (ADRs)

- [ ] New ADR created for any architectural change
- [ ] Existing ADRs updated if decision scope changed
- [ ] ADR statuses reviewed (active/superseded/pending)
- [ ] ADR follows template format:
  - Title, Status, Date, Drivers
  - Context, Decision, Consequences
  - Compliance, Notes

### 3. Architecture Documentation

- [ ] `docs/architecture/` reflects current structure
- [ ] Package dependency graph updated
- [ ] Module descriptions accurate
- [ ] Layer boundaries documented

### 4. API Documentation

- [ ] RPC operations documented
- [ ] Schemas (Zod) reflected in docs
- [ ] Error codes documented
- [ ] Auth requirements per operation
- [ ] Example requests/responses

### 5. Design System Documentation

- [ ] Component catalog updated
- [ ] New components added to catalog
- [ ] Component props documented
- [ ] Usage examples for new components
- [ ] Variants documented

### 6. Governance Documentation

- [ ] Rules updated for any new restrictions
- [ ] Policies reflect current processes
- [ ] Workflow documentation current
- [ ] Agent registry accurate

### 7. CHANGELOG.md

- [ ] New entries follow keepachangelog format
- [ ] Changes categorized (Added, Changed, Deprecated, Removed, Fixed, Security)
- [ ] Version bumped following semver

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| DG01 | warning | Missing ADR for architectural change |
| DG02 | warning | Outdated README |
| DG03 | info | Missing API docs for new operation |
| DG04 | warning | Missing component documentation |
| DG05 | info | CHANGELOG not updated |
| DG06 | warning | Architecture docs stale |

## Output

Generate documentation update summary:

```markdown
# Documentation Update Report
**Date:** {date}

## Updated
- README.md — {changes}
- docs/adr/ — {new/updated ADRs}
- docs/architecture/ — {changes}
- docs/api/ — {changes}
- docs/design-system/ — {changes}
- CHANGELOG.md — {changes}

## Created
- {new file}

## Pending
- {documentation gap}

## Recommendations
1. {recommendation}
```

## Success Criteria

- All documentation updated for changes
- ADR created for architectural decisions
- README reflects current state
- CHANGELOG updated
- No documentation gaps identified
