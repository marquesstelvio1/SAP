# @saptm/observability

Vendor-neutral observability contracts for SAPTM.

## Purpose

- Normalize correlation metadata across web, API, RPC, database, integrations, and audit flows.
- Provide structured log, metric, and span records before any concrete monitoring vendor is selected.
- Provide a Prometheus-compatible metrics registry for runtime foundations.
- Keep critical operations traceable without coupling feature code to a platform-specific SDK.

## Scope

This package defines contracts and lightweight helpers only. Runtime exporters, OpenTelemetry SDK setup, dashboards, and alert delivery are configured by applications and deployment manifests.
