# Governance: Release

**Phase:** 9 — Governance

---

## Release Process

### Pre-release
1. All CI gates pass (30+ validations)
2. All tests pass (unit, integration, E2E)
3. Release evidence generated
4. Security review complete
5. Architecture review complete
6. Documentation freshness verified

### Release
1. Container build, scan (Trivy), sign (Cosign)
2. Push to registry (GHCR)
3. Deploy to staging
4. Staging smoke tests
5. Deploy to production
6. Production health checks
7. Production smoke tests

### Post-release
1. Monitor dashboards for 1 hour
2. Verify alerting
3. Mark release in changelog
4. Update AGENTS.md if needed

## Rollback Process

1. Trigger: Health check failure, alert threshold breach, user-reported regression
2. Decision: DevOps agent + human lead
3. Execute: `environment-rollback.yml` workflow
4. Verify: Health checks pass after rollback
5. Investigate: Root cause analysis within 24 hours

## Release Gates

| Gate | Owner | Pass/Fail |
|---|---|---|
| CI pipeline | DevOps | All green |
| Security scan | Security agent | No critical/high |
| Test suite | QA agent | 100% pass |
| Documentation | Architect agent | Current |
| Release evidence | All agents | Complete |
