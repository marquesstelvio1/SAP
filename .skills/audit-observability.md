# Audit: Observability

## Purpose
Audit the observability infrastructure of the SAPTM monorepo. Verify OpenTelemetry instrumentation, Prometheus metrics collection, Grafana dashboard configuration, alert routing rules, log level standards, and Sentry error tracking.

## Inputs
- `packages/observability/` — observability package source
- `compose.yaml` — Docker Compose configuration (local dev)
- `deploy/observability/` — observability deployment manifests
- `apps/api/src/main.ts` — API entry point (OTel initialization)
- `apps/web/src/instrumentation.ts` — Next.js instrumentation
- `turbo.json` — task pipeline configuration
- `.env.example` — documented environment variables

## Execution Steps
1. **OpenTelemetry Instrumentation** (Rule 7.5)
   - Open `packages/observability/src/tracing.ts` or equivalent.
   - Verify `@opentelemetry/sdk-node`, `@opentelemetry/instrumentation-http`, `@opentelemetry/instrumentation-express` (or `@nestjs/otel`) are configured.
   - Check that service name is set from environment variable (e.g., `OTEL_SERVICE_NAME`).
   - Verify exporter is configured (OTLP HTTP/gRPC, or console for dev).
   - Confirm span processor is set (batch processor for production, simple for dev).
   - Check that `apps/api/src/main.ts` initializes OpenTelemetry before the NestJS app starts.
   - Verify `apps/web/src/instrumentation.ts` (Next.js) initializes OpenTelemetry.
   - Flag missing OTel initialization as P1.

2. **Prometheus Metrics** (Rule 7.5)
   - Open `packages/observability/src/metrics.ts` or equivalent.
   - Verify Prometheus metrics endpoint is configured (typically `GET /metrics`).
   - Check that the following metrics are exposed:
     - HTTP request duration histogram
     - HTTP request count (by method, status code, route)
     - Active requests gauge
     - Database query duration histogram (if applicable)
     - Application-specific business metrics (e.g., order count, user registrations)
   - Confirm metrics are labeled with appropriate dimensions (method, status, route, service).
   - Verify metrics endpoint is protected or internal (not publicly exposed).
   - Flag missing Prometheus metrics as P2.

3. **Grafana Dashboards**
   - Open `deploy/observability/grafana/dashboards/` or equivalent.
   - Verify at minimum the following dashboards exist:
     - **Service Overview**: request rate, error rate, latency (p50/p95/p99), active requests.
     - **Infrastructure**: CPU, memory, disk, network per service.
     - **Database**: query performance, connection pool, slow queries.
     - **Business**: domain-specific metrics (if defined).
   - Check dashboard JSON files for correct data source references.
   - Verify dashboards have proper title, description, and tags.
   - Flag missing critical dashboards as P2.

4. **Alert Routing Rules**
   - Open `deploy/observability/alertmanager/` or equivalent.
   - Verify Alertmanager configuration exists (`alertmanager.yml`).
   - Check that routing rules define:
     - Default receiver (e.g., team channel).
     - Severity-based routing (critical alerts to on-call, warnings to team channel).
     - Grouping rules to reduce alert fatigue.
     - Inhibition rules for maintenance windows.
   - Verify alert severity levels are used consistently: `critical`, `warning`, `info`.
   - Confirm alert thresholds are documented and reasonable.
   - Flag missing alert configuration as P2.

5. **Log Levels** (Rule 7.5)
   - Open configuration for structured logging (likely `packages/observability/src/logger.ts` or NestJS logger config).
   - Verify structured logging is used (JSON format, not plain text).
   - Check that log levels follow standard severity: `debug`, `info`, `warn`, `error`, `fatal`.
   - Verify log level is configurable via environment variable (`LOG_LEVEL`).
   - Confirm sensitive data is redacted from logs (PII, secrets, tokens).
   - Flag plain text logging as P2, missing PII redaction as P1.

6. **Sentry Configuration**
   - Scan for Sentry initialization in `packages/observability/` or directly in apps.
   - Verify `@sentry/node` (or `@sentry/nextjs`) is configured with:
     - DSN from environment variable (not hardcoded).
     - Environment name (production, staging, development).
     - Release/trace information from Git.
     - Sample rate configuration (e.g., `tracesSampleRate: 0.1` for production).
   - Check that performance monitoring is enabled (Sentry tracing).
   - Verify source maps are uploaded for production error grouping.
   - Flag hardcoded DSN as P0, missing Sentry config as P2.

7. **Health Checks** (Rules 7.2–7.3)
   - Verify `apps/api/src/` has `/health/live` (liveness) and `/health/ready` (readiness) endpoints.
   - Check that `/health/live` returns 200 when the service is running (no dependencies check).
   - Check that `/health/ready` returns 200 only when all dependencies (database, cache, etc.) are healthy.
   - Verify `apps/web/` has `/api/health` endpoint or equivalent.
   - Flag missing health endpoints as P1.

8. **Graceful Shutdown** (Rule 7.4)
   - Open `apps/api/src/main.ts`.
   - Verify `app.enableShutdownHooks()` or equivalent graceful shutdown handling.
   - Check that OTel SDK is shut down gracefully (`sdk.shutdown()`).
   - Confirm database connections are closed on shutdown.
   - Verify HTTP server drain timeout is configured.
   - Flag missing graceful shutdown as P1.

## Validation Steps
- [ ] OpenTelemetry initialized before app start in API and Web
- [ ] OTLP exporter configured with service name from env
- [ ] Prometheus metrics endpoint available (`GET /metrics`)
- [ ] HTTP metrics exposed (duration, count, active)
- [ ] Grafana dashboards exist for service, infra, database
- [ ] Alertmanager configured with severity-based routing
- [ ] Structured JSON logging with configurable log level
- [ ] PII redacted from logs
- [ ] Sentry configured with DSN from env, tracing enabled
- [ ] `/health/live` and `/health/ready` endpoints exist on API
- [ ] `/api/health` endpoint exists on Web
- [ ] Graceful shutdown hooks enabled
- [ ] OTel SDK shutdown on app termination

## Definition of Done
- OpenTelemetry is fully instrumented and exporting traces.
- Prometheus metrics are comprehensive and properly labeled.
- Grafana dashboards cover service, infrastructure, and database observability.
- Alert routing is configured with severity-based escalation.
- Logging is structured, configurable, and PII-safe.
- Sentry captures errors with context and source maps.
- All health endpoints respond correctly.
- Graceful shutdown drains connections and exports final spans.

## Failure Conditions
- Hardcoded Sentry DSN — **P0**
- Missing OpenTelemetry initialization — **P1**
- Missing health check endpoints — **P1**
- No graceful shutdown — **P1**
- PII present in logs — **P1**
- Prometheus metrics not exposed — **P2**
- Missing Grafana dashboards — **P2**
- No alert routing configuration — **P2**

## Required Reports
- `audit-observability-tracing.md` — OpenTelemetry instrumentation details
- `audit-observability-metrics.md` — Prometheus metric completeness
- `audit-observability-dashboards.md` — Grafana dashboard audit
- `audit-observability-alerting.md` — alert routing analysis
- `audit-observability-logging.md` — log level and structure audit
- `audit-observability-sentry.md` — Sentry configuration audit
- `audit-observability-health.md` — health check and shutdown audit
- `audit-observability-summary.md` — pass/fail per section
