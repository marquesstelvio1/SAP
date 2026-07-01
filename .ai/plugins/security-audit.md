# Security Audit Plugin

**ID:** `security-audit`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 60
**Mandatory:** true
**Runs On:** pre-release
**Blocking:** true

## Mission

Audit security posture of the entire application. Validate authentication, authorization, data protection, and compliance with security standards.

## Audit Checklist

### 1. Better Auth Security

- [ ] Session max age: 7 days (configurable)
- [ ] Session sliding window: 24 hours
- [ ] Password policy enforced (12-128 chars)
- [ ] Email verification required for full access
- [ ] 2FA (TOTP) available
- [ ] OAuth tokens encrypted at rest
- [ ] API keys stored as SHA-256 hash
- [ ] Rate limiting configured for auth endpoints
- [ ] Brute force protection enabled
- [ ] Account lockout after failed attempts

### 2. Authorization

- [ ] `evaluateAuthorization()` called on every non-public operation
- [ ] RPC operation metadata declares auth mode
- [ ] Public operations have no permissions
- [ ] Permissions assigned via org-scoped roles
- [ ] RBAC enforced on all mutations
- [ ] No hardcoded user IDs or roles
- [ ] Organization scoping on all queries

### 3. Secrets Management

- [ ] No secrets in code
- [ ] No secrets in env files committed
- [ ] Environment variables use External Secrets Operator
- [ ] Service tokens rotated regularly
- [ ] No plaintext API keys

### 4. API Security

- [ ] Security headers on all responses:
  - [ ] HSTS (Strict-Transport-Security)
  - [ ] CSP (Content-Security-Policy)
  - [ ] X-Frame-Options (DENY)
  - [ ] X-Content-Type-Options (nosniff)
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy
- [ ] CSRF via double-submit cookie pattern
- [ ] CORS restricted to trusted origins
- [ ] Rate limiting: global + per-operation
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma parameterized queries)

### 5. OWASP Top 10 Compliance

- [ ] A01: Broken Access Control — RBAC + org scoping
- [ ] A02: Cryptographic Failures — TLS 1.3, encrypted secrets
- [ ] A03: Injection — Prisma prevents SQL injection
- [ ] A04: Insecure Design — Security review process
- [ ] A05: Security Misconfiguration — Hardened defaults
- [ ] A06: Vulnerable Components — Dependency scanning
- [ ] A07: Auth Failures — Better Auth + rate limiting
- [ ] A08: Data Integrity Failures — Idempotency + outbox
- [ ] A09: Logging Failures — Audit trail
- [ ] A10: SSRF — Outbound request restrictions

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| SEC01 | critical | Secret in code |
| SEC02 | critical | Missing authorization check |
| SEC03 | critical | No org scoping on query |
| SEC04 | error | Missing security header |
| SEC05 | error | No CSRF protection |
| SEC06 | error | No rate limiting |
| SEC07 | warning | Weak password policy |
| SEC08 | warning | Missing 2FA option |
| SEC09 | error | Unencrypted sensitive data |
| SEC10 | critical | No input validation |

## Output

Generate `security-report.md` in `.ai/reports/`:

```markdown
# Security Audit Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- Critical: {n}
- High: {n}
- Medium: {n}
- Low: {n}

## Critical Issues
1. {rule-id} — {description} — **BLOCKING**

## Findings
{findings}

## Recommendations
1. {recommendation}
```

## Blocking Rules

Critical issues (SEC01, SEC02, SEC03, SEC10) block release.

## Success Criteria

- No critical security issues
- Authorization enforced on all operations
- Security headers present
- CSRF protection enabled
- Secrets properly managed
