# SLIs / SLOs — Critical Paths

**Version:** 2.0.0
**Last Updated:** 2026-07-02
**Owner:** DevOps / Observability Team
**Status:** Approved

---

## Table of Contents

1. [Scope & Terminology](#1-scope--terminology)
2. [SLI Definitions](#2-sli-definitions)
3. [SLOs & Error Budgets](#3-slos--error-budgets)
4. [Measurement Implementation](#4-measurement-implementation)
5. [Error Budget Policy](#5-error-budget-policy)
6. [Burn Rate Alerting](#6-burn-rate-alerting)
7. [Appendix: Prometheus Recording Rules](#7-appendix-prometheus-recording-rules)
8. [Appendix: Grafana Dashboard Panels](#8-appendix-grafana-dashboard-panels)

---

## 1. Scope & Terminology

This document defines **Service Level Indicators (SLIs)** and **Service Level Objectives (SLOs)** for the three most critical data paths in the SAPTM logistics platform:

| Critical Path | Description |
|---|---|
| **API Gateway (oRPC)** | All client-facing oRPC requests via the NestJS API |
| **Tracking Event Ingestion** | Recording and processing operational tracking events |
| **Outbox Event Delivery** | Publishing domain events via the transactional outbox pattern |

### Definitions

| Term | Definition |
|---|---|
| **SLI** | A quantitative measure of a specific aspect of service quality. Expressed as a ratio of good events to total events (0%–100%). |
| **SLO** | A target value for an SLI over a compliance window. |
| **Error Budget** | The maximum allowable proportion of bad events: `100% − SLO target`. |
| **Compliance Window** | The rolling time period over which SLO attainment is evaluated. |
| **Burn Rate** | The rate at which the error budget is consumed relative to the budget available. |

---

## 2. SLI Definitions

### 2.1 API Request Latency (p95)

| Field | Value |
|---|---|
| **SLI** | Proportion of API requests completed in < 500 ms (p95) |
| **Why** | End-user experience degradation is the first sign of backend pressure. Sub-second responses are expected for operational logistics UIs. |
| **Good Event** | An HTTP request whose total duration (from NestJS interceptor `startedAt` to response `endedAt`) is ≤ 500 ms, excluding liveness/readiness probes. |
| **Bad Event** | A request whose duration exceeds 500 ms, or that errors before completing. |
| **Metric Source** | `http.server.duration_ms` — histogram from `ObservabilityService.recordHttpRequest()` |
| **Labels** | `http.method`, `http.route`, `http.status_class`, `http.status_code` |
| **Excluded** | `/health/live`, `/health/ready`, `/metrics` |
| **Instrumentation File** | `apps/api/src/observability/observability.service.ts` |

### 2.2 API Availability (Success Rate)

| Field | Value |
|---|---|
| **SLI** | Proportion of API requests that complete successfully (non-5xx) |
| **Why** | Availability is the most direct measure of platform health. Any 5xx response is a user-facing failure. |
| **Good Event** | An HTTP request whose response status code is NOT in the 5xx range. |
| **Bad Event** | An HTTP request whose response status code is in the 5xx range (500–599). |
| **Metric Source** | `http.server.duration_ms` — histogram count + status_class label derived from same source |
| **Derivation** | `count{status_class!="5xx"} / count{total}` |
| **Excluded** | `/health/live`, `/health/ready`, `/metrics` (probe traffic) |
| **Instrumentation File** | `apps/api/src/observability/observability.service.ts` |

### 2.3 Tracking Event Processing Latency (p95)

| Field | Value |
|---|---|
| **SLI** | Proportion of tracking events processed from ingestion to persistence in < 2 s (p95) |
| **Why** | Operational events (arrivals, departures, delays) must be visible to operations teams in near real-time. SLA breaches cascade to cargo dwell time and customer penalties. |
| **Good Event** | A tracking event whose total processing time (from `tracking.event.record` RPC call through domain service, audit, and outbox publish) is ≤ 2 s. |
| **Bad Event** | Processing exceeds 2 s, or the event fails with a 5xx error. |
| **Metric Source** | `rpc.tracking.event.record.duration_ms` — histogram from `createRpcOperationMetadata()` in `packages/rpc/src/tracking.ts` |
| **Labels** | `rpc.operation`, `rpc.version`, `rpc.kind`, `http.status_code` |
| **Instrumentation File** | `packages/rpc/src/metadata.ts` (line 78: `metricName: rpc.{operationName}.duration_ms`) |

### 2.4 Outbox Worker Processing Delay (p95)

| Field | Value |
|---|---|
| **SLI** | Proportion of outbox events published within 5 s of creation (p95) |
| **Why** | The outbox pattern guarantees reliable event delivery. Excessive delay means downstream consumers (webhooks, integrations, notifications) receive stale data, breaking operational workflows. |
| **Good Event** | An outbox event whose `publishedAt - createdAt` (or `publishedAt - availableAt`) is ≤ 5 s. |
| **Bad Event** | Processing delay exceeds 5 s, or the event transitions to `failed` status after exhausting retries. |
| **Metric Source** | `outbox.event.processing_delay_ms` — histogram calculated from `publishedAt − availableAt` in the `outboxEvent` table (`packages/database/prisma/schema.prisma`). Emitted by the outbox worker after successful publish. |
| **Labels** | `event_type`, `aggregate_type`, `status` |
| **Status Lifecycle** | `pending → processing → published` (or `failed` after max retries). See `packages/database/src/constants.ts`. |

### 2.5 Database Query Latency (p95)

| Field | Value |
|---|---|
| **SLI** | Proportion of Prisma database queries completing in < 100 ms (p95) |
| **Why** | Database latency is the largest contributor to overall API latency. Slow queries cascade into p95 degradation for all critical paths. |
| **Good Event** | A Prisma query (any `findMany`, `findUnique`, `create`, `update`, `upsert`) whose execution time is ≤ 100 ms. |
| **Bad Event** | Query exceeds 100 ms, or throws a Prisma exception (`P2xxx`, `P3xxx`). |
| **Metric Source** | `prisma.query.duration_ms` — histogram to be emitted via Prisma middleware or `$use` hook in `packages/database/src/` |
| **Labels** | `model` (e.g., `cargo`, `trackingEvent`, `outboxEvent`), `action` (e.g., `findMany`, `create`, `update`) |
| **Excluded** | Migrations, seed scripts, connection overhead (pool acquire) |

---

## 3. SLOs & Error Budgets

### Summary Table

| # | SLI | Target SLO | Compliance Window | Error Budget | Bad Events Allowed (est.) |
|---|---|---|---|---|---|
| 1 | API latency (p95 < 500 ms) | ≥ 99.0% | Rolling 30 days | 1.0% | ~8,640 (at 1M req/day) |
| 2 | API availability (success rate) | ≥ 99.9% | Rolling 30 days | 0.1% | ~864 (at 1M req/day) |
| 3 | Tracking event processing (p95 < 2 s) | ≥ 99.5% | Rolling 30 days | 0.5% | ~648 (at 50K events/day) |
| 4 | Outbox worker delay (p95 < 5 s) | ≥ 99.5% | Rolling 30 days | 0.5% | ~648 (at 50K events/day) |
| 5 | Database query latency (p95 < 100 ms) | ≥ 99.0% | Rolling 30 days | 1.0% | ~25,920 (at 3M queries/day) |

### 3.1 API Request Latency SLO

| Property | Value |
|---|---|
| **SLI** | API request latency (p95 < 500 ms) |
| **SLO Target** | 99.0% of requests complete in ≤ 500 ms |
| **Compliance Window** | Rolling 30 days (30 × 24 = 720 hours) |
| **Measurement Method** | `histogram_quantile(0.95, sum(rate(http_server_duration_ms_bucket[30d])) by (le))` — p95 of the aggregate latency distribution |
| **Error Budget** | 1.0% of total requests per window |
| **Error Budget (absolute)** | `total_requests × 0.01` per 30 days |
| **Multi-window Burn Rate Alerts** | 2× over 1h (warning), 3× over 30m (critical), 6× over 5m (page) |
| **Justification** | 500 ms p95 allows headroom for complex cargo/search operations while meeting the 1 s SLO defined in the existing SLI/SLO document. The 99.0% target is realistic given the current 600 ms p95 baseline. |

### 3.2 API Availability SLO

| Property | Value |
|---|---|
| **SLI** | API availability (non-5xx rate) |
| **SLO Target** | 99.9% of requests return non-5xx |
| **Compliance Window** | Rolling 30 days |
| **Measurement Method** | `sum(rate(http_server_duration_ms_count{status_class!="5xx"}[30d])) / sum(rate(http_server_duration_ms_count[30d]))` |
| **Error Budget** | 0.1% of total requests per window |
| **Error Budget (absolute)** | `total_requests × 0.001` per 30 days |
| **Multi-window Burn Rate Alerts** | 2× over 1h (warning), 3× over 30m (critical), 10× over 5m (page) |
| **Justification** | 99.9% (three nines) is the industry standard for internal enterprise APIs. The current baseline of 99.7% means tight error budget (~300 ppm), requiring rapid incident response. SLO will be tightened to 99.95% once current baseline improves. |

### 3.3 Tracking Event Processing Latency SLO

| Property | Value |
|---|---|
| **SLI** | Tracking event processing latency (p95 < 2 s) |
| **SLO Target** | 99.5% of tracking events processed in ≤ 2 s |
| **Compliance Window** | Rolling 30 days |
| **Measurement Method** | `histogram_quantile(0.95, sum(rate(rpc_tracking_event_record_duration_ms_bucket[30d])) by (le))` |
| **Error Budget** | 0.5% of total tracking events per window |
| **Error Budget (absolute)** | `total_events × 0.005` per 30 days |
| **Multi-window Burn Rate Alerts** | 2× over 1h (warning), 3× over 30m (critical) |
| **Justification** | 2 s allows for the event to pass through validation, domain service, audit record creation, and outbox publishing. The existing SLI/SLO document defines 30 s freshness for event processing — this SLO is 15× tighter, reflecting the operational real-time requirement. |

### 3.4 Outbox Worker Processing Delay SLO

| Property | Value |
|---|---|
| **SLI** | Outbox worker processing delay (p95 < 5 s) |
| **SLO Target** | 99.5% of outbox events published within 5 s of `availableAt` |
| **Compliance Window** | Rolling 30 days |
| **Measurement Method** | `histogram_quantile(0.95, sum(rate(outbox_event_processing_delay_ms_bucket[30d])) by (le))` |
| **Error Budget** | 0.5% of total outbox events per window |
| **Error Budget (absolute)** | `total_events × 0.005` per 30 days |
| **Multi-window Burn Rate Alerts** | 2× over 1h (warning), 3× over 30m (critical) |
| **Justification** | 5 s ensures downstream consumers (webhooks, integrations, notifications) receive events with minimal latency. Events that exceed 5 s indicate worker saturation, PostgreSQL contention, or downstream consumer back-pressure. |

### 3.5 Database Query Latency SLO

| Property | Value |
|---|---|
| **SLI** | Database query latency (p95 < 100 ms) |
| **SLO Target** | 99.0% of Prisma queries complete in ≤ 100 ms |
| **Compliance Window** | Rolling 30 days |
| **Measurement Method** | `histogram_quantile(0.95, sum(rate(prisma_query_duration_ms_bucket[30d])) by (le))` |
| **Error Budget** | 1.0% of total queries per window |
| **Error Budget (absolute)** | `total_queries × 0.01` per 30 days |
| **Multi-window Burn Rate Alerts** | 2× over 1h (warning), 3× over 15m (critical) |
| **Justification** | 100 ms p95 is the threshold beyond which per-query latency visibly impacts API response times. The 99.0% target recognises that some queries (e.g., complex cargo search with filters, aggregations) will naturally exceed 100 ms. Slow queries should be identified, optimised, and excluded from the SLO or moved to read models. |

---

## 4. Measurement Implementation

### 4.1 Existing Metrics

These metrics are already being collected in the codebase:

| Metric | Type | Source | Status |
|---|---|---|---|
| `http.server.duration_ms` | histogram | `apps/api/src/observability/observability.service.ts` line 144 | ✅ Active |
| `rpc.*.duration_ms` | histogram | `packages/rpc/src/metadata.ts` line 78 (generated per RPC operation) | ✅ Active |
| `authorization.decisions` | counter | `apps/api/src/observability/observability.service.ts` line 215 | ✅ Active |
| `process.uptime_seconds` | gauge | `apps/api/src/observability/observability.service.ts` line 346 | ✅ Active |

### 4.2 Proposed New Metrics

These metrics must be added to support the new SLOs:

| Metric | Type | Labels | Location |
|---|---|---|---|
| `outbox.event.processing_delay_ms` | histogram | `event_type`, `aggregate_type`, `status` | Outbox worker (new) — records `publishedAt − availableAt` after successful publish |
| `outbox.event.processing_total` | counter | `event_type`, `aggregate_type`, `status` | Same location |
| `prisma.query.duration_ms` | histogram | `model`, `action` | Prisma middleware in `packages/database/src/prisma-middleware.ts` (new) |
| `prisma.query.total` | counter | `model`, `action`, `status` | Same location |

### 4.3 Outbox Worker Instrumentation

The outbox worker (`apps/api/src/workers/outbox.worker.ts` — to be created) must emit latency metrics after each successful publish:

```typescript
// Pseudocode for outbox worker instrumentation
const delayMs = publishedAt.getTime() - availableAt.getTime();
this.metrics.record(
  createMetricRecord({
    name: "outbox.event.processing_delay_ms",
    kind: "histogram",
    value: delayMs,
    attributes: {
      "event_type": event.eventType,
      "aggregate_type": event.aggregateType,
      "status": "published",
    },
  }),
);
this.metrics.record(
  createMetricRecord({
    name: "outbox.event.processing_total",
    kind: "counter",
    value: 1,
    attributes: {
      "event_type": event.eventType,
      "aggregate_type": event.aggregateType,
      "status": "published",
    },
  }),
);
```

Outbox events in `failed` status must also be counted to track error budget consumption:

```typescript
// On final retry exhaustion
this.metrics.record(
  createMetricRecord({
    name: "outbox.event.processing_total",
    kind: "counter",
    value: 1,
    attributes: {
      "event_type": event.eventType,
      "aggregate_type": event.aggregateType,
      "status": "failed",
    },
  }),
);
```

### 4.4 Prisma Query Instrumentation

A Prisma middleware (`$use`) must be registered in the Prisma client factory to wrap every query with a duration histogram:

```typescript
// Pseudocode for Prisma query instrumentation
prisma.$use(async (params, next) => {
  const start = performance.now();
  const result = await next(params);
  const durationMs = performance.now() - start;

  metrics.record(
    createMetricRecord({
      name: "prisma.query.duration_ms",
      kind: "histogram",
      value: durationMs,
      attributes: {
        model: params.model ?? "unknown",
        action: params.action,
      },
    }),
  );

  return result;
});
```

### 4.5 SLO Computation Method

All SLOs use the **ratio-of-good-events** approach recommended by Google SRE:

```
SLI = good_events / total_events
```

Each SLI is evaluated over a **rolling 30-day window** using Prometheus recording rules. The ratio is computed every 30 seconds to feed burn-rate alerting.

---

## 5. Error Budget Policy

### 5.1 Budget Calculation

Error budgets are calculated at the start of each compliance window and consumed by bad events:

```
error_budget_total   = 100% − SLO_target    (e.g., 1% for a 99% SLO)
error_budget_used    = 100% − SLI_current   (e.g., 0.3% if SLI is at 99.7%)
error_budget_remaining = error_budget_total − error_budget_used
```

### 5.2 Error Budget Thresholds

| Budget Remaining | Status | Action | Owner |
|---|---|---|---|
| > 50% | ✅ Healthy | Normal operations. Standard CI/CD deployments allowed. | Team |
| 20% – 50% | ⚠️ Warning | Review recent changes. Create a mitigation plan. Increase monitoring scrutiny. No experimental features in production. | Tech Lead |
| 5% – 20% | 🔴 Critical | Freeze non-critical deployments. Emergency response plan. Daily stand-ups for mitigation. | Engineering Manager |
| < 5% | 🚨 Exhausted | Emergency response activated. Rollback suspected changes. On-call engineer drives incident. All hands on deck until budget recovers. | On-call Engineer |

### 5.4 Budget Recovery

Error budgets recover naturally as time passes and good events displace bad events from the rolling window. No manual reset is permitted. If a systemic issue is fixed, the budget will recover at the following approximate rate:

| SLO | 1% recovery (at steady-state 100% compliant) | Full recovery |
|---|---|---|
| 99.0% (API latency) | ~7 hours | ~30 days |
| 99.9% (API availability) | ~17 hours | ~30 days |
| 99.5% (Tracking latency) | ~12 hours | ~30 days |
| 99.5% (Outbox delay) | ~12 hours | ~30 days |
| 99.0% (DB latency) | ~7 hours | ~30 days |

---

## 6. Burn Rate Alerting

### 6.1 Alert Severities

| Severity | Burn Rate | Duration | Response Time | Notification |
|---|---|---|---|---|
| **Page (P1)** | ≥ 10× budget | ≥ 5 min | 15 min | PagerDuty + Slack @channel |
| **Critical (P2)** | ≥ 3× budget | ≥ 30 min | 30 min | Slack @channel |
| **Warning (P3)** | ≥ 2× budget | ≥ 1 hour | 4 hours | Slack @team |
| **Info (P4)** | ≥ 1.5× budget | ≥ 6 hours | Next business day | Slack digest |

### 6.2 Burn Rate Multipliers

Which burn rate is "exhausting budget" depends on the SLO target and the window length:

| SLO Target | Error Budget | 2× burn exhausts in | 3× burn exhausts in | 10× burn exhausts in |
|---|---|---|---|---|
| 99.9% | 0.1% | 12 hours | 8 hours | 2.4 hours |
| 99.5% | 0.5% | 2.5 days | 1.7 days | 12 hours |
| 99.0% | 1.0% | 5 days | 3.3 days | 1 day |

### 6.3 Alert Rules

Alert rules follow the SRE Workbook multi-window pattern: a short-window burn rate alert (fast detection) gated by a longer window (fewer false positives).

| Alert | Short Window | Long Window | Threshold | Severity |
|---|---|---|---|---|
| Critical burn rate | 5 min | 30 min | ≥ 10× budget rate | P1 |
| High burn rate | 30 min | 6 h | ≥ 3× budget rate | P2 |
| Moderate burn rate | 1 h | 24 h | ≥ 2× budget rate | P3 |
| Slow burn | 6 h | 7 d | ≥ 1.5× budget rate | P4 |

---

## 7. Appendix: Prometheus Recording Rules

Save to `deploy/observability/prometheus/rules/slos.yml`:

```yaml
groups:
  - name: slo_rules
    interval: 30s
    rules:
      # =============================================
      # 1. API Request Latency SLO (p95 < 500ms)
      # =============================================
      - record: sli:api_latency_p95:ratio_rate30m
        expr: |
          (
            sum(rate(http_server_duration_ms_bucket{le="500"}[30m]))
            /
            sum(rate(http_server_duration_ms_count[30m]))
          )

      - record: slo:api_latency:target
        expr: 0.99

      - record: sli:api_latency_p95:ratio_rate6h
        expr: |
          (
            sum(rate(http_server_duration_ms_bucket{le="500"}[6h]))
            /
            sum(rate(http_server_duration_ms_count[6h]))
          )

      # =============================================
      # 2. API Availability SLO (> 99.9% non-5xx)
      # =============================================
      - record: sli:api_availability:ratio_rate30m
        expr: |
          (
            sum(rate(http_server_duration_ms_count{status_class!="5xx"}[30m]))
            /
            sum(rate(http_server_duration_ms_count[30m]))
          )

      - record: slo:api_availability:target
        expr: 0.999

      - record: sli:api_availability:ratio_rate6h
        expr: |
          (
            sum(rate(http_server_duration_ms_count{status_class!="5xx"}[6h]))
            /
            sum(rate(http_server_duration_ms_count[6h]))
          )

      # =============================================
      # 3. Tracking Event Processing Latency (p95 < 2s)
      # =============================================
      - record: sli:tracking_latency_p95:ratio_rate30m
        expr: |
          (
            sum(rate(rpc_tracking_event_record_duration_ms_bucket{le="2000"}[30m]))
            /
            sum(rate(rpc_tracking_event_record_duration_ms_count[30m]))
          )

      - record: slo:tracking_latency:target
        expr: 0.995

      - record: sli:tracking_latency_p95:ratio_rate6h
        expr: |
          (
            sum(rate(rpc_tracking_event_record_duration_ms_bucket{le="2000"}[6h]))
            /
            sum(rate(rpc_tracking_event_record_duration_ms_count[6h]))
          )

      # =============================================
      # 4. Outbox Worker Processing Delay (p95 < 5s)
      # =============================================
      - record: sli:outbox_delay_p95:ratio_rate30m
        expr: |
          (
            sum(rate(outbox_event_processing_delay_ms_bucket{le="5000"}[30m]))
            /
            sum(rate(outbox_event_processing_delay_ms_count[30m]))
          )

      - record: slo:outbox_delay:target
        expr: 0.995

      - record: sli:outbox_delay_p95:ratio_rate6h
        expr: |
          (
            sum(rate(outbox_event_processing_delay_ms_bucket{le="5000"}[6h]))
            /
            sum(rate(outbox_event_processing_delay_ms_count[6h]))
          )

      # =============================================
      # 5. Database Query Latency (p95 < 100ms)
      # =============================================
      - record: sli:db_latency_p95:ratio_rate30m
        expr: |
          (
            sum(rate(prisma_query_duration_ms_bucket{le="100"}[30m]))
            /
            sum(rate(prisma_query_duration_ms_count[30m]))
          )

      - record: slo:db_latency:target
        expr: 0.99

      - record: sli:db_latency_p95:ratio_rate6h
        expr: |
          (
            sum(rate(prisma_query_duration_ms_bucket{le="100"}[6h]))
            /
            sum(rate(prisma_query_duration_ms_count[6h]))
          )

      # =============================================
      # Error Budget Remaining (percentage)
      # =============================================
      - record: error_budget:api_latency:remaining
        expr: |
          (1 - sli:api_latency_p95:ratio_rate30m) / (1 - slo:api_latency:target)

      - record: error_budget:api_availability:remaining
        expr: |
          (1 - sli:api_availability:ratio_rate30m) / (1 - slo:api_availability:target)

      - record: error_budget:tracking_latency:remaining
        expr: |
          (1 - sli:tracking_latency_p95:ratio_rate30m) / (1 - slo:tracking_latency:target)

      - record: error_budget:outbox_delay:remaining
        expr: |
          (1 - sli:outbox_delay_p95:ratio_rate30m) / (1 - slo:outbox_delay:target)

      - record: error_budget:db_latency:remaining
        expr: |
          (1 - sli:db_latency_p95:ratio_rate30m) / (1 - slo:db_latency:target)
```

### Alertmanager Rules

Save to `deploy/observability/prometheus/rules/slo-alerts.yml`:

```yaml
groups:
  - name: slo_alerts
    interval: 1m
    rules:
      # =============================================
      # API Latency SLO Alerts
      # =============================================
      - alert: SLOApiLatencyHighBurnRate
        expr: |
          (1 - sli:api_latency_p95:ratio_rate30m) / (1 - slo:api_latency:target) > 3
        for: 10m
        labels:
          severity: critical
          slo: api_latency
        annotations:
          summary: "API latency SLO burn rate exceeded 3× over 30m"
          description: "API request latency SLO (p95 < 500ms) is burning budget at > 3× the target rate. Error budget remaining: {{ $value | humanizePercentage }}."

      - alert: SLOApiLatencyModerateBurnRate
        expr: |
          (1 - sli:api_latency_p95:ratio_rate30m) / (1 - slo:api_latency:target) > 2
        for: 1h
        labels:
          severity: warning
          slo: api_latency
        annotations:
          summary: "API latency SLO burn rate exceeded 2× over 1h"
          description: "API request latency SLO (p95 < 500ms) is burning budget at > 2× the target rate."

      # =============================================
      # API Availability SLO Alerts
      # =============================================
      - alert: SLOApiAvailabilityHighBurnRate
        expr: |
          (1 - sli:api_availability:ratio_rate30m) / (1 - slo:api_availability:target) > 3
        for: 10m
        labels:
          severity: critical
          slo: api_availability
        annotations:
          summary: "API availability SLO burn rate exceeded 3× over 30m"
          description: "API availability SLO (> 99.9% success) is burning budget at > 3× the target rate. Error budget remaining: {{ $value | humanizePercentage }}."

      - alert: SLOApiAvailabilityModerateBurnRate
        expr: |
          (1 - sli:api_availability:ratio_rate30m) / (1 - slo:api_availability:target) > 2
        for: 1h
        labels:
          severity: warning
          slo: api_availability
        annotations:
          summary: "API availability SLO burn rate exceeded 2× over 1h"

      # =============================================
      # Tracking Event Latency SLO Alerts
      # =============================================
      - alert: SLOTrackingLatencyHighBurnRate
        expr: |
          (1 - sli:tracking_latency_p95:ratio_rate30m) / (1 - slo:tracking_latency:target) > 3
        for: 10m
        labels:
          severity: critical
          slo: tracking_latency
        annotations:
          summary: "Tracking event latency SLO burn rate exceeded 3×"

      - alert: SLOTrackingLatencyModerateBurnRate
        expr: |
          (1 - sli:tracking_latency_p95:ratio_rate30m) / (1 - slo:tracking_latency:target) > 2
        for: 1h
        labels:
          severity: warning
          slo: tracking_latency
        annotations:
          summary: "Tracking event latency SLO burn rate exceeded 2×"

      # =============================================
      # Outbox Delay SLO Alerts
      # =============================================
      - alert: SLOOutboxDelayHighBurnRate
        expr: |
          (1 - sli:outbox_delay_p95:ratio_rate30m) / (1 - slo:outbox_delay:target) > 3
        for: 10m
        labels:
          severity: critical
          slo: outbox_delay
        annotations:
          summary: "Outbox worker delay SLO burn rate exceeded 3×"

      - alert: SLOOutboxDelayModerateBurnRate
        expr: |
          (1 - sli:outbox_delay_p95:ratio_rate30m) / (1 - slo:outbox_delay:target) > 2
        for: 1h
        labels:
          severity: warning
          slo: outbox_delay
        annotations:
          summary: "Outbox worker delay SLO burn rate exceeded 2×"

      # =============================================
      # Database Query Latency SLO Alerts
      # =============================================
      - alert: SLODbLatencyHighBurnRate
        expr: |
          (1 - sli:db_latency_p95:ratio_rate30m) / (1 - slo:db_latency:target) > 3
        for: 10m
        labels:
          severity: critical
          slo: db_latency
        annotations:
          summary: "Database query latency SLO burn rate exceeded 3×"

      - alert: SLODbLatencyModerateBurnRate
        expr: |
          (1 - sli:db_latency_p95:ratio_rate30m) / (1 - slo:db_latency:target) > 2
        for: 1h
        labels:
          severity: warning
          slo: db_latency
        annotations:
          summary: "Database query latency SLO burn rate exceeded 2×"
```

---

## 8. Appendix: Grafana Dashboard Panels

### 8.1 SLO Overview Panel

Create a Grafana dashboard `SLO — Critical Paths` with the following panels:

| Panel | Query | Visualisation |
|---|---|---|
| **SLO Compliance** | One stat per SLO showing `sli:{name}:ratio_rate6h` vs `slo:{name}:target` | Stat (green ≥ target, yellow > 2× burn, red > 3× burn) |
| **Error Budget Remaining** | `error_budget:{name}:remaining` | Gauges (0%–100%, colour-coded per threshold) |
| **Latency Heatmap** | `http_server_duration_ms_bucket` | Heatmap (le vs time) |
| **Availability Time Series** | `sli:api_availability:ratio_rate30m` | Time series with threshold line at 0.999 |

### 8.2 Per-SLO Detail Panels

Each SLO gets a dedicated row with:

1. **Burn Rate Multi-Window** — Three time series for 30m, 6h, 24h burn rates
2. **Error Budget Trend** — Remaining budget over time (7d, 30d)
3. **Top Contributors** — For API latency: slowest routes by p95. For DB latency: slowest models/actions.
4. **Bad Events Breakdown** — For availability: 5xx breakdown by status code, route

---

## 9. Review Cadence

| Review Type | Frequency | Participants |
|---|---|---|
| SLO compliance check | Daily (automated) | Grafana dashboard + Slack digest |
| Error budget review | Weekly | Engineering team stand-up |
| SLO target adjustment | Quarterly | Product + Engineering + DevOps |
| Full SLI/SLO audit | Annually | All stakeholders |
| Metric implementation review | Per-release | DevOps team (verify new metric sources) |

---

## 10. References

- **Existing SLI/SLO Document:** `docs/observability/sli-slo.md` (v1 — authentication, cargo lifecycle, payment processing, API gateway)
- **Observability Strategy:** `docs/observability/observability-strategy.md`
- **API Instrumentation:** `docs/observability/api-instrumentation.md`
- **Observability Contracts:** `docs/observability/contracts.md`
- **Error Handling:** `docs/observability/error-handling.md`
- **Google SRE Workbook — Implementing SLOs:** https://sre.google/workbook/implementing-slos
- **Google SRE Workbook — Alerting on SLOs:** https://sre.google/workbook/alerting-on-slos
- **Prometheus Recording Rules:** `deploy/observability/prometheus/rules/slos.yml`
- **Alertmanager Rules:** `deploy/observability/prometheus/rules/slo-alerts.yml`

---

## Changelog

| Date | Version | Changes |
|---|---|---|
| 2026-07-02 | 2.0.0 | Initial release: API latency, API availability, tracking event latency, outbox delay, database query latency SLOs |
