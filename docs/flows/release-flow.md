# Flow: Release

**Phase:** 10 — Execution Pipeline

---

## Purpose
Release verified code to production.

## Inputs
- Approved and merged PRs
- Release evidence

## Outputs
- Deployed release
- Release notes
- Changelog update

## Steps
1. Verify all CI gates pass
2. Generate release evidence
3. Build container images
4. Scan containers (Trivy)
5. Sign containers (Cosign)
6. Push to registry
7. Deploy to staging
8. Run staging smoke tests
9. Deploy to production
10. Run production health checks
11. Run production smoke tests
12. Monitor for 1 hour
13. Update changelog
14. Tag release in git

## Checkpoints
- [ ] CI gates pass
- [ ] Release evidence complete
- [ ] Container scan clean
- [ ] Staging smoke tests pass
- [ ] Production health checks pass
- [ ] Dashboards green
- [ ] Alerts silent

## Quality Gates
- No critical/high vulnerability in scan
- All tests pass
- Health checks respond 200
- Rollback plan defined
- Release notes published
