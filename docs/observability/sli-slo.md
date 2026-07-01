# SLIs & SLOs — SAPTM

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Owner:** DevOps / Observability Team

---

## Definition

- **SLI (Service Level Indicator):** A quantitative measure of some aspect of the service
- **SLO (Service Level Objective):** A target value or range for an SLI
- **SLA (Service Level Agreement):** A contractual commitment to meet SLOs (not defined here)

---

## Critical Paths

### 1. Authentication

| SLI | Definition | Measurement | Current Baseline | SLO | Burn Rate |
|-----|-----------|-------------|-----------------|-----|-----------|
| Auth Availability | % of sign-in requests that return non-5xx | Prometheus counter `saptm_auth_requests_total{status!~"5.."}` / total | 99.9% | ≥ 99.5% | 5% / 30m |
| Auth Latency (p95) | 95th percentile of sign-in response time | Prometheus histogram `saptm_auth_request_duration_ms` | 500ms | ≤ 1000ms | 2x / 1h |
| Auth Error Rate | % of sign-in requests returning 5xx | Prometheus counter `saptm_auth_requests_total{status=~"5.."}` / total | 0.1% | ≤ 0.5% | 3x / 1h |

### 2. Cargo Lifecycle

| SLI | Definition | Measurement | Current Baseline | SLO | Burn Rate |
|-----|-----------|-------------|-----------------|-----|-----------|
| Cargo Create Availability | % of cargo creation requests returning success | OTEL span count | 99.8% | ≥ 99.0% | 5% / 30m |
| Cargo Create Latency (p95) | 95th percentile of cargo creation | OTEL span duration `cargo.create` | 800ms | ≤ 2000ms | 2x / 1h |
| Cargo Search Availability | % of cargo search requests returning success | OTEL span count | 99.9% | ≥ 99.5% | 5% / 30m |
| Cargo Search Latency (p95) | 95th percentile of cargo search | OTEL span duration `cargo.search` | 300ms | ≤ 500ms | 3x / 1h |

### 3. Shipment Tracking

| SLI | Definition | Measurement | Current Baseline | SLO | Burn Rate |
|-----|-----------|-------------|-----------------|-----|-----------|
| Tracking Check Availability | % of tracking checks returning success | Grafana | 99.8% | ≥ 99.0% | 5% / 30m |
| Tracking Check Latency (p95) | 95th percentile of tracking query | OTEL span duration `tracking.overview` | 400ms | ≤ 1000ms | 2x / 1h |
| Event Processing Freshness | Time from event creation to availability in query | Custom metric | 5s | ≤ 30s | 2x / 1h |

### 4. Payment Processing (Stripe)

| SLI | Definition | Measurement | Current Baseline | SLO | Burn Rate |
|-----|-----------|-------------|-----------------|-----|-----------|
| Checkout Availability | % of checkout sessions initiated successfully | Stripe webhook tracking | 99.9% | ≥ 99.5% | 5% / 30m |
| Checkout Latency (p95) | 95th percentile of checkout session creation | OTEL span duration `billing.checkout` | 1200ms | ≤ 3000ms | 2x / 1h |

### 5. API Gateway / RPC

| SLI | Definition | Measurement | Current Baseline | SLO | Burn Rate |
|-----|-----------|-------------|-----------------|-----|-----------|
| API Availability | % of all RPC requests returning non-5xx | Prometheus counter | 99.7% | ≥ 99.0% | 5% / 30m |
| API Latency (p95) | 95th percentile of all RPC requests | Prometheus histogram | 600ms | ≤ 1000ms | 2x / 1h |
| API Error Rate | % of all RPC requests returning errors | Prometheus counter | 0.3% | ≤ 1.0% | 3x / 1h |

---

## Implementation

### Prometheus Recording Rules

Save to `deploy/prometheus/rules/sli-slo.yml`:

```yaml
groups:
  - name: sli_slo
    interval: 30s
    rules:
      # Auth SLO
      - record: sli:auth_availability:ratio_rate30m
        expr: |
          sum(rate(saptm_auth_requests_total{status!~"5.."}[30m]))
          / sum(rate(saptm_auth_requests_total[30m]))
      
      - record: slo:auth_availability:ratio
        expr: 0.995

      # API SLO
      - record: sli:api_availability:ratio_rate30m
        expr: |
          sum(rate(saptm_api_requests_total{status!~"5.."}[30m]))
          / sum(rate(saptm_api_requests_total[30m]))
      
      - record: slo:api_availability:ratio
        expr: 0.99
```

### Alertmanager Rules

Save to `deploy/alertmanager/rules/slo-alerts.yml`:

```yaml
groups:
  - name: slo_alerts
    interval: 1m
    rules:
      - alert: SLOHighBurnRate
        expr: |
          (1 - sli:auth_availability:ratio_rate30m) / (1 - slo:auth_availability:ratio) > 3
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Auth availability SLO burn rate exceeded 3x"
          
      - alert: SLOModerateBurnRate
        expr: |
          (1 - sli:auth_availability:ratio_rate30m) / (1 - slo:auth_availability:ratio) > 2
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Auth availability SLO burn rate exceeded 2x"
```

---

## Dashboard Panels

Create Grafana dashboard panels for:
1. **SLO Overview** — All SLOs with current compliance status (green/yellow/red)
2. **Burn Rate** — Multi-window burn rate chart (30m / 1h / 6h)
3. **Error Budget** — Remaining error budget per SLO (percentage + absolute)

---

## Error Budget Policy

| Budget Remaining | Action | Owner |
|-----------------|--------|-------|
| > 50% | Normal operations | Team |
| 20-50% | Review recent changes, create mitigation plan | Tech Lead |
| 5-20% | Freeze non-critical deployments | Engineering Manager |
| < 5% | Emergency response, rollback if needed | On-call Engineer |

---

## Review Cadence

| Review Type | Frequency | Participants |
|-------------|-----------|-------------|
| SLO compliance review | Weekly | Engineering team |
| Error budget review | Monthly | Engineering Manager |
| SLO target adjustment | Quarterly | Product + Engineering |
| Full SLI/SLO audit | Annually | All stakeholders |
