export const rbacBootstrapPermissions = [
  {
    key: "tenant.manage",
    description: "Manage tenant settings and administrative organization controls.",
  },
  { key: "identity.user.invite", description: "Invite users into an organization." },
  {
    key: "identity.role.assign",
    description: "Assign roles and permission-bearing access to organization members.",
  },
  {
    key: "integration.api_key.manage",
    description: "Create, rotate, revoke, and manage service account API keys.",
  },
  {
    key: "integration.event.ingest",
    description: "Register idempotent external integration events for tenant operations.",
  },
  { key: "audit.read", description: "Read audit records and security-relevant activity trails." },
  {
    key: "report.export",
    description: "Export reports subject to authorization, retention, and audit policy.",
  },
  {
    key: "notification.read",
    description: "Read and acknowledge tenant-scoped operational notifications.",
  },
  {
    key: "cargo.read",
    description:
      "Read tenant-scoped cargo records, custody state, compliance status, and risk flags.",
  },
  {
    key: "cargo.register",
    description:
      "Register cargo under governed business rules with idempotency, audit, and outbox events.",
  },
  {
    key: "cargo.release",
    description:
      "Release cargo for transport only after customs, inspection, status, audit, and outbox rules pass.",
  },
  {
    key: "cargo.transport.plan",
    description:
      "Create an operational tracking shipment from released cargo with governed planning, audit, and outbox.",
  },
  {
    key: "cargo.transport.depart",
    description:
      "Depart released cargo with approved compliance evidence and update tracking in one governed transaction.",
  },
  {
    key: "cargo.transport.arrive",
    description:
      "Confirm operational arrival for in-transit cargo and update tracking with audit and outbox.",
  },
  {
    key: "cargo.handoff.record",
    description:
      "Record port, rail, terminal, or carrier operational cargo handoffs with custody transfer, audit, and outbox.",
  },
  {
    key: "cargo.claim.settle",
    description:
      "Record governed accounting settlement for accepted cargo delivery claims with audit and outbox.",
  },
  {
    key: "cargo.delivery.complete",
    description:
      "Complete final cargo handover only after governed arrival, updating cargo and tracking transactionally.",
  },
  {
    key: "cargo.delivery.exception.record",
    description:
      "Record damaged or non-sound delivery attempts and move cargo/tracking into governed exception state.",
  },
  {
    key: "cargo.delivery.exception.resolve",
    description:
      "Resolve cargo delivery exceptions after inspection or claim handling and reopen delivery completion.",
  },
  {
    key: "cargo.compliance.record",
    description:
      "Record tenant-scoped cargo compliance evidence with idempotency, audit, and outbox.",
  },
  {
    key: "cargo.compliance.verify",
    description:
      "Approve or reject cargo compliance evidence with governed review, audit, and outbox.",
  },
  {
    key: "tracking.shipment.read",
    description: "Read operational tracking shipments, milestones, and logistics status.",
  },
  {
    key: "tracking.event.record",
    description: "Record operational tracking events for shipments and multimodal movements.",
  },
  {
    key: "tracking.exception.manage",
    description: "Manage tracking exceptions, delays, holds, and operational recovery notes.",
  },
  {
    key: "tracking.exception.resolve",
    description:
      "Resolve tracking exceptions and release affected shipments from operational holds.",
  },
  {
    key: "capacity.read",
    description: "Read tenant-scoped operational capacity resources, slots, and reservations.",
  },
  {
    key: "capacity.manage",
    description:
      "Register operational capacity resources and open governed slot windows with audit and outbox.",
  },
  {
    key: "capacity.slot.reserve",
    description:
      "Reserve operational capacity slots for cargo movement, handoff, arrival, delivery, or storage.",
  },
  {
    key: "capacity.slot.cancel",
    description: "Cancel active operational slot reservations with audit and outbox.",
  },
  {
    key: "capacity.advisory.decide",
    description:
      "Approve or reject capacity advisory recommendations with human decision evidence.",
  },
  {
    key: "planning.order.read",
    description:
      "Read tenant-scoped transport orders, confirmations, linked cargo, capacity, and tracking context.",
  },
  {
    key: "planning.order.confirm",
    description:
      "Confirm governed transport orders only after cargo, timing, route, responsibility, and optional capacity rules pass.",
  },
  {
    key: "planning.order.cancel",
    description:
      "Cancel confirmed transport orders before departure with reason, idempotency, audit, and outbox.",
  },
  {
    key: "planning.order.reschedule",
    description:
      "Reschedule confirmed transport orders before departure with route, timing, audit, and outbox.",
  },
  {
    key: "planning.order.dispatch",
    description:
      "Dispatch confirmed transport orders into execution with operational instructions, idempotency, audit, and outbox.",
  },
  {
    key: "tariff.read",
    description: "Read tenant-scoped tariff rate cards, pricing rules, and quote history.",
  },
  {
    key: "tariff.manage",
    description:
      "Manage governed tariff rate cards and pricing rules with idempotency, audit, and outbox.",
  },
  {
    key: "tariff.quote.calculate",
    description:
      "Calculate governed tariff quotes for eligible cargo using active rate cards and auditable pricing rules.",
  },
  {
    key: "tariff.quote.approve",
    description:
      "Approve calculated tariff quotes with explicit approval evidence and audit trail.",
  },
] as const;

export type RbacBootstrapPermissionKey = (typeof rbacBootstrapPermissions)[number]["key"];

export const rbacBootstrapRoleTemplates = [
  {
    key: "tenant.admin",
    name: "Tenant Administrator",
    description: "Full administrative access for an organization.",
    permissions: [
      "tenant.manage",
      "identity.user.invite",
      "identity.role.assign",
      "integration.api_key.manage",
      "integration.event.ingest",
      "audit.read",
      "report.export",
      "notification.read",
      "cargo.read",
      "cargo.register",
      "cargo.release",
      "cargo.transport.plan",
      "cargo.transport.depart",
      "cargo.transport.arrive",
      "cargo.handoff.record",
      "cargo.claim.settle",
      "cargo.delivery.complete",
      "cargo.delivery.exception.record",
      "cargo.delivery.exception.resolve",
      "cargo.compliance.record",
      "cargo.compliance.verify",
      "tracking.shipment.read",
      "tracking.event.record",
      "tracking.exception.manage",
      "tracking.exception.resolve",
      "capacity.read",
      "capacity.manage",
      "capacity.slot.reserve",
      "capacity.slot.cancel",
      "capacity.advisory.decide",
      "planning.order.read",
      "planning.order.confirm",
      "planning.order.cancel",
      "planning.order.reschedule",
      "planning.order.dispatch",
      "tariff.read",
      "tariff.manage",
      "tariff.quote.calculate",
      "tariff.quote.approve",
    ],
  },
  {
    key: "tenant.security_admin",
    name: "Security Administrator",
    description: "Manage users, roles, permissions, and security audit access.",
    permissions: [
      "identity.user.invite",
      "identity.role.assign",
      "audit.read",
      "notification.read",
    ],
  },
  {
    key: "tenant.integration_admin",
    name: "Integration Administrator",
    description: "Manage service credentials and review integration audit activity.",
    permissions: [
      "integration.api_key.manage",
      "integration.event.ingest",
      "tracking.event.record",
      "audit.read",
      "notification.read",
    ],
  },
  {
    key: "tenant.auditor",
    name: "Tenant Auditor",
    description: "Read audit trails and export governed reports.",
    permissions: ["audit.read", "report.export", "notification.read"],
  },
  {
    key: "tenant.report_exporter",
    name: "Report Exporter",
    description: "Export governed reports without broader administration rights.",
    permissions: [
      "report.export",
      "tracking.shipment.read",
      "cargo.read",
      "capacity.read",
      "planning.order.read",
      "tariff.read",
    ],
  },
  {
    key: "tenant.finance_manager",
    name: "Finance Manager",
    description: "Manage tariff, pricing, quote approval, and governed financial exports.",
    permissions: [
      "cargo.read",
      "tariff.read",
      "tariff.manage",
      "tariff.quote.calculate",
      "tariff.quote.approve",
      "audit.read",
      "report.export",
      "notification.read",
    ],
  },
  {
    key: "tenant.cargo_operator",
    name: "Cargo Operator",
    description: "Execute cargo registration, release, custody, delivery, and exception workflows.",
    permissions: [
      "cargo.read",
      "cargo.register",
      "cargo.release",
      "cargo.transport.plan",
      "cargo.transport.depart",
      "cargo.transport.arrive",
      "cargo.handoff.record",
      "cargo.delivery.complete",
      "cargo.delivery.exception.record",
      "cargo.delivery.exception.resolve",
      "cargo.compliance.record",
      "tracking.shipment.read",
      "tracking.event.record",
      "capacity.read",
      "planning.order.read",
      "notification.read",
    ],
  },
  {
    key: "tenant.capacity_planner",
    name: "Capacity Planner",
    description:
      "Manage capacity resources, slots, reservations, advisory decisions, and planning.",
    permissions: [
      "capacity.read",
      "capacity.manage",
      "capacity.slot.reserve",
      "capacity.slot.cancel",
      "capacity.advisory.decide",
      "cargo.read",
      "planning.order.read",
      "planning.order.confirm",
      "planning.order.reschedule",
      "planning.order.dispatch",
      "report.export",
      "notification.read",
    ],
  },
  {
    key: "tenant.tracking_operator",
    name: "Tracking Operator",
    description: "Operate shipment tracking, movement events, exceptions, and recovery workflows.",
    permissions: [
      "tracking.shipment.read",
      "tracking.event.record",
      "tracking.exception.manage",
      "tracking.exception.resolve",
      "cargo.read",
      "notification.read",
    ],
  },
  {
    key: "tenant.compliance_officer",
    name: "Compliance Officer",
    description: "Review cargo compliance evidence, release readiness, audit trails, and exports.",
    permissions: [
      "cargo.read",
      "cargo.release",
      "cargo.compliance.record",
      "cargo.compliance.verify",
      "audit.read",
      "report.export",
      "notification.read",
    ],
  },
  {
    key: "tenant.integration_operator",
    name: "Integration Operator",
    description: "Ingest external operational events and execute tracking-producing adapters.",
    permissions: [
      "integration.event.ingest",
      "tracking.event.record",
      "tracking.shipment.read",
      "audit.read",
      "notification.read",
    ],
  },
  {
    key: "tenant.operations_manager",
    name: "Operations Manager",
    description: "Manage operational tracking visibility, events, and logistics exceptions.",
    permissions: [
      "cargo.read",
      "cargo.register",
      "cargo.release",
      "cargo.transport.plan",
      "cargo.transport.depart",
      "cargo.transport.arrive",
      "cargo.handoff.record",
      "cargo.claim.settle",
      "cargo.delivery.complete",
      "cargo.delivery.exception.record",
      "cargo.delivery.exception.resolve",
      "cargo.compliance.record",
      "cargo.compliance.verify",
      "tracking.shipment.read",
      "tracking.event.record",
      "tracking.exception.manage",
      "tracking.exception.resolve",
      "capacity.read",
      "capacity.manage",
      "capacity.slot.reserve",
      "capacity.slot.cancel",
      "capacity.advisory.decide",
      "planning.order.read",
      "planning.order.confirm",
      "planning.order.cancel",
      "planning.order.reschedule",
      "planning.order.dispatch",
      "tariff.read",
      "tariff.manage",
      "tariff.quote.calculate",
      "tariff.quote.approve",
      "audit.read",
      "report.export",
      "notification.read",
    ],
  },
  {
    key: "tenant.operations_viewer",
    name: "Operations Viewer",
    description: "Read operational tracking dashboards and shipment status.",
    permissions: [
      "cargo.read",
      "tracking.shipment.read",
      "capacity.read",
      "planning.order.read",
      "tariff.read",
      "notification.read",
    ],
  },
] as const satisfies readonly RbacBootstrapRoleTemplate[];

export type RbacBootstrapRoleTemplate = {
  key: string;
  name: string;
  description: string;
  permissions: readonly RbacBootstrapPermissionKey[];
};
