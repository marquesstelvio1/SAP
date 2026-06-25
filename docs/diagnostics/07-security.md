# Diagnostic: Security

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Security Posture
**Date:** 2026-06-23

---

## Current State

Defense in depth: Security headers, CSRF, CORS, rate limiting, API key hashing, audit trail. 30+ validation gates in CI. Cosign for image signing. Trivy for vulnerability scanning.

## Problems

1. **CSRF exclusion on RPC endpoints** — `/rpc` and `/v1/rpc` are excluded from CSRF protection, making all authenticated RPC calls vulnerable to CSRF (CVSS 8.8).
2. **Stripe webhook verification** — Stripe webhook handler may not verify event signatures or retrieve events from Stripe API for verification.
3. **Billing webhook idempotency** — No idempotency on billing webhooks — duplicate charges possible.
4. **Session ID in telemetry** — Session IDs sent to OpenTelemetry without user consent — GDPR concern.
5. **No global RPC rate limiting** — Rate limiting may not cover all RPC operations — DoS amplification risk.
6. **CSP bypass via 'unsafe-eval'** — `script-src 'unsafe-eval'` weakens CSP protection.
7. **No subresource integrity** — No SRI on external scripts (if any).

## Technical Debt

- CSRF excluded paths defined in main.ts — easy to forget when adding new routes.
- Security headers configured in two places (NestJS middleware + Next.js headers()) — potential drift.

## Risks

- **Critical:** CSRF on authenticated RPC allows attackers to execute mutations on behalf of victims.
- **High:** Stripe webhook spoofing could trigger fake billing events.
- **High:** Duplicate billing charges erode customer trust.

## Impact

Active CSRF vulnerability across the entire authenticated API surface. Financial risk from billing webhook weaknesses.

## Priority

Critical

## Recommended Actions

1. Remove `/rpc` from CSRF exclusion; implement CSRF token passing in RPC client.
2. Verify Stripe webhook signatures with `stripe.webhooks.constructEvent()`.
3. Add idempotency key processing for Stripe webhooks.
4. Remove session IDs from telemetry or add explicit consent mechanism.
5. Implement per-operation rate limiting for all RPC mutations.
6. Replace `'unsafe-eval'` with more specific CSP directives.
7. Security audit of all webhook handlers.

## Estimated Effort

6-8 days

## Owner Agent

security
