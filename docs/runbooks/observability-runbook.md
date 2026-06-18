# Observability Runbook

## Purpose

This runbook defines how operators validate metrics, dashboards, and alerts before and after a SAPTM rollout.

## Systems

| System | Runtime Path |
| --- | --- |
| API metrics | `GET /metrics` on `saptm-api` |
| OTel Collector | `saptm-otel-collector.saptm-observability.svc.cluster.local:4317/4318` |
| Prometheus | `saptm-prometheus.saptm-observability.svc.cluster.local:9090` |
| Alertmanager | `saptm-alertmanager.saptm-observability.svc.cluster.local:9093` |
| Grafana | `saptm-grafana.saptm-observability.svc.cluster.local:3000` |

## Deployment Checks

1. Confirm the namespace exists: `kubectl get namespace saptm-observability`.
2. Confirm `saptm-observability-secrets` exists with `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD`.
3. Confirm `saptm-alertmanager-config` exists with `alertmanager.yml` rendered from `INCIDENT_WEBHOOK_URL`.
4. Apply the stack: `kubectl apply -k deploy/kubernetes/observability`.
5. Wait for rollouts for Collector, Alertmanager, Prometheus, and Grafana.
6. Confirm Prometheus target `saptm-api-kubernetes` is up.
7. Confirm dashboard `SAPTM Runtime` loads in Grafana.
8. Confirm Alertmanager can route a test alert to the incident receiver.

## Alert Triage

| Alert | First Check | Escalation |
| --- | --- | --- |
| `SAPTMApiTargetDown` | Check `/metrics`, API pods, and Service labels | DevOps + Backend |
| `SAPTMApiHighErrorRate` | Inspect API logs by `correlationId` and latest deployment | Backend |
| `SAPTMApiHighLatencyP95` | Inspect route latency, database readiness, and pod resources | Backend + DevOps |
| `SAPTMAuthorizationDenialSpike` | Check recent RBAC changes and denied audit records | Auth + Security |

## Production Rules

- Metrics labels must avoid raw IDs, secrets, tokens, payloads, and unbounded cardinality.
- Alerts must reference a runbook and a severity.
- Dashboard panels must use stable Prometheus metric names.
- Grafana credentials must be injected by secret manager or external-secrets workflow.
- Alertmanager receiver endpoints must be rendered from `INCIDENT_WEBHOOK_URL` through `saptm-alertmanager-config`.
- Alertmanager test route evidence is required before production enablement.

## Recovery

If the observability stack fails during rollout:

1. Do not roll back the application solely because dashboards are unavailable.
2. Validate API health directly through `/health/live`, `/health/ready`, and `/metrics`.
3. Roll back the observability manifest only if it blocks app namespace networking or cluster stability.
4. Open a diagnostic entry and link the failed workflow run.
