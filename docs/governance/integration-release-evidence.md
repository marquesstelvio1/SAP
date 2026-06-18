# Integration Gateway Release Evidence

## Release Candidate

Integration Gateway is a governance module release candidate for local production readiness. It
does not call external providers; it proves the local service-account, API-key, idempotent event,
audit, and outbox lifecycle required before real adapters are enabled.

## Contract Evidence

- `integration.gateway.overview.read` accepts `integration.api_key.manage` or
  `integration.event.ingest`, session auth, and organization scope.
- `integration.service_account.create` requires `integration.api_key.manage`, idempotency, session
  auth, organization scope, critical audit, and outbox evidence.
- `integration.event.record` requires `integration.event.ingest`, an active scoped service account,
  tenant idempotency, critical audit, and outbox evidence.
- RPC schemas validate service account summaries, key prefixes, simple JSON event payloads, replay
  state, audit evidence, and outbox evidence.

## Backend Evidence

- `/rpc/integrations/overview` reads only tenant-scoped service accounts and integration events.
- `/rpc/integrations/createServiceAccount` stores API key hashes only and returns plaintext once.
- `/rpc/integrations/recordEvent` blocks missing or inactive service accounts.
- Event registration enforces `organizationId + sourceSystem + externalId` idempotency.
- Service account creation and event registration write audit and outbox transactionally.

## Frontend Evidence

- `/app/integrations` is protected by `requirePlatformSession`.
- The UI disables service account provisioning without `integration.api_key.manage`.
- The UI disables event registration without `integration.event.ingest`.
- The UI displays service accounts, key prefixes, scopes, recent external events, and security
  controls.
- The UI submits real Server Actions backed by oRPC instead of mutating local state directly.

## Acceptance Criteria

- Tenant-scoped integration gateway overview.
- Governed service account and API key provisioning.
- API key plaintext returned only once and stored hash-only.
- Integration event registration requires active service account scope.
- Idempotent external event registration by organization, source system, and external ID.
- Integration Gateway writes audit and outbox evidence.
- Protected integration UI with service account and event forms.
- Authenticated integration E2E provisions a service account and records an external event.

## Validation Phrases

- tenant-scoped integration gateway overview
- API key plaintext returned only once and stored hash-only
- idempotent external event registration by organization, source system, and external ID
