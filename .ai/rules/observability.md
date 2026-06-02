# Observability Rules

1. Every critical operation must propagate `correlationId`.
2. Every API operation must emit structured logs and trace spans.
3. Every critical mutation must emit a metric and audit record.
4. Every external integration must log source, external id, status, and retry state.
5. Alerts must map to a runbook and severity.
6. Observability failures on critical paths must be treated as release blockers.

