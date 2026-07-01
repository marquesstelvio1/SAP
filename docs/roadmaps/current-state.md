# Roadmap: Current State

**Phase:** 8 — Roadmap Engine

---

## What Works

- Monorepo structure with Turborepo + pnpm
- NestJS 11 backend with 22 domain modules
- RPC-first communication via @orpc/server
- Next.js 16 App Router frontend
- Better Auth with session management, 2FA, email/password
- Custom RBAC with 41 permissions and org-scoped roles
- Multi-tenant data model
- Transactional outbox pattern
- Immutable audit trail
- Comprehensive security headers and middleware
- Docker Compose with PostgreSQL 17, Redis 7, OTEL, Prometheus, Grafana
- 30+ validation gates in CI
- Container signing (Cosign) and scanning (Trivy)

## What Needs Work

### Critical (0-30 days)
1. CSRF protection on RPC endpoints
2. Automatic tenant query scoping
3. Test coverage across all packages
4. Outbox worker deployment
5. OAuth token encryption
6. Session removal from telemetry

### High (30-60 days)
1. Cargo service decomposition
2. Database index optimization
3. Tenant-level rate limiting
4. Production monitoring stack
5. Component tests for frontend
6. Service-level unit tests
7. Per-operation rate limiting
8. Default roles on org creation

### Medium (60-90 days)
1. Performance optimization (caching, pagination)
2. Accessibility tests in CI
3. Storybook completion
4. Developer experience improvements
5. CI pipeline optimization
6. SLO/SLI definition
7. Dark mode audit
8. Design token documentation

## Overall Status

**Foundation:** Complete
**Features:** In progress (Tracking, Cargo, Capacity, Tariff, Planning, Integrations deployed locally)
**Production Readiness:** Not ready (missing observability, security hardening, test coverage)
