# Branch Standards

## Format

`type/domain/task-id-short-context`

Examples:

- `feat/frontend/fin-142-checkout-empty-state`
- `fix/auth/fin-188-session-race`
- `perf/backend/fin-201-query-cache`
- `chore/infra/fin-233-observability-bootstrap`

## Rules

- `main` is protected.
- `develop` is optional and only used if release trains require it.
- Hotfix branches must start from the active release branch or `main`.
- Experimental branches must never bypass governance gates.

