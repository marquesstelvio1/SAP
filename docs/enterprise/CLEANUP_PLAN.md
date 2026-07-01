# CLEANUP PLAN — SAPTM MESH AUDIT

> Structured reconciliation plan to align codebase with documented architecture.
> Every entry maps to a file path.

---

## REMOVE

| # | Item | Path | Reason |
|---|---|---|---|
| R-01 | `pnpm-lock.yaml` from git tracking (keep generated) | `pnpm-lock.yaml` | Should not be in gitignore if it is — verify it's tracked |
| R-02 | Unused `cmdk` dependency from root | `package.json` line 87 | Already in radix-ui catalog, `cmdk@1.1.1` is redundant |
| R-03 | Empty `packages/ui/tests/` directory | `packages/ui/tests/` | No tests exist, directory is misleading |
| R-04 | Debug log files | `debug.log` | Not production-safe |
| R-05 | `diagnóstico.md` root file | `diagnóstico.md` | Diagnostic artifact, not project documentation |
| R-06 | `diagnosticos/` directory | `diagnosticos/` | Diagnostic artifacts, not project documentation |
| R-07 | Duplicate enterprise audit reports | `ENTERPRISE-AUDIT-REPORT.md`, `ENTERPRISE_CERTIFICATION_REPORT.md`, `FINAL-ENTERPRISE-REPORT.md` | Consolidate into `docs/enterprise/` |
| R-08 | Duplicate PRODUCT-AUDIT.md | `PRODUCT-AUDIT.md` | Consolidate into `docs/enterprise/` |
| R-09 | Duplicate ENTERPRISE-REMEDIATION-PLAN.md | `ENTERPRISE-REMEDIATION-PLAN.md` | Consolidate into `docs/enterprise/` |
| R-10 | Duplicate EXECUTION-LOG.md | `EXECUTION-LOG.md` | Consolidate into `docs/enterprise/` |
| R-11 | DESIGN-SYSTEM-PLAN.md | `DESIGN-SYSTEM-PLAN.md` | Duplicate of `docs/design-system/` |
| R-12 | `diagnosticos/` directory | Root level | Diagnostic artifacts belong in `/audit/` |
| R-13 | Inline `div` avatar in shell | `apps/web/components/shell/platform-shell.tsx` | Replace with `@saptm/ui Avatar` component |
| R-14 | Native checkbox in sign-in | `apps/web/app/sign-in/sign-in-form.tsx` | Replace with `@saptm/ui Checkbox` |
| R-15 | CSS group-hover tooltip in cargo | `apps/web/app/(platform)/app/cargo/page.tsx` | Replace with `@saptm/ui Tooltip` |

---

## FIX

| # | Item | Path | Correction |
|---|---|---|---|
| F-01 | Loading boundaries missing | `apps/web/app/(platform)/app/*/` (11 dirs) | Add `loading.tsx` to each domain route |
| F-02 | Error boundaries missing | `apps/web/app/(platform)/app/*/` (11 dirs) | Add `error.tsx` to each domain route |
| F-03 | Density tokens unused | `packages/ui/src/components/*.tsx` | Replace `h-9`, `h-10`, `h-8` with density token references |
| F-04 | Motion tokens absent | `packages/ui/src/styles/globals.css` | Add `--motion-*` token family |
| F-05 | Hardcoded z-index | `apps/web/components/shell/platform-shell.tsx` | Replace `z-30` with `var(--z-sticky)` |
| F-06 | Page files >500 lines | `apps/web/app/(platform)/app/cargo/page.tsx` (859) | Extract section components |
| F-07 | Page files >500 lines | `apps/web/app/(platform)/app/tracking/page.tsx` (596) | Extract section components |
| F-08 | API versioning absent | `apps/api/src/rpc/rpc-http.middleware.ts` | Add `/v1/rpc` prefix |
| F-09 | Outbox not abstracted | `apps/api/src/*/` | Create `EventBus` interface, `OutboxEventBus` impl |
| F-10 | Prisma not abstracted | `apps/api/src/*/domain/` | Create repository interfaces |
| F-11 | ✅ RESOLVED — Organizations module missing | `apps/api/src/organizations/` | `OrganizationsModule` exists with repository pattern and dedicated service |
| F-12 | ✅ RESOLVED — Documents module missing | `apps/api/src/documents/` | `DocumentsModule` exists, extracted from `cargo/` |
| F-13 | TanStack Query unused | `apps/web/` | Create query provider, use for mutations |
| F-14 | Zod v4 compatibility | `packages/config/src/index.ts` | ✅ Fixed — Zod v4.4.3 already in use; `received` → `input` at line 65 |

---

## ALIGN

| # | Item | Path | Alignment |
|---|---|---|---|
| A-01 | Design system token consumption | `packages/ui/src/components/*.tsx` | All components must use `--space-*`, `--density-*`, `--motion-*` tokens |
| A-02 | RPC contract docs | `docs/API_CONTRACTS.md` (new) | Generate from `packages/rpc/src/*.ts` |
| A-03 | Database model alignment | `docs/architecture/domain-map.md`, `docs/database/database-strategy.md`, `docs/architecture/repository-analysis.md`, `docs/architecture/stack-analysis.md`, `docs/enterprise/discovery.md`, `docs/FINAL_SUMMARY.md` | ✅ Fixed — docs updated to match actual Prisma schema (41 models, 33 enums). Phantom models marked as "planned". See `docs/database/schema-alignment-report.md` for audit results |
| A-04 | Auth permissions alignment | `packages/auth/src/permissions.ts` vs `packages/rpc/src/*.ts` | Verify all RPC metadata permissions exist in permission catalog |
| A-05 | ✅ RESOLVED — NestJS modules vs docs | `apps/api/src/` | Updated `technical-architecture.md`, `TARGET_ARCHITECTURE.md`, `STRUCTURAL_GAPS.md`, `layer-boundaries.md`, `CLEANUP_PLAN.md`, `domain-map.md`, `EXECUTION_TASKS.md` to match actual 24 modules |
| A-06 | CSP with Tailwind v4 | `apps/web/next.config.ts` | ✅ Fixed — CSP added to `webSecurityHeaders` with `style-src 'unsafe-inline'` for Tailwind v4. Nonce-based upgrade path in `apps/web/src/proxy.ts`. See `docs/security/http-security-headers.md` |
| A-07 | PowerShell → Node.js scripts | `scripts/*.ps1` | ✅ Fixed — 10 `.mjs` equivalents created alongside originals. See `scripts/invoke-ai-workflow.mjs`, `scripts/new-ai-*.mjs`, `scripts/test-aios.mjs` |
| A-08 | Enterprise reports | Root level → `docs/enterprise/` | ✅ Fixed — 6 redundant status reports consolidated into `SYSTEM_HEALTH_SCORE.md` and archived |
