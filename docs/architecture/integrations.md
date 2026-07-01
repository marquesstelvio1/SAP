# Integrations Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Overview

External system integrations are handled through a gateway pattern. Each external system has a dedicated adapter that translates external data into internal RPC contracts.

## Integration Gateway

```
External System
     │
     ▼
Service Account (API Key auth)
     │
     ▼
Integration RPC Handler
  ├── Idempotency check
  ├── Event validation
  ├── Audit record creation
  ├── Outbox event publication
  └── Notification generation
```

## Supported Adapters

| Adapter | External System | Data Flow |
|---|---|---|
| Port TOS | Terminal Operating System | Movement events → Tracking |
| Rail TMS | Rail Transport Management | Movement events → Tracking |
| Carrier TMS | Road Carrier Management | Movement events → Tracking |
| Telematics GPS | GPS Tracking Provider | Position data → Tracking |
| Customs ERP | Customs Clearance System | Clearance status → Tracking |
| Warehouse WMS | Warehouse Management | Activity events → Tracking |

## Security Pattern

1. **Service account provisioning** — Each integration gets a dedicated service account
2. **API key authentication** — SHA-256 hashed keys with visible prefix
3. **Scope limitation** — Service accounts scoped to specific permissions
4. **Idempotent ingestion** — External events deduplicated by source + external ID
5. **Audit trail** — All integration events recorded
6. **Outbox pattern** — Events published asynchronously to notification pipeline

## API (via RPC Contracts)

Each adapter exposes mutation operations:
- `integration.{adapter}_{event_type}` — Record external event
- `integration.service_account.create` — Provision new service account

All operations require `service` auth mode with corresponding permissions.
