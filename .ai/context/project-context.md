# Project Context

**Phase:** 11 — AI Memory Layer

---

## Project Identity

**Name:** SAPTM — Enterprise Logistics Platform
**Domain:** Rail-port logistics operations
**Stack:** TypeScript monorepo (NestJS 11 + Next.js 16 + PostgreSQL 17 + Prisma 7)
**Auth:** Better Auth v1
**RPC:** @orpc/server v1
**Deployment:** Docker + Kubernetes

## Current Architecture Summary

- Monorepo with pnpm workspaces + Turborepo
- 2 apps (api, web), 11 packages
- RPC-first API communication
- Multi-tenant with per-organization data isolation
- 41 platform permissions with org-scoped RBAC
- Immutable audit trail + transactional outbox
- 30+ CI validation gates

## Current Focus

- Foundation hardening (CSRF, tenant scoping, tests)
- Feature implementation (Tracking, Cargo, Capacity, Tariff, Planning, Integrations)
- Production readiness (observability, security, performance)

## Key Contacts

- **Architect:** architect agent
- **Security:** security agent
- **QA:** qa agent
- **DevOps:** devops agent
