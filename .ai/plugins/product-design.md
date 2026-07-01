# Product Design Plugin

**ID:** `product-design`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 10
**Mandatory:** true
**Runs On:** feature-start
**Blocking:** true

## Mission

Ensure every feature is designed from a product perspective before any code is written. No implementation may proceed without passing through Product Design.

## Execution

### Phase 1 — Product Discovery

- [ ] Business goal identified
- [ ] Target users / personas defined
- [ ] User problem validated
- [ ] Success metrics defined
- [ ] Business value estimated
- [ ] Feature priority validated against roadmap

### Phase 2 — User Journey

- [ ] User flow diagram created
- [ ] Entry points identified
- [ ] Primary path mapped
- [ ] Alternative paths mapped
- [ ] Error paths mapped
- [ ] Edge cases documented

### Phase 3 — Wireframes

- [ ] Desktop wireframes created
- [ ] Tablet wireframes created
- [ ] Mobile wireframes created
- [ ] Loading states designed
- [ ] Empty states designed
- [ ] Error states designed
- [ ] Skeleton states designed

### Phase 4 — Information Architecture

- [ ] Navigation placement decided
- [ ] Page hierarchy defined
- [ ] Module organization defined
- [ ] Sitemap updated

### Phase 5 — Requirements

- [ ] Functional requirements defined
- [ ] Non-functional requirements defined
- [ ] Acceptance criteria written
- [ ] Edge cases documented
- [ ] Dependencies identified

## Outputs

Generate the following files in `docs/product/`:

### docs/product/vision.md
```markdown
# Product Vision
- **Feature:** {name}
- **Business Goal:** {goal}
- **Target Users:** {personas}
- **Success Metrics:** {metrics}
- **Priority:** {priority}
```

### docs/product/personas.md
```markdown
# Personas
## {persona-name}
- **Role:** {role}
- **Goals:** {goals}
- **Pain Points:** {pain-points}
- **Permissions:** {permissions}
```

### docs/product/user-flows.md
```markdown
# User Flows
## {flow-name}
- **Entry:** {entry-point}
- **Steps:** 1. {step} 2. {step} ...
- **Alternatives:** {alt-paths}
- **Errors:** {error-paths}
```

### docs/product/sitemap.md
```markdown
# Sitemap
- {route} → {description}
```

### docs/product/wireframes.md
```markdown
# Wireframes
## {screen-name}
- **States:** loading, empty, error, success
- **Components:** {list}
- **Actions:** {list}
```

### docs/product/requirements.md
```markdown
# Requirements
## Functional
- FR-01: {requirement}
## Non-Functional
- NFR-01: {requirement}
## Acceptance Criteria
- AC-01: {criteria}
```

## Enforcement

| Rule | Severity | Description |
|---|---|---|
| P01 | critical | No implementation without product design |
| P02 | error | Missing user flow |
| P03 | error | Missing wireframes |
| P04 | warning | Missing success metrics |
| P05 | warning | Missing non-functional requirements |

## Success Criteria

- All outputs generated
- User flows documented
- Wireframes created for all states
- Requirements defined with acceptance criteria
- Feature priority validated
