import assert from "node:assert/strict";
import { test } from "node:test";

import {
  capacityAdvisoryDecisionAnalyticsInputSchema,
  capacityAdvisoryDecisionAnalyticsMetadata,
  capacityAdvisoryDecisionAnalyticsOutputSchema,
  capacityAdvisoryDecisionRecordInputSchema,
  capacityAdvisoryDecisionRecordMetadata,
  capacityAdvisoryDecisionRecordOutputSchema,
  capacityAdvisoryInputSchema,
  capacityAdvisoryMetadata,
  capacityAdvisoryOutputSchema,
  capacityOverviewInputSchema,
  capacityOverviewMetadata,
  capacityOverviewOutputSchema,
  capacityResourceRegisterInputSchema,
  capacityResourceRegisterMetadata,
  capacityResourceRegisterOutputSchema,
  capacitySlotCancelInputSchema,
  capacitySlotCancelMetadata,
  capacitySlotCancelOutputSchema,
  capacitySlotOpenInputSchema,
  capacitySlotOpenMetadata,
  capacitySlotOpenOutputSchema,
  capacitySlotReserveInputSchema,
  capacitySlotReserveMetadata,
  capacitySlotReserveOutputSchema,
} from "../dist/index.js";

const now = "2026-06-05T10:00:00.000Z";
const later = "2026-06-05T14:00:00.000Z";

const resource = {
  id: "resource_001",
  resourceCode: "TER-LAD-01",
  resourceName: "Terminal Luanda",
  resourceType: "terminal",
  locationName: "Porto de Luanda",
  maxConcurrentBookings: 10,
  sourceSystem: "saptm",
  createdAt: now,
  updatedAt: now,
};

const slot = {
  id: "slot_001",
  resourceId: "resource_001",
  resourceCode: "TER-LAD-01",
  resourceType: "terminal",
  locationName: "Porto de Luanda",
  slotReference: "SLOT-001",
  windowStartAt: now,
  windowEndAt: later,
  capacityUnits: 10,
  reservedUnits: 2,
  availableUnits: 8,
  status: "open",
  sourceSystem: "saptm",
  createdAt: now,
  updatedAt: now,
};

const reservation = {
  id: "reservation_001",
  cargoId: "cargo_001",
  cargoReference: "CGO-2026-0001",
  slotId: "slot_001",
  reservationReference: "RSV-001",
  reservationPurpose: "departure",
  status: "reserved",
  reservedUnits: 2,
  reservedByName: "Operations Controller",
  reservedAt: "2026-06-05T11:00:00.000Z",
  cancellationReference: null,
  cancelledByName: null,
  cancellationReason: null,
  cancelledAt: null,
  sourceSystem: "saptm",
  createdAt: now,
  updatedAt: now,
};

const cargo = {
  id: "cargo_001",
  cargoReference: "CGO-2026-0001",
  cargoDescription: "Rail containers",
  status: "ready_for_transport",
  custodyOwnerName: "Rail Ops",
};

test("capacity overview metadata requires session and capacity read permission", () => {
  assert.equal(capacityOverviewMetadata.name, "capacity.overview.read");
  assert.equal(capacityOverviewMetadata.kind, "query");
  assert.equal(capacityOverviewMetadata.auth, "session");
  assert.equal(capacityOverviewMetadata.organizationRequired, true);
  assert.deepEqual(capacityOverviewMetadata.permissions, ["capacity.read"]);
  assert.equal(capacityOverviewMetadata.audit, "standard");
  assert.equal(capacityOverviewMetadata.observability.criticality, "high");
});

test("capacity overview schema validates slot and reservation dashboard", () => {
  assert.deepEqual(capacityOverviewInputSchema.parse(undefined), { limit: 10 });

  const output = capacityOverviewOutputSchema.parse({
    generatedAt: now,
    organizationId: "org_port_rail",
    totals: {
      resources: 1,
      openSlots: 1,
      blockedSlots: 0,
      closedSlots: 0,
      activeReservations: 1,
    },
    upcomingSlots: [slot],
    recentReservations: [reservation],
  });

  assert.equal(output.upcomingSlots[0].availableUnits, 8);
  assert.equal(output.recentReservations[0].reservationPurpose, "departure");
});

test("capacity optimization advisory schemas validate human-approved recommendations", () => {
  assert.equal(capacityAdvisoryMetadata.name, "capacity.optimization.advisory.read");
  assert.equal(capacityAdvisoryMetadata.kind, "query");
  assert.deepEqual(capacityAdvisoryMetadata.permissions, ["capacity.read"]);
  assert.equal(capacityAdvisoryMetadata.audit, "standard");
  assert.deepEqual(capacityAdvisoryInputSchema.parse(undefined), { limit: 5 });

  const output = capacityAdvisoryOutputSchema.parse({
    generatedAt: now,
    organizationId: "org_port_rail",
    policy: {
      automationAllowed: false,
      humanApprovalRequired: true,
      source: "rule_based_capacity_optimizer",
    },
    recommendations: [
      {
        id: "capacity-advisory:slot_saturation:slot_001",
        type: "slot_saturation",
        severity: "high",
        title: "Rever saturacao de slot operacional",
        rationale: "Slot proximo do limite de capacidade.",
        recommendedAction: "Abrir capacidade adicional pelo fluxo governado.",
        slot,
        reservation: null,
        metrics: {
          utilizationPercent: 80,
          availableUnits: 2,
          hoursUntilWindowEnd: 4,
        },
        humanApprovalRequired: true,
        approvalRequiredFor: "capacity.manage",
        confidenceScore: 0.84,
        source: "rule_based_capacity_optimizer",
      },
    ],
  });

  assert.equal(output.policy.automationAllowed, false);
  assert.equal(output.recommendations[0].humanApprovalRequired, true);
  assert.equal(output.recommendations[0].source, "rule_based_capacity_optimizer");
});

test("capacity advisory decision contract requires human approval evidence", () => {
  assert.equal(capacityAdvisoryDecisionRecordMetadata.name, "capacity.advisory.decision.record");
  assert.deepEqual(capacityAdvisoryDecisionRecordMetadata.permissions, [
    "capacity.advisory.decide",
  ]);
  assert.equal(capacityAdvisoryDecisionRecordMetadata.idempotency, "required");

  assert.throws(() =>
    capacityAdvisoryDecisionRecordInputSchema.parse({
      recommendationId: "capacity-advisory:slot_saturation:slot_001",
      recommendationType: "slot_saturation",
      decisionStatus: "approved",
      decidedByName: "Capacity Manager",
      decisionReason: "Approved after operational review.",
      requiredPermission: "capacity.manage",
      slotId: "slot_001",
      decidedAt: now,
      idempotencyKey: "idem_capacity_advisory_decision_001",
    }),
  );

  const input = capacityAdvisoryDecisionRecordInputSchema.parse({
    recommendationId: "capacity-advisory:slot_saturation:slot_001",
    recommendationType: "slot_saturation",
    decisionStatus: "approved",
    decidedByName: "Capacity Manager",
    decisionReason: "Approved after operational review.",
    approvalReference: "APR-CAP-001",
    requiredPermission: "capacity.manage",
    slotId: "slot_001",
    decidedAt: now,
    idempotencyKey: "idem_capacity_advisory_decision_001",
  });

  const output = capacityAdvisoryDecisionRecordOutputSchema.parse({
    organizationId: "org_port_rail",
    decisionId: "decision_001",
    decision: {
      id: "decision_001",
      recommendationId: input.recommendationId,
      recommendationType: input.recommendationType,
      decisionStatus: input.decisionStatus,
      decidedByName: input.decidedByName,
      decisionReason: input.decisionReason,
      approvalReference: input.approvalReference,
      requiredPermission: input.requiredPermission,
      slotId: input.slotId,
      reservationId: null,
      sourceSystem: input.sourceSystem,
      decidedAt: input.decidedAt,
      createdAt: now,
      updatedAt: now,
    },
    businessRules: {
      decisionAccepted: true,
      recommendationTraceable: true,
      humanDecisionCaptured: true,
      approvalReferenceRequired: true,
      duplicateDecisionBlocked: true,
      appliedRules: ["CAPACITY_ADVISORY_DECISION_REQUIRES_HUMAN_DECISION_EVIDENCE"],
    },
    idempotency: {
      key: input.idempotencyKey,
      replayed: false,
    },
    audit: {
      action: "capacity.advisory.decision.recorded",
      subjectType: "capacity_advisory_decision",
      subjectId: "decision_001",
    },
    outbox: {
      eventType: "capacity.advisory.decision.recorded",
      aggregateType: "capacity",
      aggregateId: "decision_001",
    },
  });

  assert.equal(output.businessRules.decisionAccepted, true);
  assert.equal(output.audit.action, "capacity.advisory.decision.recorded");
});

test("capacity advisory decision analytics contract is read-only and governed", () => {
  assert.equal(
    capacityAdvisoryDecisionAnalyticsMetadata.name,
    "capacity.advisory.decision.analytics.read",
  );
  assert.equal(capacityAdvisoryDecisionAnalyticsMetadata.kind, "query");
  assert.deepEqual(capacityAdvisoryDecisionAnalyticsMetadata.permissions, ["capacity.read"]);
  assert.equal(capacityAdvisoryDecisionAnalyticsMetadata.audit, "standard");
  assert.deepEqual(capacityAdvisoryDecisionAnalyticsInputSchema.parse(undefined), {
    limit: 10,
    windowDays: 30,
  });

  const output = capacityAdvisoryDecisionAnalyticsOutputSchema.parse({
    generatedAt: later,
    organizationId: "org_port_rail",
    window: {
      startedAt: now,
      endedAt: later,
      windowDays: 30,
    },
    totals: {
      decisions: 2,
      approved: 1,
      rejected: 1,
      approvalRatePercent: 50,
      decisionsWithApprovalReference: 1,
      decisionsRequiringOperationalPermission: 2,
    },
    byRecommendationType: [
      {
        recommendationType: "slot_saturation",
        decisions: 1,
        approved: 1,
        rejected: 0,
        approvalRatePercent: 100,
      },
    ],
    byRequiredPermission: [
      {
        requiredPermission: "capacity.manage",
        decisions: 1,
        approved: 1,
        rejected: 0,
        approvalRatePercent: 100,
      },
    ],
    recentDecisions: [
      {
        id: "decision_001",
        recommendationId: "capacity-advisory:slot_saturation:slot_001",
        recommendationType: "slot_saturation",
        decisionStatus: "approved",
        decidedByName: "Capacity Manager",
        decisionReason: "Approved after operational review.",
        approvalReference: "APR-CAP-001",
        requiredPermission: "capacity.manage",
        slotId: "slot_001",
        reservationId: null,
        sourceSystem: "saptm",
        decidedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    governance: {
      readOnly: true,
      automationAllowed: false,
      humanApprovalRequired: true,
      source: "capacity_advisory_decision_analytics",
    },
  });

  assert.equal(output.governance.readOnly, true);
  assert.equal(output.governance.automationAllowed, false);
  assert.equal(output.totals.approvalRatePercent, 50);
});

test("capacity resource register schema validates critical command contract", () => {
  assert.equal(capacityResourceRegisterMetadata.name, "capacity.resource.register");
  assert.deepEqual(capacityResourceRegisterMetadata.permissions, ["capacity.manage"]);
  assert.equal(capacityResourceRegisterMetadata.idempotency, "required");

  const input = capacityResourceRegisterInputSchema.parse({
    resourceCode: "ter-lad-01",
    resourceName: "Terminal Luanda",
    resourceType: "terminal",
    locationName: "Porto de Luanda",
    maxConcurrentBookings: 10,
    idempotencyKey: "idem_capacity_resource_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.resourceType, "terminal");
});

test("capacity resource register output validates audit and outbox", () => {
  const output = capacityResourceRegisterOutputSchema.parse({
    organizationId: "org_port_rail",
    resourceId: "resource_001",
    resource,
    businessRules: {
      resourceAccepted: true,
      uniqueResourceCode: true,
      capacityPositive: true,
      appliedRules: ["CAPACITY_RESOURCE_CODE_UNIQUE_PER_ORGANIZATION"],
    },
    idempotency: {
      key: "idem_capacity_resource_001",
      replayed: false,
    },
    audit: {
      action: "capacity.resource.registered",
      subjectType: "capacity_resource",
      subjectId: "resource_001",
    },
    outbox: {
      eventType: "capacity.resource.registered",
      aggregateType: "capacity",
      aggregateId: "resource_001",
    },
  });

  assert.equal(output.businessRules.resourceAccepted, true);
  assert.equal(output.audit.action, "capacity.resource.registered");
});

test("capacity slot open schema blocks invalid windows", () => {
  assert.equal(capacitySlotOpenMetadata.name, "capacity.slot.open");
  assert.deepEqual(capacitySlotOpenMetadata.permissions, ["capacity.manage"]);

  assert.throws(() =>
    capacitySlotOpenInputSchema.parse({
      resourceId: "resource_001",
      slotReference: "SLOT-001",
      windowStartAt: later,
      windowEndAt: now,
      capacityUnits: 10,
      idempotencyKey: "idem_capacity_slot_001",
    }),
  );

  const input = capacitySlotOpenInputSchema.parse({
    resourceId: "resource_001",
    slotReference: "SLOT-001",
    windowStartAt: now,
    windowEndAt: later,
    capacityUnits: 10,
    idempotencyKey: "idem_capacity_slot_001",
  });

  assert.equal(input.sourceSystem, "saptm");
});

test("capacity slot open output validates audit and outbox", () => {
  const output = capacitySlotOpenOutputSchema.parse({
    organizationId: "org_port_rail",
    resourceId: "resource_001",
    slotId: "slot_001",
    resource,
    slot,
    businessRules: {
      slotOpened: true,
      resourceActive: true,
      windowValid: true,
      capacityWithinResourceLimit: true,
      duplicateReferenceBlocked: true,
      appliedRules: ["CAPACITY_SLOT_WINDOW_MUST_BE_VALID"],
    },
    idempotency: {
      key: "idem_capacity_slot_001",
      replayed: false,
    },
    audit: {
      action: "capacity.slot.opened",
      subjectType: "capacity_slot",
      subjectId: "slot_001",
    },
    outbox: {
      eventType: "capacity.slot.opened",
      aggregateType: "capacity",
      aggregateId: "slot_001",
    },
  });

  assert.equal(output.slot.availableUnits, 8);
});

test("capacity slot reserve schema validates governed reservation command", () => {
  assert.equal(capacitySlotReserveMetadata.name, "capacity.slot.reserve");
  assert.deepEqual(capacitySlotReserveMetadata.permissions, ["capacity.slot.reserve"]);

  const input = capacitySlotReserveInputSchema.parse({
    cargoId: "cargo_001",
    slotId: "slot_001",
    reservationReference: "RSV-001",
    reservationPurpose: "departure",
    reservedUnits: 2,
    reservedByName: "Operations Controller",
    reservedAt: "2026-06-05T11:00:00.000Z",
    idempotencyKey: "idem_capacity_reserve_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.reservationPurpose, "departure");
});

test("capacity slot reserve output validates no-overbooking contract", () => {
  const output = capacitySlotReserveOutputSchema.parse({
    organizationId: "org_port_rail",
    cargoId: "cargo_001",
    slotId: "slot_001",
    reservationId: "reservation_001",
    cargo,
    resource,
    slot,
    reservation,
    businessRules: {
      reservationAllowed: true,
      cargoEligible: true,
      slotOpen: true,
      reservationWithinWindow: true,
      capacityAvailable: true,
      duplicateReservationBlocked: true,
      duplicateCargoSlotBlocked: true,
      appliedRules: ["CAPACITY_RESERVATION_CANNOT_OVERBOOK_SLOT"],
    },
    idempotency: {
      key: "idem_capacity_reserve_001",
      replayed: false,
    },
    audit: {
      action: "capacity.slot.reserved",
      subjectType: "capacity_slot_reservation",
      subjectId: "reservation_001",
    },
    outbox: {
      eventType: "capacity.slot.reserved",
      aggregateType: "capacity",
      aggregateId: "reservation_001",
    },
  });

  assert.equal(output.businessRules.capacityAvailable, true);
  assert.equal(output.reservation.reservedUnits, 2);
});

test("capacity slot cancel schema and output validate cancellation contract", () => {
  assert.equal(capacitySlotCancelMetadata.name, "capacity.slot.cancel");
  assert.deepEqual(capacitySlotCancelMetadata.permissions, ["capacity.slot.cancel"]);

  const input = capacitySlotCancelInputSchema.parse({
    reservationId: "reservation_001",
    cancellationReference: "CXL-001",
    cancelledByName: "Operations Controller",
    cancellationReason: "Slot reallocated after vessel delay.",
    cancelledAt: "2026-06-05T12:00:00.000Z",
    idempotencyKey: "idem_capacity_cancel_001",
  });

  assert.equal(input.sourceSystem, "saptm");

  const output = capacitySlotCancelOutputSchema.parse({
    organizationId: "org_port_rail",
    cargoId: "cargo_001",
    slotId: "slot_001",
    reservationId: "reservation_001",
    cargo,
    resource,
    slot: {
      ...slot,
      reservedUnits: 0,
      availableUnits: 10,
    },
    reservation: {
      ...reservation,
      status: "cancelled",
      cancellationReference: "CXL-001",
      cancelledByName: "Operations Controller",
      cancellationReason: "Slot reallocated after vessel delay.",
      cancelledAt: "2026-06-05T12:00:00.000Z",
    },
    businessRules: {
      cancellationAllowed: true,
      reservationActive: true,
      cancellationAfterReservation: true,
      appliedRules: ["CAPACITY_CANCELLATION_RELEASES_RESERVED_UNITS"],
    },
    idempotency: {
      key: "idem_capacity_cancel_001",
      replayed: false,
    },
    audit: {
      action: "capacity.slot_reservation.cancelled",
      subjectType: "capacity_slot_reservation",
      subjectId: "reservation_001",
    },
    outbox: {
      eventType: "capacity.slot_reservation.cancelled",
      aggregateType: "capacity",
      aggregateId: "reservation_001",
    },
  });

  assert.equal(output.businessRules.cancellationAllowed, true);
  assert.equal(output.reservation.status, "cancelled");
});
