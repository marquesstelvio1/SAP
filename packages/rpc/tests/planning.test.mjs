import assert from "node:assert/strict";
import { test } from "node:test";

import {
  planningOverviewInputSchema,
  planningOverviewMetadata,
  planningOverviewOutputSchema,
  transportOrderCancelInputSchema,
  transportOrderCancelMetadata,
  transportOrderCancelOutputSchema,
  transportOrderConfirmInputSchema,
  transportOrderConfirmMetadata,
  transportOrderConfirmOutputSchema,
  transportOrderDispatchInputSchema,
  transportOrderDispatchMetadata,
  transportOrderDispatchOutputSchema,
  transportOrderRescheduleInputSchema,
  transportOrderRescheduleMetadata,
  transportOrderRescheduleOutputSchema,
} from "../dist/index.js";

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

test("planning overview metadata requires session and planning read permission", () => {
  assert.equal(planningOverviewMetadata.name, "planning.overview.read");
  assert.equal(planningOverviewMetadata.kind, "query");
  assert.equal(planningOverviewMetadata.auth, "session");
  assert.equal(planningOverviewMetadata.organizationRequired, true);
  assert.deepEqual(planningOverviewMetadata.permissions, ["planning.order.read"]);
  assert.equal(planningOverviewMetadata.audit, "standard");
  assert.equal(planningOverviewMetadata.observability.criticality, "high");
});

test("planning overview schema validates transport order dashboard", () => {
  assert.deepEqual(planningOverviewInputSchema.parse(undefined), { limit: 10 });

  const output = planningOverviewOutputSchema.parse({
    generatedAt: now,
    organizationId: "org_port_rail",
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
  });

  assert.equal(output.recentOrders[0].orderReference, "TO-2026-0001");
  assert.equal(output.totals.linkedCapacityReservations, 1);
});

test("transport order confirm contract enforces timing and governed output", () => {
  assert.equal(transportOrderConfirmMetadata.name, "planning.transport_order.confirm");
  assert.deepEqual(transportOrderConfirmMetadata.permissions, ["planning.order.confirm"]);
  assert.equal(transportOrderConfirmMetadata.idempotency, "required");
  assert.equal(transportOrderConfirmMetadata.audit, "critical");

  assert.throws(() =>
    transportOrderConfirmInputSchema.parse({
      cargoId: "cargo_001",
      orderReference: "TO-2026-0001",
      mode: "rail",
      carrierName: "Rail Angola",
      routeSummary: "Luanda rail yard to port terminal.",
      originName: "Porto de Luanda",
      destinationName: "Porto de Luanda",
      plannedDepartureAt: departure,
      plannedArrivalAt: now,
      responsiblePlannerName: "Operations Planner",
      confirmationReference: "CNF-TO-2026-0001",
      confirmedAt: arrival,
      idempotencyKey: "idem_planning_transport_001",
    }),
  );

  const input = transportOrderConfirmInputSchema.parse({
    cargoId: "cargo_001",
    trackingShipmentId: "shipment_001",
    capacityReservationId: "reservation_001",
    orderReference: "TO-2026-0001",
    mode: "rail",
    carrierName: "Rail Angola",
    routeSummary: "Luanda rail yard to port terminal.",
    originName: "Luanda Rail Yard",
    destinationName: "Porto de Luanda",
    plannedDepartureAt: departure,
    plannedArrivalAt: arrival,
    responsiblePlannerName: "Operations Planner",
    confirmationReference: "CNF-TO-2026-0001",
    confirmedAt: now,
    idempotencyKey: "idem_planning_transport_001",
  });

  const output = transportOrderConfirmOutputSchema.parse({
    organizationId: "org_port_rail",
    orderId: "transport_order_001",
    cargoId: input.cargoId,
    transportOrder,
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
  });

  assert.equal(output.businessRules.orderConfirmed, true);
  assert.equal(output.transportOrder.capacityReservationReference, "RSV-2026-0001");
});

test("transport order cancel contract enforces governed cancellation output", () => {
  assert.equal(transportOrderCancelMetadata.name, "planning.transport_order.cancel");
  assert.deepEqual(transportOrderCancelMetadata.permissions, ["planning.order.cancel"]);
  assert.equal(transportOrderCancelMetadata.idempotency, "required");
  assert.equal(transportOrderCancelMetadata.audit, "critical");

  assert.throws(() =>
    transportOrderCancelInputSchema.parse({
      orderId: "transport_order_001",
      cancellationReference: "CXL-TO-2026-0001",
      cancelledByName: "Ops",
      cancellationReason: "Bad",
      cancelledAt: now,
      idempotencyKey: "idem_planning_cancel_001",
    }),
  );

  const input = transportOrderCancelInputSchema.parse({
    orderId: "transport_order_001",
    cancellationReference: "CXL-TO-2026-0001",
    cancelledByName: "Operations Controller",
    cancellationReason: "Capacity window cancelled after port disruption.",
    cancelledAt: "2026-06-07T09:00:00.000Z",
    idempotencyKey: "idem_planning_cancel_001",
  });

  const output = transportOrderCancelOutputSchema.parse({
    organizationId: "org_port_rail",
    orderId: input.orderId,
    cargoId: "cargo_001",
    transportOrder: {
      ...transportOrder,
      status: "cancelled",
      cancellationReference: input.cancellationReference,
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
      subjectId: "transport_order_001",
    },
    outbox: {
      eventType: "planning.transport_order.cancelled",
      aggregateType: "planning",
      aggregateId: "transport_order_001",
    },
  });

  assert.equal(output.businessRules.orderCancelled, true);
  assert.equal(output.transportOrder.cancellationReference, "CXL-TO-2026-0001");
});

test("transport order reschedule contract enforces governed schedule revision output", () => {
  assert.equal(transportOrderRescheduleMetadata.name, "planning.transport_order.reschedule");
  assert.deepEqual(transportOrderRescheduleMetadata.permissions, ["planning.order.reschedule"]);
  assert.equal(transportOrderRescheduleMetadata.idempotency, "required");
  assert.equal(transportOrderRescheduleMetadata.audit, "critical");

  assert.throws(() =>
    transportOrderRescheduleInputSchema.parse({
      orderId: "transport_order_001",
      revisionReference: "REV-TO-2026-0001",
      mode: "rail",
      carrierName: "Rail Angola",
      routeSummary: "Invalid same endpoint route.",
      originName: "Porto de Luanda",
      destinationName: "Porto de Luanda",
      plannedDepartureAt: departure,
      plannedArrivalAt: now,
      rescheduledByName: "Operations Planner",
      rescheduleReason: "Bad",
      rescheduledAt: arrival,
      idempotencyKey: "idem_planning_reschedule_001",
    }),
  );

  const input = transportOrderRescheduleInputSchema.parse({
    orderId: "transport_order_001",
    revisionReference: "REV-TO-2026-0001",
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

  const output = transportOrderRescheduleOutputSchema.parse({
    organizationId: "org_port_rail",
    orderId: input.orderId,
    cargoId: "cargo_001",
    revisionId: "revision_001",
    revisionReference: input.revisionReference,
    transportOrder: {
      ...transportOrder,
      carrierName: input.carrierName,
      routeSummary: input.routeSummary,
      plannedDepartureAt: input.plannedDepartureAt,
      plannedArrivalAt: input.plannedArrivalAt,
      scheduleRevisionCount: 1,
      lastScheduleRevisionReference: input.revisionReference,
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
      subjectId: "transport_order_001",
    },
    outbox: {
      eventType: "planning.transport_order.rescheduled",
      aggregateType: "planning",
      aggregateId: "transport_order_001",
    },
  });

  assert.equal(output.businessRules.orderRescheduled, true);
  assert.equal(output.revisionReference, "REV-TO-2026-0001");
});

test("transport order dispatch contract enforces governed execution handoff output", () => {
  assert.equal(transportOrderDispatchMetadata.name, "planning.transport_order.dispatch");
  assert.deepEqual(transportOrderDispatchMetadata.permissions, ["planning.order.dispatch"]);
  assert.equal(transportOrderDispatchMetadata.idempotency, "required");
  assert.equal(transportOrderDispatchMetadata.audit, "critical");

  assert.throws(() =>
    transportOrderDispatchInputSchema.parse({
      orderId: "transport_order_001",
      dispatchReference: "DSP-TO-2026-0001",
      dispatchedByName: "Ops",
      dispatchInstructions: "Bad",
      dispatchedAt: "2026-06-07T09:00:00.000Z",
      idempotencyKey: "idem_planning_dispatch_001",
    }),
  );

  const input = transportOrderDispatchInputSchema.parse({
    orderId: "transport_order_001",
    dispatchReference: "DSP-TO-2026-0001",
    dispatchedByName: "Operations Dispatcher",
    dispatchInstructions: "Release order to rail terminal execution queue.",
    dispatchedAt: "2026-06-07T09:00:00.000Z",
    idempotencyKey: "idem_planning_dispatch_001",
  });

  const output = transportOrderDispatchOutputSchema.parse({
    organizationId: "org_port_rail",
    orderId: input.orderId,
    cargoId: "cargo_001",
    dispatchId: "dispatch_001",
    dispatchReference: input.dispatchReference,
    transportOrder: {
      ...transportOrder,
      dispatchCount: 1,
      lastDispatchReference: input.dispatchReference,
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
      subjectId: "transport_order_001",
    },
    outbox: {
      eventType: "planning.transport_order.dispatched",
      aggregateType: "planning",
      aggregateId: "transport_order_001",
    },
  });

  assert.equal(output.businessRules.orderDispatched, true);
  assert.equal(output.dispatchReference, "DSP-TO-2026-0001");
});
