# STACK INVENTORY — SAPTM

> Complete technology ecosystem analysis.

---

## RUNTIME

| Component | Version | Source |
|---|---|---|
| Node.js | >=22 (engine) | `package.json` engines |
| Package Manager | pnpm 10.12.1 | `package.json` packageManager |
| TypeScript | ^5.8.0 | `pnpm-workspace.yaml` catalog |
| ESM | `"type": "module"` | `package.json` type |

---

## FRONTEND STACK

| Component | Version | Location |
|---|---|---|
| **Framework** | Next.js 16 | `apps/web/` |
| **React** | 19.2.7 | `pnpm-workspace.yaml` catalog |
| **Build** | Turbopack (default), Webpack fallback | `next.config.ts` |
| **Routing** | App Router | `apps/web/app/` |
| **UI Library** | shadcn/ui (new-york style) | `components.json` |
| **CSS** | Tailwind v4 | `apps/web/app/globals.css` |
| **Icons** | lucide-react ^0.468.0 | `pnpm-workspace.yaml` |
| **Table** | @tanstack/react-table ^8.0.0 | `pnpm-workspace.yaml` |
| **Charts** | recharts ^2.0.0 | `pnpm-workspace.yaml` |
| **Date Picker** | react-day-picker ^9.0.0 | `pnpm-workspace.yaml` |
| **Date Utils** | date-fns ^4.0.0 | `pnpm-workspace.yaml` |
| **Theme** | next-themes ^0.4.0 | `pnpm-workspace.yaml` |
| **Toast** | sonner ^2.0.0 | `pnpm-workspace.yaml` |
| **Query** | @tanstack/react-query ^5.0.0 | Catalog (7 hooks, QueryProvider in root layout) |
| **Error Tracking** | @sentry/nextjs ^8.0.0 | `pnpm-workspace.yaml` catalog |
| **State Management** | React Server Components + React 19 hooks | No external state lib |
| **Forms** | Native HTML5 + React 19 `useActionState` | No form library |

---

## BACKEND STACK

| Component | Version | Location |
|---|---|---|
| **Framework** | NestJS 11 | `apps/api/` |
| **Platform** | Express (default) | `@nestjs/platform-express` |
| **Runtime** | tsx (dev), tsc (build) | `package.json` dev |
| **RPC** | @orpc/server, @orpc/client, @orpc/contract ^1.0.0 | `packages/rpc/` |
| **Validation** | zod ^4.0.0 | `pnpm-workspace.yaml` catalog |
| **Database** | PostgreSQL | Docker compose |
| **ORM** | Prisma 7 | `packages/database/` |
| **Pg Adapter** | @prisma/adapter-pg ^7.0.0 | `pnpm-workspace.yaml` |
| **Auth** | better-auth ^1.0.0 | `packages/auth/` |
| **Cache** | Redis (@nestjs/cache-manager) | Docker compose |
| **Rate Limiting** | @nestjs/throttler | `apps/api/src/rate-limit/` |
| **CSRF** | csrf-csrf (double submit cookie) | `apps/api/src/security/` |
| **Cookie Parsing** | cookie-parser | `apps/api/src/main.ts` |
| **DI** | NestJS built-in + rxjs ^7.8.0 | nest ecosystem |

---

## INFRASTRUCTURE

| Component | Details |
|---|---|
| **Containerization** | Docker multi-stage builds (api + web) |
| **Orchestration** | Docker Compose (local), Kubernetes (production) |
| **K8s Config** | Kustomize base + overlays |
| **CI/CD** | 9 GitHub Actions workflows |
| **Monitoring** | OpenTelemetry + Prometheus + Grafana + Alertmanager |
| **Logging** | Structured JSON (LOG_LEVEL configurable) |
| **Secrets** | Environment variables via dotenvx |
| **Backup** | Logical pg_dump (strategy defined, scripts pending) |

---

## KEY LIBRARIES

| Package | Version | Purpose |
|---|---|---|
| radix-ui | 1.4.3 | Headless UI primitives (catalog) |
| class-variance-authority | 0.7.1 | Component variant management |
| clsx | ^2.1.0 | Class name utility |
| tailwind-merge | ^2.6.0 | Tailwind class dedup |
| cmdk | ^1.1.1 | Command palette (root dep) |
| reflect-metadata | ^0.2.0 | Decorator metadata (NestJS) |
| stripe | ^18.0.0 | Payment processing |
| resend | (via @saptm/email) | Email delivery |
