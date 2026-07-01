# Diagnostic: CI/CD

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** CI/CD Pipeline
**Date:** 2026-06-23

---

## Current State

9 GitHub Actions workflows. 30+ validation gates in platform-ci. Cosign for image signing. Trivy for vulnerability scanning. Release evidence generation. Multi-stage Docker builds.

## Problems

1. **CI pipeline duration** — 30+ validation gates run sequentially; full CI may take 30+ minutes.
2. **No test stage staging** — Tests run after all validation gates; failing tests waste gate execution time.
3. **No dependency caching optimization** — pnpm cache may not be optimized for CI speed.
4. **No PR preview environments** — No ephemeral environments for manual testing.
5. **No rollback testing** — Rollback scripts exist but are not tested in CI.
6. **Secrets management in CI** — Some env vars are hardcoded in workflow files rather than GitHub Secrets.

## Technical Debt

- Workflow files duplicate environment variables across multiple workflows.
- Validation scripts (60+) are all Node.js .mjs files — no parallel execution.

## Risks

- **Medium:** Long CI times discourage developers from waiting for results.
- **Medium:** Hardcoded CI secrets could leak in PRs from forks.

## Impact

Developer productivity suffers from long CI feedback loops. Fork-based contributions risk secret exposure.

## Priority

Medium

## Recommended Actions

1. Parallelize CI gates where possible (separate jobs for infra, security, business logic).
2. Move tests earlier in the pipeline (immediately after build).
3. Optimize pnpm cache configuration for CI.
4. Implement PR preview environments (temporary deployments per PR).
5. Add rollback script to CI for automated rollback testing.
6. Move all secrets to GitHub Secrets; audit workflow files for plaintext values.

## Estimated Effort

4-6 days

## Owner Agent

devops
