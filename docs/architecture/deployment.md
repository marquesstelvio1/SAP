# Deployment Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Infrastructure Stack

```
                 Internet
                    │
              [CDN / LB]
                    │
        ┌───────────┴───────────┐
        │                       │
   @saptm/web              @saptm/api
   (Next.js 16)            (NestJS 11)
        │                       │
        └───────────┬───────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    PostgreSQL 17         Redis 7
          │                   │
          └────────────────────┘
                    │
          ┌─────────┴─────────┐
          │  Observability     │
          │  Stack             │
          │  OTEL → Prom →     │
          │  Grafana + Alerts  │
          └───────────────────┘
```

## Docker Compose (Local Development)

8 services defined in `compose.yaml`:
- **postgres** — PostgreSQL 17 on port 25432
- **redis** — Redis 7 on port 26379
- **api** — NestJS on port 4000
- **web** — Next.js on port 3000
- **otel-collector** — OpenTelemetry on ports 4317/4318
- **alertmanager** — Alert routing on port 9093
- **prometheus** — Metric storage on port 9090
- **grafana** — Dashboard UI on port 3001

## Docker Build

### API (`apps/api/Dockerfile`)
- Multi-stage build (deps → build → production)
- Node 22-alpine base
- Output: compiled NestJS app

### Web (`apps/web/Dockerfile`)
- Multi-stage build (deps → build → production)
- Next.js standalone output mode
- Node 22-alpine base

## Kubernetes

Production deployments managed via Kubernetes manifests in `deploy/kubernetes/`.

## CI/CD Pipeline (GitHub Actions)

### Workflows
1. **Platform CI** — 30+ validation gates on PR/push to main
2. **Container CI** — Build, scan, sign containers
3. **AI CI** — AI-assisted validation
4. **AI Release** — AI-assisted release management
5. **Cluster Baseline** — K8s cluster validation
6. **Environment Deploy** — Deploy to staging/production
7. **Environment Rollback** — Automated rollback
8. **Observability Deploy** — Deploy monitoring stack
9. **AI Backlog Sync** — Sync backlog with AI diagnostics
10. **Documentation Freshness** — Validate docs are current on PR/push and weekly

### Release Process
1. CI passes all 30+ gates
2. Release evidence generated
3. Container built, scanned (Trivy), signed (Cosign)
4. Deployed to environment
5. Health checks validate deployment
6. Rollback available if health checks fail

## Health Checks

- API: `/health/live` (liveness), `/health/ready` (readiness)
- Web: `/api/health`
- Docker health checks for all services
