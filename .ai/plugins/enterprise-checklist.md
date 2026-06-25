# Enterprise Checklist Plugin

**ID:** `enterprise-checklist`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 68
**Mandatory:** true
**Runs On:** pre-release
**Blocking:** true

## Mission

Validate that the application meets enterprise-grade standards across all dimensions: security, reliability, scalability, maintainability, and compliance.

## Enterprise Checklist

### 1. Security & Compliance

#### Security (critical)
- [ ] SEC-01: CSRF protection enabled on all RPC endpoints
- [ ] SEC-02: Automatic tenant scoping via Prisma middleware
- [ ] SEC-03: All secrets encrypted at rest
- [ ] SEC-04: Rate limiting configured globally + per operation
- [ ] SEC-05: Input validation on all endpoints
- [ ] SEC-06: Authorization check on every non-public operation
- [ ] SEC-07: Brute force protection on auth endpoints
- [ ] SEC-08: Security headers on all responses
- [ ] SEC-09: CORS restricted to trusted origins
- [ ] SEC-10: API keys hashed with SHA-256

#### Compliance
- [ ] CMP-01: GDPR data handling compliant
- [ ] CMP-02: Audit trail for all mutations
- [ ] CMP-03: Session IDs not in telemetry
- [ ] CMP-04: Data retention policies defined
- [ ] CMP-05: User data export capability

### 2. Reliability

- [ ] REL-01: All mutations are idempotent
- [ ] REL-02: Transactional outbox for event-driven operations
- [ ] REL-03: No hard deletes on domain data
- [ ] REL-04: Health checks configured
- [ ] REL-05: Graceful degradation on dependency failure
- [ ] REL-06: Retry logic for transient failures
- [ ] REL-07: Circuit breakers for external services
- [ ] REL-08: Feature flags for risky changes

### 3. Scalability

- [ ] SCL-01: Database indexes on all foreign keys
- [ ] SCL-02: Pagination on all list endpoints
- [ ] SCL-03: Connection pooling configured
- [ ] SCL-04: Caching strategy implemented
- [ ] SCL-05: Horizontal scaling supported
- [ ] SCL-06: Stateless application design

### 4. Maintainability

- [ ] MNT-01: Architecture documentation up-to-date
- [ ] MNT-02: API documentation up-to-date
- [ ] MNT-03: ADR for all architectural decisions
- [ ] MNT-04: Test coverage ≥ 80%
- [ ] MNT-05: No code duplication > 50 lines
- [ ] MNT-06: Clean dependency graph (no cycles)
- [ ] MNT-07: Consistent coding patterns
- [ ] MNT-08: Semantic versioning for packages

### 5. Observability

- [ ] OBS-01: OpenTelemetry tracing configured
- [ ] OBS-02: Structured logging
- [ ] OBS-03: Metrics dashboard available
- [ ] OBS-04: Alerting rules configured
- [ ] OBS-05: Distributed tracing across services
- [ ] OBS-06: Audit logging for security events

### 6. DevOps

- [ ] DVO-01: CI pipeline with all gates
- [ ] DVO-02: Automated testing in CI
- [ ] DVO-03: Docker image optimized (multi-stage)
- [ ] DVO-04: Kubernetes manifests valid
- [ ] DVO-05: Rollback plan documented
- [ ] DVO-06: Health checks in deployment
- [ ] DVO-07: Monitoring and alerting in staging

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| EC01 | critical | Missing CSRF protection |
| EC02 | critical | No tenant scoping |
| EC03 | critical | Missing authorization check |
| EC04 | error | No audit trail for mutations |
| EC05 | error | No idempotency for mutations |
| EC06 | error | No health checks |
| EC07 | warning | Missing pagination |
| EC08 | warning | Missing indexes |
| EC09 | warning | No architecture docs |
| EC10 | error | No observability |

## Output

Generate `enterprise-report.md` in `.ai/reports/`:

```markdown
# Enterprise Checklist Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- Total Checks: {n}
- Critical Fails: {n}
- Error Fails: {n}
- Warnings: {n}
- Pass: {n}

## Critical Failures (BLOCKING)
1. {check-id}: {description}

## Details
### Security & Compliance: {pass/fail}
{detail}

### Reliability: {pass/fail}
{detail}

### Scalability: {pass/fail}
{detail}

### Maintainability: {pass/fail}
{detail}

### Observability: {pass/fail}
{detail}

### DevOps: {pass/fail}
{detail}

## Recommendations
1. {recommendation}
```

## Blocking Rules

Critical failures (EC01, EC02, EC03) block release.

## Success Criteria

- No critical failures
- All enterprise security checks pass
- Audit trail implemented
- Idempotency implemented
- Observability configured
