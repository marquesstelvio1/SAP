# Release Evidence

## Purpose

Release evidence turns platform readiness into an auditable artifact. It does not approve a release
by itself; it gives the release owner a structured go/no-go package.

## Generated Evidence

`scripts/generate-release-evidence.mjs` writes:

- `reports/release-evidence/saptm-release-evidence.json`
- `reports/release-evidence/saptm-release-evidence.md`

The generated report includes:

- CI gate command inventory.
- Foundation file evidence.
- Business Module Evidence for the first accepted business module.
- Governance Module Evidence for Audit Query / Export.
- Governance Module Evidence for Operational Reports / Export.
- Governance Module Evidence for Notifications / Inbox.
- Governance Module Evidence for Integration Gateway.
- Governance Module Evidence for Port TOS Adapter.
- Governance Module Evidence for Rail TMS Adapter.
- Governance Module Evidence for Carrier TMS Adapter.
- Governance Module Evidence for Telematics GPS Adapter.
- Governance Module Evidence for Customs ERP Adapter.
- Governance Module Evidence for Warehouse WMS Adapter.
- Business Module Evidence for Transport Planning.
- Repository, ref, SHA, and run metadata.
- Human decision placeholder set to `pending-human-go-no-go`.
- Production cutover handoff evidence for environment-owned registry, secrets, cluster, DNS/TLS,
  observability, backup/DR, security, and load-test inputs.

## Business Module Evidence

Operational Tracking is the first business module release candidate. The generated report must list:

- Required tracking gates.
- Tracking release evidence files.
- Exception workflow completion criteria.
- Operator evidence and approval requirements.
- Operational analytics aggregate criteria.
- Local advisory recommendations with mandatory human approval.
- Visual regression coverage for critical local UI states.
- Authenticated local QA across Tracking, Cargo, Capacity, Planning, Tariff, Admin, Audit, and Reports using deterministic seed data.
- Authenticated local QA submits real governed UI commands for Cargo, Capacity, Planning, Tariff, Admin Identity/RBAC, Audit export, Reports export, Notifications, and Integrations.

Cargo Management is the second business module P0-P8 release candidate. The generated report must
list:

- Required cargo gates.
- Cargo release evidence files.
- Governed cargo registration criteria.
- Cargo business rules for hazardous cargo, customs hold, damaged cargo, and inspection blockers.
- Cargo registration audit/outbox criteria.

Capacity Management is the third business module P9 release candidate. The generated report must
list:

- Required capacity gates.
- Capacity release evidence files.
- Governed resource registration, slot opening, reservation, and cancellation criteria.
- No-overbooking and reserved-unit release criteria.
- Capacity audit/outbox criteria.
- Capacity optimization advisory criteria with human approval and no autonomous execution.
- Capacity advisory decision criteria with idempotency, audit, outbox, and no autonomous execution.
- Capacity advisory decision analytics criteria with tenant-scoped read-only aggregates and no
  autonomous execution.

Transport Planning is the fifth business module P26 release candidate. The generated report must
list:

- Required planning gates.
- Transport Planning release evidence files.
- Tenant-scoped planning overview criteria.
- Governed and idempotent transport order confirmation criteria.
- Governed and idempotent transport order reschedule criteria.
- Governed and idempotent transport order dispatch criteria.
- Governed and idempotent transport order cancellation criteria.
- Cargo eligibility, customs, sound condition, route, timing, capacity, tracking, and duplicate
  blocking criteria.
- Cancellation confirmed-state, pre-departure timing, reason, unique reference, no existing
  dispatch, capacity signal, and tracking signal criteria.
- Reschedule confirmed-state, route change, timing, unique revision, capacity-window alignment, no
  existing dispatch, and tracking signal criteria.
- Dispatch confirmed-state, post-confirmation/latest-schedule timing, unique dispatch reference,
  duplicate-order blocking, capacity readiness, and tracking signal criteria.
- Planning audit/outbox criteria.
- Protected Planning UI, reschedule UI, dispatch UI, cancellation UI, authenticated form submission,
  and deterministic demo seed coverage.

Audit Query / Export is the first governance module release candidate. The generated report must
list:

- Required audit gates.
- Audit release evidence files.
- Tenant-scoped audit record search.
- Governed CSV export.
- `audit.read` and `report.export` permission criteria.
- Audit export audit/outbox criteria.

Operational Reports / Export is the second governance module release candidate. The generated
report must list:

- Required reports gates.
- Reports release evidence files.
- Tracking, Cargo, Capacity, Planning, and Tariff CSV export criteria.
- `report.export` and domain read permission criteria.
- Reports export audit/outbox criteria.

Notifications / Inbox is the third governance module release candidate. The generated report must
list:

- Required notifications gates.
- Notifications release evidence files.
- Tenant-scoped notification inbox criteria.
- `notification.read` permission criteria.
- Outbox worker publishing criteria.
- Notification acknowledgement audit criteria.

Integration Gateway is the fourth governance module release candidate. The generated report must
list:

- Required integration gates.
- Integration release evidence files.
- Tenant-scoped integration gateway overview.
- Hash-only API key storage with plaintext displayed once.
- Active service account scope requirement for external events.
- Idempotent external event registration by organization, source system, and external ID.
- Integration audit/outbox criteria.

Port TOS Adapter is the fifth governance module release candidate. The generated report must list:

- Required Port TOS adapter gates.
- Port TOS adapter release evidence files.
- Active service account scope requirements.
- Port TOS movement to tracking event mapping.
- Transactional integration event and tracking event processing.
- Adapter audit/outbox criteria.

Rail TMS Adapter is the sixth governance module release candidate. The generated report must list:

- Required Rail TMS adapter gates.
- Rail TMS adapter release evidence files.
- Active service account scope requirements.
- Rail TMS movement to tracking event mapping.
- Transactional integration event and tracking event processing.
- Adapter audit/outbox criteria.

Carrier TMS Adapter is the seventh governance module release candidate. The generated report must
list:

- Required Carrier TMS adapter gates.
- Carrier TMS adapter release evidence files.
- Active service account scope requirements.
- Carrier TMS movement to tracking event mapping.
- Transactional integration event and tracking event processing.
- Adapter audit/outbox criteria.

Telematics GPS Adapter is the eighth governance module release candidate. The generated report must
list:

- Required Telematics GPS adapter gates.
- Telematics GPS adapter release evidence files.
- Active service account scope requirements.
- Telematics GPS position to tracking event mapping.
- Coordinate, speed, and heading validation.
- Transactional integration event and tracking event processing.
- Adapter audit/outbox criteria.

Customs ERP Adapter is the ninth governance module release candidate. The generated report must
list:

- Required Customs ERP adapter gates.
- Customs ERP adapter release evidence files.
- Active service account scope requirements.
- Customs ERP status to tracking event mapping.
- Customs, document, declaration, broker, and authority evidence preservation.
- Transactional integration event and tracking event processing.
- Adapter audit/outbox criteria.

Warehouse WMS Adapter is the tenth governance module release candidate. The generated report must
list:

- Required Warehouse WMS adapter gates.
- Warehouse WMS adapter release evidence files.
- Active service account scope requirements.
- Warehouse and yard activity to tracking event mapping.
- Warehouse, zone, dock, container, handling unit, operator, and pallet evidence preservation.
- Transactional integration event and tracking event processing.
- Adapter audit/outbox criteria.

## External Production Evidence

The generated report also lists evidence that cannot be proven from static CI alone:

- Cluster preflight output from the target cluster.
- Validate production handoff gate output.
- Production cutover handoff owner-input evidence.
- ACME account email and rendered ClusterIssuer evidence.
- Runtime smoke output against public staging or production URLs.
- Valid TLS certificate and HTTPS redirect evidence.
- Target DNS, GitHub environment URL variables, and rendered ingress evidence.
- Prometheus target, alert routing, and Grafana dashboard evidence.
- Alertmanager generated config secret and test alert route evidence.
- Latest successful database backup and restore evidence.
- External Secrets Operator generated secret evidence.
- ResourceQuota and LimitRange evidence from target namespaces.
- Cosign signature verification and vulnerability scan artifact evidence.

## Production Rules

- Do not treat generated evidence as approval.
- Attach release evidence to the release gate review.
- Keep generated evidence free of secrets.
- Use target-cluster evidence for production go/no-go.

## Acceptance Criteria

- Platform CI generates release evidence after build.
- Platform CI uploads evidence as an artifact.
- Evidence includes CI gates and foundation files.
- Evidence includes Operational Tracking as a business module release candidate.
- Evidence includes Cargo Management as a business module release candidate.
- Evidence includes Capacity Management as a business module release candidate.
- Evidence includes Capacity Optimization Advisory as a local release candidate.
- Evidence includes Capacity Advisory Decision as a local release candidate.
- Evidence includes Capacity Advisory Decision Analytics as a local release candidate.
- Evidence includes Transport Planning as a business module release candidate.
- Evidence includes Audit Query / Export as a governance module release candidate.
- Evidence includes Operational Reports / Export as a governance module release candidate.
- Evidence includes Notifications / Inbox as a governance module release candidate.
- Evidence includes Integration Gateway as a governance module release candidate.
- Evidence includes Port TOS Adapter as a governance module release candidate.
- Evidence includes Rail TMS Adapter as a governance module release candidate.
- Evidence includes Carrier TMS Adapter as a governance module release candidate.
- Evidence includes Telematics GPS Adapter as a governance module release candidate.
- Evidence includes Customs ERP Adapter as a governance module release candidate.
- Evidence includes Warehouse WMS Adapter as a governance module release candidate.
- Evidence includes authenticated local QA and deterministic demo seed coverage.
- Evidence includes authenticated form-submission QA for governed business commands.
- Evidence includes authenticated form-submission QA for governed Admin Identity/RBAC commands.
- Evidence includes authenticated export QA for Audit Query / Export.
- Evidence includes authenticated export QA for Operational Reports / Export.
- Evidence lists required external production checks.
- Evidence includes production cutover handoff artifacts and owner-input requirements.
