# Context Loader Plugin

**ID:** `context-loader`
**Version:** 1.0.0
**Kind:** system
**Execution Order:** 0
**Mandatory:** true
**Runs On:** task-start, session-start

## Mission

Load all relevant context before any agent begins work. Guarantee that every agent has the full picture before making decisions.

## Execution

### Step 1 — Load Project Configuration

Read the following files:

- `AGENTS.md` — Agent instructions and guard rails
- `CLAUDE.md` — Claude-specific instructions (if exists)
- `README.md` — Project overview
- `opencode.json` — OpenCode configuration
- `package.json` — Root package.json (scripts, dependencies)
- `pnpm-workspace.yaml` — Workspace topology
- `turbo.json` — Task pipeline definitions
- `components.json` — shadcn/ui configuration
- `tsconfig.base.json` — TypeScript configuration
- `biome.json` — Linting configuration
- `knip.json` — Dead file analysis configuration
- `.env.example` — Environment variable schema

### Step 2 — Load AI Context

Read:

- `.ai/operating-system.json` — OS configuration
- `.ai/agents/registry.json` — Agent registry
- `.ai/skills/registry.json` — Skill registry
- `.ai/rules/rule-index.json` — Rule index
- `.ai/routing.json` — Agent routing
- `.ai/memory/decision-log.md` — Decision log
- `.ai/memory/patterns/*.md` — Approved patterns
- `.ai/memory/conventions/*.md` — Project conventions
- `.ai/memory/design-tokens/*.md` — Design tokens
- `.ai/context/project-context.md` — Project context
- `.ai/context/repository-map.md` — Repository map

### Step 3 — Load Plugins

Read:

- `.ai/plugins/plugin-registry.json` — Plugin registry
- `.ai/plugins/*.md` — All plugin definitions

### Step 4 — Load Workflows

Read:

- `.ai/workflows/*.md` — All workflow definitions

### Step 5 — Load Docs (if applicable)

Read based on task domain:

- `docs/architecture/*.md` — Architecture documentation
- `docs/design-system/*.md` — Design system documentation
- `docs/security/*.md` — Security documentation
- `docs/api/` — API documentation
- `docs/adr/*.md` — Architecture Decision Records

### Step 6 — Load Recent Reports

Read:

- `.ai/reports/*.md` — Recent audit and validation reports

## Output

```
Context loaded: {project, domain, agents, plugins, workflows, memory}
```

## Error Handling

If any mandatory file is missing:
1. Log warning
2. Continue execution
3. Report missing file in context summary

## Success Criteria

- All project config files loaded
- All AI context files loaded
- All plugins registered
- All relevant docs loaded
- Context summary generated
