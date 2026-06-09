import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createPlanningRpcRouter } from "../dist/planning/planning-rpc.router.js";

const now = "2026-06-07T08:00:00.000Z";
const departure = "2026-06-07T12:00:00.000Z";
const arrival = "2026-06-07T20:00:00.000Z";

const transportOrder = {
  id: "transport_order_001",
  cargoId: "cargo_001",
  cargoReference: "CGO-2026-0001",
  cargoDescription: "Rail containers",
  cargoStatus: "ready_for_transport",
  trackingShipmentId: "shipment_001",
  trackingReferenceCode: "TRK-2026-0001",
  capacityReservationId: "reservation_001",
  capacityReservationReference: "RSV-2026-0001",
  orderReference: "TO-2026-0001",
  status: "confirmed",
  mode: "rail",
  carrierName: "Rail Angola",
  routeSummary: "Luanda rail yard to port terminal.",
  originName: "Luanda Rail Yard",
  destinationName: "Porto de Luanda",
  plannedDepartureAt: departure,
  plannedArrivalAt: arrival,
  responsiblePlannerName: "Operations Planner",
  confirmationReference: "CNF-TO-2026-0001",
  sourceSystem: "saptm",
  confirmedAt: now,
  cancellationReference: null,
  cancelledByName: null,
  cancellationReason: null,
  cancelledAt: null,
  scheduleRevisionCount: 0,
  lastScheduleRevisionReference: null,
  lastRescheduledByName: null,
  lastRescheduleReason: null,
  lastRescheduledAt: null,
  dispatchCount: 0,
  lastDispatchReference: null,
  lastDispatchedByName: null,
  lastDispatchInstructions: null,
  lastDispatchedAt: null,
  createdAt: now,
  updatedAt: now,
};

test("planning overview RPC authorizes request and delegates by organization", async () => {
  const calls = [];
  const requested = [];
  const client = createPlanningClient({
    calls,
    permissions: ["planning.order.read"],
    planningService: createPlanningService({
      async getOverview(input) {
        requested.push(input);

        return {
          generatedAt: now,
          organizationId: input.organizationId,
          totals: {
            transportOrders: 1,
            confirmed: 1,
            cancelled: 0,
            upcomingDepartures: 1,
            linkedCapacityReservations: 1,
            linkedTrackingShipments: 1,
            dispatched: 0,
          },
          recentOrders: [transportOrder],
        };
      },
    }),
  });

  const overview = await client.planning.overview({ limit: 5 });

  assert.equal(overview.organizationId, "org_port_rail");
  assert.equal(overview.recentOrders[0].orderReference, "TO-2026-0001");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "planning.overview.read");
  assert.equal(requested[0].organizationId, "org_port_rail");
  assert.equal(requested[0].limit, 5);
});

test("transport order confirm RPC delegates auditable mutation input", async () => {
  const calls = [];
  const confirmed = [];
  const client = createPlanningClient({
    calls,
    permissions: ["planning.order.confirm"],
    planningService: createPlanningService({
      async confirmTransportOrder(input) {
        confirmed.push(input);

        return {
          organizationId: input.organizationId,
          orderId: "transport_order_001",
          cargoId: input.cargoId,
          transportOrder: {
            ...transportOrder,
            cargoId: input.cargoId,
            orderReference: input.orderReference.toUpperCase(),
            mode: input.mode,
            plannedDepartureAt: input.plannedDepartureAt,
            plannedArrivalAt: input.plannedArrivalAt,
            confirmedAt: input.confirmedAt,
          },
          businessRules: {
            orderConfirmed: true,
            cargoEligible: true,
            routeDefined: true,
            capacityReservationLinked: true,
            trackingShipmentLinked: true,
            responsibilityAssigned: true,
            timingValid: true,
            duplicateOrderBlocked: true,
            appliedRules: ["PLANNING_TRANSPORT_ORDER_REQUIRES_READY_SOUND_CARGO"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "planning.transport_order.confirmed",
            subjectType: "transport_order",
            subjectId: "transport_order_001",
          },
          outbox: {
            eventType: "planning.transport_order.confirmed",
            aggregateType: "planning",
            aggregateId: "transport_order_001",
          },
        };
      },
    }),
  });

  const output = await client.planning.confirmTransportOrder({
    cargoId: "cargo_001",
    trackingShipmentId: "shipment_001",
    capacityReservationId: "reservation_001",
    orderReference: "to-2026-0001",
    mode: "rail",
    carrierName: "Rail Angola",
    routeSummary: "Luanda rail yard to port terminal.",
    originName: "Luanda Rail Yard",
    destinationName: "Porto de Luanda",
    plannedDepartureAt: departure,
    plannedArrivalAt: arrival,
    responsiblePlannerName: "Operations Planner",
    confirmationReference: "cnf-to-2026-0001",
    confirmedAt: now,
    idempotencyKey: "idem_planning_transport_001",
  });

  assert.equal(output.businessRules.orderConfirmed, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "planning.transport_order.confirm");
  assert.equal(confirmed[0].organizationId, "org_port_rail");
  assert.equal(confirmed[0].actorId, "user_ops");
  assert.equal(confirmed[0].correlationId, "corr_planning.transport_order.confirm");
  assert.equal(confirmed[0].ipAddress, "127.0.0.1");
  assert.equal(confirmed[0].userAgent, "node-test");
});

test("transport order cancel RPC delegates auditable mutation input", async () => {
  const calls = [];
  const cancelled = [];
  const client = createPlanningClient({
    calls,
    permissions: ["planning.order.cancel"],
    planningService: createPlanningService({
      async cancelTransportOrder(input) {
        cancelled.push(input);

        return {
          organizationId: input.organizationId,
          orderId: input.orderId,
          cargoId: "cargo_001",
          transportOrder: {
            ...transportOrder,
            id: input.orderId,
            status: "cancelled",
            cancellationReference: input.cancellationReference.toUpperCase(),
            cancelledByName: input.cancelledByName,
            cancellationReason: input.cancellationReason,
            cancelledAt: input.cancelledAt,
          },
          businessRules: {
            orderCancelled: true,
            cancellableState: true,
            timingValid: true,
            reasonProvided: true,
            duplicateCancellationReferenceBlocked: true,
            dispatchNotStarted: true,
            capacityReleaseRequired: true,
            downstreamTrackingNotificationRequired: true,
            appliedRules: ["PLANNING_TRANSPORT_ORDER_CANCELLATION_REQUIRES_CONFIRMED_STATE"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "planning.transport_order.cancelled",
            subjectType: "transport_order",
            subjectId: input.orderId,
          },
          outbox: {
            eventType: "planning.transport_order.cancelled",
            aggregateType: "planning",
            aggregateId: input.orderId,
          },
        };
      },
    }),
  });

  const output = await client.planning.cancelTransportOrder({
    orderId: "transport_order_001",
    cancellationReference: "cxl-to-2026-0001",
    cancelledByName: "Operations Controller",
    cancellationReason: "Capacity window cancelled after port disruption.",
    cancelledAt: "2026-06-07T09:00:00.000Z",
    idempotencyKey: "idem_planning_cancel_001",
  });

  assert.equal(output.businessRules.orderCancelled, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "planning.transport_order.cancel");
  assert.equal(cancelled[0].organizationId, "org_port_rail");
  assert.equal(cancelled[0].actorId, "user_ops");
  assert.equal(cancelled[0].correlationId, "corr_planning.transport_order.cancel");
  assert.equal(cancelled[0].ipAddress, "127.0.0.1");
  assert.equal(cancelled[0].userAgent, "node-test");
});

test("transport order reschedule RPC delegates auditable mutation input", async () => {
  const calls = [];
  const rescheduled = [];
  const client = createPlanningClient({
    calls,
    permissions: ["planning.order.reschedule"],
    planningService: createPlanningService({
      async rescheduleTransportOrder(input) {
        rescheduled.push(input);

        return {
          organizationId: input.organizationId,
          orderId: input.orderId,
          cargoId: "cargo_001",
          revisionId: "revision_001",
          revisionReference: input.revisionReference.toUpperCase(),
          transportOrder: {
            ...transportOrder,
            id: input.orderId,
            mode: input.mode,
            carrierName: input.carrierName,
            routeSummary: input.routeSummary,
            originName: input.originName,
            destinationName: input.destinationName,
            plannedDepartureAt: input.plannedDepartureAt,
            plannedArrivalAt: input.plannedArrivalAt,
            scheduleRevisionCount: 1,
            lastScheduleRevisionReference: input.revisionReference.toUpperCase(),
            lastRescheduledByName: input.rescheduledByName,
            lastRescheduleReason: input.rescheduleReason,
            lastRescheduledAt: input.rescheduledAt,
          },
          businessRules: {
            orderRescheduled: true,
            reschedulableState: true,
            routeDefined: true,
            responsibilityAssigned: true,
            timingValid: true,
            scheduleChanged: true,
            capacityWindowAligned: true,
            duplicateRevisionBlocked: true,
            dispatchNotStarted: true,
            downstreamTrackingNotificationRequired: true,
            appliedRules: ["PLANNING_TRANSPORT_ORDER_RESCHEDULE_REQUIRES_CONFIRMED_STATE"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "planning.transport_order.rescheduled",
            subjectType: "transport_order",
            subjectId: input.orderId,
          },
          outbox: {
            eventType: "planning.transport_order.rescheduled",
            aggregateType: "planning",
            aggregateId: input.orderId,
          },
        };
      },
    }),
  });

  const output = await client.planning.rescheduleTransportOrder({
    orderId: "transport_order_001",
    revisionReference: "rev-to-2026-0001",
    mode: "rail",
    carrierName: "Rail Angola Express",
    routeSummary: "Luanda rail yard to alternate port window.",
    originName: "Luanda Rail Yard",
    destinationName: "Porto de Luanda",
    plannedDepartureAt: "2026-06-07T13:00:00.000Z",
    plannedArrivalAt: "2026-06-07T21:00:00.000Z",
    rescheduledByName: "Operations Planner",
    rescheduleReason: "Rail slot shifted after terminal congestion.",
    rescheduledAt: "2026-06-07T09:00:00.000Z",
    idempotencyKey: "idem_planning_reschedule_001",
  });

  assert.equal(output.businessRules.orderRescheduled, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "planning.transport_order.reschedule");
  assert.equal(rescheduled[0].organizationId, "org_port_rail");
  assert.equal(rescheduled[0].actorId, "user_ops");
  assert.equal(rescheduled[0].correlationId, "corr_planning.transport_order.reschedule");
  assert.equal(rescheduled[0].ipAddress, "127.0.0.1");
  assert.equal(rescheduled[0].userAgent, "node-test");
});

test("transport order dispatch RPC delegates auditable mutation input", async () => {
  const calls = [];
  const dispatched = [];
  const client = createPlanningClient({
    calls,
    permissions: ["planning.order.dispatch"],
    planningService: createPlanningService({
      async dispatchTransportOrder(input) {
        dispatched.push(input);

        return {
          organizationId: input.organizationId,
          orderId: input.orderId,
          cargoId: "cargo_001",
          dispatchId: "dispatch_001",
          dispatchReference: input.dispatchReference.toUpperCase(),
          transportOrder: {
            ...transportOrder,
            id: input.orderId,
            dispatchCount: 1,
            lastDispatchReference: input.dispatchReference.toUpperCase(),
            lastDispatchedByName: input.dispatchedByName,
            lastDispatchInstructions: input.dispatchInstructions,
            lastDispatchedAt: input.dispatchedAt,
          },
          businessRules: {
            orderDispatched: true,
            dispatchableState: true,
            timingValid: true,
            responsibilityAssigned: true,
            latestScheduleAcknowledged: true,
            capacityReservationReady: true,
            duplicateDispatchBlocked: true,
            downstreamTrackingNotificationRequired: true,
            appliedRules: ["PLANNING_TRANSPORT_ORDER_DISPATCH_REQUIRES_CONFIRMED_STATE"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "planning.transport_order.dispatched",
            subjectType: "transport_order",
            subjectId: input.orderId,
          },
          outbox: {
            eventType: "planning.transport_order.dispatched",
            aggregateType: "planning",
            aggregateId: input.orderId,
          },
        };
      },
    }),
  });

  const output = await client.planning.dispatchTransportOrder({
    orderId: "transport_order_001",
    dispatchReference: "dsp-to-2026-0001",
    dispatchedByName: "Operations Dispatcher",
    dispatchInstructions: "Release order to rail terminal execution queue.",
    dispatchedAt: "2026-06-07T09:00:00.000Z",
    idempotencyKey: "idem_planning_dispatch_001",
  });

  assert.equal(output.businessRules.orderDispatched, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "planning.transport_order.dispatch");
  assert.equal(dispatched[0].organizationId, "org_port_rail");
  assert.equal(dispatched[0].actorId, "user_ops");
  assert.equal(dispatched[0].correlationId, "corr_planning.transport_order.dispatch");
  assert.equal(dispatched[0].ipAddress, "127.0.0.1");
  assert.equal(dispatched[0].userAgent, "node-test");
});

function createPlanningClient({ calls, permissions, planningService }) {
  const router = createPlanningRpcRouter({
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
    planningService,
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

function createPlanningService(overrides) {
  return {
    async getOverview() {
      throw new Error("getOverview should not be called by this test");
    },
    async confirmTransportOrder() {
      throw new Error("confirmTransportOrder should not be called by this test");
    },
    async cancelTransportOrder() {
      throw new Error("cancelTransportOrder should not be called by this test");
    },
    async rescheduleTransportOrder() {
      throw new Error("rescheduleTransportOrder should not be called by this test");
    },
    async dispatchTransportOrder() {
      throw new Error("dispatchTransportOrder should not be called by this test");
    },
    ...overrides,
  };
}
