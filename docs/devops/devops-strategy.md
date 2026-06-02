# Phase 5 — DevOps Strategy

## Position

DevOps exists to make every change repeatable, testable, observable, and releasable. The first release target is a governed SaaS foundation, not a feature-complete product.

## Tooling

| Tool | Purpose |
| --- | --- |
| PNPM | Workspace dependency management |
| Turborepo | Task graph and build orchestration |
| Biome | Formatting and linting |
| tsup | Shared package bundling |
| dotenvx | Environment loading and secret-safe local execution |
| Changesets | Versioning and release notes |
| Playwright | End-to-end and smoke testing |
| GitHub Actions | CI, quality gates, release checks |

## Environments

| Environment | Purpose |
| --- | --- |
| Local | Developer iteration with `.env.example` guidance |
| CI | Install, lint, typecheck, test, build |
| Preview | Branch-level deployment and smoke testing |
| Staging | Release candidate validation |
| Production | Customer-facing SaaS runtime |

## CI Pipeline

1. Checkout.
2. Enable Corepack.
3. Install PNPM dependencies.
4. Run Biome checks.
5. Run typecheck.
6. Run unit/integration tests.
7. Run package/app builds.
8. Run Playwright smoke tests when web app exists.
9. Upload reports and artifacts.

## Release Strategy

- Changesets tracks package and release metadata.
- Release branch requires architecture, security, test, observability, and docs gates.
- Production deployment requires rollback plan.
- Database migration release requires dry-run, backup, and expand-migrate-contract plan.

## Secrets Strategy

- `.env` files are never committed.
- `.env.example` documents required variables.
- dotenvx loads local environment values.
- CI uses environment-scoped secrets.
- Service credentials rotate and are audited.

## Deployment Roadmap

| Stage | Deployment Shape |
| --- | --- |
| Foundation | Monorepo CI only |
| MVP | Web + API + PostgreSQL |
| Scale | API replicas, read replicas, queue workers |
| Enterprise | Regional deployment, SSO roadmap, dedicated tenant options |

## Acceptance Criteria

- Root workspace scripts exist.
- CI workflow exists.
- Environment variable contract exists.
- Release governance and rollback expectations are documented.

