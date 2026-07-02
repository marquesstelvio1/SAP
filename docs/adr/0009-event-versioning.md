# ADR 0009 — Event Versioning & Schema Registry

## Status

Accepted.

## Context

The SAPTM platform uses domain events for communication between bounded contexts. Events are published via the transactional outbox (`OutboxEventBusAdapter`) and consumed by internal handlers (in-memory EventBusService) and external webhooks.

Currently, the `DomainEvent` type has `eventVersion?: number` (optional). While all events are published with `eventVersion: 1`, there is no:
1. Versioning policy — what happens when a payload schema changes?
2. Schema registry — no central catalog of event schemas with version history
3. Consumer compatibility policy — are consumers expected to handle multiple versions?

Without explicit versioning:
- A breaking change to an event payload will silently break consumers
- There is no migration path for legacy consumers
- The outbox stores events that cannot be correctly interpreted without version context

## Decision

### 1. `eventVersion` is MANDATORY

Make `eventVersion: number` (required) in the `DomainEvent` interface. Every event published MUST include an explicit version number.

### 2. Semantic Versioning for Events

Event versions follow a simplified semantic scheme:

- **Major version bump (v1→v2):** Breaking change — field removed, renamed, or changed type. Consumers MUST be updated.
- **Minor version bump (v1.0→v1.1):** Backwards-compatible addition — new optional field added. Existing consumers continue to work.
- Only the major version is stored in `eventVersion` field. Minor version info is conveyed via the payload itself if needed.

### 3. Version Policy

| Action | Version | Consumer Impact |
|--------|---------|----------------|
| Add optional field | Minor (same major) | None — consumers ignore unknown fields |
| Add required field | Major | All consumers must be updated |
| Remove field | Major | All consumers must be updated |
| Rename field | Major | All consumers must be updated |
| Change field type | Major | All consumers must be updated |

### 4. Event Registry

Event schemas are documented alongside their source domain:

- `packages/rpc/src/events/` — Zod schemas per event, versioned
- Each event type has a file (e.g., `cargo-registered-v1.ts`)
- Consumers import schemas to validate payloads

### 5. Current Events

All current events are at eventVersion 1. No migration needed.

## Consequences

### Positive
1. ✅ Breaking changes are explicit and detectable
2. ✅ Consumers can validate payloads against known schemas
3. ✅ Outbox events are self-describing — the version tells consumers how to interpret the payload
4. ✅ Future schema registry can be generated from the Zod schemas

### Negative
1. ❌ Existing code must add `eventVersion: 1` everywhere (already done)
2. ❌ Minor version bumps require coordination across teams

## Compliance

- [x] DomainEvent interface updated
- [x] All current events use eventVersion: 1
- [x] Event versioning policy documented
