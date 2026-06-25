# AGENT TECHNOLOGY MATRIX — SAPTM

> Maps agent types to required technology knowledge.

---

| Agent | Must Know | Must Not Break | Validation |
|---|---|---|---|
| **Architect** | Turborepo pipeline, NestJS module architecture, pnpm catalog, Docker Compose, K8s configs, Prisma migrations, OpenTelemetry | Module boundaries, package dependencies, ADR compliance | `turbo.json` correctness, dependency graph |
| **Backend** | NestJS 11, Prisma 7, Zod 4, @orpc 1.x, better-auth 1.x, PostgreSQL, Redis | API contracts, database schema, permission model, auth context | `pnpm test`, `pnpm typecheck` |
| **Frontend** | Next.js 16, React 19, Tailwind 4, shadcn/ui, TanStack Query 5, Zod 4 (client-side) | Loading/error states, design tokens, component reuse | `pnpm lint`, `pnpm build` |
| **Design System** | Tailwind 4, CSS variables, shadcn/ui, Radix UI, CVA, WCAG 2.2 AA | Token consistency, component API, accessibility | Visual regression, `a11y audit` |
| **QA** | Node --test, Playwright, Playwright test runner | Test coverage, regression, E2E flows | `pnpm test`, `pnpm test:e2e` |
| **DevOps** | Docker, K8s Kustomize, GitHub Actions, OpenTelemetry, Prometheus, Grafana | Build pipeline, deployment config, health checks | `pnpm validate:*`, `pnpm build` |
