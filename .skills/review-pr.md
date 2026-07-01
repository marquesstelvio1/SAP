# review-pr.md

## Purpose
Review pull requests in the SAPTM monorepo before merge to ensure compliance with AGENTS.md constitution, architectural rules, security requirements, testing standards, and design system conventions.

## Inputs
- PR diff (`git diff main...HEAD` or GitHub PR diff URL)
- PR description and commit messages
- Affected files list
- Changeset files (if versioned packages affected)
- CI output (lint, typecheck, test, build gates)

## Execution Steps

1. **Inspect the diff**
   ```bash
   git fetch origin main
   git diff origin/main...HEAD --stat
   git diff origin/main...HEAD
   ```
   - Understand scope: which apps/packages are touched
   - Check diff size: PRs should be focused (single concern per PR)
   - Identify new files, deleted files, and modifications

2. **Check AGENTS.md compliance**
   Verify against all 10 Articles:
   - **ARTICLE I (Architecture)**: Does code reside in `apps/` or `packages/`? Any direct `src/` imports between packages? Package boundaries respected?
   - **ARTICLE II (Security)**: Auth declared on all new routes? Permission checks use `@saptm/auth/policy`? No secrets in code?
   - **ARTICLE III (Quality)**: Tests added/updated? `loading.tsx` and `error.tsx` for new pages? Test format `.test.mjs`?
   - **ARTICLE IV (Product)**: Loading, error, empty states handled? Forms have inline validation? Toast feedback?
   - **ARTICLE V (Design System)**: Design tokens used? No hardcoded values? Dark mode handled?
   - **ARTICLE VI (Testing)**: Test patterns match requirements? Deterministic tests?
   - **ARTICLE VII (Infra)**: Health checks added for new services? Graceful shutdown?
   - **ARTICLE VIII (Monorepo)**: `turbo.json` pipelines updated if needed? Changesets added?
   - **ARTICLE IX (Docs)**: ADR needed? API contracts updated? Docs reflect code?
   - **ARTICLE X (Agent Collaboration)**: Proper sign-offs obtained?

3. **Verify testing requirements**
   - New API modules: integration tests in `apps/api/tests/`?
   - New RPC contracts: unit tests in `packages/rpc/tests/`?
   - New UI components: structural tests in `packages/ui/src/components/__tests__/`?
   - New page routes: `loading.tsx` and `error.tsx` present?
   - Existing tests still pass: `turbo run test`

4. **Check type safety**
   - No `any` types without ADR justification
   - No `@ts-ignore` or `@ts-expect-error`
   - RPC contracts use Zod schemas properly
   - No unsafe type assertions (`as T`) without validation

5. **Review security implications**
   - New routes: auth mode declared (`public`, `authenticated`, `service`)?
   - Permission checks: correct evaluation mode (`ALL` vs `ANY`)?
   - Tenant isolation: all queries scoped to `organizationId`?
   - Input validation: Zod schemas on all public-facing inputs?
   - No sensitive data exposed in responses or logs
   - **Require Security agent sign-off** for:
     - New auth/permission logic
     - Changes to session/cookie handling
     - External service integrations
     - Data exposure changes

6. **Verify design token usage**
   - No hardcoded colors, spacing, shadows, or typography values
   - Design tokens from `@saptm/ui/tokens` used throughout
   - Semantic tokens (`--primary`, `--muted`, etc.) over raw values
   - Density tokens respected
   - Dark mode using `.dark` class via `next-themes`
   - **Require Design System agent sign-off** for UI changes

7. **Check documentation updates**
   - New/modified RPC operations: update `docs/API_CONTRACTS.md`
   - Architecture decisions: create/update ADR in `docs/adr/`
   - Design system changes: update `docs/design-system/`
   - Security changes: update `docs/security/`
   - Docs reflect actual code — no aspirational content

8. **Run validation gates**
   ```bash
   turbo run lint typecheck test build 2>&1 | tee .pr-gates.txt
   ```
   - All four gates must pass
   - Review any warnings (CI should treat warnings as errors)

9. **Request sign-offs**
   Based on changes detected in steps 2–7:
   - **Architect agent**: structural changes, new packages, new apps, dependency changes
   - **Security agent**: auth/permission changes, data handling, external integrations
   - **QA agent**: feature implementations, bug fixes, test changes
   - **Design System agent**: UI component changes, token changes, styling

## Validation Steps
- [ ] `turbo run lint` passes
- [ ] `turbo run typecheck` passes
- [ ] `turbo run test` passes
- [ ] `turbo run build` passes
- [ ] AGENTS.md compliance verified (all 10 Articles)
- [ ] Testing requirements met (new tests for new code)
- [ ] No security violations found
- [ ] Design tokens used correctly
- [ ] Documentation updated appropriately
- [ ] Required agent sign-offs obtained

## Definition Of Done
- All validation gates pass
- All required agent sign-offs recorded in PR comments
- No unresolved review comments
- Documentation updated to reflect changes
- PR is mergeable (no conflicts, CI green)

## Failure Conditions
- Any validation gate fails
- AGENTS.md violation found (blocking — must fix before merge)
- Missing required test coverage (>20% uncovered new code)
- Security vulnerability introduced (blocking — must fix before merge)
- Missing required agent sign-off
- Documentation not updated for user-facing changes
- PR scope is too broad (multiple unrelated changes)

## Required Reports
- `.pr-gates.txt` — full validation gate output
- `review-summary.md` — per-file review findings with severity (blocking/warning/info)
- `compliance-checklist.md` — AGENTS.md article-by-article compliance status
- `sign-off-log.md` — which agents signed off and on which aspects
