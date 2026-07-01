import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";
import type {
  PlanningCapacityReservationRecord,
  PlanningCargoRecord,
  PlanningTrackingShipmentRecord,
  PlanningTransportOrderDispatchRecord,
  PlanningTransportOrderRecord,
  PlanningTransportOrderScheduleRevisionRecord,
  PlanningTransportOrderWithContext,
  TransportOrderStatusGroup,
} from "../domain/planning.business-rules.js";
import type {
  PlanningDispatchCreateInput,
  PlanningRepository,
  PlanningScheduleRevisionCreateInput,
  PlanningTransportOrderCancelUpdate,
  PlanningTransportOrderCreateInput,
  PlanningTransportOrderDispatchUpdate,
  PlanningTransportOrderRescheduleUpdate,
} from "../domain/planning.repository.js";

const planningCargoSelect = {
  id: true,
  organizationId: true,
  cargoReference: true,
  cargoDescription: true,
  status: true,
  customsStatus: true,
  conditionStatus: true,
  originName: true,
  destinationName: true,
  trackingShipmentId: true,
  releasedAt: true,
} as const;

const transportOrderContextInclude = {
  cargo: {
    select: planningCargoSelect,
  },
  trackingShipment: {
    select: {
      id: true,
      referenceCode: true,
    },
  },
  capacityReservation: {
    select: {
      id: true,
      reservationReference: true,
      status: true,
      cargoId: true,
      slot: {
        select: {
          id: true,
          slotReference: true,
          windowStartAt: true,
          windowEndAt: true,
        },
      },
    },
  },
  scheduleRevisions: {
    orderBy: {
      rescheduledAt: "desc" as const,
    },
    select: {
      revisionReference: true,
      rescheduledByName: true,
      rescheduleReason: true,
      rescheduledAt: true,
    },
    take: 1,
  },
  dispatches: {
    orderBy: {
      dispatchedAt: "desc" as const,
    },
    select: {
      dispatchReference: true,
      dispatchedByName: true,
      dispatchInstructions: true,
      dispatchedAt: true,
    },
    take: 1,
  },
  _count: {
    select: {
      scheduleRevisions: true,
      dispatches: true,
    },
  },
} as const;

@Injectable()
export class PrismaPlanningRepository implements PlanningRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  // Overview queries

  async countTransportOrders(organizationId: string): Promise<number> {
    return this.database.transportOrder.count({
      where: { organizationId },
    });
  }

  async groupTransportOrderStatuses(organizationId: string): Promise<TransportOrderStatusGroup[]> {
    const groups = await this.database.transportOrder.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    });
    return groups as TransportOrderStatusGroup[];
  }

  async countUpcomingDepartures(organizationId: string, now: Date): Promise<number> {
    return this.database.transportOrder.count({
      where: {
        organizationId,
        status: "confirmed",
        plannedDepartureAt: { gte: now },
      },
    });
  }

  async countLinkedCapacityReservations(organizationId: string): Promise<number> {
    return this.database.transportOrder.count({
      where: {
        organizationId,
        capacityReservationId: { not: null },
      },
    });
  }

  async countLinkedTrackingShipments(organizationId: string): Promise<number> {
    return this.database.transportOrder.count({
      where: {
        organizationId,
        trackingShipmentId: { not: null },
      },
    });
  }

  async countDispatches(organizationId: string): Promise<number> {
    return this.database.transportOrderDispatch.count({
      where: { organizationId },
    });
  }

  async countDispatchableOrders(organizationId: string, now: Date): Promise<number> {
    return this.database.transportOrder.count({
      where: {
        organizationId,
        status: "confirmed",
        deletedAt: null,
        OR: [
          {
            dispatches: {
              none: {},
            },
          },
          {
            dispatches: {
              every: {
                dispatchedAt: { lt: now },
              },
            },
          },
        ],
      },
    });
  }

  async countDispatchedOrders(organizationId: string): Promise<number> {
    return this.database.transportOrder.count({
      where: {
        organizationId,
        status: "confirmed",
        deletedAt: null,
        dispatches: {
          some: {},
        },
      },
    });
  }

  async findRecentOrders(organizationId: string, limit: number) {
    return this.database.transportOrder.findMany({
      where: { organizationId },
      include: transportOrderContextInclude,
      orderBy: [{ plannedDepartureAt: "asc" as const }, { createdAt: "desc" as const }],
      take: limit,
    }) as unknown as Promise<PlanningTransportOrderWithContext[]>;
  }

  async findRecentDispatchableOrders(
    organizationId: string,
    limit: number,
    offset: number,
    now: Date,
  ): Promise<PlanningTransportOrderWithContext[]> {
    return this.database.transportOrder.findMany({
      where: {
        organizationId,
        status: "confirmed",
        deletedAt: null,
        OR: [
          {
            dispatches: {
              none: {},
            },
          },
          {
            dispatches: {
              every: {
                dispatchedAt: { lt: now },
              },
            },
          },
        ],
      },
      include: transportOrderContextInclude,
      orderBy: [{ plannedDepartureAt: "asc" as const }, { createdAt: "desc" as const }],
      skip: offset,
      take: limit,
    }) as unknown as Promise<PlanningTransportOrderWithContext[]>;
  }

  // Entity lookups

  async findCargoById(
    organizationId: string,
    cargoId: string,
  ): Promise<PlanningCargoRecord | null> {
    return this.database.cargo.findFirst({
      where: { id: cargoId, organizationId },
      select: planningCargoSelect,
    }) as Promise<PlanningCargoRecord | null>;
  }

  async findTrackingShipmentById(
    organizationId: string,
    trackingShipmentId: string,
  ): Promise<PlanningTrackingShipmentRecord | null> {
    return this.database.trackingShipment.findFirst({
      where: { id: trackingShipmentId, organizationId },
      select: {
        id: true,
        organizationId: true,
        referenceCode: true,
        status: true,
        plannedDepartureAt: true,
        estimatedArrivalAt: true,
        cargo: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    }) as Promise<PlanningTrackingShipmentRecord | null>;
  }

  async findCapacityReservationById(
    organizationId: string,
    capacityReservationId: string,
  ): Promise<PlanningCapacityReservationRecord | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: { id: capacityReservationId, organizationId },
      select: {
        id: true,
        organizationId: true,
        cargoId: true,
        slotId: true,
        reservationReference: true,
        status: true,
        reservedAt: true,
        slot: {
          select: {
            id: true,
            organizationId: true,
            slotReference: true,
            windowStartAt: true,
            windowEndAt: true,
          },
        },
      },
    }) as Promise<PlanningCapacityReservationRecord | null>;
  }

  // Idempotency lookups

  async findTransportOrderByConfirmIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderWithContext | null> {
    return this.database.transportOrder.findFirst({
      where: { organizationId, confirmIdempotencyKey: idempotencyKey },
      include: transportOrderContextInclude,
    }) as unknown as Promise<PlanningTransportOrderWithContext | null>;
  }

  async findTransportOrderByCancelIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderWithContext | null> {
    return this.database.transportOrder.findFirst({
      where: { organizationId, cancelIdempotencyKey: idempotencyKey },
      include: transportOrderContextInclude,
    }) as unknown as Promise<PlanningTransportOrderWithContext | null>;
  }

  async findScheduleRevisionByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord | null> {
    return this.database.transportOrderScheduleRevision.findFirst({
      where: { organizationId, idempotencyKey },
    });
  }

  async findDispatchByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null> {
    return this.database.transportOrderDispatch.findFirst({
      where: { organizationId, idempotencyKey },
    });
  }

  // Transport order lookups

  async findTransportOrderByIdWithContext(
    organizationId: string,
    orderId: string,
  ): Promise<PlanningTransportOrderWithContext | null> {
    return this.database.transportOrder.findFirst({
      where: { organizationId, id: orderId },
      include: transportOrderContextInclude,
    }) as unknown as Promise<PlanningTransportOrderWithContext | null>;
  }

  async findTransportOrderByReference(
    organizationId: string,
    orderReference: string,
  ): Promise<PlanningTransportOrderRecord | null> {
    return this.database.transportOrder.findFirst({
      where: { organizationId, orderReference },
    });
  }

  async findTransportOrderByCancellationReference(
    organizationId: string,
    cancellationReference: string,
  ): Promise<PlanningTransportOrderRecord | null> {
    return this.database.transportOrder.findFirst({
      where: { organizationId, cancellationReference },
    });
  }

  async findTransportOrderByCargoId(
    organizationId: string,
    cargoId: string,
  ): Promise<PlanningTransportOrderRecord | null> {
    return this.database.transportOrder.findFirst({
      where: { organizationId, cargoId },
    });
  }

  // Schedule revision lookups

  async findScheduleRevisionByReference(
    organizationId: string,
    revisionReference: string,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord | null> {
    return this.database.transportOrderScheduleRevision.findFirst({
      where: { organizationId, revisionReference },
    });
  }

  // Dispatch lookups

  async findDispatchByReference(
    organizationId: string,
    dispatchReference: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null> {
    return this.database.transportOrderDispatch.findFirst({
      where: { organizationId, dispatchReference },
    });
  }

  async findDispatchByOrderId(
    organizationId: string,
    orderId: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null> {
    return this.database.transportOrderDispatch.findFirst({
      where: { organizationId, orderId },
    });
  }

  // Transactional writes

  async createTransportOrder(
    tx: PrismaTx,
    data: PlanningTransportOrderCreateInput,
  ): Promise<PlanningTransportOrderWithContext> {
    return tx.transportOrder.create({
      data,
      include: transportOrderContextInclude,
    }) as unknown as Promise<PlanningTransportOrderWithContext>;
  }

  async updateTransportOrderCancel(
    tx: PrismaTx,
    id: string,
    organizationId: string,
    currentStatus: "confirmed" | "cancelled",
    data: PlanningTransportOrderCancelUpdate,
  ): Promise<{ count: number }> {
    return tx.transportOrder.updateMany({
      where: {
        id,
        organizationId,
        status: currentStatus,
        cancelIdempotencyKey: null,
      },
      data,
    }) as unknown as Promise<{ count: number }>;
  }

  async updateTransportOrderReschedule(
    tx: PrismaTx,
    id: string,
    organizationId: string,
    currentStatus: "confirmed" | "cancelled",
    data: PlanningTransportOrderRescheduleUpdate,
  ): Promise<{ count: number }> {
    return tx.transportOrder.updateMany({
      where: { id, organizationId, status: currentStatus },
      data,
    }) as unknown as Promise<{ count: number }>;
  }

  async updateTransportOrderDispatch(
    tx: PrismaTx,
    id: string,
    organizationId: string,
    currentStatus: "confirmed" | "cancelled",
    data: PlanningTransportOrderDispatchUpdate,
  ): Promise<{ count: number }> {
    return tx.transportOrder.updateMany({
      where: { id, organizationId, status: currentStatus },
      data,
    }) as unknown as Promise<{ count: number }>;
  }

  async createScheduleRevision(
    tx: PrismaTx,
    data: PlanningScheduleRevisionCreateInput,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord> {
    return tx.transportOrderScheduleRevision.create({
      data,
    });
  }

  async findTransportOrderByIdAfterUpdate(
    tx: PrismaTx,
    id: string,
    organizationId: string,
  ): Promise<PlanningTransportOrderWithContext> {
    return tx.transportOrder.findFirstOrThrow({
      where: { id, organizationId },
      include: transportOrderContextInclude,
    }) as unknown as Promise<PlanningTransportOrderWithContext>;
  }

  async createDispatch(
    tx: PrismaTx,
    data: PlanningDispatchCreateInput,
  ): Promise<PlanningTransportOrderDispatchRecord> {
    return tx.transportOrderDispatch.create({
      data,
    });
  }
}
