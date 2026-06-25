# Standard: Turborepo

**Phase:** 4 — Engineering Standards

---

## Required

- Task pipeline defined in `turbo.json`
- All scripts run via `turbo run`
- Package dependencies declared in `pnpm-workspace.yaml` catalog
- Workspace packages referenced as `workspace:*`
- Cache outputs for build artifacts (`dist/**`, `.next/**`)

## Task Pipeline

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] },
    "test": { "dependsOn": ["^build", "build"], "outputs": [] },
    "lint": { "outputs": [] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

## Recommended

- Use `--ui=stream` for CI output
- Use `--filter` for targeted task execution
- Use `--affected` for PR-based selective execution
- Configure remote caching for CI speed

## Forbidden

- Running scripts directly without turbo (use `turbo run`)
- Circular dependencies between packages
- Direct imports between packages (use workspace package names)
- Adding dependencies outside the catalog

## Validation

- `turbo run build` succeeds for all packages
- `turbo run lint` passes Biome checks
- `turbo run typecheck` passes type checking
- No cache misses in CI for unchanged packages

## Migration

- When upgrading turbo, check task pipeline changes
- Verify cache behavior after upgrade
- Test with `--dry` flag before running tasks
