import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AuditJsonValue,
  type DatabaseActorType,
  getPrismaClient,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  capacityReservationStatuses,
  cargoConditionStatuses,
  cargoCustomsStatuses,
  cargoStatuses,
  PlanningOverviewOutput,
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

export type GetPlanningOverviewInput = {
  organizationId: string;
  limit?: number;
  generatedAt?: Date;
};

export type ConfirmTransportOrderInput = TransportOrderConfirmInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CancelTransportOrderInput = TransportOrderCancelInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RescheduleTransportOrderInput = TransportOrderRescheduleInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type DispatchTransportOrderInput = TransportOrderDispatchInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

type CargoStatus = (typeof cargoStatuses)[number];
type CargoCustomsStatus = (typeof cargoCustomsStatuses)[number];
type CargoConditionStatus = (typeof cargoConditionStatuses)[number];
type CapacityReservationStatus = (typeof capacityReservationStatuses)[number];
type TransportOrderStatus = (typeof transportOrderStatuses)[number];
type TransportOrderMode = (typeof transportOrderModes)[number];

type PlanningCargoRecord = {
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

type PlanningTrackingShipmentRecord = {
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

type PlanningCapacityReservationRecord = {
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

type PlanningTransportOrderRecord = {
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

type PlanningTransportOrderWithContext = PlanningTransportOrderRecord & {
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

type PlanningTransportOrderScheduleRevisionRecord = {
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

type PlanningTransportOrderScheduleRevisionSummary = Pick<
  PlanningTransportOrderScheduleRevisionRecord,
  "rescheduleReason" | "rescheduledAt" | "rescheduledByName" | "revisionReference"
>;

type PlanningTransportOrderDispatchRecord = {
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

type PlanningTransportOrderDispatchSummary = Pick<
  PlanningTransportOrderDispatchRecord,
  "dispatchInstructions" | "dispatchReference" | "dispatchedAt" | "dispatchedByName"
>;

type TransportOrderStatusGroup = {
  status: TransportOrderStatus;
  _count: {
    _all: number;
  };
};

type TransportOrderBusinessRules = TransportOrderConfirmOutput["businessRules"];
type TransportOrderCancelBusinessRules = TransportOrderCancelOutput["businessRules"];
type TransportOrderRescheduleBusinessRules = TransportOrderRescheduleOutput["businessRules"];
type TransportOrderDispatchBusinessRules = TransportOrderDispatchOutput["businessRules"];

@Injectable()
export class PlanningService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async getOverview(input: GetPlanningOverviewInput): Promise<PlanningOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const now = input.generatedAt ?? new Date();
    const [
      transportOrders,
      statusGroups,
      upcomingDepartures,
      linkedCapacity,
      linkedTracking,
      dispatched,
      recentOrders,
    ] = await Promise.all([
      this.database.transportOrder.count({
        where: {
          organizationId: input.organizationId,
        },
      }),
      this.database.transportOrder.groupBy({
        by: ["status"],
        where: {
          organizationId: input.organizationId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.transportOrder.count({
        where: {
          organizationId: input.organizationId,
          status: "confirmed",
          plannedDepartureAt: {
            gte: now,
          },
        },
      }),
      this.database.transportOrder.count({
        where: {
          organizationId: input.organizationId,
          capacityReservationId: {
            not: null,
          },
        },
      }),
      this.database.transportOrder.count({
        where: {
          organizationId: input.organizationId,
          trackingShipmentId: {
            not: null,
          },
        },
      }),
      this.database.transportOrderDispatch.count({
        where: {
          organizationId: input.organizationId,
        },
      }),
      this.database.transportOrder.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: transportOrderContextInclude,
        orderBy: [{ plannedDepartureAt: "asc" }, { createdAt: "desc" }],
        take: limit,
      }),
    ]);
    const statusCounts = createTransportOrderStatusCounts(statusGroups);

    return {
      generatedAt: now.toISOString(),
      organizationId: input.organizationId,
      totals: {
        transportOrders,
        confirmed: statusCounts.confirmed,
        cancelled: statusCounts.cancelled,
        upcomingDepartures,
        linkedCapacityReservations: linkedCapacity,
        linkedTrackingShipments: linkedTracking,
        dispatched,
      },
      recentOrders: recentOrders.map(createTransportOrderSummary),
    };
  }

  async confirmTransportOrder(
    input: ConfirmTransportOrderInput,
  ): Promise<TransportOrderConfirmOutput> {
    const orderReference = normalizePlanningCode(input.orderReference);
    const confirmationReference = normalizePlanningCode(input.confirmationReference);
    const replayedOrder = await this.findTransportOrderByConfirmIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedOrder !== null) {
      if (
        replayedOrder.cargoId !== input.cargoId ||
        replayedOrder.orderReference !== orderReference
      ) {
        throw new BadRequestException("planning.transport_order_confirm_idempotency_conflict");
      }

      return createTransportOrderConfirmOutput({
        organizationId: input.organizationId,
        transportOrder: replayedOrder,
        replayed: true,
      });
    }

    const [cargo, trackingShipment, capacityReservation, duplicateReference, duplicateCargoOrder] =
      await Promise.all([
        this.findCargoById(input.organizationId, input.cargoId),
        input.trackingShipmentId === undefined
          ? Promise.resolve(null)
          : this.findTrackingShipmentById(input.organizationId, input.trackingShipmentId),
        input.capacityReservationId === undefined
          ? Promise.resolve(null)
          : this.findCapacityReservationById(input.organizationId, input.capacityReservationId),
        this.findTransportOrderByReference(input.organizationId, orderReference),
        this.findTransportOrderByCargoId(input.organizationId, input.cargoId),
      ]);

    if (cargo === null) {
      throw new NotFoundException("planning.cargo_not_found");
    }

    if (input.trackingShipmentId !== undefined && trackingShipment === null) {
      throw new NotFoundException("planning.tracking_shipment_not_found");
    }

    if (input.capacityReservationId !== undefined && capacityReservation === null) {
      throw new NotFoundException("planning.capacity_reservation_not_found");
    }

    const businessRules = resolveTransportOrderConfirmBusinessRules({
      cargo,
      trackingShipment,
      capacityReservation,
      duplicateReference,
      duplicateCargoOrder,
      input,
    });

    if (!businessRules.orderConfirmed) {
      throw new BadRequestException("planning.transport_order_confirm_blocked");
    }

    const auditBefore = createTransportOrderConfirmAuditBefore({
      cargo,
      trackingShipment,
      capacityReservation,
      duplicateReference,
      duplicateCargoOrder,
      businessRules,
    });
    const transportOrder = await this.database.$transaction(async (transaction) => {
      const createdOrder = await transaction.transportOrder.create({
        data: {
          organizationId: input.organizationId,
          cargoId: cargo.id,
          trackingShipmentId: trackingShipment?.id ?? null,
          capacityReservationId: capacityReservation?.id ?? null,
          orderReference,
          status: "confirmed",
          mode: input.mode,
          carrierName: input.carrierName.trim(),
          routeSummary: input.routeSummary.trim(),
          originName: input.originName.trim(),
          destinationName: input.destinationName.trim(),
          plannedDepartureAt: new Date(input.plannedDepartureAt),
          plannedArrivalAt: new Date(input.plannedArrivalAt),
          responsiblePlannerName: input.responsiblePlannerName.trim(),
          confirmationReference,
          sourceSystem: input.sourceSystem,
          confirmIdempotencyKey: input.idempotencyKey,
          confirmedAt: new Date(input.confirmedAt),
        },
        include: transportOrderContextInclude,
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "planning.transport_order.confirmed",
          subjectType: "transport_order",
          subjectId: createdOrder.id,
          severity: "high",
          before: auditBefore,
          after: createTransportOrderConfirmAuditAfter({
            transportOrder: createdOrder,
            businessRules,
          }),
          reason: "Governed transport order confirmation.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "planning.transport_order.confirmed",
          aggregateType: "planning",
          aggregateId: createdOrder.id,
          payload: {
            transportOrderId: createdOrder.id,
            orderReference: createdOrder.orderReference,
            cargoId: createdOrder.cargoId,
            cargoReference: createdOrder.cargo.cargoReference,
            trackingShipmentId: createdOrder.trackingShipmentId,
            capacityReservationId: createdOrder.capacityReservationId,
            mode: createdOrder.mode,
            carrierName: createdOrder.carrierName,
            plannedDepartureAt: createdOrder.plannedDepartureAt.toISOString(),
            plannedArrivalAt: createdOrder.plannedArrivalAt.toISOString(),
            appliedRules: businessRules.appliedRules,
            idempotencyKey: input.idempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createdOrder;
    });

    return createTransportOrderConfirmOutput({
      organizationId: input.organizationId,
      transportOrder,
      replayed: false,
      businessRules,
    });
  }

  async cancelTransportOrder(
    input: CancelTransportOrderInput,
  ): Promise<TransportOrderCancelOutput> {
    const cancellationReference = normalizePlanningCode(input.cancellationReference);
    const replayedOrder = await this.findTransportOrderByCancelIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedOrder !== null) {
      if (replayedOrder.id !== input.orderId) {
        throw new BadRequestException("planning.transport_order_cancel_idempotency_conflict");
      }

      return createTransportOrderCancelOutput({
        organizationId: input.organizationId,
        transportOrder: replayedOrder,
        replayed: true,
      });
    }

    const [transportOrder, duplicateCancellationReference] = await Promise.all([
      this.findTransportOrderByIdWithContext(input.organizationId, input.orderId),
      this.findTransportOrderByCancellationReference(input.organizationId, cancellationReference),
    ]);

    if (transportOrder === null) {
      throw new NotFoundException("planning.transport_order_not_found");
    }

    const businessRules = resolveTransportOrderCancelBusinessRules({
      transportOrder,
      duplicateCancellationReference,
      input: {
        ...input,
        cancellationReference,
      },
    });

    if (!businessRules.orderCancelled) {
      throw new BadRequestException("planning.transport_order_cancel_blocked");
    }

    const cancelledAt = new Date(input.cancelledAt);
    const auditBefore = createTransportOrderCancelAuditBefore({
      transportOrder,
      duplicateCancellationReference,
      businessRules,
    });
    const cancelledOrder = await this.database.$transaction(async (transaction) => {
      const updateResult = await transaction.transportOrder.updateMany({
        where: {
          id: transportOrder.id,
          organizationId: input.organizationId,
          status: "confirmed",
          cancelIdempotencyKey: null,
        },
        data: {
          status: "cancelled",
          cancellationReference,
          cancelledByName: input.cancelledByName.trim(),
          cancellationReason: input.cancellationReason.trim(),
          cancelledAt,
          cancelIdempotencyKey: input.idempotencyKey,
        },
      });

      if (updateResult.count !== 1) {
        throw new BadRequestException("planning.transport_order_state_changed");
      }

      const updatedOrder = await transaction.transportOrder.findFirstOrThrow({
        where: {
          id: transportOrder.id,
          organizationId: input.organizationId,
        },
        include: transportOrderContextInclude,
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "planning.transport_order.cancelled",
          subjectType: "transport_order",
          subjectId: updatedOrder.id,
          severity: "high",
          before: auditBefore,
          after: createTransportOrderCancelAuditAfter({
            transportOrder: updatedOrder,
            businessRules,
          }),
          reason: "Governed transport order cancellation.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "planning.transport_order.cancelled",
          aggregateType: "planning",
          aggregateId: updatedOrder.id,
          payload: {
            transportOrderId: updatedOrder.id,
            orderReference: updatedOrder.orderReference,
            cargoId: updatedOrder.cargoId,
            cargoReference: updatedOrder.cargo.cargoReference,
            cancellationReference: updatedOrder.cancellationReference,
            cancelledAt: updatedOrder.cancelledAt?.toISOString() ?? null,
            cancelledByName: updatedOrder.cancelledByName,
            cancellationReason: updatedOrder.cancellationReason,
            capacityReservationId: updatedOrder.capacityReservationId,
            trackingShipmentId: updatedOrder.trackingShipmentId,
            capacityReleaseRequired: businessRules.capacityReleaseRequired,
            downstreamTrackingNotificationRequired:
              businessRules.downstreamTrackingNotificationRequired,
            appliedRules: businessRules.appliedRules,
            idempotencyKey: input.idempotencyKey,
            sourceSystem: input.sourceSystem,
            correlationId: input.correlationId,
          },
        },
      });

      return updatedOrder;
    });

    return createTransportOrderCancelOutput({
      organizationId: input.organizationId,
      transportOrder: cancelledOrder,
      replayed: false,
      businessRules,
    });
  }

  async rescheduleTransportOrder(
    input: RescheduleTransportOrderInput,
  ): Promise<TransportOrderRescheduleOutput> {
    const revisionReference = normalizePlanningCode(input.revisionReference);
    const replayedRevision = await this.findScheduleRevisionByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedRevision !== null) {
      if (replayedRevision.orderId !== input.orderId) {
        throw new BadRequestException("planning.transport_order_reschedule_idempotency_conflict");
      }

      const replayedOrder = await this.findTransportOrderByIdWithContext(
        input.organizationId,
        replayedRevision.orderId,
      );

      if (replayedOrder === null) {
        throw new NotFoundException("planning.transport_order_not_found");
      }

      return createTransportOrderRescheduleOutput({
        organizationId: input.organizationId,
        transportOrder: replayedOrder,
        scheduleRevision: replayedRevision,
        replayed: true,
      });
    }

    const [transportOrder, duplicateRevision] = await Promise.all([
      this.findTransportOrderByIdWithContext(input.organizationId, input.orderId),
      this.findScheduleRevisionByReference(input.organizationId, revisionReference),
    ]);

    if (transportOrder === null) {
      throw new NotFoundException("planning.transport_order_not_found");
    }

    const businessRules = resolveTransportOrderRescheduleBusinessRules({
      transportOrder,
      duplicateRevision,
      input: {
        ...input,
        revisionReference,
      },
    });

    if (!businessRules.orderRescheduled) {
      throw new BadRequestException("planning.transport_order_reschedule_blocked");
    }

    const plannedDepartureAt = new Date(input.plannedDepartureAt);
    const plannedArrivalAt = new Date(input.plannedArrivalAt);
    const rescheduledAt = new Date(input.rescheduledAt);
    const auditBefore = createTransportOrderRescheduleAuditBefore({
      transportOrder,
      duplicateRevision,
      businessRules,
    });
    const { scheduleRevision, updatedOrder } = await this.database.$transaction(
      async (transaction) => {
        const updateResult = await transaction.transportOrder.updateMany({
          where: {
            id: transportOrder.id,
            organizationId: input.organizationId,
            status: "confirmed",
          },
          data: {
            mode: input.mode,
            carrierName: input.carrierName.trim(),
            routeSummary: input.routeSummary.trim(),
            originName: input.originName.trim(),
            destinationName: input.destinationName.trim(),
            plannedDepartureAt,
            plannedArrivalAt,
            sourceSystem: input.sourceSystem,
          },
        });

        if (updateResult.count !== 1) {
          throw new BadRequestException("planning.transport_order_state_changed");
        }

        const createdRevision = await transaction.transportOrderScheduleRevision.create({
          data: {
            organizationId: input.organizationId,
            orderId: transportOrder.id,
            revisionReference,
            previousMode: transportOrder.mode,
            newMode: input.mode,
            previousCarrierName: transportOrder.carrierName,
            newCarrierName: input.carrierName.trim(),
            previousRouteSummary: transportOrder.routeSummary,
            newRouteSummary: input.routeSummary.trim(),
            previousOriginName: transportOrder.originName,
            newOriginName: input.originName.trim(),
            previousDestinationName: transportOrder.destinationName,
            newDestinationName: input.destinationName.trim(),
            previousPlannedDepartureAt: transportOrder.plannedDepartureAt,
            newPlannedDepartureAt: plannedDepartureAt,
            previousPlannedArrivalAt: transportOrder.plannedArrivalAt,
            newPlannedArrivalAt: plannedArrivalAt,
            rescheduledByName: input.rescheduledByName.trim(),
            rescheduleReason: input.rescheduleReason.trim(),
            sourceSystem: input.sourceSystem,
            idempotencyKey: input.idempotencyKey,
            rescheduledAt,
          },
        });

        const nextOrder = await transaction.transportOrder.findFirstOrThrow({
          where: {
            id: transportOrder.id,
            organizationId: input.organizationId,
          },
          include: transportOrderContextInclude,
        });

        await transaction.auditRecord.create({
          data: {
            organizationId: input.organizationId,
            actorType: input.actorType,
            actorId: input.actorId,
            action: "planning.transport_order.rescheduled",
            subjectType: "transport_order",
            subjectId: nextOrder.id,
            severity: "high",
            before: auditBefore,
            after: createTransportOrderRescheduleAuditAfter({
              transportOrder: nextOrder,
              scheduleRevision: createdRevision,
              businessRules,
            }),
            reason: "Governed transport order reschedule.",
            correlationId: input.correlationId,
            ...createAuditRequestMetadata(input),
          },
        });

        await transaction.outboxEvent.create({
          data: {
            organizationId: input.organizationId,
            eventType: "planning.transport_order.rescheduled",
            aggregateType: "planning",
            aggregateId: nextOrder.id,
            payload: {
              transportOrderId: nextOrder.id,
              orderReference: nextOrder.orderReference,
              cargoId: nextOrder.cargoId,
              cargoReference: nextOrder.cargo.cargoReference,
              revisionId: createdRevision.id,
              revisionReference: createdRevision.revisionReference,
              previousPlannedDepartureAt: createdRevision.previousPlannedDepartureAt.toISOString(),
              newPlannedDepartureAt: createdRevision.newPlannedDepartureAt.toISOString(),
              previousPlannedArrivalAt: createdRevision.previousPlannedArrivalAt.toISOString(),
              newPlannedArrivalAt: createdRevision.newPlannedArrivalAt.toISOString(),
              mode: nextOrder.mode,
              carrierName: nextOrder.carrierName,
              routeSummary: nextOrder.routeSummary,
              capacityReservationId: nextOrder.capacityReservationId,
              trackingShipmentId: nextOrder.trackingShipmentId,
              downstreamTrackingNotificationRequired:
                businessRules.downstreamTrackingNotificationRequired,
              appliedRules: businessRules.appliedRules,
              idempotencyKey: input.idempotencyKey,
              sourceSystem: input.sourceSystem,
              correlationId: input.correlationId,
            },
          },
        });

        return {
          scheduleRevision: createdRevision,
          updatedOrder: nextOrder,
        };
      },
    );

    return createTransportOrderRescheduleOutput({
      organizationId: input.organizationId,
      transportOrder: updatedOrder,
      scheduleRevision,
      replayed: false,
      businessRules,
    });
  }

  async dispatchTransportOrder(
    input: DispatchTransportOrderInput,
  ): Promise<TransportOrderDispatchOutput> {
    const dispatchReference = normalizePlanningCode(input.dispatchReference);
    const replayedDispatch = await this.findDispatchByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedDispatch !== null) {
      if (replayedDispatch.orderId !== input.orderId) {
        throw new BadRequestException("planning.transport_order_dispatch_idempotency_conflict");
      }

      const replayedOrder = await this.findTransportOrderByIdWithContext(
        input.organizationId,
        replayedDispatch.orderId,
      );

      if (replayedOrder === null) {
        throw new NotFoundException("planning.transport_order_not_found");
      }

      return createTransportOrderDispatchOutput({
        organizationId: input.organizationId,
        transportOrder: replayedOrder,
        transportOrderDispatch: replayedDispatch,
        replayed: true,
      });
    }

    const [transportOrder, duplicateDispatchReference, duplicateOrderDispatch] = await Promise.all([
      this.findTransportOrderByIdWithContext(input.organizationId, input.orderId),
      this.findDispatchByReference(input.organizationId, dispatchReference),
      this.findDispatchByOrderId(input.organizationId, input.orderId),
    ]);

    if (transportOrder === null) {
      throw new NotFoundException("planning.transport_order_not_found");
    }

    const businessRules = resolveTransportOrderDispatchBusinessRules({
      transportOrder,
      duplicateDispatchReference,
      duplicateOrderDispatch,
      input: {
        ...input,
        dispatchReference,
      },
    });

    if (!businessRules.orderDispatched) {
      throw new BadRequestException("planning.transport_order_dispatch_blocked");
    }

    const dispatchedAt = new Date(input.dispatchedAt);
    const auditBefore = createTransportOrderDispatchAuditBefore({
      transportOrder,
      duplicateDispatchReference,
      duplicateOrderDispatch,
      businessRules,
    });
    const { transportOrderDispatch, updatedOrder } = await this.database.$transaction(
      async (transaction) => {
        const updateResult = await transaction.transportOrder.updateMany({
          where: {
            id: transportOrder.id,
            organizationId: input.organizationId,
            status: "confirmed",
          },
          data: {
            sourceSystem: input.sourceSystem,
          },
        });

        if (updateResult.count !== 1) {
          throw new BadRequestException("planning.transport_order_state_changed");
        }

        const createdDispatch = await transaction.transportOrderDispatch.create({
          data: {
            organizationId: input.organizationId,
            orderId: transportOrder.id,
            dispatchReference,
            dispatchedByName: input.dispatchedByName.trim(),
            dispatchInstructions: input.dispatchInstructions.trim(),
            sourceSystem: input.sourceSystem,
            idempotencyKey: input.idempotencyKey,
            dispatchedAt,
          },
        });

        const nextOrder = await transaction.transportOrder.findFirstOrThrow({
          where: {
            id: transportOrder.id,
            organizationId: input.organizationId,
          },
          include: transportOrderContextInclude,
        });

        await transaction.auditRecord.create({
          data: {
            organizationId: input.organizationId,
            actorType: input.actorType,
            actorId: input.actorId,
            action: "planning.transport_order.dispatched",
            subjectType: "transport_order",
            subjectId: nextOrder.id,
            severity: "high",
            before: auditBefore,
            after: createTransportOrderDispatchAuditAfter({
              transportOrder: nextOrder,
              transportOrderDispatch: createdDispatch,
              businessRules,
            }),
            reason: "Governed transport order dispatch.",
            correlationId: input.correlationId,
            ...createAuditRequestMetadata(input),
          },
        });

        await transaction.outboxEvent.create({
          data: {
            organizationId: input.organizationId,
            eventType: "planning.transport_order.dispatched",
            aggregateType: "planning",
            aggregateId: nextOrder.id,
            payload: {
              transportOrderId: nextOrder.id,
              orderReference: nextOrder.orderReference,
              cargoId: nextOrder.cargoId,
              cargoReference: nextOrder.cargo.cargoReference,
              dispatchId: createdDispatch.id,
              dispatchReference: createdDispatch.dispatchReference,
              dispatchedAt: createdDispatch.dispatchedAt.toISOString(),
              dispatchedByName: createdDispatch.dispatchedByName,
              dispatchInstructions: createdDispatch.dispatchInstructions,
              plannedDepartureAt: nextOrder.plannedDepartureAt.toISOString(),
              plannedArrivalAt: nextOrder.plannedArrivalAt.toISOString(),
              carrierName: nextOrder.carrierName,
              capacityReservationId: nextOrder.capacityReservationId,
              trackingShipmentId: nextOrder.trackingShipmentId,
              downstreamTrackingNotificationRequired:
                businessRules.downstreamTrackingNotificationRequired,
              appliedRules: businessRules.appliedRules,
              idempotencyKey: input.idempotencyKey,
              sourceSystem: input.sourceSystem,
              correlationId: input.correlationId,
            },
          },
        });

        return {
          transportOrderDispatch: createdDispatch,
          updatedOrder: nextOrder,
        };
      },
    );

    return createTransportOrderDispatchOutput({
      organizationId: input.organizationId,
      transportOrder: updatedOrder,
      transportOrderDispatch,
      replayed: false,
      businessRules,
    });
  }

  private async findCargoById(
    organizationId: string,
    cargoId: string,
  ): Promise<PlanningCargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        id: cargoId,
        organizationId,
      },
      select: planningCargoSelect,
    });
  }

  private async findTrackingShipmentById(
    organizationId: string,
    trackingShipmentId: string,
  ): Promise<PlanningTrackingShipmentRecord | null> {
    return this.database.trackingShipment.findFirst({
      where: {
        id: trackingShipmentId,
        organizationId,
      },
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
    });
  }

  private async findCapacityReservationById(
    organizationId: string,
    capacityReservationId: string,
  ): Promise<PlanningCapacityReservationRecord | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: {
        id: capacityReservationId,
        organizationId,
      },
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
    });
  }

  private async findTransportOrderByConfirmIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderWithContext | null> {
    return this.database.transportOrder.findFirst({
      where: {
        organizationId,
        confirmIdempotencyKey: idempotencyKey,
      },
      include: transportOrderContextInclude,
    });
  }

  private async findTransportOrderByCancelIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderWithContext | null> {
    return this.database.transportOrder.findFirst({
      where: {
        organizationId,
        cancelIdempotencyKey: idempotencyKey,
      },
      include: transportOrderContextInclude,
    });
  }

  private async findScheduleRevisionByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord | null> {
    return this.database.transportOrderScheduleRevision.findFirst({
      where: {
        organizationId,
        idempotencyKey,
      },
    });
  }

  private async findDispatchByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null> {
    return this.database.transportOrderDispatch.findFirst({
      where: {
        organizationId,
        idempotencyKey,
      },
    });
  }

  private async findTransportOrderByIdWithContext(
    organizationId: string,
    orderId: string,
  ): Promise<PlanningTransportOrderWithContext | null> {
    return this.database.transportOrder.findFirst({
      where: {
        organizationId,
        id: orderId,
      },
      include: transportOrderContextInclude,
    });
  }

  private async findScheduleRevisionByReference(
    organizationId: string,
    revisionReference: string,
  ): Promise<PlanningTransportOrderScheduleRevisionRecord | null> {
    return this.database.transportOrderScheduleRevision.findFirst({
      where: {
        organizationId,
        revisionReference,
      },
    });
  }

  private async findDispatchByReference(
    organizationId: string,
    dispatchReference: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null> {
    return this.database.transportOrderDispatch.findFirst({
      where: {
        organizationId,
        dispatchReference,
      },
    });
  }

  private async findDispatchByOrderId(
    organizationId: string,
    orderId: string,
  ): Promise<PlanningTransportOrderDispatchRecord | null> {
    return this.database.transportOrderDispatch.findFirst({
      where: {
        organizationId,
        orderId,
      },
    });
  }

  private async findTransportOrderByReference(
    organizationId: string,
    orderReference: string,
  ): Promise<PlanningTransportOrderRecord | null> {
    return this.database.transportOrder.findFirst({
      where: {
        organizationId,
        orderReference,
      },
    });
  }

  private async findTransportOrderByCancellationReference(
    organizationId: string,
    cancellationReference: string,
  ): Promise<PlanningTransportOrderRecord | null> {
    return this.database.transportOrder.findFirst({
      where: {
        organizationId,
        cancellationReference,
      },
    });
  }

  private async findTransportOrderByCargoId(
    organizationId: string,
    cargoId: string,
  ): Promise<PlanningTransportOrderRecord | null> {
    return this.database.transportOrder.findFirst({
      where: {
        organizationId,
        cargoId,
      },
    });
  }
}

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
      rescheduledAt: "desc",
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
      dispatchedAt: "desc",
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

function createTransportOrderStatusCounts(groups: TransportOrderStatusGroup[]) {
  const counts = {
    confirmed: 0,
    cancelled: 0,
  };

  for (const group of groups) {
    counts[group.status] = group._count._all;
  }

  return counts;
}

function createTransportOrderSummary(order: PlanningTransportOrderWithContext) {
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

function resolveTransportOrderConfirmBusinessRules(input: {
  cargo: PlanningCargoRecord;
  trackingShipment: PlanningTrackingShipmentRecord | null;
  capacityReservation: PlanningCapacityReservationRecord | null;
  duplicateReference: PlanningTransportOrderRecord | null;
  duplicateCargoOrder: PlanningTransportOrderRecord | null;
  input: ConfirmTransportOrderInput;
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

function resolveTransportOrderCancelBusinessRules(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateCancellationReference: PlanningTransportOrderRecord | null;
  input: CancelTransportOrderInput;
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

function resolveTransportOrderRescheduleBusinessRules(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateRevision: PlanningTransportOrderScheduleRevisionRecord | null;
  input: RescheduleTransportOrderInput;
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

function resolveTransportOrderDispatchBusinessRules(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateDispatchReference: PlanningTransportOrderDispatchRecord | null;
  duplicateOrderDispatch: PlanningTransportOrderDispatchRecord | null;
  input: DispatchTransportOrderInput;
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

function createTransportOrderConfirmOutput(input: {
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

function createTransportOrderCancelOutput(input: {
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

function createTransportOrderRescheduleOutput(input: {
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

function createTransportOrderDispatchOutput(input: {
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

function createTransportOrderConfirmAuditBefore(input: {
  cargo: PlanningCargoRecord;
  trackingShipment: PlanningTrackingShipmentRecord | null;
  capacityReservation: PlanningCapacityReservationRecord | null;
  duplicateReference: PlanningTransportOrderRecord | null;
  duplicateCargoOrder: PlanningTransportOrderRecord | null;
  businessRules: TransportOrderBusinessRules;
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

function createTransportOrderConfirmAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  businessRules: TransportOrderBusinessRules;
}): AuditJsonValue {
  return {
    transportOrder: createTransportOrderSummary(input.transportOrder),
    businessRules: input.businessRules,
  };
}

function createTransportOrderCancelAuditBefore(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateCancellationReference: PlanningTransportOrderRecord | null;
  businessRules: TransportOrderCancelBusinessRules;
}): AuditJsonValue {
  return {
    transportOrder: createTransportOrderSummary(input.transportOrder),
    duplicates: {
      cancellationReferenceOrderId: input.duplicateCancellationReference?.id ?? null,
    },
    businessRules: input.businessRules,
  };
}

function createTransportOrderCancelAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  businessRules: TransportOrderCancelBusinessRules;
}): AuditJsonValue {
  return {
    transportOrder: createTransportOrderSummary(input.transportOrder),
    businessRules: input.businessRules,
  };
}

function createTransportOrderRescheduleAuditBefore(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateRevision: PlanningTransportOrderScheduleRevisionRecord | null;
  businessRules: TransportOrderRescheduleBusinessRules;
}): AuditJsonValue {
  return {
    transportOrder: createTransportOrderSummary(input.transportOrder),
    duplicates: {
      revisionId: input.duplicateRevision?.id ?? null,
      revisionReference: input.duplicateRevision?.revisionReference ?? null,
    },
    businessRules: input.businessRules,
  };
}

function createTransportOrderRescheduleAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  scheduleRevision: PlanningTransportOrderScheduleRevisionRecord;
  businessRules: TransportOrderRescheduleBusinessRules;
}): AuditJsonValue {
  return {
    transportOrder: createTransportOrderSummary(input.transportOrder),
    scheduleRevision: createScheduleRevisionAudit(input.scheduleRevision),
    businessRules: input.businessRules,
  };
}

function createTransportOrderDispatchAuditBefore(input: {
  transportOrder: PlanningTransportOrderWithContext;
  duplicateDispatchReference: PlanningTransportOrderDispatchRecord | null;
  duplicateOrderDispatch: PlanningTransportOrderDispatchRecord | null;
  businessRules: TransportOrderDispatchBusinessRules;
}): AuditJsonValue {
  return {
    transportOrder: createTransportOrderSummary(input.transportOrder),
    duplicates: {
      dispatchReferenceDispatchId: input.duplicateDispatchReference?.id ?? null,
      orderDispatchId: input.duplicateOrderDispatch?.id ?? null,
    },
    businessRules: input.businessRules,
  };
}

function createTransportOrderDispatchAuditAfter(input: {
  transportOrder: PlanningTransportOrderWithContext;
  transportOrderDispatch: PlanningTransportOrderDispatchRecord;
  businessRules: TransportOrderDispatchBusinessRules;
}): AuditJsonValue {
  return {
    transportOrder: createTransportOrderSummary(input.transportOrder),
    dispatch: createTransportOrderDispatchAudit(input.transportOrderDispatch),
    businessRules: input.businessRules,
  };
}

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

function createAuditRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}

function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

function normalizePlanningCode(value: string): string {
  return value.trim().toUpperCase();
}
