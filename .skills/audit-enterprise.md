# Audit: Enterprise

## Purpose
Perform a full enterprise-grade audit of the entire SAPTM monorepo, covering architecture, security, performance, design system, QA, DevOps, and observability. Validate that all documentation matches code and identify any P0 (critical) issues that block production readiness.

## Inputs
- Entire codebase under `apps/` and `packages/`
- `docs/` directory (ADR, API contracts, design system, security docs)
- `AGENTS.md` — constitutional rules
- `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.json` hierarchy
- All `package.json` files
- `.env.example`
- `compose.yaml` and `deploy/` directory

## Execution Steps
1. **Architecture Review**
   - Verify all code resides within `apps/` or `packages/` (Rule 1.1.1).
   - Confirm no package imports from another package's `src/` directly — only `@saptm/*` workspace references (Rule 1.1.2).
   - Check TypeScript project references enforce package boundaries (Rule 1.1.3).
   - Validate `@saptm/api` is the only backend entry point and `@saptm/web` is the only frontend entry point (Rules 1.2.1–1.2.2).
   - Confirm domain modules follow `module.ts`, `controller.ts`, `service.ts`, `types.ts` structure (Rule 1.2.3).
   - Verify all API-to-client communication uses `@saptm/rpc` contracts (Rule 1.2.4).
   - Check every RPC operation has metadata: name, version, kind, auth, audit, criticality, signals (Rule 1.2.5).
   - Confirm layer boundaries are respected — packages never consume applications (Rule 1.3.5).
   - Scan for circular dependencies between packages (Rule 1.3.6).

2. **Security Audit**
   - Run full audit-security.md skill (see `.skills/audit-security.md`).
   - Verify authentication required on all routes except public health endpoints (Rule 2.1.1).
   - Check session expiry: 7 days with 24h sliding window (Rule 2.1.2).
   - Confirm email verification required before full access (Rule 2.1.3).
   - Validate password policy: 12–128 characters (Rule 2.1.4).
   - Check 2FA (TOTP) availability (Rule 2.1.5).
   - Verify every RPC operation declares auth mode: `public`, `authenticated`, or `service` (Rule 2.2.1).
   - Confirm permission checks use `evaluateAuthorization` from `@saptm/auth/policy` (Rule 2.2.2).
   - Validate permission evaluation modes: `ALL` or `ANY` (Rule 2.2.3).
   - Verify RBAC roles are per-organization with granular permission assignments (Rule 2.2.4).
   - Confirm client-side checks are UI-only (Rule 2.2.5).
   - Check security headers: HSTS, CSP, XFO, COOP, CORP, Permissions-Policy, Referrer-Policy (Rule 2.3.1).
   - Validate CSRF via `csrf-csrf` double-submit cookie with signed cookies (Rule 2.3.2).
   - Verify CORS restricted to trusted origins from environment config (Rule 2.3.3).
   - Check rate limiting via `@nestjs/throttler` (Rule 2.3.4).
   - Confirm API keys hashed with SHA-256; only prefix stored in plaintext (Rule 2.3.5).
   - Verify no secrets in code — all from environment variables or External Secrets Operator (Rule 2.4.1).
   - Check `.env` is gitignored; `.env.example` is documentation source (Rule 2.4.2).
   - Validate tenant isolation: all domain data scoped to `organizationId` (Rules 2.5.1–2.5.3).

3. **Performance Audit**
   - Run full audit-performance.md skill (see `.skills/audit-performance.md`).

4. **Design System Audit**
   - Run full audit-design-system.md skill (see `.skills/audit-design-system.md`).

5. **QA Audit**
   - Verify all RPC contracts have unit tests in `packages/rpc/tests/` (Rule 3.1.1).
   - Verify all API modules have integration tests in `apps/api/tests/` (Rule 3.1.2).
   - Verify UI components have structural rendering tests in `packages/ui/src/components/__tests__/` (Rule 3.1.3).
   - Verify critical user journeys have E2E tests in `tests/e2e/` (Rule 3.1.4).
   - Confirm every new page includes `loading.tsx` and `error.tsx` boundaries (Rule 3.1.5).
   - Verify API tests use Node `node --test` runner (Rule 3.2.1).
   - Verify E2E tests use Playwright with chromium only, serial execution (Rule 3.2.2).
   - Verify test files use `.test.mjs` extension (Rule 3.2.3).
   - Confirm external services mocked in integration tests (Rule 3.2.4).
   - Check PR validation pipeline: lint → typecheck → test → build (Rule 3.3.1).
   - Verify CI has 30+ production validation gates (Rule 3.3.2).

6. **DevOps Audit**
   - Verify Docker multi-stage builds for all deployable applications (Rule 7.1).
   - Check health endpoints: `/health/live`, `/health/ready` (API) and `/api/health` (Web) (Rules 7.2–7.3).
   - Confirm graceful shutdown handling on all services (Rule 7.4).
   - Verify OpenTelemetry traces + Prometheus metrics + structured logs (Rule 7.5).
   - Check database migrations applied at deployment via init container (Rule 7.6).
   - Verify `turbo.json` declares task pipelines — all scripts use `turbo run` (Rule 8.1).

7. **Monorepo Governance Audit**
   - Run full audit-monorepo.md skill (see `.skills/audit-monorepo.md`).

8. **Observability Audit**
   - Run full audit-observability.md skill (see `.skills/audit-observability.md`).

9. **Documentation Consistency**
   - Validate architecture decisions in `docs/adr/` reflect actual code (Rule 9.1, 9.5).
   - Verify RPC contracts documented in `docs/API_CONTRACTS.md` (Rule 9.2).
   - Check design system documented in `docs/design-system/` (Rule 9.3).
   - Verify security architecture documented in `docs/security/` (Rule 9.4).
   - Confirm `AGENTS.md` matches the constitutional rules (Rule 9.6).
   - Flag any documentation drift (Rule 9.7).

## Validation Steps
- [ ] Architecture: All code in `apps/` or `packages/`, no direct `src/` imports, project references correct.
- [ ] RPC: Every operation has required metadata fields.
- [ ] Layer boundaries: No package imports an application.
- [ ] No circular dependencies between packages.
- [ ] Security audit sub-skill passes all checks.
- [ ] Performance audit sub-skill passes all checks.
- [ ] Design system audit sub-skill passes all checks.
- [ ] QA: All required test files exist and use correct runners/extensions.
- [ ] DevOps: Multi-stage builds, health endpoints, graceful shutdown, observability pipeline.
- [ ] Monorepo audit sub-skill passes all checks.
- [ ] Observability audit sub-skill passes all checks.
- [ ] Documentation: ADRs, API contracts, design system, security docs all match code.
- [ ] No P0 issues identified.

## Definition of Done
- All sub-skills executed and passed.
- All validation checks are green.
- All P0 issues resolved (zero tolerance).
- Audit report generated with findings per section.
- Documentation drift corrected in the same PR (Rule 9.7).

## Failure Conditions
- Any P0 issue is found — audit fails immediately.
- Sub-skill produces critical failures — audit fails.
- Documentation is more than one minor version behind code.
- Architecture rule violated (e.g., direct `src/` import, circular dependency).
- Missing required security controls.

## Required Reports
- `audit-enterprise-report.md` — full findings per section
- `audit-enterprise-p0.md` — list of P0 issues with severity, location, and fix recommendation
- `audit-enterprise-docs-drift.md` — documentation inconsistencies found
- `audit-enterprise-summary.md` — executive summary with pass/fail per category
