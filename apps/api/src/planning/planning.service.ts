import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  PlanningOverviewOutput,
  TransportOrderCancelInput,
  TransportOrderCancelOutput,
  TransportOrderConfirmInput,
  TransportOrderConfirmOutput,
  TransportOrderDispatchInput,
  TransportOrderDispatchOutput,
  TransportOrderRescheduleInput,
  TransportOrderRescheduleOutput,
} from "@saptm/rpc";
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";
import {
  createTransportOrderCancelAuditAfter,
  createTransportOrderCancelAuditBefore,
  createTransportOrderConfirmAuditAfter,
  createTransportOrderConfirmAuditBefore,
  createTransportOrderDispatchAuditAfter,
  createTransportOrderDispatchAuditBefore,
  createTransportOrderRescheduleAuditAfter,
  createTransportOrderRescheduleAuditBefore,
} from "./domain/planning.audit-trail.js";
import {
  resolveTransportOrderCancelBusinessRules,
  resolveTransportOrderConfirmBusinessRules,
  resolveTransportOrderDispatchBusinessRules,
  resolveTransportOrderRescheduleBusinessRules,
} from "./domain/planning.business-rules.js";
import {
  createAuditRequestMetadata,
  createTransportOrderCancelOutput,
  createTransportOrderConfirmOutput,
  createTransportOrderDispatchOutput,
  createTransportOrderRescheduleOutput,
  createTransportOrderStatusCounts,
  createTransportOrderSummary,
  normalizeLimit,
  normalizePlanningCode,
} from "./domain/planning.dto.js";
import { PLANNING_REPOSITORY, type PlanningRepository } from "./domain/planning.repository.js";

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

@Injectable()
export class PlanningService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  constructor(
    @Inject(PLANNING_REPOSITORY) private readonly planningRepo: PlanningRepository,
    private readonly eventBus: OutboxEventBusAdapter,
  ) {}

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
      this.planningRepo.countTransportOrders(input.organizationId),
      this.planningRepo.groupTransportOrderStatuses(input.organizationId),
      this.planningRepo.countUpcomingDepartures(input.organizationId, now),
      this.planningRepo.countLinkedCapacityReservations(input.organizationId),
      this.planningRepo.countLinkedTrackingShipments(input.organizationId),
      this.planningRepo.countDispatches(input.organizationId),
      this.planningRepo.findRecentOrders(input.organizationId, limit),
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
    const replayedOrder = await this.planningRepo.findTransportOrderByConfirmIdempotencyKey(
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
        this.planningRepo.findCargoById(input.organizationId, input.cargoId),
        input.trackingShipmentId === undefined
          ? Promise.resolve(null)
          : this.planningRepo.findTrackingShipmentById(
              input.organizationId,
              input.trackingShipmentId,
            ),
        input.capacityReservationId === undefined
          ? Promise.resolve(null)
          : this.planningRepo.findCapacityReservationById(
              input.organizationId,
              input.capacityReservationId,
            ),
        this.planningRepo.findTransportOrderByReference(input.organizationId, orderReference),
        this.planningRepo.findTransportOrderByCargoId(input.organizationId, input.cargoId),
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
    const transportOrder = await this.database.$transaction(async (transaction: PrismaTx) => {
      const createdOrder = await this.planningRepo.createTransportOrder(transaction, {
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

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "planning.transport_order.confirmed",
        aggregateType: "planning",
        aggregateId: createdOrder.id,
        eventVersion: 1,
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
    const replayedOrder = await this.planningRepo.findTransportOrderByCancelIdempotencyKey(
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
      this.planningRepo.findTransportOrderByIdWithContext(input.organizationId, input.orderId),
      this.planningRepo.findTransportOrderByCancellationReference(
        input.organizationId,
        cancellationReference,
      ),
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
    const cancelledOrder = await this.database.$transaction(async (transaction: PrismaTx) => {
      const updateResult = await this.planningRepo.updateTransportOrderCancel(
        transaction,
        transportOrder.id,
        input.organizationId,
        "confirmed",
        {
          status: "cancelled",
          cancellationReference,
          cancelledByName: input.cancelledByName.trim(),
          cancellationReason: input.cancellationReason.trim(),
          cancelledAt,
          cancelIdempotencyKey: input.idempotencyKey,
        },
      );

      if (updateResult.count !== 1) {
        throw new BadRequestException("planning.transport_order_state_changed");
      }

      const updatedOrder = await this.planningRepo.findTransportOrderByIdAfterUpdate(
        transaction,
        transportOrder.id,
        input.organizationId,
      );

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

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "planning.transport_order.cancelled",
        aggregateType: "planning",
        aggregateId: updatedOrder.id,
        eventVersion: 1,
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
    const replayedRevision = await this.planningRepo.findScheduleRevisionByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedRevision !== null) {
      if (replayedRevision.orderId !== input.orderId) {
        throw new BadRequestException("planning.transport_order_reschedule_idempotency_conflict");
      }

      const replayedOrder = await this.planningRepo.findTransportOrderByIdWithContext(
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
      this.planningRepo.findTransportOrderByIdWithContext(input.organizationId, input.orderId),
      this.planningRepo.findScheduleRevisionByReference(input.organizationId, revisionReference),
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
      async (transaction: PrismaTx) => {
        const updateResult = await this.planningRepo.updateTransportOrderReschedule(
          transaction,
          transportOrder.id,
          input.organizationId,
          "confirmed",
          {
            mode: input.mode,
            carrierName: input.carrierName.trim(),
            routeSummary: input.routeSummary.trim(),
            originName: input.originName.trim(),
            destinationName: input.destinationName.trim(),
            plannedDepartureAt,
            plannedArrivalAt,
            sourceSystem: input.sourceSystem,
          },
        );

        if (updateResult.count !== 1) {
          throw new BadRequestException("planning.transport_order_state_changed");
        }

        const createdRevision = await this.planningRepo.createScheduleRevision(transaction, {
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
        });

        const nextOrder = await this.planningRepo.findTransportOrderByIdAfterUpdate(
          transaction,
          transportOrder.id,
          input.organizationId,
        );

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

        await this.eventBus.publish(transaction, {
          organizationId: input.organizationId,
          eventType: "planning.transport_order.rescheduled",
          aggregateType: "planning",
          aggregateId: nextOrder.id,
          eventVersion: 1,
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
    const replayedDispatch = await this.planningRepo.findDispatchByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedDispatch !== null) {
      if (replayedDispatch.orderId !== input.orderId) {
        throw new BadRequestException("planning.transport_order_dispatch_idempotency_conflict");
      }

      const replayedOrder = await this.planningRepo.findTransportOrderByIdWithContext(
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
      this.planningRepo.findTransportOrderByIdWithContext(input.organizationId, input.orderId),
      this.planningRepo.findDispatchByReference(input.organizationId, dispatchReference),
      this.planningRepo.findDispatchByOrderId(input.organizationId, input.orderId),
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
      async (transaction: PrismaTx) => {
        const updateResult = await this.planningRepo.updateTransportOrderDispatch(
          transaction,
          transportOrder.id,
          input.organizationId,
          "confirmed",
          {
            sourceSystem: input.sourceSystem,
          },
        );

        if (updateResult.count !== 1) {
          throw new BadRequestException("planning.transport_order_state_changed");
        }

        const createdDispatch = await this.planningRepo.createDispatch(transaction, {
          organizationId: input.organizationId,
          orderId: transportOrder.id,
          dispatchReference,
          dispatchedByName: input.dispatchedByName.trim(),
          dispatchInstructions: input.dispatchInstructions.trim(),
          sourceSystem: input.sourceSystem,
          idempotencyKey: input.idempotencyKey,
          dispatchedAt,
        });

        const nextOrder = await this.planningRepo.findTransportOrderByIdAfterUpdate(
          transaction,
          transportOrder.id,
          input.organizationId,
        );

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

        await this.eventBus.publish(transaction, {
          organizationId: input.organizationId,
          eventType: "planning.transport_order.dispatched",
          aggregateType: "planning",
          aggregateId: nextOrder.id,
          eventVersion: 1,
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
}
