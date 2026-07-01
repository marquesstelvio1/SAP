import type {
  capacityReservationStatuses,
  cargoConditionStatuses,
  cargoCustomsStatuses,
  cargoStatuses,
  TransportOrderCancelInput,
  TransportOrderCancelOutput,
  TransportOrderConfirmInput,
  TransportOrderConfirmOutput,
  TransportOrderDispatchInput,
  TransportOrderDispatchOutput,
  TransportOrderRescheduleInput,
  TransportOrderRescheduleOutput,
  transportOrderModes,
  transportOrderStatuses,
} from "@saptm/rpc";

export type CargoStatus = (typeof cargoStatuses)[number];
export type CargoCustomsStatus = (typeof cargoCustomsStatuses)[number];
export type CargoConditionStatus = (typeof cargoConditionStatuses)[number];
export type CapacityReservationStatus = (typeof capacityReservationStatuses)[number];
export type TransportOrderStatus = (typeof transportOrderStatuses)[number];
export type TransportOrderMode = (typeof transportOrderModes)[number];

export type PlanningCargoRecord = {
  id: string;
  organizationId: string;
  cargoReference: string;
  cargoDescription: string;
  status: CargoStatus;
  customsStatus: CargoCustomsStatus;
  conditionStatus: CargoConditionStatus;
  originName: string;
  destinationName: string;
  trackingShipmentId: string | null;
  releasedAt: Date | null;
};

export type PlanningTrackingShipmentRecord = {
  id: string;
  organizationId: string;
  referenceCode: string;
  status: string;
  plannedDepartureAt: Date | null;
  estimatedArrivalAt: Date | null;
  cargo: {
    id: string;
    organizationId: string;
  } | null;
};

export type PlanningCapacityReservationRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  slotId: string;
  reservationReference: string;
  status: CapacityReservationStatus;
  reservedAt: Date;
  slot: {
    id: string;
    organizationId: string;
    slotReference: string;
    windowStartAt: Date;
    windowEndAt: Date;
  };
};

export type PlanningTransportOrderRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  trackingShipmentId: string | null;
  capacityReservationId: string | null;
  orderReference: string;
  status: TransportOrderStatus;
  mode: TransportOrderMode;
  carrierName: string;
  routeSummary: string;
  originName: string;
  destinationName: string;
  plannedDepartureAt: Date;
  plannedArrivalAt: Date;
  responsiblePlannerName: string;
  confirmationReference: string;
  sourceSystem: string;
  confirmIdempotencyKey: string | null;
  confirmedAt: Date;
  cancellationReference: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
  cancelIdempotencyKey: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanningTransportOrderWithContext = PlanningTransportOrderRecord & {
  cargo: PlanningCargoRecord;
  trackingShipment: {
    id: string;
    referenceCode: string;
  } | null;
  capacityReservation: {
    id: string;
    reservationReference: string;
    status: CapacityReservationStatus;
    cargoId: string;
    slot: {
      id: string;
      slotReference: string;
      windowStartAt: Date;
      windowEndAt: Date;
    };
  } | null;
  scheduleRevisions: PlanningTransportOrderScheduleRevisionSummary[];
  dispatches: PlanningTransportOrderDispatchSummary[];
  _count: {
    scheduleRevisions: number;
    dispatches: number;
  };
};

export type PlanningTransportOrderScheduleRevisionRecord = {
  id: string;
  organizationId: string;
  orderId: string;
  revisionReference: string;
  previousMode: TransportOrderMode;
  newMode: TransportOrderMode;
  previousCarrierName: string;
  newCarrierName: string;
  previousRouteSummary: string;
  newRouteSummary: string;
  previousOriginName: string;
  newOriginName: string;
  previousDestinationName: string;
  newDestinationName: string;
  previousPlannedDepartureAt: Date;
  newPlannedDepartureAt: Date;
  previousPlannedArrivalAt: Date;
  newPlannedArrivalAt: Date;
  rescheduledByName: string;
  rescheduleReason: string;
  sourceSystem: string;
  idempotencyKey: string;
  rescheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanningTransportOrderScheduleRevisionSummary = Pick<
  PlanningTransportOrderScheduleRevisionRecord,
  "rescheduleReason" | "rescheduledAt" | "rescheduledByName" | "revisionReference"
>;

export type PlanningTransportOrderDispatchRecord = {
  id: string;
  organizationId: string;
  orderId: string;
  dispatchReference: string;
  dispatchedByName: string;
  dispatchInstructions: string;
  sourceSystem: string;
  idempotencyKey: string;
  dispatchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanningTransportOrderDispatchSummary = Pick<
  PlanningTransportOrderDispatchRecord,
  "dispatchInstructions" | "dispatchReference" | "dispatchedAt" | "dispatchedByName"
>;

export type TransportOrderStatusGroup = {
  status: TransportOrderStatus;
  _count: {
    _all: number;
  };
};

export type TransportOrderBusinessRules = TransportOrderConfirmOutput["businessRules"];
export type TransportOrderCancelBusinessRules = TransportOrderCancelOutput["businessRules"];
export type TransportOrderRescheduleBusinessRules = TransportOrderRescheduleOutput["businessRules"];
export type TransportOrderDispatchBusinessRules = TransportOrderDispatchOutput["businessRules"];

export function resolveTransportOrderConfirmBusinessRules(input: {
  cargo: PlanningCargoRecord;
  trackingShipment: PlanningTrackingShipmentRecord | null;
  capacityReservation: PlanningCapacityReservationRecord | null;
  duplicateReference: PlanningTransportOrderRecord | null;
  duplicateCargoOrder: PlanningTransportOrderRecord | null;
  input: TransportOrderConfirmInput;
}): TransportOrderBusinessRules {
  const plannedDepartureAt = new Date(input.input.plannedDepartureAt);
  const plannedArrivalAt = new Date(input.input.plannedArrivalAt);
  const confirmedAt = new Date(input.input.confirmedAt);
  const capacityReservationLinked =
    input.input.capacityReservationId === undefined ||
    (input.capacityReservation !== null &&
      input.capacityReservation.status === "reserved" &&
      input.capacityReservation.cargoId === input.cargo.id &&
      plannedDepartureAt >= input.capacityReservation.slot.windowStartAt &&
      plannedDepartureAt <= input.capacityReservation.slot.windowEndAt);
  const trackingShipmentLinked =
    input.input.trackingShipmentId === undefined ||
    (input.trackingShipment !== null &&
      (input.cargo.trackingShipmentId === input.trackingShipment.id ||
        input.trackingShipment.cargo?.id === input.cargo.id));
  const cargoEligible =
    input.cargo.status === "ready_for_transport" &&
    ["not_required", "cleared"].includes(input.cargo.customsStatus) &&
    input.cargo.conditionStatus === "sound";
  const routeDefined =
    input.input.originName.trim().length > 0 &&
    input.input.destinationName.trim().length > 0 &&
    input.input.routeSummary.trim().length >= 8 &&
    input.input.originName.trim().toLowerCase() !==
      input.input.destinationName.trim().toLowerCase();
  const responsibilityAssigned =
    input.input.responsiblePlannerName.trim().length >= 2 &&
    input.input.carrierName.trim().length >= 2 &&
    input.input.confirmationReference.trim().length >= 3;
  const timingValid =
    plannedArrivalAt > plannedDepartureAt &&
    confirmedAt <= plannedDepartureAt &&
    (input.capacityReservation === null ||
      (plannedDepartureAt >= input.capacityReservation.slot.windowStartAt &&
        plannedDepartureAt <= input.capacityReservation.slot.windowEndAt));
  const duplicateOrderBlocked =
    input.duplicateReference === null && input.duplicateCargoOrder === null;
  const orderConfirmed =
    cargoEligible &&
    routeDefined &&
    capacityReservationLinked &&
    trackingShipmentLinked &&
    responsibilityAssigned &&
    timingValid &&
    duplicateOrderBlocked;

  return {
    orderConfirmed,
    cargoEligible,
    routeDefined,
    capacityReservationLinked,
    trackingShipmentLinked,
    responsibilityAssigned,
    timingValid,
    duplicateOrderBlocked,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_REQUIRES_READY_SOUND_CARGO",
      "PLANNING_TRANSPORT_ORDER_REQUIRES_ROUTE_AND_DISTINCT_ENDPOINTS",
      "PLANNING_TRANSPORT_ORDER_REQUIRES_RESPONSIBLE_PLANNER_AND_CARRIER",
      "PLANNING_TRANSPORT_ORDER_REQUIRES_CONFIRMATION_BEFORE_DEPARTURE",
      "PLANNING_TRANSPORT_ORDER_BLOCKS_DUPLICATE_REFERENCE_AND_CARGO",
      "PLANNING_TRANSPORT_ORDER_LINKS_ACTIVE_CAPACITY_RESERVATION_WHEN_PROVIDED",
      "PLANNING_TRANSPORT_ORDER_LINKS_TENANT_TRACKING_SHIPMENT_WHEN_PROVIDED",
    ],
  };
}

export function resolveTransportOrderCancelBusinessRules(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateCancellationReference: PlanningTransportOrderRecord | null;
  input: TransportOrderCancelInput & { cancellationReference: string };
}): TransportOrderCancelBusinessRules {
  const cancelledAt = new Date(input.input.cancelledAt);
  const cancellableState = input.transportOrder.status === "confirmed";
  const timingValid =
    cancelledAt >= input.transportOrder.confirmedAt &&
    cancelledAt <= input.transportOrder.plannedDepartureAt;
  const reasonProvided =
    input.input.cancelledByName.trim().length >= 2 &&
    input.input.cancellationReference.trim().length >= 3 &&
    input.input.cancellationReason.trim().length >= 8;
  const duplicateCancellationReferenceBlocked =
    input.duplicateCancellationReference === null ||
    input.duplicateCancellationReference.id === input.transportOrder.id;
  const dispatchNotStarted = input.transportOrder._count.dispatches === 0;
  const capacityReleaseRequired = input.transportOrder.capacityReservationId !== null;
  const downstreamTrackingNotificationRequired = input.transportOrder.trackingShipmentId !== null;
  const orderCancelled =
    cancellableState &&
    timingValid &&
    reasonProvided &&
    duplicateCancellationReferenceBlocked &&
    dispatchNotStarted;

  return {
    orderCancelled,
    cancellableState,
    timingValid,
    reasonProvided,
    duplicateCancellationReferenceBlocked,
    dispatchNotStarted,
    capacityReleaseRequired,
    downstreamTrackingNotificationRequired,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_REQUIRES_CONFIRMED_STATE",
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_REQUIRES_REASON_AND_REFERENCE",
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_REQUIRES_TIME_BEFORE_DEPARTURE",
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_BLOCKS_DUPLICATE_REFERENCE",
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_BLOCKS_DISPATCHED_ORDER",
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_FLAGS_CAPACITY_RELEASE_WHEN_LINKED",
      "PLANNING_TRANSPORT_ORDER_CANCELLATION_FLAGS_TRACKING_NOTIFICATION_WHEN_LINKED",
    ],
  };
}

export function resolveTransportOrderRescheduleBusinessRules(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateRevision: PlanningTransportOrderScheduleRevisionRecord | null;
  input: TransportOrderRescheduleInput & { revisionReference: string };
}): TransportOrderRescheduleBusinessRules {
  const plannedDepartureAt = new Date(input.input.plannedDepartureAt);
  const plannedArrivalAt = new Date(input.input.plannedArrivalAt);
  const rescheduledAt = new Date(input.input.rescheduledAt);
  const reschedulableState = input.transportOrder.status === "confirmed";
  const routeDefined =
    input.input.originName.trim().length > 0 &&
    input.input.destinationName.trim().length > 0 &&
    input.input.routeSummary.trim().length >= 8 &&
    input.input.originName.trim().toLowerCase() !==
      input.input.destinationName.trim().toLowerCase();
  const responsibilityAssigned =
    input.input.rescheduledByName.trim().length >= 2 &&
    input.input.carrierName.trim().length >= 2 &&
    input.input.revisionReference.trim().length >= 3 &&
    input.input.rescheduleReason.trim().length >= 8;
  const timingValid =
    plannedArrivalAt > plannedDepartureAt &&
    rescheduledAt >= input.transportOrder.confirmedAt &&
    rescheduledAt <= input.transportOrder.plannedDepartureAt &&
    rescheduledAt <= plannedDepartureAt;
  const scheduleChanged =
    input.input.mode !== input.transportOrder.mode ||
    input.input.carrierName.trim() !== input.transportOrder.carrierName ||
    input.input.routeSummary.trim() !== input.transportOrder.routeSummary ||
    input.input.originName.trim() !== input.transportOrder.originName ||
    input.input.destinationName.trim() !== input.transportOrder.destinationName ||
    plannedDepartureAt.getTime() !== input.transportOrder.plannedDepartureAt.getTime() ||
    plannedArrivalAt.getTime() !== input.transportOrder.plannedArrivalAt.getTime();
  const capacityWindowAligned =
    input.transportOrder.capacityReservation === null ||
    (input.transportOrder.capacityReservation.status === "reserved" &&
      input.transportOrder.capacityReservation.cargoId === input.transportOrder.cargoId &&
      plannedDepartureAt >= input.transportOrder.capacityReservation.slot.windowStartAt &&
      plannedDepartureAt <= input.transportOrder.capacityReservation.slot.windowEndAt);
  const duplicateRevisionBlocked = input.duplicateRevision === null;
  const dispatchNotStarted = input.transportOrder._count.dispatches === 0;
  const downstreamTrackingNotificationRequired = input.transportOrder.trackingShipmentId !== null;
  const orderRescheduled =
    reschedulableState &&
    routeDefined &&
    responsibilityAssigned &&
    timingValid &&
    scheduleChanged &&
    capacityWindowAligned &&
    duplicateRevisionBlocked &&
    dispatchNotStarted;

  return {
    orderRescheduled,
    reschedulableState,
    routeDefined,
    responsibilityAssigned,
    timingValid,
    scheduleChanged,
    capacityWindowAligned,
    duplicateRevisionBlocked,
    dispatchNotStarted,
    downstreamTrackingNotificationRequired,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_REQUIRES_CONFIRMED_STATE",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_REQUIRES_ROUTE_AND_DISTINCT_ENDPOINTS",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_REQUIRES_REASON_AND_RESPONSIBLE_PLANNER",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_REQUIRES_TIME_BEFORE_CURRENT_AND_NEW_DEPARTURE",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_REQUIRES_ACTUAL_SCHEDULE_CHANGE",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_BLOCKS_DUPLICATE_REVISION_REFERENCE",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_BLOCKS_DISPATCHED_ORDER",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_ALIGNS_ACTIVE_CAPACITY_WINDOW_WHEN_LINKED",
      "PLANNING_TRANSPORT_ORDER_RESCHEDULE_FLAGS_TRACKING_NOTIFICATION_WHEN_LINKED",
    ],
  };
}

export function resolveTransportOrderDispatchBusinessRules(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateDispatchReference: PlanningTransportOrderDispatchRecord | null;
  duplicateOrderDispatch: PlanningTransportOrderDispatchRecord | null;
  input: TransportOrderDispatchInput & { dispatchReference: string };
}): TransportOrderDispatchBusinessRules {
  const dispatchedAt = new Date(input.input.dispatchedAt);
  const lastScheduleRevision = input.transportOrder.scheduleRevisions.at(0);
  const dispatchableState = input.transportOrder.status === "confirmed";
  const latestScheduleAcknowledged =
    lastScheduleRevision === undefined || dispatchedAt >= lastScheduleRevision.rescheduledAt;
  const timingValid =
    dispatchedAt >= input.transportOrder.confirmedAt &&
    dispatchedAt <= input.transportOrder.plannedDepartureAt &&
    latestScheduleAcknowledged;
  const responsibilityAssigned =
    input.input.dispatchedByName.trim().length >= 2 &&
    input.input.dispatchReference.trim().length >= 3 &&
    input.input.dispatchInstructions.trim().length >= 8;
  const capacityReservationReady =
    input.transportOrder.capacityReservation === null ||
    (input.transportOrder.capacityReservation.status === "reserved" &&
      input.transportOrder.capacityReservation.cargoId === input.transportOrder.cargoId &&
      input.transportOrder.plannedDepartureAt >=
        input.transportOrder.capacityReservation.slot.windowStartAt &&
      input.transportOrder.plannedDepartureAt <=
        input.transportOrder.capacityReservation.slot.windowEndAt);
  const duplicateDispatchBlocked =
    input.duplicateDispatchReference === null && input.duplicateOrderDispatch === null;
  const downstreamTrackingNotificationRequired = input.transportOrder.trackingShipmentId !== null;
  const orderDispatched =
    dispatchableState &&
    timingValid &&
    responsibilityAssigned &&
    latestScheduleAcknowledged &&
    capacityReservationReady &&
    duplicateDispatchBlocked;

  return {
    orderDispatched,
    dispatchableState,
    timingValid,
    responsibilityAssigned,
    latestScheduleAcknowledged,
    capacityReservationReady,
    duplicateDispatchBlocked,
    downstreamTrackingNotificationRequired,
    appliedRules: [
      "PLANNING_TRANSPORT_ORDER_DISPATCH_REQUIRES_CONFIRMED_STATE",
      "PLANNING_TRANSPORT_ORDER_DISPATCH_REQUIRES_TIME_AFTER_CONFIRMATION_AND_BEFORE_DEPARTURE",
      "PLANNING_TRANSPORT_ORDER_DISPATCH_REQUIRES_LATEST_SCHEDULE_ACKNOWLEDGED",
      "PLANNING_TRANSPORT_ORDER_DISPATCH_REQUIRES_RESPONSIBLE_OPERATOR_AND_INSTRUCTIONS",
      "PLANNING_TRANSPORT_ORDER_DISPATCH_BLOCKS_DUPLICATE_REFERENCE_AND_ORDER",
      "PLANNING_TRANSPORT_ORDER_DISPATCH_REQUIRES_READY_CAPACITY_RESERVATION_WHEN_LINKED",
      "PLANNING_TRANSPORT_ORDER_DISPATCH_FLAGS_TRACKING_NOTIFICATION_WHEN_LINKED",
    ],
  };
}
