# Diagnostic: Observability

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Observability & Monitoring
**Date:** 2026-06-23

---

## Current State

OpenTelemetry SDK integrated. Trace context propagated across services. Prometheus + Grafana + Alertmananger configured in Docker Compose. Sentry for error tracking. PostHog for analytics.

## Problems

1. **No production monitoring stack deployed** — OTEL/Prometheus/Grafana run locally but may not be deployed in production.
2. **No structured logging** — `LOG_LEVEL=info` is configured but log format/structure is undefined.
3. **No SLOs/SLIs defined** — No service level objectives for API availability, latency, error rate.
4. **No alerting rules** — Alertmanager is configured but no alerting rules defined for production.
5. **Distributed tracing incomplete** — Not all services may be instrumented for trace propagation.
6. **No business metrics** — No domain-specific metrics (cargos registered, exceptions created, etc.).

## Technical Debt

- Observability module exists but integration with domain services may be inconsistent.
- Sentry configuration splits across web (sentry.client/edge/server.config.ts) and API (via module).

## Risks

- **High:** Blind to production health — incidents discovered by users first.
- **Medium:** No SLOs means no performance targets to measure against.

## Impact

Cannot detect or diagnose production issues proactively. Incident response is reactive.

## Priority

High

## Recommended Actions

1. Deploy OTEL Collector, Prometheus, and Grafana to production Kubernetes.
2. Define structured JSON logging format with correlation IDs.
3. Define SLOs: API availability (99.9%), p95 latency (<500ms), error rate (<0.1%).
4. Define and deploy alerting rules for SLI breaches.
5. Complete distributed tracing instrumentation across all services.
6. Add business metrics (domain events, mutation counts, user activity).

## Estimated Effort

7-10 days

## Owner Agent

observability
