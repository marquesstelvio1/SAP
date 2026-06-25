# Business Rules: Authorization

**Phase:** 3 — Business Rules Extraction
**Source:** `packages/auth/src/permissions.ts`, `packages/auth/src/policy.ts`, `packages/auth/src/context.ts`, `packages/auth/src/user-authorization.ts`

---

## Permission Rules

| Rule | Value |
|---|---|
| Permission format | Lowercase dotted notation (e.g., `cargo.register`) |
| Total permissions | 41 defined |
| Permission assignment | Via roles → role-permission mappings |
| Permission scope | Per-organization |
| Permission mode | ALL (all required) or ANY (any sufficient) |

## Authorization Modes

| Mode | Description |
|---|---|
| `public` | No authentication required |
| `session` | User session required |
| `service` | API key / service account required |

## Policy Evaluation

```
evaluateAuthorization(authContext, requirement):
  1. Check actor type (requirement.actorTypes)
  2. Check organization scope (requirement.organizationRequired)
  3. Check specific organization ID (requirement.organizationId)
  4. Check permissions (ALL mode: all must match; ANY mode: one must match)
  
  Allowed only if ALL checks pass.
```

## Platform Permissions (41)

### Admin
- `tenant.manage`
- `identity.user.invite`
- `identity.role.assign`

### Integration
- `integration.api_key.manage`
- `integration.event.ingest`

### Audit
- `audit.read`

### Reports
- `report.export`

### Notifications
- `notification.read`

### Cargo
- `cargo.read`, `cargo.register`, `cargo.release`, `cargo.transport.plan`, `cargo.transport.depart`, `cargo.transport.arrive`, `cargo.handoff.record`, `cargo.claim.settle`, `cargo.delivery.complete`, `cargo.delivery.exception.record`, `cargo.delivery.exception.resolve`, `cargo.compliance.record`, `cargo.compliance.verify`

### Tracking
- `tracking.shipment.read`, `tracking.event.record`, `tracking.exception.manage`, `tracking.exception.resolve`

### Capacity
- `capacity.read`, `capacity.manage`, `capacity.slot.reserve`, `capacity.slot.cancel`, `capacity.advisory.decide`

### Planning
- `planning.order.read`, `planning.order.confirm`, `planning.order.cancel`, `planning.order.reschedule`, `planning.order.dispatch`

### Tariff
- `tariff.read`, `tariff.manage`, `tariff.quote.calculate`, `tariff.quote.approve`

### Billing
- `billing.read`

## RPC Metadata Authorization Rules

- Mutations MUST explicitly declare auth mode
- Public operations MUST NOT have permissions
- Public operations MUST NOT require organization scope
- Critical audit + low criticality is FORBIDDEN

## TODO

- Default roles on org creation — NOT IMPLEMENTED
- Role hierarchy (inheritance) — NOT IMPLEMENTED
- Resource-level permission scoping — NOT IMPLEMENTED
