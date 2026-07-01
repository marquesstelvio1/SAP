import type { PrismaTx } from "@saptm/database";
import type {
  PlanningCapacityReservationRecord,
  PlanningCargoRecord,
  PlanningTrackingShipmentRecord,
  PlanningTransportOrderDispatchRecord,
  PlanningTransportOrderRecord,
  PlanningTransportOrderScheduleRevisionRecord,
  PlanningTransportOrderWithContext,
  TransportOrderStatusGroup,
} from "./planning.business-rules.js";

export const PLANNING_REPOSITORY = Symbol("PlanningRepository");

export type PlanningTransportOrderCreateInput = {
  organizationId: string;
  cargoId: string;
  trackingShipmentId: string | null;
  capacityReservationId: string | null;
  orderReference: string;
  status: "confirmed" | "cancelled";
  mode: "rail" | "road" | "sea" | "barge" | "multimodal";
  carrierName: string;
  routeSummary: string;
  originName: string;
  destinationName: string;
  plannedDepartureAt: Date;
  plannedArrivalAt: Date;
  responsiblePlannerName: string;
  confirmationReference: string;
  sourceSystem: string;
  confirmIdempotencyKey: string;
  confirmedAt: Date;
};

export type PlanningTransportOrderCancelUpdate = {
  status: "confirmed" | "cancelled";
  cancellationReference: string;
  cancelledByName: string;
  cancellationReason: string;
  cancelledAt: Date;
  cancelIdempotencyKey: string;
};

export type PlanningTransportOrderRescheduleUpdate = {
  mode: "rail" | "road" | "sea" | "barge" | "multimodal";
  carrierName: string;
  routeSummary: string;
  originName: string;
  destinationName: string;
  plannedDepartureAt: Date;
  plannedArrivalAt: Date;
  sourceSystem: string;
};

export type PlanningTransportOrderDispatchUpdate = {
  sourceSystem: string;
};

export type PlanningScheduleRevisionCreateInput = {
  organizationId: string;
  orderId: string;
  revisionReference: string;
  previousMode: "rail" | "road" | "sea" | "barge" | "multimodal";
  newMode: "rail" | "road" | "sea" | "barge" | "multimodal";
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
};

export type PlanningDispatchCreateInput = {
  organizationId: string;
  orderId: string;
  dispatchReference: string;
  dispatchedByName: string;
  dispatchInstructions: string;
  sourceSystem: string;
  idempotencyKey: string;
  dispatchedAt: Date;
};

export interface PlanningRepository {
  // Overview queries
  countTransportOrders(organizationId: string): Promise<number>;
  groupTransportOrderStatuses(organizationId: string): Promise<TransportOrderStatusGroup[]>;
  countUpcomingDepartures(organizationId: string, now: Date): Promise<number>;
  countLinkedCapacityReservations(organizationId: string): Promise<number>;
  countLinkedTrackingShipments(organizationId: string): Promise<number>;
  countDispatches(organizationId: string): Promise<number>;
  countDispatchableOrders(organizationId: string, now: Date): Promise<number>;
  countDispatchedOrders(organizationId: string): Promise<number>;
  findRecentOrders(
    organizationId: string,
    limit: number,
  ): Promise<PlanningTransportOrderWithContext[]>;
  findRecentDispatchableOrders(
    organizationId: string,
    limit: number,
    offset: number,
    now: Date,
  ): Promise<PlanningTransportOrderWithContext[]>;

  // Entity lookups
  findCargoById(organizationId: string, cargoId: string): Promise<PlanningCargoRecord | null>;
  findTrackingShipmentById(
    organizationId: string,
    trackingShipmentId: string,
  ): Promise<PlanningTrackingShipmentRecord | null>;
  findCapacityReservationById(
    organizationId: string,
    capacityReservationId: string,
  ): Promise<PlanningCapacityReservationRecord | null>;

  // Idempotency lookups
  findTransportOrderByConfirmIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderWithContext | null>;
  findTransportOrderByCancelIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderWithContext | null>;
  findScheduleRevisionByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord | null>;
  findDispatchByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null>;

  // Transport order lookups
  findTransportOrderByIdWithContext(
    organizationId: string,
    orderId: string,
  ): Promise<PlanningTransportOrderWithContext | null>;
  findTransportOrderByReference(
    organizationId: string,
    orderReference: string,
  ): Promise<PlanningTransportOrderRecord | null>;
  findTransportOrderByCancellationReference(
    organizationId: string,
    cancellationReference: string,
  ): Promise<PlanningTransportOrderRecord | null>;
  findTransportOrderByCargoId(
    organizationId: string,
    cargoId: string,
  ): Promise<PlanningTransportOrderRecord | null>;

  // Schedule revision lookups
  findScheduleRevisionByReference(
    organizationId: string,
    revisionReference: string,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord | null>;

  // Dispatch lookups
  findDispatchByReference(
    organizationId: string,
    dispatchReference: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null>;
  findDispatchByOrderId(
    organizationId: string,
    orderId: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null>;

  // Transactional writes
  createTransportOrder(
    tx: PrismaTx,
    data: PlanningTransportOrderCreateInput,
  ): Promise<PlanningTransportOrderWithContext>;

  updateTransportOrderCancel(
    tx: PrismaTx,
    id: string,
    organizationId: string,
    currentStatus: "confirmed" | "cancelled",
    data: PlanningTransportOrderCancelUpdate,
  ): Promise<{ count: number }>;

  updateTransportOrderReschedule(
    tx: PrismaTx,
    id: string,
    organizationId: string,
    currentStatus: "confirmed" | "cancelled",
    data: PlanningTransportOrderRescheduleUpdate,
  ): Promise<{ count: number }>;

  updateTransportOrderDispatch(
    tx: PrismaTx,
    id: string,
    organizationId: string,
    currentStatus: "confirmed" | "cancelled",
    data: PlanningTransportOrderDispatchUpdate,
  ): Promise<{ count: number }>;

  createScheduleRevision(
    tx: PrismaTx,
    data: PlanningScheduleRevisionCreateInput,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord>;

  findTransportOrderByIdAfterUpdate(
    tx: PrismaTx,
    id: string,
    organizationId: string,
  ): Promise<PlanningTransportOrderWithContext>;

  createDispatch(
    tx: PrismaTx,
    data: PlanningDispatchCreateInput,
  ): Promise<PlanningTransportOrderDispatchRecord>;
}
