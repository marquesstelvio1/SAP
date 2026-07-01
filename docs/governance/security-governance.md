# Governance: Security

**Phase:** 9 — Governance

---

## Review Requirements

### Mandatory Security Review
- All auth/permission changes
- All RPC metadata changes (auth mode, permissions)
- All CSRF/CORS configuration changes
- All webhook/API key changes
- All authentication flow changes
- All new external integrations

### Security Review Checklist
- [ ] No hardcoded secrets
- [ ] CSRF protection active on all authenticated endpoints
- [ ] CORS restricted to trusted origins
- [ ] Security headers present
- [ ] Auth mode declared on all RPC operations
- [ ] Permissions assigned correctly (ALL/ANY mode)
- [ ] Organization scoping enforced
- [ ] Audit trail for mutations
- [ ] Idempotency for mutations
- [ ] No plaintext sensitive data

## Vulnerability Management

| Severity | Response Time | Action |
|---|---|---|
| Critical | 24 hours | Immediate fix, deployment |
| High | 72 hours | Fix within release |
| Medium | 2 weeks | Schedule in next sprint |
| Low | Next release | Backlog |

## Security Incident Response

1. **Detect** — Alert from monitoring, user report, or audit
2. **Triage** — Security agent assesses severity
3. **Contain** — Isolate affected components
4. **Fix** — Implement remediation
5. **Verify** — Confirm fix, test
6. **Review** — Post-mortem within 5 days
7. **Document** — Update security docs
