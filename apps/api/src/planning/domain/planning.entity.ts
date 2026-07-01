import type { TransportOrderMode, TransportOrderStatus } from "./planning.business-rules.js";

export class OrderReference {
  private constructor(readonly value: string) {}

  static create(value: string): OrderReference {
    const trimmed = value.trim().toUpperCase();

    if (trimmed.length < 3 || trimmed.length > 80) {
      throw new Error("planning.order_reference.invalid_length");
    }

    return new OrderReference(trimmed);
  }

  static from(value: string): OrderReference {
    return new OrderReference(value);
  }

  equals(other: OrderReference): boolean {
    return this.value === other.value;
  }
}

export interface PlanningTransportOrderEntity {
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
}

export interface PlanningScheduleRevisionEntity {
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
}

export interface PlanningDispatchEntity {
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
}

export type PlanningTransportOrderSummary = {
  id: string;
  orderReference: string;
  cargoId: string;
  status: TransportOrderStatus;
  mode: TransportOrderMode;
  carrierName: string;
  originName: string;
  destinationName: string;
  plannedDepartureAt: Date;
  plannedArrivalAt: Date;
};
