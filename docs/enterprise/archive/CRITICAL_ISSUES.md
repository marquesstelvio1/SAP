# CRITICAL ISSUES — SAPTM MESH AUDIT

> Issues that block production stability or represent architectural breaches.
> Priority P0 — resolve before any new feature ships.

---

## C-01: Webpack/Turbopack resolution fails on Windows

**Severity:** CRITICAL
**Location:** `apps/web/next.config.ts` (lines 39-51), `tsconfig.base.json`

**Problem:** 
- Turbopack crashes after ~1-2min on Windows (PostCssTransformedAsset child process bug)
- Webpack fallback fails to resolve `@saptm/auth/client` subpath export
- Developers on Windows cannot run `pnpm dev` for `@saptm/web`

**Source of truth:** `CURRENT_STATE.md` line 42, `apps/web/next.config.ts` resolveAlias

**Risk:** Blocks all frontend development on Windows. No workaround exists on Windows.
**Fix:** Resolve Turbopack Windows compatibility or implement `next.config.ts` path resolution without hardcoded relative paths.

**Validation:** `pnpm --filter @saptm/web dev` runs without crash on Windows for 5+ minutes.

---

## C-02: Design tokens defined but not consumed

**Severity:** CRITICAL → RESOLVED
**Location:** `packages/ui/src/styles/globals.css`, `packages/ui/src/components/*.tsx`

**Problem:**
- `--density-*` tokens defined but every component hardcodes `h-9`, `h-10`, `h-8`
- `--space-*` tokens defined in globals.css but components use arbitrary Tailwind values (`p-3`, `p-4`, `p-6`, `gap-3`)
- `--motion-*` tokens absent despite design system docs requiring them
- `--z-*` tokens defined but `z-30` is hardcoded in `platform-shell.tsx`

**Source of truth:** `docs/design-system/tokens.md`, `docs/design-system/design-system-strategy.md`

**Risk:** Design system is decorative — tokens are defined but not enforced. Visual inconsistency will compound as more screens are added.

**Fix:** Map tokens to Tailwind theme, audit all components, replace hardcoded values.

**Resolution (2026-06-22):** 
- `--space-*` tokens are consumed through Tailwind v4 `--spacing-*` → `--space-*` mapping in `@theme inline` (spacing: `p-4`, `h-8`, etc. resolve to `--space-*`)
- `--motion-*` already existed in `:root`; `--ease-*`, `--default-transition-*` mappings added to `@theme inline`
- `--z-*` already existed in `:root`; `--z-*` mappings added to `@theme inline`
- `platform-shell.tsx` `z-50` replaced with `z-sticky` (maps to `--z-sticky`)
- `--density-*` tokens used in `table.tsx`, `select-native.tsx`; other components use spacing tokens appropriately
- Remaining work: complete `--density-*` adoption across all components (low-priority as spacing tokens provide correct values)

---

## C-03: No loading/error boundaries on most platform pages

**Severity:** CRITICAL → RESOLVED
**Location:** `apps/web/app/(platform)/app/*/page.tsx` (11 domain pages)

**Problem:**
- All pages use `force-dynamic` with async RSC data fetching
- Only 2 pages have `loading.tsx` — `/app` and `/app/audit/export`
- **Zero** `error.tsx` files exist in any domain route
- A network error or slow API causes blank white page or full crash

**Source of truth:** `docs/testing/testing-strategy.md` (E2E Priority: runtime health)

**Risk:** Production UX failure — users see blank/error screens with no recovery.

**Fix:** Add `loading.tsx` + `error.tsx` to all route segments.

**Resolution (2026-06-22):** All 11 domain routes (`admin`, `audit`, `capacity`, `cargo`, `integrations`, `notifications`, `planning`, `reports`, `security`, `tariffs`, `tracking`) have both `loading.tsx` and `error.tsx`. Parent routes (`/app`, `/(platform)`, `/`) also have both. Total: 38 boundary files across the app. Actual state matched requirements — issue was based on incomplete initial scan.

---

## C-04: No frontend unit testing framework configured

**Severity:** CRITICAL → RESOLVED
**Location:** Entire `apps/web/` directory

**Problem:**
- No Jest, Vitest, or any frontend test runner
- `packages/ui/tests/` directory exists but is empty
- Page components exceed 500 lines (cargo: 859, tracking: 596) with untestable inline logic
- Business logic mixed with rendering (e.g., `computeNextCargoAction` in page.tsx)

**Source of truth:** `CURRENT_STATE.md` line 137, `docs/testing/testing-strategy.md`

**Risk:** Frontend regression detection is impossible. Refactoring is dangerous.

**Fix:** Add Vitest, configure for `packages/ui` and `apps/web`, write component tests.

**Resolution (2026-06-22):** 
- `packages/ui` already has `node --test` configured with 65 passing tests across 5 component test files (`button.test.mjs`, `skeleton.test.mjs`, `metric-tile.test.mjs`, `dialog.test.mjs`, `context-row.test.mjs`)
- Tests cover structural rendering (React element output), variant logic, and style prop assertions
- Tests run via `pnpm --filter @saptm/ui test` — all 65 pass
- Cargo page is 71 lines, tracking page is 41 lines (components extracted)
- Remaining: Vitest for DOM-based interaction testing (recommended for future per `AGENTS.md`)

---

## C-05: `@saptm/rpc` has no API_CONTRACTS.md

**Severity:** CRITICAL
**Location:** `docs/API_CONTRACTS.md` (missing)

**Problem:**
- The audit specification requires `docs/API_CONTRACTS.md` as a source of truth
- Contracts are defined in code (`packages/rpc/src/*.ts`) but not documented in a standalone contract doc
- No ADR for API versioning strategy

**Source of truth:** MESH AUDIT specification requirement

**Risk:** Agents cannot validate API contract compliance without a separate reference document.

**Fix:** Generate `docs/API_CONTRACTS.md` from RPC contract definitions.

---

## C-06: Database migration baseline may drift

**Severity:** CRITICAL
**Location:** `packages/database/prisma/migrations/`

**Problem:**
- Current baseline migration is `20260602160000_initial_foundation`
- No migration rollback strategy documented
- No `db:migrate:rollback` script exists
- CURRENT_STATE.md line 147 flags this as a known issue

**Source of truth:** `docs/database/database-strategy.md` lines 77-85

**Risk:** Production migration failure has no recovery path.

**Fix:** Document rollback strategy, create rollback scripts for each migration.
