# Roadmap: Security

**Phase:** 8 — Roadmap Engine

---

## P0 — Immediate (0-30 days)

1. **Fix CSRF on RPC endpoints** — Remove `/rpc` and `/v1/rpc` from CSRF exclusion. Implement CSRF token passing in RPC client. (1 day)
2. **Verify Stripe webhook signatures** — Add `stripe.webhooks.constructEvent()` to webhook handler. (0.5 day)
3. **Add billing webhook idempotency** — Implement idempotency key processing for Stripe events. (0.5 day)
4. **Encrypt OAuth tokens** — Implement AES-256 encryption for OAuth access/refresh tokens. (0.5 day)
5. **Remove session IDs from telemetry** — Strip session IDs from OpenTelemetry context or add consent mechanism. (0.25 day)

## P1 — Short-term (30-60 days)

1. **Add per-operation rate limiting** — Implement rate limiting per RPC operation (not just global). (0.5 day)
2. **Add brute force protection** — Account lockout after 5 failed attempts in 15 minutes. (1 day)
3. **Add session revocation audit trail** — Create AuditRecord on session revocation events. (0.5 day)
4. **Improve CSP** — Replace `'unsafe-eval'` with more specific directives. (0.5 day)
5. **Add tenant-level rate limiting** — Prevent one tenant from consuming all capacity. (2-3 days)

## P2 — Medium-term (60-90 days)

1. **Subresource Integrity** — Add SRI for external scripts (if any). (0.5 day)
2. **Security audit automation** — Automate security audit in CI pipeline. (2 days)
3. **Penetration testing** — Schedule and act on pentest findings. (5 days)

## Epics

| Epic | Tasks | Effort |
|---|---|---|
| CSRF Hardening | Fix exclusion, update client, test E2E | 1 day |
| Webhook Security | Stripe verification, idempotency, audit | 1.5 days |
| Auth Hardening | OAuth encryption, brute force, session audit | 2.5 days |
| Rate Limiting | Per-operation, per-tenant, auth endpoints | 3.5 days |
