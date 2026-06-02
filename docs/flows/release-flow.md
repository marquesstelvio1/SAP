# Flow: Release And Stabilization

## Preconditions

- merged PRs are linked to tasks
- changelog is updated
- documentation is updated
- smoke, regression, and domain-critical tests are green

## Release flow

1. Build release candidate.
2. Run release governance checks.
3. Publish changelog and deployment notes.
4. Promote to target environment.
5. Monitor health, error rate, latency, and business metrics.
6. Create stabilization tasks for any regression or drift.

## Stabilization SLA

- critical regressions: immediate rollback or hotfix
- high regressions: same-day mitigation
- medium regressions: next sprint or patch window

