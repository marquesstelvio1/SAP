import type { AuditJsonValue } from "@saptm/database";
import type {
  TransportOrderCancelOutput,
  TransportOrderConfirmOutput,
  TransportOrderDispatchOutput,
  TransportOrderRescheduleOutput,
} from "@saptm/rpc";
import type {
  PlanningCapacityReservationRecord,
  PlanningCargoRecord,
  PlanningTrackingShipmentRecord,
  PlanningTransportOrderDispatchRecord,
  PlanningTransportOrderRecord,
  PlanningTransportOrderScheduleRevisionRecord,
  PlanningTransportOrderWithContext,
} from "./planning.business-rules.js";

export function createTransportOrderConfirmAuditBefore(input: {
  cargo: PlanningCargoRecord;
  trackingShipment: PlanningTrackingShipmentRecord | null;
  capacityReservation: PlanningCapacityReservationRecord | null;
  duplicateReference: PlanningTransportOrderRecord | null;
  duplicateCargoOrder: PlanningTransportOrderRecord | null;
  businessRules: TransportOrderConfirmOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargo: {
      id: input.cargo.id,
      cargoReference: input.cargo.cargoReference,
      status: input.cargo.status,
      customsStatus: input.cargo.customsStatus,
      conditionStatus: input.cargo.conditionStatus,
      releasedAt: input.cargo.releasedAt?.toISOString() ?? null,
    },
    trackingShipment:
      input.trackingShipment === null ? null : createTrackingAudit(input.trackingShipment),
    capacityReservation:
      input.capacityReservation === null
        ? null
        : createCapacityReservationAudit(input.capacityReservation),
    duplicates: {
      orderReferenceOrderId: input.duplicateReference?.id ?? null,
      cargoOrderId: input.duplicateCargoOrder?.id ?? null,
    },
    businessRules: input.businessRules,
  };
}

export function createTransportOrderConfirmAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  businessRules: TransportOrderConfirmOutput["businessRules"];
}): AuditJsonValue {
  return {
    transportOrder: {
      id: input.transportOrder.id,
      orderReference: input.transportOrder.orderReference,
      cargoId: input.transportOrder.cargoId,
      cargoReference: input.transportOrder.cargo.cargoReference,
      mode: input.transportOrder.mode,
      carrierName: input.transportOrder.carrierName,
      routeSummary: input.transportOrder.routeSummary,
      originName: input.transportOrder.originName,
      destinationName: input.transportOrder.destinationName,
      plannedDepartureAt: input.transportOrder.plannedDepartureAt.toISOString(),
      plannedArrivalAt: input.transportOrder.plannedArrivalAt.toISOString(),
      status: input.transportOrder.status,
    },
    businessRules: input.businessRules,
  };
}

export function createTransportOrderCancelAuditBefore(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateCancellationReference: PlanningTransportOrderRecord | null;
  businessRules: TransportOrderCancelOutput["businessRules"];
}): AuditJsonValue {
  return {
    transportOrder: {
      id: input.transportOrder.id,
      orderReference: input.transportOrder.orderReference,
      status: input.transportOrder.status,
    },
    duplicates: {
      cancellationReferenceOrderId: input.duplicateCancellationReference?.id ?? null,
    },
    businessRules: input.businessRules,
  };
}

export function createTransportOrderCancelAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  businessRules: TransportOrderCancelOutput["businessRules"];
}): AuditJsonValue {
  return {
    transportOrder: {
      id: input.transportOrder.id,
      orderReference: input.transportOrder.orderReference,
      status: input.transportOrder.status,
      cancellationReference: input.transportOrder.cancellationReference,
      cancelledByName: input.transportOrder.cancelledByName,
      cancellationReason: input.transportOrder.cancellationReason,
      cancelledAt: input.transportOrder.cancelledAt?.toISOString() ?? null,
    },
    businessRules: input.businessRules,
  };
}

export function createTransportOrderRescheduleAuditBefore(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateRevision: PlanningTransportOrderScheduleRevisionRecord | null;
  businessRules: TransportOrderRescheduleOutput["businessRules"];
}): AuditJsonValue {
  return {
    transportOrder: {
      id: input.transportOrder.id,
      orderReference: input.transportOrder.orderReference,
      mode: input.transportOrder.mode,
      carrierName: input.transportOrder.carrierName,
      routeSummary: input.transportOrder.routeSummary,
      originName: input.transportOrder.originName,
      destinationName: input.transportOrder.destinationName,
      plannedDepartureAt: input.transportOrder.plannedDepartureAt.toISOString(),
      plannedArrivalAt: input.transportOrder.plannedArrivalAt.toISOString(),
    },
    duplicates: {
      revisionId: input.duplicateRevision?.id ?? null,
      revisionReference: input.duplicateRevision?.revisionReference ?? null,
    },
    businessRules: input.businessRules,
  };
}

export function createTransportOrderRescheduleAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  scheduleRevision: PlanningTransportOrderScheduleRevisionRecord;
  businessRules: TransportOrderRescheduleOutput["businessRules"];
}): AuditJsonValue {
  return {
    transportOrder: {
      id: input.transportOrder.id,
      orderReference: input.transportOrder.orderReference,
      mode: input.transportOrder.mode,
      carrierName: input.transportOrder.carrierName,
      routeSummary: input.transportOrder.routeSummary,
      originName: input.transportOrder.originName,
      destinationName: input.transportOrder.destinationName,
      plannedDepartureAt: input.transportOrder.plannedDepartureAt.toISOString(),
      plannedArrivalAt: input.transportOrder.plannedArrivalAt.toISOString(),
    },
    scheduleRevision: createScheduleRevisionAudit(input.scheduleRevision),
    businessRules: input.businessRules,
  };
}

export function createTransportOrderDispatchAuditBefore(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateDispatchReference: PlanningTransportOrderDispatchRecord | null;
  duplicateOrderDispatch: PlanningTransportOrderDispatchRecord | null;
  businessRules: TransportOrderDispatchOutput["businessRules"];
}): AuditJsonValue {
  return {
    transportOrder: {
      id: input.transportOrder.id,
      orderReference: input.transportOrder.orderReference,
      status: input.transportOrder.status,
    },
    duplicates: {
      dispatchReferenceDispatchId: input.duplicateDispatchReference?.id ?? null,
      orderDispatchId: input.duplicateOrderDispatch?.id ?? null,
    },
    businessRules: input.businessRules,
  };
}

export function createTransportOrderDispatchAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  transportOrderDispatch: PlanningTransportOrderDispatchRecord;
  businessRules: TransportOrderDispatchOutput["businessRules"];
}): AuditJsonValue {
  return {
    transportOrder: {
      id: input.transportOrder.id,
      orderReference: input.transportOrder.orderReference,
      status: input.transportOrder.status,
    },
    dispatch: createTransportOrderDispatchAudit(input.transportOrderDispatch),
    businessRules: input.businessRules,
  };
}

// Audit helpers

function createTransportOrderDispatchAudit(
  dispatch: PlanningTransportOrderDispatchRecord,
): AuditJsonValue {
  return {
    id: dispatch.id,
    orderId: dispatch.orderId,
    dispatchReference: dispatch.dispatchReference,
    dispatchedByName: dispatch.dispatchedByName,
    dispatchInstructions: dispatch.dispatchInstructions,
    dispatchedAt: dispatch.dispatchedAt.toISOString(),
    sourceSystem: dispatch.sourceSystem,
  };
}

function createScheduleRevisionAudit(
  revision: PlanningTransportOrderScheduleRevisionRecord,
): AuditJsonValue {
  return {
    id: revision.id,
    revisionReference: revision.revisionReference,
    previousMode: revision.previousMode,
    newMode: revision.newMode,
    previousCarrierName: revision.previousCarrierName,
    newCarrierName: revision.newCarrierName,
    previousRouteSummary: revision.previousRouteSummary,
    newRouteSummary: revision.newRouteSummary,
    previousOriginName: revision.previousOriginName,
    newOriginName: revision.newOriginName,
    previousDestinationName: revision.previousDestinationName,
    newDestinationName: revision.newDestinationName,
    previousPlannedDepartureAt: revision.previousPlannedDepartureAt.toISOString(),
    newPlannedDepartureAt: revision.newPlannedDepartureAt.toISOString(),
    previousPlannedArrivalAt: revision.previousPlannedArrivalAt.toISOString(),
    newPlannedArrivalAt: revision.newPlannedArrivalAt.toISOString(),
    rescheduledByName: revision.rescheduledByName,
    rescheduleReason: revision.rescheduleReason,
    rescheduledAt: revision.rescheduledAt.toISOString(),
    sourceSystem: revision.sourceSystem,
  };
}

function createTrackingAudit(trackingShipment: PlanningTrackingShipmentRecord): AuditJsonValue {
  return {
    id: trackingShipment.id,
    referenceCode: trackingShipment.referenceCode,
    status: trackingShipment.status,
    plannedDepartureAt: trackingShipment.plannedDepartureAt?.toISOString() ?? null,
    estimatedArrivalAt: trackingShipment.estimatedArrivalAt?.toISOString() ?? null,
    cargoId: trackingShipment.cargo?.id ?? null,
  };
}

function createCapacityReservationAudit(
  reservation: PlanningCapacityReservationRecord,
): AuditJsonValue {
  return {
    id: reservation.id,
    cargoId: reservation.cargoId,
    slotId: reservation.slotId,
    reservationReference: reservation.reservationReference,
    status: reservation.status,
    reservedAt: reservation.reservedAt.toISOString(),
    slot: {
      id: reservation.slot.id,
      slotReference: reservation.slot.slotReference,
      windowStartAt: reservation.slot.windowStartAt.toISOString(),
      windowEndAt: reservation.slot.windowEndAt.toISOString(),
    },
  };
}
