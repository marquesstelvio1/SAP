# Commit Standards

## Format

`type(scope): summary`

Examples:

- `feat(frontend): add guarded checkout empty state`
- `fix(auth): preserve RBAC check on session refresh`
- `perf(api): reduce n+1 queries on invoices`
- `docs(governance): update release approval gate`

## Allowed types

- `feat`
- `fix`
- `refactor`
- `perf`
- `test`
- `docs`
- `build`
- `ci`
- `chore`
- `revert`

## Rules

- One primary intent per commit.
- Reference task id in the body.
- Mention risk or migration when relevant.
- Generated commits must include validation evidence in the body.

