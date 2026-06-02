# Global Business Rules

These rules are mandatory before domain-specific business rules are added.

1. No API contract change without explicit versioning or migration strategy.
2. No auth or permission change without RBAC impact analysis.
3. No breaking change without a rollback path.
4. No new UI pattern outside the approved design system.
5. No production workflow without logs, error states, and metrics.
6. No data mutation without validation and auditability.
7. No release without updated docs, tests, and changelog.
8. No autonomous AI execution on critical flows without human approval.

## Required domain additions

Each product domain must later document:

- domain entities
- critical user journeys
- regulatory constraints
- billing constraints
- data retention rules
- incident severity rules

