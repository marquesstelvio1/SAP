# SAPTM Personas

## Persona 1: Carlos — Logistics Operator

**Role:** Logistics Operator
**Age:** 36
**Experience:** 12 years in port and rail logistics operations
**Tech Comfort:** Moderate — uses operational systems daily, prefers structured workflows

**Environment:** Works 12-hour shifts at a logistics terminal. Manages 20-50 cargo movements per shift across rail, port, and road transport modes. Reports to Operations Manager.

**Goals:**
- Register cargo quickly and accurately during peak receiving hours.
- Ensure cargo moves through transport lifecycle without delays.
- Record exceptions with complete evidence to avoid claim disputes.
- Maintain custody chain through accurate handoff recordings.

**Frustrations:**
- Repetitive data entry for frequent shippers (same origin, same custody owner).
- Manual compliance document checks before departure approval.
- Writing exception summaries under time pressure while cargo is held.
- Switching between cargo management and tracking views to verify shipment state.

**Success Metrics:**
- Cargo registered within 5 minutes of receiving.
- Zero compliance evidence rejections for incomplete documentation.
- Exception resolution within 24 hours of recording.
- Accurate handoff recordings with correct custody chain.

**Device:** Desktop workstation with dual monitors; limited mobile access for yard operations.

**Key Permissions Needed:**
`cargo.read`, `cargo.register`, `cargo.release`, `cargo.transport.plan`, `cargo.transport.depart`, `cargo.transport.arrive`, `cargo.delivery.complete`, `cargo.delivery.exception.record`, `cargo.handoff.record`, `cargo.compliance.record`, `tracking.shipment.read`, `tracking.event.record`

---

## Persona 2: Maria — Operations Manager

**Role:** Operations Manager
**Age:** 42
**Experience:** 18 years in supply chain and logistics management
**Tech Comfort:** High — experienced with ERP systems, expects analytics and reporting

**Environment:** Manages a team of 8-15 logistics operators across two shifts. Responsible for capacity planning, tariff pricing, and operational KPIs. Reports to Director of Operations.

**Goals:**
- Optimize infrastructure capacity utilization (terminal gates, berths, rail tracks).
- Maintain accurate rate cards and pricing rules for customer quotes.
- Resolve escalated delivery exceptions and approve claim settlements.
- Monitor team performance and SLA compliance across cargo operations.

**Frustrations:**
- Capacity advisory recommendations lack clear prioritization.
- Rate rule creation is error-prone without visual calculation preview.
- No consolidated view of team workload and pending items.
- Quote approval requires manual verification against rate card rules.

**Success Metrics:**
- Capacity utilization above 75% across all resource types.
- Exception resolution SLA met (95% within 48 hours).
- Quote accuracy within 2% of calculated vs actual charges.
- Team exception recording quality score above 90%.

**Device:** Laptop with external monitor; tablet for yard walkarounds.

**Key Permissions Needed:**
`capacity.read`, `capacity.manage`, `capacity.slot.reserve`, `capacity.slot.cancel`, `capacity.advisory.decide`, `tariff.read`, `tariff.manage`, `tariff.quote.calculate`, `tariff.quote.approve`, `cargo.delivery.exception.resolve`, `cargo.claim.settle`, `planning.order.read`, `planning.order.confirm`, `tracking.shipment.read`, `tracking.exception.manage`, `report.export`

---

## Persona 3: Joao — Administrator

**Role:** Platform Administrator
**Age:** 45
**Experience:** 20 years in IT management, last 5 in logistics technology
**Tech Comfort:** Expert — infrastructure and security focused

**Environment:** Administers the SAPTM platform for a mid-size logistics organization (50-200 users). Manages tenant configuration, RBAC, security policies, and compliance. Reports to CTO.

**Goals:**
- Maintain secure tenant isolation and access control.
- Ensure all critical operations are audited and traceable.
- Streamline user onboarding and offboarding.
- Meet compliance requirements for logistics data governance.

**Frustrations:**
- Permission matrix has 64+ granular permissions across 15 domains — hard to manage.
- No permission change history or diff view for audit reviews.
- Audit log search is text-based without structured filtering.
- Offboarding requires manual steps across multiple domains (admin, teams, webhooks).

**Success Metrics:**
- Zero security incidents related to access control.
- User onboarding completed within 2 hours of request.
- Audit trail completeness for all critical operations (100%).
- Compliance audit pass with zero findings.

**Device:** Desktop workstation; laptop for on-call incident response.

**Key Permissions Needed:**
`tenant.manage`, `identity.user.invite`, `identity.role.assign`, `audit.read`, `audit.export`, `billing.overview`, `settings.organization.update`, `settings.branding.update`, `notification.read`, `report.export`, `integration.api_key.manage`, `webhook.create`, `webhook.update`, `webhook.delete`

---

## Persona 4: Ana — External Integrator

**Role:** Integration Engineer
**Age:** 31
**Experience:** 8 years in software engineering, 3 in logistics API integration
**Tech Comfort:** Expert — API-first, automation-focused

**Environment:** Works for a third-party logistics software provider integrating with SAPTM. Manages connections between SAPTM and external systems: Port TOS, Rail TMS, Carrier TMS, Telematics GPS, Customs ERP, Warehouse WMS.

**Goals:**
- Integrate external systems with SAPTM via service accounts and event ingestion.
- Maintain reliable event ingestion pipelines with idempotency guarantees.
- Monitor integration health and troubleshoot delivery failures.
- Adapt to API contract versioning with minimal disruption.

**Frustrations:**
- Service account creation requires admin approval, slowing integration development.
- Event ingestion errors lack structured error details for automated retry logic.
- No integration sandbox or staging environment documented.
- API contract changes require manual migration effort per adapter.

**Success Metrics:**
- Integration pipeline uptime above 99.9%.
- Event ingestion error rate below 0.1%.
- Integration deployment within 2 weeks of requirements finalization.
- Zero data loss during adapter or SAPTM-side failures.

**Device:** Laptop with multiple monitoring dashboards; API testing tools (Postman/Insomnia).

**Key Permissions Needed:**
`integration.api_key.manage`, `integration.event.ingest`, `tracking.event.record`, `tracking.shipment.read`, `tracking.exception.manage`, `cargo.read`, `cargo.register`, `cargo.handoff.record`, `webhook.create`, `webhook.list`, `webhook.deliveryLog`, `webhook.retryDelivery`

**Integration Points:**
- Port TOS adapter: vessel movements, berth allocation
- Rail TMS adapter: train departures/arrivals, rail track assignments
- Carrier TMS adapter: truck dispatch, delivery confirmations
- Telematics GPS adapter: real-time position data
- Customs ERP adapter: customs clearance status updates
- Warehouse WMS adapter: warehouse activity events
