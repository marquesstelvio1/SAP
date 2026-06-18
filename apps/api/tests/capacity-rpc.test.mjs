import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createCapacityRpcRouter } from "../dist/capacity/capacity-rpc.router.js";

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

const cargo = {
  id: "cargo_001",
  cargoReference: "CGO-2026-0001",
  cargoDescription: "Rail containers",
  status: "ready_for_transport",
  custodyOwnerName: "Rail Ops",
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

test("capacity overview RPC authorizes request and delegates by organization", async () => {
  const calls = [];
  const requested = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.read"],
    capacityService: createCapacityService({
      async getOverview(input) {
        requested.push(input);

        return {
          generatedAt: now,
          organizationId: input.organizationId,
          totals: {
            resources: 1,
            openSlots: 1,
            blockedSlots: 0,
            closedSlots: 0,
            activeReservations: 1,
          },
          upcomingSlots: [slot],
          recentReservations: [reservation],
        };
      },
    }),
  });

  const overview = await client.capacity.overview({ limit: 5 });

  assert.equal(overview.organizationId, "org_port_rail");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "capacity.overview.read");
  assert.equal(requested[0].organizationId, "org_port_rail");
  assert.equal(requested[0].limit, 5);
});

test("capacity optimization advisory RPC authorizes read and delegates limit", async () => {
  const calls = [];
  const requested = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.read"],
    capacityService: createCapacityService({
      async getAdvisory(input) {
        requested.push(input);

        return {
          generatedAt: now,
          organizationId: input.organizationId,
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
        };
      },
    }),
  });

  const advisory = await client.capacity.advisory({ limit: 3 });

  assert.equal(advisory.organizationId, "org_port_rail");
  assert.equal(advisory.policy.automationAllowed, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "capacity.optimization.advisory.read");
  assert.equal(requested[0].organizationId, "org_port_rail");
  assert.equal(requested[0].limit, 3);
});

test("capacity advisory decision analytics RPC authorizes read and delegates window", async () => {
  const calls = [];
  const requested = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.read"],
    capacityService: createCapacityService({
      async getAdvisoryDecisionAnalytics(input) {
        requested.push(input);

        return {
          generatedAt: later,
          organizationId: input.organizationId,
          window: {
            startedAt: now,
            endedAt: later,
            windowDays: input.windowDays,
          },
          totals: {
            decisions: 1,
            approved: 1,
            rejected: 0,
            approvalRatePercent: 100,
            decisionsWithApprovalReference: 1,
            decisionsRequiringOperationalPermission: 1,
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
        };
      },
    }),
  });

  const analytics = await client.capacity.advisoryDecisionAnalytics({
    limit: 7,
    windowDays: 45,
  });

  assert.equal(analytics.organizationId, "org_port_rail");
  assert.equal(analytics.governance.automationAllowed, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "capacity.advisory.decision.analytics.read");
  assert.equal(requested[0].organizationId, "org_port_rail");
  assert.equal(requested[0].limit, 7);
  assert.equal(requested[0].windowDays, 45);
});

test("capacity resource register RPC delegates auditable mutation input", async () => {
  const calls = [];
  const registered = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.manage"],
    capacityService: createCapacityService({
      async registerResource(input) {
        registered.push(input);

        return {
          organizationId: input.organizationId,
          resourceId: "resource_001",
          resource: {
            ...resource,
            resourceCode: input.resourceCode,
            resourceName: input.resourceName,
            resourceType: input.resourceType,
            locationName: input.locationName,
            maxConcurrentBookings: input.maxConcurrentBookings,
            sourceSystem: input.sourceSystem,
          },
          businessRules: {
            resourceAccepted: true,
            uniqueResourceCode: true,
            capacityPositive: true,
            appliedRules: ["CAPACITY_RESOURCE_CODE_UNIQUE_PER_ORGANIZATION"],
          },
          idempotency: {
            key: input.idempotencyKey,
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
        };
      },
    }),
  });

  const result = await client.capacity.registerResource({
    resourceCode: "TER-LAD-01",
    resourceName: "Terminal Luanda",
    resourceType: "terminal",
    locationName: "Porto de Luanda",
    maxConcurrentBookings: 10,
    idempotencyKey: "idem_capacity_resource_001",
  });

  assert.equal(result.audit.action, "capacity.resource.registered");
  assert.equal(calls[0].metadata.name, "capacity.resource.register");
  assert.equal(registered[0].organizationId, "org_port_rail");
  assert.equal(registered[0].actorId, "user_ops");
  assert.equal(registered[0].userAgent, "node-test");
  assert.equal(registered[0].ipAddress, "127.0.0.1");
});

test("capacity slot open RPC delegates resource-scoped slot command", async () => {
  const calls = [];
  const opened = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.manage"],
    capacityService: createCapacityService({
      async openSlot(input) {
        opened.push(input);

        return {
          organizationId: input.organizationId,
          resourceId: input.resourceId,
          slotId: "slot_001",
          resource,
          slot: {
            ...slot,
            resourceId: input.resourceId,
            slotReference: input.slotReference,
            windowStartAt: input.windowStartAt,
            windowEndAt: input.windowEndAt,
            capacityUnits: input.capacityUnits,
            availableUnits: input.capacityUnits,
            reservedUnits: 0,
          },
          businessRules: {
            slotOpened: true,
            resourceActive: true,
            windowValid: true,
            capacityWithinResourceLimit: true,
            duplicateReferenceBlocked: true,
            appliedRules: ["CAPACITY_SLOT_WINDOW_MUST_BE_VALID"],
          },
          idempotency: {
            key: input.idempotencyKey,
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
        };
      },
    }),
  });

  const result = await client.capacity.openSlot({
    resourceId: "resource_001",
    slotReference: "SLOT-001",
    windowStartAt: now,
    windowEndAt: later,
    capacityUnits: 10,
    idempotencyKey: "idem_capacity_slot_001",
  });

  assert.equal(result.audit.action, "capacity.slot.opened");
  assert.equal(calls[0].metadata.name, "capacity.slot.open");
  assert.equal(opened[0].organizationId, "org_port_rail");
});

test("capacity slot reserve RPC delegates auditable reservation input", async () => {
  const calls = [];
  const reserved = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.slot.reserve"],
    capacityService: createCapacityService({
      async reserveSlot(input) {
        reserved.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          slotId: input.slotId,
          reservationId: "reservation_001",
          cargo,
          resource,
          slot,
          reservation: {
            ...reservation,
            cargoId: input.cargoId,
            slotId: input.slotId,
            reservationReference: input.reservationReference,
            reservationPurpose: input.reservationPurpose,
            reservedUnits: input.reservedUnits,
            reservedByName: input.reservedByName,
            reservedAt: input.reservedAt,
          },
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
            key: input.idempotencyKey,
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
        };
      },
    }),
  });

  const result = await client.capacity.reserveSlot({
    cargoId: "cargo_001",
    slotId: "slot_001",
    reservationReference: "RSV-001",
    reservationPurpose: "departure",
    reservedUnits: 2,
    reservedByName: "Operations Controller",
    reservedAt: "2026-06-05T11:00:00.000Z",
    idempotencyKey: "idem_capacity_reserve_001",
  });

  assert.equal(result.businessRules.capacityAvailable, true);
  assert.equal(calls[0].metadata.name, "capacity.slot.reserve");
  assert.equal(reserved[0].actorId, "user_ops");
});

test("capacity slot cancel RPC delegates cancellation input", async () => {
  const calls = [];
  const cancelled = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.slot.cancel"],
    capacityService: createCapacityService({
      async cancelSlotReservation(input) {
        cancelled.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: "cargo_001",
          slotId: "slot_001",
          reservationId: input.reservationId,
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
            cancellationReference: input.cancellationReference,
            cancelledByName: input.cancelledByName,
            cancellationReason: input.cancellationReason,
            cancelledAt: input.cancelledAt,
          },
          businessRules: {
            cancellationAllowed: true,
            reservationActive: true,
            cancellationAfterReservation: true,
            appliedRules: ["CAPACITY_CANCELLATION_RELEASES_RESERVED_UNITS"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "capacity.slot_reservation.cancelled",
            subjectType: "capacity_slot_reservation",
            subjectId: input.reservationId,
          },
          outbox: {
            eventType: "capacity.slot_reservation.cancelled",
            aggregateType: "capacity",
            aggregateId: input.reservationId,
          },
        };
      },
    }),
  });

  const result = await client.capacity.cancelSlotReservation({
    reservationId: "reservation_001",
    cancellationReference: "CXL-001",
    cancelledByName: "Operations Controller",
    cancellationReason: "Slot reallocated after vessel delay.",
    cancelledAt: "2026-06-05T12:00:00.000Z",
    idempotencyKey: "idem_capacity_cancel_001",
  });

  assert.equal(result.audit.action, "capacity.slot_reservation.cancelled");
  assert.equal(calls[0].metadata.name, "capacity.slot.cancel");
  assert.equal(cancelled[0].organizationId, "org_port_rail");
  assert.equal(cancelled[0].ipAddress, "127.0.0.1");
});

test("capacity advisory decision RPC delegates auditable human decision input", async () => {
  const calls = [];
  const decisions = [];
  const client = createCapacityClient({
    calls,
    permissions: ["capacity.advisory.decide"],
    capacityService: createCapacityService({
      async recordAdvisoryDecision(input) {
        decisions.push(input);

        return {
          organizationId: input.organizationId,
          decisionId: "decision_001",
          decision: {
            id: "decision_001",
            recommendationId: input.recommendationId,
            recommendationType: input.recommendationType,
            decisionStatus: input.decisionStatus,
            decidedByName: input.decidedByName,
            decisionReason: input.decisionReason,
            approvalReference: input.approvalReference ?? null,
            requiredPermission: input.requiredPermission,
            slotId: input.slotId ?? null,
            reservationId: input.reservationId ?? null,
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
        };
      },
    }),
  });

  const result = await client.capacity.recordAdvisoryDecision({
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

  assert.equal(result.audit.action, "capacity.advisory.decision.recorded");
  assert.equal(calls[0].metadata.name, "capacity.advisory.decision.record");
  assert.equal(decisions[0].organizationId, "org_port_rail");
  assert.equal(decisions[0].actorId, "user_ops");
  assert.equal(decisions[0].ipAddress, "127.0.0.1");
});

function createCapacityClient({ calls, permissions, capacityService }) {
  const router = createCapacityRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions,
            correlationId: `corr_${metadata.name}`,
            traceContext: {
              correlationId: `corr_${metadata.name}`,
              requestId: `req_${metadata.name}`,
              operationName: metadata.name,
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    capacityService,
  });

  return createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });
}

function createCapacityService(overrides) {
  return {
    async getOverview() {
      throw new Error("getOverview should not be called by this test");
    },
    async getAdvisory() {
      throw new Error("getAdvisory should not be called by this test");
    },
    async getAdvisoryDecisionAnalytics() {
      throw new Error("getAdvisoryDecisionAnalytics should not be called by this test");
    },
    async registerResource() {
      throw new Error("registerResource should not be called by this test");
    },
    async openSlot() {
      throw new Error("openSlot should not be called by this test");
    },
    async reserveSlot() {
      throw new Error("reserveSlot should not be called by this test");
    },
    async cancelSlotReservation() {
      throw new Error("cancelSlotReservation should not be called by this test");
    },
    async recordAdvisoryDecision() {
      throw new Error("recordAdvisoryDecision should not be called by this test");
    },
    ...overrides,
  };
}
