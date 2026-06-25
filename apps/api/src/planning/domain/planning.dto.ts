import type {
  TransportOrderCancelOutput,
  TransportOrderConfirmOutput,
  TransportOrderDispatchOutput,
  TransportOrderRescheduleOutput,
} from "@saptm/rpc";
import type {
  PlanningTransportOrderDispatchRecord,
  PlanningTransportOrderScheduleRevisionRecord,
  PlanningTransportOrderWithContext,
  TransportOrderBusinessRules,
  TransportOrderCancelBusinessRules,
  TransportOrderDispatchBusinessRules,
  TransportOrderRescheduleBusinessRules,
  TransportOrderStatusGroup,
} from "./planning.business-rules.js";

// Normalize helpers

export function normalizePlanningCode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

// Status counts

export function createTransportOrderStatusCounts(groups: TransportOrderStatusGroup[]) {
  const counts = {
    confirmed: 0,
    cancelled: 0,
  };

  for (const group of groups) {
    const key = group.status as keyof typeof counts;
    counts[key] = group._count._all;
  }

  return counts;
}

// Summary builder

export function createTransportOrderSummary(order: PlanningTransportOrderWithContext) {
  const lastRevision = order.scheduleRevisions.at(0);
  const lastDispatch = order.dispatches.at(0);

  return {
    id: order.id,
    cargoId: order.cargoId,
    cargoReference: order.cargo.cargoReference,
    cargoDescription: order.cargo.cargoDescription,
    cargoStatus: order.cargo.status,
    trackingShipmentId: order.trackingShipmentId,
    trackingReferenceCode: order.trackingShipment?.referenceCode ?? null,
    capacityReservationId: order.capacityReservationId,
    capacityReservationReference: order.capacityReservation?.reservationReference ?? null,
    orderReference: order.orderReference,
    status: order.status,
    mode: order.mode,
    carrierName: order.carrierName,
    routeSummary: order.routeSummary,
    originName: order.originName,
    destinationName: order.destinationName,
    plannedDepartureAt: order.plannedDepartureAt.toISOString(),
    plannedArrivalAt: order.plannedArrivalAt.toISOString(),
    responsiblePlannerName: order.responsiblePlannerName,
    confirmationReference: order.confirmationReference,
    sourceSystem: order.sourceSystem,
    confirmedAt: order.confirmedAt.toISOString(),
    cancellationReference: order.cancellationReference,
    cancelledByName: order.cancelledByName,
    cancellationReason: order.cancellationReason,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    scheduleRevisionCount: order._count.scheduleRevisions,
    lastScheduleRevisionReference: lastRevision?.revisionReference ?? null,
    lastRescheduledByName: lastRevision?.rescheduledByName ?? null,
    lastRescheduleReason: lastRevision?.rescheduleReason ?? null,
    lastRescheduledAt: lastRevision?.rescheduledAt.toISOString() ?? null,
    dispatchCount: order._count.dispatches,
    lastDispatchReference: lastDispatch?.dispatchReference ?? null,
    lastDispatchedByName: lastDispatch?.dispatchedByName ?? null,
    lastDispatchInstructions: lastDispatch?.dispatchInstructions ?? null,
    lastDispatchedAt: lastDispatch?.dispatchedAt.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// Replay business rules

function createReplayTransportOrderBusinessRules(input: {
  capacityReservationLinked: boolean;
  trackingShipmentLinked: boolean;
}): TransportOrderBusinessRules {
  return {
    orderConfirmed: true,
    cargoEligible: true,
    routeDefined: true,
    capacityReservationLinked: input.capacityReservationLinked,
    trackingShipmentLinked: input.trackingShipmentLinked,
    responsibilityAssigned: true,
    timingValid: true,
    duplicateOrderBlocked: true,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_REPLAYED_FROM_IDEMPOTENCY_KEY",
      "PLANNING_TRANSPORT_ORDER_BLOCKS_DUPLICATE_REFERENCE_AND_CARGO",
    ],
  };
}

function createReplayTransportOrderCancelBusinessRules(input: {
  capacityReleaseRequired: boolean;
  downstreamTrackingNotificationRequired: boolean;
}): TransportOrderCancelBusinessRules {
  return {
    orderCancelled: true,
    cancellableState: false,
    timingValid: true,
    reasonProvided: true,
    duplicateCancellationReferenceBlocked: true,
    dispatchNotStarted: true,
    capacityReleaseRequired: input.capacityReleaseRequired,
    downstreamTrackingNotificationRequired: input.downstreamTrackingNotificationRequired,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_REPLAYED_FROM_IDEMPOTENCY_KEY",
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_BLOCKS_DUPLICATE_REFERENCE",
    ],
  };
}

function createReplayTransportOrderRescheduleBusinessRules(input: {
  capacityWindowAligned: boolean;
  downstreamTrackingNotificationRequired: boolean;
}): TransportOrderRescheduleBusinessRules {
  return {
    orderRescheduled: true,
    reschedulableState: true,
    routeDefined: true,
    responsibilityAssigned: true,
    timingValid: true,
    scheduleChanged: true,
    capacityWindowAligned: input.capacityWindowAligned,
    duplicateRevisionBlocked: true,
    dispatchNotStarted: true,
    downstreamTrackingNotificationRequired: input.downstreamTrackingNotificationRequired,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_REPLAYED_FROM_IDEMPOTENCY_KEY",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_BLOCKS_DUPLICATE_REVISION_REFERENCE",
    ],
  };
}

function createReplayTransportOrderDispatchBusinessRules(input: {
  capacityReservationReady: boolean;
  downstreamTrackingNotificationRequired: boolean;
  latestScheduleAcknowledged: boolean;
}): TransportOrderDispatchBusinessRules {
  return {
    orderDispatched: true,
    dispatchableState: true,
    timingValid: true,
    responsibilityAssigned: true,
    latestScheduleAcknowledged: input.latestScheduleAcknowledged,
    capacityReservationReady: input.capacityReservationReady,
    duplicateDispatchBlocked: true,
    downstreamTrackingNotificationRequired: input.downstreamTrackingNotificationRequired,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_DISPATCH_REPLAYED_FROM_IDEMPOTENCY_KEY",
      "PLANNING_TRANSPORT_ORDER_DISPATCH_BLOCKS_DUPLICATE_REFERENCE_AND_ORDER",
    ],
  };
}

// Output builders

export function createTransportOrderConfirmOutput(input: {
  organizationId: string;
  transportOrder: PlanningTransportOrderWithContext;
  replayed: boolean;
  businessRules?: TransportOrderBusinessRules;
}): TransportOrderConfirmOutput {
  const businessRules =
    input.businessRules ??
    createReplayTransportOrderBusinessRules({
      capacityReservationLinked: input.transportOrder.capacityReservationId !== null,
      trackingShipmentLinked: input.transportOrder.trackingShipmentId !== null,
    });

  if (input.transportOrder.confirmIdempotencyKey === null) {
    throw new Error("planning.transport_order.confirm_idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    orderId: input.transportOrder.id,
    cargoId: input.transportOrder.cargoId,
    transportOrder: createTransportOrderSummary(input.transportOrder),
    businessRules,
    idempotency: {
      key: input.transportOrder.confirmIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "planning.transport_order.confirmed",
      subjectType: "transport_order",
      subjectId: input.transportOrder.id,
    },
    outbox: {
      eventType: "planning.transport_order.confirmed",
      aggregateType: "planning",
      aggregateId: input.transportOrder.id,
    },
  };
}

export function createTransportOrderCancelOutput(input: {
  organizationId: string;
  transportOrder: PlanningTransportOrderWithContext;
  replayed: boolean;
  businessRules?: TransportOrderCancelBusinessRules;
}): TransportOrderCancelOutput {
  if (input.transportOrder.cancelIdempotencyKey === null) {
    throw new Error("planning.transport_order.cancel_idempotency_key_missing");
  }

  if (input.transportOrder.cancelledAt === null) {
    throw new Error("planning.transport_order.cancelled_at_missing");
  }

  return {
    organizationId: input.organizationId,
    orderId: input.transportOrder.id,
    cargoId: input.transportOrder.cargoId,
    transportOrder: createTransportOrderSummary(input.transportOrder),
    businessRules:
      input.businessRules ??
      createReplayTransportOrderCancelBusinessRules({
        capacityReleaseRequired: input.transportOrder.capacityReservationId !== null,
        downstreamTrackingNotificationRequired: input.transportOrder.trackingShipmentId !== null,
      }),
    idempotency: {
      key: input.transportOrder.cancelIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "planning.transport_order.cancelled",
      subjectType: "transport_order",
      subjectId: input.transportOrder.id,
    },
    outbox: {
      eventType: "planning.transport_order.cancelled",
      aggregateType: "planning",
      aggregateId: input.transportOrder.id,
    },
  };
}

export function createTransportOrderRescheduleOutput(input: {
  organizationId: string;
  transportOrder: PlanningTransportOrderWithContext;
  scheduleRevision: PlanningTransportOrderScheduleRevisionRecord;
  replayed: boolean;
  businessRules?: TransportOrderRescheduleBusinessRules;
}): TransportOrderRescheduleOutput {
  return {
    organizationId: input.organizationId,
    orderId: input.transportOrder.id,
    cargoId: input.transportOrder.cargoId,
    revisionId: input.scheduleRevision.id,
    revisionReference: input.scheduleRevision.revisionReference,
    transportOrder: createTransportOrderSummary(input.transportOrder),
    businessRules:
      input.businessRules ??
      createReplayTransportOrderRescheduleBusinessRules({
        downstreamTrackingNotificationRequired: input.transportOrder.trackingShipmentId !== null,
        capacityWindowAligned:
          input.transportOrder.capacityReservation === null ||
          input.transportOrder.capacityReservation.status === "reserved",
      }),
    idempotency: {
      key: input.scheduleRevision.idempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "planning.transport_order.rescheduled",
      subjectType: "transport_order",
      subjectId: input.transportOrder.id,
    },
    outbox: {
      eventType: "planning.transport_order.rescheduled",
      aggregateType: "planning",
      aggregateId: input.transportOrder.id,
    },
  };
}

export function createTransportOrderDispatchOutput(input: {
  organizationId: string;
  transportOrder: PlanningTransportOrderWithContext;
  transportOrderDispatch: PlanningTransportOrderDispatchRecord;
  replayed: boolean;
  businessRules?: TransportOrderDispatchBusinessRules;
}): TransportOrderDispatchOutput {
  return {
    organizationId: input.organizationId,
    orderId: input.transportOrder.id,
    cargoId: input.transportOrder.cargoId,
    dispatchId: input.transportOrderDispatch.id,
    dispatchReference: input.transportOrderDispatch.dispatchReference,
    transportOrder: createTransportOrderSummary(input.transportOrder),
    businessRules:
      input.businessRules ??
      createReplayTransportOrderDispatchBusinessRules({
        capacityReservationReady:
          input.transportOrder.capacityReservation === null ||
          input.transportOrder.capacityReservation.status === "reserved",
        downstreamTrackingNotificationRequired: input.transportOrder.trackingShipmentId !== null,
        latestScheduleAcknowledged: true,
      }),
    idempotency: {
      key: input.transportOrderDispatch.idempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "planning.transport_order.dispatched",
      subjectType: "transport_order",
      subjectId: input.transportOrder.id,
    },
    outbox: {
      eventType: "planning.transport_order.dispatched",
      aggregateType: "planning",
      aggregateId: input.transportOrder.id,
    },
  };
}

// Audit request metadata

export function createAuditRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
