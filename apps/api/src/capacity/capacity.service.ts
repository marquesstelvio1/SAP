import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AuditJsonValue,
  type DatabaseActorType,
  getPrismaClient,
  type SaptmPrismaClient,
} from "@saptm/database";
import {
  type CapacityAdvisoryDecisionAnalyticsInput,
  type CapacityAdvisoryDecisionAnalyticsOutput,
  type CapacityAdvisoryDecisionRecordInput,
  type CapacityAdvisoryDecisionRecordOutput,
  type CapacityAdvisoryOutput,
  type CapacityOverviewOutput,
  type CapacityResourceRegisterInput,
  type CapacityResourceRegisterOutput,
  type CapacitySlotCancelInput,
  type CapacitySlotCancelOutput,
  type CapacitySlotOpenInput,
  type CapacitySlotOpenOutput,
  type CapacitySlotReserveInput,
  type CapacitySlotReserveOutput,
  capacityAdvisoryApprovalPermissions,
  capacityAdvisoryRecommendationTypes,
  type capacityAdvisorySeverities,
  type capacityReservationPurposes,
  type capacityReservationStatuses,
  type capacityResourceTypes,
  type capacitySlotStatuses,
  type cargoStatuses,
} from "@saptm/rpc";

export type GetCapacityOverviewInput = {
  organizationId: string;
  limit?: number;
  generatedAt?: Date;
};

export type GetCapacityAdvisoryInput = {
  organizationId: string;
  limit?: number;
  generatedAt?: Date;
};

export type GetCapacityAdvisoryDecisionAnalyticsInput = CapacityAdvisoryDecisionAnalyticsInput & {
  organizationId: string;
  generatedAt?: Date;
};

export type RegisterCapacityResourceInput = CapacityResourceRegisterInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type OpenCapacitySlotInput = CapacitySlotOpenInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ReserveCapacitySlotInput = CapacitySlotReserveInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CancelCapacitySlotReservationInput = CapacitySlotCancelInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RecordCapacityAdvisoryDecisionInput = CapacityAdvisoryDecisionRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

type CapacityResourceType = (typeof capacityResourceTypes)[number];
type CapacitySlotStatus = (typeof capacitySlotStatuses)[number];
type CapacityReservationPurpose = (typeof capacityReservationPurposes)[number];
type CapacityReservationStatus = (typeof capacityReservationStatuses)[number];
type CapacityAdvisoryRecommendationType = (typeof capacityAdvisoryRecommendationTypes)[number];
type CapacityAdvisorySeverity = (typeof capacityAdvisorySeverities)[number];
type CargoStatus = (typeof cargoStatuses)[number];

type CapacityResourceRecord = {
  id: string;
  organizationId: string;
  resourceCode: string;
  resourceName: string;
  resourceType: CapacityResourceType;
  locationName: string;
  maxConcurrentBookings: number;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CapacitySlotRecord = {
  id: string;
  organizationId: string;
  resourceId: string;
  slotReference: string;
  windowStartAt: Date;
  windowEndAt: Date;
  capacityUnits: number;
  reservedUnits: number;
  status: CapacitySlotStatus;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CapacitySlotWithResource = CapacitySlotRecord & {
  resource: CapacityResourceRecord;
};

type CapacityCargoRecord = {
  id: string;
  organizationId: string;
  cargoReference: string;
  cargoDescription: string;
  status: CargoStatus;
  custodyOwnerName: string;
};

type CapacitySlotReservationRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  slotId: string;
  reservationReference: string;
  reservationPurpose: CapacityReservationPurpose;
  status: CapacityReservationStatus;
  reservedUnits: number;
  reservedByName: string;
  reservedAt: Date;
  cancellationReference: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  sourceSystem: string;
  reserveIdempotencyKey: string | null;
  cancelIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CapacitySlotReservationWithSlotCargo = CapacitySlotReservationRecord & {
  cargo: CapacityCargoRecord;
  slot: CapacitySlotWithResource;
};

type CapacitySlotStatusGroup = {
  status: CapacitySlotStatus;
  _count: {
    _all: number;
  };
};

type CapacityAdvisoryDecisionRecord = {
  id: string;
  organizationId: string;
  recommendationId: string;
  recommendationType: CapacityAdvisoryRecommendationType;
  decisionStatus: CapacityAdvisoryDecisionRecordOutput["decision"]["decisionStatus"];
  decidedByName: string;
  decisionReason: string;
  approvalReference: string | null;
  requiredPermission: string;
  slotId: string | null;
  reservationId: string | null;
  sourceSystem: string;
  decisionIdempotencyKey: string | null;
  decidedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type CapacityAdvisoryCandidate = CapacityAdvisoryOutput["recommendations"][number] & {
  priorityScore: number;
};

@Injectable()
export class CapacityService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async getOverview(input: GetCapacityOverviewInput): Promise<CapacityOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const [resourceCount, slotStatusGroups, activeReservations, upcomingSlots, recentReservations] =
      await Promise.all([
        this.database.capacityResource.count({
          where: {
            organizationId: input.organizationId,
          },
        }),
        this.database.capacitySlot.groupBy({
          by: ["status"],
          where: {
            organizationId: input.organizationId,
          },
          _count: {
            _all: true,
          },
        }),
        this.database.capacitySlotReservation.count({
          where: {
            organizationId: input.organizationId,
            status: "reserved",
          },
        }),
        this.database.capacitySlot.findMany({
          where: {
            organizationId: input.organizationId,
          },
          include: {
            resource: true,
          },
          orderBy: [{ windowStartAt: "asc" }, { createdAt: "desc" }],
          take: limit,
        }),
        this.database.capacitySlotReservation.findMany({
          where: {
            organizationId: input.organizationId,
          },
          include: {
            cargo: {
              select: {
                id: true,
                organizationId: true,
                cargoReference: true,
                cargoDescription: true,
                status: true,
                custodyOwnerName: true,
              },
            },
            slot: {
              include: {
                resource: true,
              },
            },
          },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          take: limit,
        }),
      ]);
    const slotStatusCounts = createCapacitySlotStatusCounts(slotStatusGroups);

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        resources: resourceCount,
        openSlots: slotStatusCounts.open,
        blockedSlots: slotStatusCounts.blocked,
        closedSlots: slotStatusCounts.closed,
        activeReservations,
      },
      upcomingSlots: upcomingSlots.map(createCapacitySlotSummary),
      recentReservations: recentReservations.map(createCapacityReservationSummary),
    };
  }

  async getAdvisory(input: GetCapacityAdvisoryInput): Promise<CapacityAdvisoryOutput> {
    const limit = normalizeAdvisoryLimit(input.limit);
    const generatedAt = input.generatedAt ?? new Date();
    const [openSlots, recentReservations] = await Promise.all([
      this.database.capacitySlot.findMany({
        where: {
          organizationId: input.organizationId,
          status: "open",
        },
        include: {
          resource: true,
        },
        orderBy: [{ windowEndAt: "asc" }, { reservedUnits: "desc" }, { updatedAt: "desc" }],
        take: 100,
      }),
      this.database.capacitySlotReservation.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: capacityReservationInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 100,
      }),
    ]);
    const recommendations = createCapacityAdvisoryRecommendations({
      slots: openSlots,
      reservations: recentReservations,
      generatedAt,
      limit,
    });

    return {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      policy: {
        automationAllowed: false,
        humanApprovalRequired: true,
        source: "rule_based_capacity_optimizer",
      },
      recommendations,
    };
  }

  async getAdvisoryDecisionAnalytics(
    input: GetCapacityAdvisoryDecisionAnalyticsInput,
  ): Promise<CapacityAdvisoryDecisionAnalyticsOutput> {
    const generatedAt = input.generatedAt ?? new Date();
    const limit = normalizeAdvisoryDecisionAnalyticsLimit(input.limit);
    const windowDays = normalizeAdvisoryDecisionAnalyticsWindowDays(input.windowDays);
    const windowStartedAt = new Date(generatedAt.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const decisions = await this.database.capacityAdvisoryDecision.findMany({
      where: {
        organizationId: input.organizationId,
        decidedAt: {
          gte: windowStartedAt,
          lte: generatedAt,
        },
      },
      orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
      take: 1_000,
    });

    return createCapacityAdvisoryDecisionAnalyticsOutput({
      organizationId: input.organizationId,
      generatedAt,
      windowStartedAt,
      windowDays,
      decisions,
      limit,
    });
  }

  async registerResource(
    input: RegisterCapacityResourceInput,
  ): Promise<CapacityResourceRegisterOutput> {
    const resourceCode = normalizeCapacityCode(input.resourceCode);
    const replayedResource = await this.findResourceByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedResource !== null) {
      if (replayedResource.resourceCode !== resourceCode) {
        throw new BadRequestException("capacity.resource_register_idempotency_conflict");
      }

      return createCapacityResourceRegisterOutput({
        organizationId: input.organizationId,
        resource: replayedResource,
        replayed: true,
      });
    }

    const existingResource = await this.findResourceByCode(input.organizationId, resourceCode);
    const businessRules = resolveCapacityResourceRegisterBusinessRules(existingResource, input);

    if (!businessRules.resourceAccepted) {
      throw new BadRequestException("capacity.resource_register_blocked");
    }

    const resource = await this.database.$transaction(async (transaction) => {
      const createdResource = await transaction.capacityResource.create({
        data: {
          organizationId: input.organizationId,
          resourceCode,
          resourceName: input.resourceName.trim(),
          resourceType: input.resourceType,
          locationName: input.locationName.trim(),
          maxConcurrentBookings: input.maxConcurrentBookings,
          sourceSystem: input.sourceSystem,
          recordIdempotencyKey: input.idempotencyKey,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "capacity.resource.registered",
          subjectType: "capacity_resource",
          subjectId: createdResource.id,
          severity: "medium",
          before: {},
          after: createCapacityResourceRegisterAuditAfter({
            resource: createdResource,
            businessRules,
          }),
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "capacity.resource.registered",
          aggregateType: "capacity",
          aggregateId: createdResource.id,
          payload: {
            resourceId: createdResource.id,
            resourceCode: createdResource.resourceCode,
            resourceType: createdResource.resourceType,
            locationName: createdResource.locationName,
            maxConcurrentBookings: createdResource.maxConcurrentBookings,
            appliedRules: businessRules.appliedRules,
            idempotencyKey: input.idempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createdResource;
    });

    return createCapacityResourceRegisterOutput({
      organizationId: input.organizationId,
      resource,
      replayed: false,
      businessRules,
    });
  }

  async openSlot(input: OpenCapacitySlotInput): Promise<CapacitySlotOpenOutput> {
    const slotReference = normalizeCapacityCode(input.slotReference);
    const replayedSlot = await this.findSlotByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedSlot !== null) {
      if (replayedSlot.resourceId !== input.resourceId) {
        throw new BadRequestException("capacity.slot_open_idempotency_conflict");
      }

      return createCapacitySlotOpenOutput({
        organizationId: input.organizationId,
        resource: replayedSlot.resource,
        slot: replayedSlot,
        replayed: true,
      });
    }

    const [resource, duplicateReference] = await Promise.all([
      this.findResourceById(input.organizationId, input.resourceId),
      this.findSlotByReference(input.organizationId, slotReference),
    ]);

    if (resource === null) {
      throw new NotFoundException("capacity.resource_not_found");
    }

    const businessRules = resolveCapacitySlotOpenBusinessRules(resource, duplicateReference, input);

    if (!businessRules.slotOpened) {
      throw new BadRequestException("capacity.slot_open_blocked");
    }

    const windowStartAt = new Date(input.windowStartAt);
    const windowEndAt = new Date(input.windowEndAt);
    const previousAuditState = createCapacitySlotOpenAuditBefore({
      resource,
      duplicateReference,
      businessRules,
    });
    const slot = await this.database.$transaction(async (transaction) => {
      const createdSlot = await transaction.capacitySlot.create({
        data: {
          organizationId: input.organizationId,
          resourceId: resource.id,
          slotReference,
          windowStartAt,
          windowEndAt,
          capacityUnits: input.capacityUnits,
          reservedUnits: 0,
          status: "open",
          sourceSystem: input.sourceSystem,
          recordIdempotencyKey: input.idempotencyKey,
        },
        include: {
          resource: true,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "capacity.slot.opened",
          subjectType: "capacity_slot",
          subjectId: createdSlot.id,
          severity: "high",
          before: previousAuditState,
          after: createCapacitySlotOpenAuditAfter({
            slot: createdSlot,
            businessRules,
          }),
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "capacity.slot.opened",
          aggregateType: "capacity",
          aggregateId: createdSlot.id,
          payload: {
            slotId: createdSlot.id,
            resourceId: createdSlot.resourceId,
            slotReference: createdSlot.slotReference,
            windowStartAt: createdSlot.windowStartAt.toISOString(),
            windowEndAt: createdSlot.windowEndAt.toISOString(),
            capacityUnits: createdSlot.capacityUnits,
            appliedRules: businessRules.appliedRules,
            idempotencyKey: input.idempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createdSlot;
    });

    return createCapacitySlotOpenOutput({
      organizationId: input.organizationId,
      resource: slot.resource,
      slot,
      replayed: false,
      businessRules,
    });
  }

  async reserveSlot(input: ReserveCapacitySlotInput): Promise<CapacitySlotReserveOutput> {
    const reservationReference = normalizeCapacityCode(input.reservationReference);
    const replayedReservation = await this.findReservationByReserveIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedReservation !== null) {
      if (
        replayedReservation.cargoId !== input.cargoId ||
        replayedReservation.slotId !== input.slotId
      ) {
        throw new BadRequestException("capacity.slot_reserve_idempotency_conflict");
      }

      return createCapacitySlotReserveOutput({
        organizationId: input.organizationId,
        reservation: replayedReservation,
        replayed: true,
      });
    }

    const [cargo, slot, duplicateReference, duplicateCargoSlot] = await Promise.all([
      this.findCargoById(input.organizationId, input.cargoId),
      this.findSlotById(input.organizationId, input.slotId),
      this.findReservationByReference(input.organizationId, reservationReference),
      this.findReservationByCargoSlotPurpose(
        input.organizationId,
        input.cargoId,
        input.slotId,
        input.reservationPurpose,
      ),
    ]);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (slot === null) {
      throw new NotFoundException("capacity.slot_not_found");
    }

    const businessRules = resolveCapacitySlotReserveBusinessRules({
      cargo,
      slot,
      duplicateReference,
      duplicateCargoSlot,
      input,
    });

    if (!businessRules.reservationAllowed) {
      throw new BadRequestException("capacity.slot_reserve_blocked");
    }

    const reservedAt = new Date(input.reservedAt);
    const previousAuditState = createCapacitySlotReserveAuditBefore({
      cargo,
      slot,
      duplicateReference,
      duplicateCargoSlot,
      businessRules,
    });
    const reservation = await this.database.$transaction(async (transaction) => {
      const slotUpdate = await transaction.capacitySlot.updateMany({
        where: {
          id: slot.id,
          organizationId: input.organizationId,
          status: "open",
          reservedUnits: {
            lte: slot.capacityUnits - input.reservedUnits,
          },
        },
        data: {
          reservedUnits: {
            increment: input.reservedUnits,
          },
        },
      });

      if (slotUpdate.count !== 1) {
        throw new BadRequestException("capacity.slot_capacity_changed");
      }

      const createdReservation = await transaction.capacitySlotReservation.create({
        data: {
          organizationId: input.organizationId,
          cargoId: cargo.id,
          slotId: slot.id,
          reservationReference,
          reservationPurpose: input.reservationPurpose,
          status: "reserved",
          reservedUnits: input.reservedUnits,
          reservedByName: input.reservedByName.trim(),
          reservedAt,
          sourceSystem: input.sourceSystem,
          reserveIdempotencyKey: input.idempotencyKey,
        },
        include: {
          cargo: {
            select: {
              id: true,
              organizationId: true,
              cargoReference: true,
              cargoDescription: true,
              status: true,
              custodyOwnerName: true,
            },
          },
          slot: {
            include: {
              resource: true,
            },
          },
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "capacity.slot.reserved",
          subjectType: "capacity_slot_reservation",
          subjectId: createdReservation.id,
          severity: input.reservedUnits > 1 ? "high" : "medium",
          before: previousAuditState,
          after: createCapacitySlotReserveAuditAfter({
            reservation: createdReservation,
            businessRules,
          }),
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "capacity.slot.reserved",
          aggregateType: "capacity",
          aggregateId: createdReservation.id,
          payload: {
            reservationId: createdReservation.id,
            reservationReference: createdReservation.reservationReference,
            reservationPurpose: createdReservation.reservationPurpose,
            cargoId: createdReservation.cargoId,
            cargoReference: createdReservation.cargo.cargoReference,
            slotId: createdReservation.slotId,
            slotReference: createdReservation.slot.slotReference,
            reservedUnits: createdReservation.reservedUnits,
            reservedAt: createdReservation.reservedAt.toISOString(),
            appliedRules: businessRules.appliedRules,
            idempotencyKey: input.idempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createdReservation;
    });

    return createCapacitySlotReserveOutput({
      organizationId: input.organizationId,
      reservation,
      replayed: false,
      businessRules,
    });
  }

  async cancelSlotReservation(
    input: CancelCapacitySlotReservationInput,
  ): Promise<CapacitySlotCancelOutput> {
    const cancellationReference = normalizeCapacityCode(input.cancellationReference);
    const replayedReservation = await this.findReservationByCancelIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedReservation !== null) {
      if (replayedReservation.id !== input.reservationId) {
        throw new BadRequestException("capacity.slot_cancel_idempotency_conflict");
      }

      return createCapacitySlotCancelOutput({
        organizationId: input.organizationId,
        reservation: replayedReservation,
        replayed: true,
      });
    }

    const reservation = await this.findReservationById(input.organizationId, input.reservationId);

    if (reservation === null) {
      throw new NotFoundException("capacity.reservation_not_found");
    }

    if (reservation.status === "cancelled") {
      throw new BadRequestException("capacity.reservation_already_cancelled");
    }

    const businessRules = resolveCapacitySlotCancelBusinessRules(reservation, input);

    if (!businessRules.cancellationAllowed) {
      throw new BadRequestException("capacity.slot_cancel_blocked");
    }

    const cancelledAt = new Date(input.cancelledAt);
    const previousAuditState = createCapacitySlotCancelAuditBefore({
      reservation,
      businessRules,
    });
    const cancelledReservation = await this.database.$transaction(async (transaction) => {
      const reservationUpdate = await transaction.capacitySlotReservation.updateMany({
        where: {
          id: reservation.id,
          organizationId: input.organizationId,
          status: "reserved",
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

      if (reservationUpdate.count !== 1) {
        throw new BadRequestException("capacity.reservation_state_changed");
      }

      await transaction.capacitySlot.update({
        where: {
          id: reservation.slotId,
        },
        data: {
          reservedUnits: {
            decrement: Math.min(reservation.reservedUnits, reservation.slot.reservedUnits),
          },
        },
      });

      const updatedReservation = await transaction.capacitySlotReservation.findFirstOrThrow({
        where: {
          id: reservation.id,
          organizationId: input.organizationId,
        },
        include: {
          cargo: {
            select: {
              id: true,
              organizationId: true,
              cargoReference: true,
              cargoDescription: true,
              status: true,
              custodyOwnerName: true,
            },
          },
          slot: {
            include: {
              resource: true,
            },
          },
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "capacity.slot_reservation.cancelled",
          subjectType: "capacity_slot_reservation",
          subjectId: updatedReservation.id,
          severity: "high",
          before: previousAuditState,
          after: createCapacitySlotCancelAuditAfter({
            reservation: updatedReservation,
            businessRules,
            sourceSystem: input.sourceSystem,
          }),
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "capacity.slot_reservation.cancelled",
          aggregateType: "capacity",
          aggregateId: updatedReservation.id,
          payload: {
            reservationId: updatedReservation.id,
            reservationReference: updatedReservation.reservationReference,
            cancellationReference: updatedReservation.cancellationReference,
            cancellationReason: updatedReservation.cancellationReason,
            cargoId: updatedReservation.cargoId,
            cargoReference: updatedReservation.cargo.cargoReference,
            slotId: updatedReservation.slotId,
            slotReference: updatedReservation.slot.slotReference,
            releasedUnits: reservation.reservedUnits,
            cancelledAt: toRequiredIsoString(updatedReservation.cancelledAt),
            appliedRules: businessRules.appliedRules,
            idempotencyKey: input.idempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return updatedReservation;
    });

    return createCapacitySlotCancelOutput({
      organizationId: input.organizationId,
      reservation: cancelledReservation,
      replayed: false,
      businessRules,
    });
  }

  async recordAdvisoryDecision(
    input: RecordCapacityAdvisoryDecisionInput,
  ): Promise<CapacityAdvisoryDecisionRecordOutput> {
    const recommendationId = input.recommendationId.trim();
    const replayedDecision = await this.findAdvisoryDecisionByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedDecision !== null) {
      if (replayedDecision.recommendationId !== recommendationId) {
        throw new BadRequestException("capacity.advisory_decision_idempotency_conflict");
      }

      return createCapacityAdvisoryDecisionRecordOutput({
        organizationId: input.organizationId,
        decision: replayedDecision,
        replayed: true,
      });
    }

    const [existingDecision, slot, reservation] = await Promise.all([
      this.findAdvisoryDecisionByRecommendationId(input.organizationId, recommendationId),
      input.slotId === undefined
        ? Promise.resolve(null)
        : this.findSlotById(input.organizationId, input.slotId),
      input.reservationId === undefined
        ? Promise.resolve(null)
        : this.findReservationById(input.organizationId, input.reservationId),
    ]);

    if (input.slotId !== undefined && slot === null) {
      throw new NotFoundException("capacity.advisory_decision_slot_not_found");
    }

    if (input.reservationId !== undefined && reservation === null) {
      throw new NotFoundException("capacity.advisory_decision_reservation_not_found");
    }

    const businessRules = resolveCapacityAdvisoryDecisionBusinessRules({
      existingDecision,
      slot,
      reservation,
      input,
    });

    if (!businessRules.decisionAccepted) {
      throw new BadRequestException("capacity.advisory_decision_blocked");
    }

    const decidedAt = new Date(input.decidedAt);
    const decision = await this.database.$transaction(async (transaction) => {
      const createdDecision = await transaction.capacityAdvisoryDecision.create({
        data: {
          organizationId: input.organizationId,
          recommendationId,
          recommendationType: input.recommendationType,
          decisionStatus: input.decisionStatus,
          decidedByName: input.decidedByName.trim(),
          decisionReason: input.decisionReason.trim(),
          approvalReference: input.approvalReference?.trim() ?? null,
          requiredPermission: input.requiredPermission,
          slotId: input.slotId ?? null,
          reservationId: input.reservationId ?? null,
          sourceSystem: input.sourceSystem,
          decisionIdempotencyKey: input.idempotencyKey,
          decidedAt,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "capacity.advisory.decision.recorded",
          subjectType: "capacity_advisory_decision",
          subjectId: createdDecision.id,
          severity: input.decisionStatus === "approved" ? "high" : "medium",
          before: createCapacityAdvisoryDecisionAuditBefore({
            existingDecision,
            slot,
            reservation,
            businessRules,
          }),
          after: createCapacityAdvisoryDecisionAuditAfter({
            decision: createdDecision,
            businessRules,
          }),
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "capacity.advisory.decision.recorded",
          aggregateType: "capacity",
          aggregateId: createdDecision.id,
          payload: {
            decisionId: createdDecision.id,
            recommendationId: createdDecision.recommendationId,
            recommendationType: createdDecision.recommendationType,
            decisionStatus: createdDecision.decisionStatus,
            decidedByName: createdDecision.decidedByName,
            approvalReference: createdDecision.approvalReference,
            requiredPermission: createdDecision.requiredPermission,
            slotId: createdDecision.slotId,
            reservationId: createdDecision.reservationId,
            appliedRules: businessRules.appliedRules,
            idempotencyKey: input.idempotencyKey,
            correlationId: input.correlationId,
          },
        },
      });

      return createdDecision;
    });

    return createCapacityAdvisoryDecisionRecordOutput({
      organizationId: input.organizationId,
      decision,
      replayed: false,
      businessRules,
    });
  }

  private async findResourceByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacityResourceRecord | null> {
    return this.database.capacityResource.findFirst({
      where: {
        organizationId,
        recordIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findResourceByCode(
    organizationId: string,
    resourceCode: string,
  ): Promise<CapacityResourceRecord | null> {
    return this.database.capacityResource.findFirst({
      where: {
        organizationId,
        resourceCode,
      },
    });
  }

  private async findResourceById(
    organizationId: string,
    resourceId: string,
  ): Promise<CapacityResourceRecord | null> {
    return this.database.capacityResource.findFirst({
      where: {
        id: resourceId,
        organizationId,
      },
    });
  }

  private async findSlotByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotWithResource | null> {
    return this.database.capacitySlot.findFirst({
      where: {
        organizationId,
        recordIdempotencyKey: idempotencyKey,
      },
      include: {
        resource: true,
      },
    });
  }

  private async findSlotByReference(
    organizationId: string,
    slotReference: string,
  ): Promise<CapacitySlotWithResource | null> {
    return this.database.capacitySlot.findFirst({
      where: {
        organizationId,
        slotReference,
      },
      include: {
        resource: true,
      },
    });
  }

  private async findSlotById(
    organizationId: string,
    slotId: string,
  ): Promise<CapacitySlotWithResource | null> {
    return this.database.capacitySlot.findFirst({
      where: {
        id: slotId,
        organizationId,
      },
      include: {
        resource: true,
      },
    });
  }

  private async findReservationByReserveIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: {
        organizationId,
        reserveIdempotencyKey: idempotencyKey,
      },
      include: capacityReservationInclude,
    });
  }

  private async findReservationByCancelIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: {
        organizationId,
        cancelIdempotencyKey: idempotencyKey,
      },
      include: capacityReservationInclude,
    });
  }

  private async findReservationById(
    organizationId: string,
    reservationId: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: {
        id: reservationId,
        organizationId,
      },
      include: capacityReservationInclude,
    });
  }

  private async findReservationByReference(
    organizationId: string,
    reservationReference: string,
  ): Promise<CapacitySlotReservationRecord | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: {
        organizationId,
        reservationReference,
      },
    });
  }

  private async findReservationByCargoSlotPurpose(
    organizationId: string,
    cargoId: string,
    slotId: string,
    reservationPurpose: CapacityReservationPurpose,
  ): Promise<CapacitySlotReservationRecord | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: {
        organizationId,
        cargoId,
        slotId,
        reservationPurpose,
      },
    });
  }

  private async findCargoById(
    organizationId: string,
    cargoId: string,
  ): Promise<CapacityCargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        id: cargoId,
        organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        cargoReference: true,
        cargoDescription: true,
        status: true,
        custodyOwnerName: true,
      },
    });
  }

  private async findAdvisoryDecisionByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacityAdvisoryDecisionRecord | null> {
    return this.database.capacityAdvisoryDecision.findFirst({
      where: {
        organizationId,
        decisionIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findAdvisoryDecisionByRecommendationId(
    organizationId: string,
    recommendationId: string,
  ): Promise<CapacityAdvisoryDecisionRecord | null> {
    return this.database.capacityAdvisoryDecision.findFirst({
      where: {
        organizationId,
        recommendationId,
      },
    });
  }
}

const capacityReservationInclude = {
  cargo: {
    select: {
      id: true,
      organizationId: true,
      cargoReference: true,
      cargoDescription: true,
      status: true,
      custodyOwnerName: true,
    },
  },
  slot: {
    include: {
      resource: true,
    },
  },
} as const;

function resolveCapacityResourceRegisterBusinessRules(
  existingResource: CapacityResourceRecord | null,
  input: RegisterCapacityResourceInput,
): CapacityResourceRegisterOutput["businessRules"] {
  const uniqueResourceCode = existingResource === null;
  const capacityPositive = input.maxConcurrentBookings > 0;
  const resourceAccepted = uniqueResourceCode && capacityPositive;
  const appliedRules = [
    "CAPACITY_RESOURCE_CODE_UNIQUE_PER_ORGANIZATION",
    "CAPACITY_RESOURCE_LIMIT_MUST_BE_POSITIVE",
    "CAPACITY_RESOURCE_REGISTRATION_IS_IDEMPOTENT",
  ];

  return {
    resourceAccepted,
    uniqueResourceCode,
    capacityPositive,
    appliedRules,
  };
}

function resolveCapacitySlotOpenBusinessRules(
  resource: CapacityResourceRecord,
  duplicateReference: CapacitySlotWithResource | null,
  input: OpenCapacitySlotInput,
): CapacitySlotOpenOutput["businessRules"] {
  const windowStartAt = new Date(input.windowStartAt);
  const windowEndAt = new Date(input.windowEndAt);
  const resourceActive = resource.maxConcurrentBookings > 0;
  const windowValid = windowEndAt.getTime() > windowStartAt.getTime();
  const capacityWithinResourceLimit = input.capacityUnits <= resource.maxConcurrentBookings;
  const duplicateReferenceBlocked = duplicateReference === null;
  const slotOpened =
    resourceActive && windowValid && capacityWithinResourceLimit && duplicateReferenceBlocked;
  const appliedRules = [
    "CAPACITY_SLOT_WINDOW_MUST_BE_VALID",
    "CAPACITY_SLOT_UNITS_CANNOT_EXCEED_RESOURCE_LIMIT",
    "CAPACITY_SLOT_REFERENCE_MUST_BE_UNIQUE",
    "CAPACITY_SLOT_OPENING_IS_IDEMPOTENT",
  ];

  return {
    slotOpened,
    resourceActive,
    windowValid,
    capacityWithinResourceLimit,
    duplicateReferenceBlocked,
    appliedRules,
  };
}

function resolveCapacitySlotReserveBusinessRules(input: {
  cargo: CapacityCargoRecord;
  slot: CapacitySlotWithResource;
  duplicateReference: CapacitySlotReservationRecord | null;
  duplicateCargoSlot: CapacitySlotReservationRecord | null;
  input: ReserveCapacitySlotInput;
}): CapacitySlotReserveOutput["businessRules"] {
  const reservedAt = new Date(input.input.reservedAt);
  const availableUnits = input.slot.capacityUnits - input.slot.reservedUnits;
  const cargoEligible = isCargoEligibleForReservationPurpose(
    input.cargo.status,
    input.input.reservationPurpose,
  );
  const slotOpen = input.slot.status === "open";
  const reservationWithinWindow =
    reservedAt.getTime() >= input.slot.windowStartAt.getTime() &&
    reservedAt.getTime() <= input.slot.windowEndAt.getTime();
  const capacityAvailable = availableUnits >= input.input.reservedUnits;
  const duplicateReservationBlocked = input.duplicateReference === null;
  const duplicateCargoSlotBlocked = input.duplicateCargoSlot === null;
  const reservationAllowed =
    cargoEligible &&
    slotOpen &&
    reservationWithinWindow &&
    capacityAvailable &&
    duplicateReservationBlocked &&
    duplicateCargoSlotBlocked;
  const appliedRules = [
    "CAPACITY_RESERVATION_REQUIRES_ELIGIBLE_CARGO_STATE",
    "CAPACITY_RESERVATION_REQUIRES_OPEN_SLOT",
    "CAPACITY_RESERVATION_MUST_BE_WITHIN_SLOT_WINDOW",
    "CAPACITY_RESERVATION_CANNOT_OVERBOOK_SLOT",
    "CAPACITY_RESERVATION_REFERENCE_MUST_BE_UNIQUE",
    "CAPACITY_RESERVATION_IS_IDEMPOTENT",
  ];

  return {
    reservationAllowed,
    cargoEligible,
    slotOpen,
    reservationWithinWindow,
    capacityAvailable,
    duplicateReservationBlocked,
    duplicateCargoSlotBlocked,
    appliedRules,
  };
}

function resolveCapacitySlotCancelBusinessRules(
  reservation: CapacitySlotReservationWithSlotCargo,
  input: CancelCapacitySlotReservationInput,
): CapacitySlotCancelOutput["businessRules"] {
  const cancelledAt = new Date(input.cancelledAt);
  const reservationActive = reservation.status === "reserved";
  const cancellationAfterReservation = cancelledAt.getTime() >= reservation.reservedAt.getTime();
  const cancellationAllowed = reservationActive && cancellationAfterReservation;
  const appliedRules = [
    "CAPACITY_CANCELLATION_REQUIRES_ACTIVE_RESERVATION",
    "CAPACITY_CANCELLATION_CANNOT_PRECEDE_RESERVATION",
    "CAPACITY_CANCELLATION_RELEASES_RESERVED_UNITS",
    "CAPACITY_CANCELLATION_IS_IDEMPOTENT",
  ];

  return {
    cancellationAllowed,
    reservationActive,
    cancellationAfterReservation,
    appliedRules,
  };
}

function resolveCapacityAdvisoryDecisionBusinessRules(input: {
  existingDecision: CapacityAdvisoryDecisionRecord | null;
  slot: CapacitySlotWithResource | null;
  reservation: CapacitySlotReservationWithSlotCargo | null;
  input: RecordCapacityAdvisoryDecisionInput;
}): CapacityAdvisoryDecisionRecordOutput["businessRules"] {
  const recommendationTraceable =
    input.input.recommendationId.trim().startsWith("capacity-advisory:") &&
    (input.slot !== null || input.reservation !== null);
  const humanDecisionCaptured =
    input.input.decidedByName.trim().length >= 2 && input.input.decisionReason.trim().length >= 8;
  const approvalReferenceRequired =
    input.input.decisionStatus === "rejected" ||
    (input.input.approvalReference?.trim().length ?? 0) >= 3;
  const duplicateDecisionBlocked = input.existingDecision === null;
  const decisionAccepted =
    recommendationTraceable &&
    humanDecisionCaptured &&
    approvalReferenceRequired &&
    duplicateDecisionBlocked;
  const appliedRules = [
    "CAPACITY_ADVISORY_DECISION_REQUIRES_TRACEABLE_RECOMMENDATION",
    "CAPACITY_ADVISORY_DECISION_REQUIRES_HUMAN_DECISION_EVIDENCE",
    "CAPACITY_ADVISORY_APPROVAL_REQUIRES_APPROVAL_REFERENCE",
    "CAPACITY_ADVISORY_RECOMMENDATION_CAN_BE_DECIDED_ONCE",
    "CAPACITY_ADVISORY_DECISION_IS_IDEMPOTENT",
    "CAPACITY_ADVISORY_DECISION_DOES_NOT_EXECUTE_OPERATIONAL_COMMANDS",
  ];

  return {
    decisionAccepted,
    recommendationTraceable,
    humanDecisionCaptured,
    approvalReferenceRequired,
    duplicateDecisionBlocked,
    appliedRules,
  };
}

function isCargoEligibleForReservationPurpose(
  cargoStatus: CargoStatus,
  purpose: CapacityReservationPurpose,
): boolean {
  if (purpose === "departure") {
    return cargoStatus === "ready_for_transport";
  }

  if (purpose === "handoff" || purpose === "arrival" || purpose === "delivery") {
    return cargoStatus === "in_transport";
  }

  if (purpose === "storage") {
    return cargoStatus !== "cancelled";
  }

  return cargoStatus !== "cancelled" && cargoStatus !== "delivered";
}

function createCapacityAdvisoryRecommendations(input: {
  slots: readonly CapacitySlotWithResource[];
  reservations: readonly CapacitySlotReservationWithSlotCargo[];
  generatedAt: Date;
  limit: number;
}): CapacityAdvisoryOutput["recommendations"] {
  const candidates: CapacityAdvisoryCandidate[] = [];
  const recommendationKeys = new Set<string>();
  const activeReservationsBySlot = new Map<string, CapacitySlotReservationWithSlotCargo[]>();
  const cancelledReservationsByResource = new Map<string, CapacitySlotReservationWithSlotCargo[]>();

  for (const reservation of input.reservations) {
    if (reservation.status === "reserved") {
      const reservations = activeReservationsBySlot.get(reservation.slotId) ?? [];
      reservations.push(reservation);
      activeReservationsBySlot.set(reservation.slotId, reservations);
    }

    if (reservation.status === "cancelled") {
      const reservations = cancelledReservationsByResource.get(reservation.slot.resourceId) ?? [];
      reservations.push(reservation);
      cancelledReservationsByResource.set(reservation.slot.resourceId, reservations);
    }
  }

  for (const slot of input.slots) {
    const utilizationPercent = calculateCapacityUtilizationPercent(slot);
    const availableUnits = calculateCapacityAvailableUnits(slot);
    const hoursUntilWindowEnd = calculateHoursUntilWindowEnd(slot, input.generatedAt);

    if (utilizationPercent >= 85) {
      candidates.push(
        createCapacityAdvisoryCandidate({
          type: "slot_saturation",
          severity: utilizationPercent >= 100 ? "critical" : "high",
          title: "Rever saturacao de slot operacional",
          rationale:
            "O slot esta proximo do limite de capacidade e pode bloquear novas reservas se nao houver replaneamento.",
          recommendedAction:
            "Abrir capacidade adicional, redistribuir reservas ou aprovar cancelamento/reallocacao pelo fluxo governado.",
          slot,
          reservation: null,
          approvalRequiredFor: "capacity.manage",
          confidenceScore: utilizationPercent >= 100 ? 0.9 : 0.84,
          priorityScore: utilizationPercent >= 100 ? 100 : 88,
          generatedAt: input.generatedAt,
        }),
      );
      recommendationKeys.add(createCapacityAdvisoryKey(slot.id, "slot_saturation"));
    }

    if (availableUnits > 0 && hoursUntilWindowEnd !== null && hoursUntilWindowEnd <= 24) {
      const type: CapacityAdvisoryRecommendationType = "expiring_slot";

      if (!recommendationKeys.has(createCapacityAdvisoryKey(slot.id, type))) {
        candidates.push(
          createCapacityAdvisoryCandidate({
            type,
            severity: hoursUntilWindowEnd <= 6 ? "high" : "medium",
            title: "Aproveitar capacidade antes do fecho da janela",
            rationale:
              "O slot ainda tem unidades livres e a janela operacional termina em menos de 24 horas.",
            recommendedAction:
              "Priorizar reservas elegiveis ou fechar decisao de nao uso com owner operacional antes do fim da janela.",
            slot,
            reservation: null,
            approvalRequiredFor: "capacity.slot.reserve",
            confidenceScore: hoursUntilWindowEnd <= 6 ? 0.82 : 0.74,
            priorityScore: hoursUntilWindowEnd <= 6 ? 82 : 62,
            generatedAt: input.generatedAt,
          }),
        );
      }
    }

    if (
      slot.capacityUnits >= 4 &&
      utilizationPercent <= 25 &&
      slot.windowEndAt.getTime() > input.generatedAt.getTime()
    ) {
      candidates.push(
        createCapacityAdvisoryCandidate({
          type: "unused_capacity",
          severity: "low",
          title: "Rever capacidade aberta com baixa utilizacao",
          rationale:
            "O slot possui capacidade relevante aberta, mas baixa ocupacao para a janela operacional atual.",
          recommendedAction:
            "Confirmar procura pendente, consolidar slots ou reduzir capacidade aberta antes de nova liberacao.",
          slot,
          reservation: null,
          approvalRequiredFor: "capacity.manage",
          confidenceScore: 0.68,
          priorityScore: 38,
          generatedAt: input.generatedAt,
        }),
      );
    }
  }

  for (const [slotId, reservations] of activeReservationsBySlot.entries()) {
    const slot = reservations[0]?.slot;

    if (slot === undefined || reservations.length < 3) {
      continue;
    }

    const utilizationPercent = calculateCapacityUtilizationPercent(slot);

    if (utilizationPercent < 70) {
      continue;
    }

    candidates.push(
      createCapacityAdvisoryCandidate({
        type: "reservation_imbalance",
        severity: utilizationPercent >= 90 ? "high" : "medium",
        title: "Balancear reservas concentradas no mesmo slot",
        rationale:
          "Multiplas reservas ativas estao concentradas no mesmo slot com ocupacao elevada, aumentando risco de gargalo.",
        recommendedAction:
          "Rever prioridades das cargas, redistribuir reservas elegiveis e aprovar mudancas apenas por comando governado.",
        slot,
        reservation: reservations[0] ?? null,
        approvalRequiredFor: "capacity.slot.reserve",
        confidenceScore: 0.76,
        priorityScore: utilizationPercent >= 90 ? 86 : 70,
        generatedAt: input.generatedAt,
      }),
    );
    recommendationKeys.add(createCapacityAdvisoryKey(slotId, "reservation_imbalance"));
  }

  for (const reservations of cancelledReservationsByResource.values()) {
    if (reservations.length < 2) {
      continue;
    }

    const reservation = reservations[0];

    if (reservation === undefined) {
      continue;
    }

    candidates.push(
      createCapacityAdvisoryCandidate({
        type: "cancellation_review",
        severity: "medium",
        title: "Investigar cancelamentos recorrentes por recurso",
        rationale:
          "Cancelamentos recentes no mesmo recurso podem indicar indisponibilidade, janela mal dimensionada ou mudanca operacional recorrente.",
        recommendedAction:
          "Validar causa raiz com operacoes e ajustar abertura de slots antes de novas reservas.",
        slot: reservation.slot,
        reservation,
        approvalRequiredFor: "capacity.slot.cancel",
        confidenceScore: 0.72,
        priorityScore: 58,
        generatedAt: input.generatedAt,
      }),
    );
  }

  return candidates
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, input.limit)
    .map(({ priorityScore: _priorityScore, ...recommendation }) => recommendation);
}

function createCapacityAdvisoryCandidate(input: {
  type: CapacityAdvisoryRecommendationType;
  severity: CapacityAdvisorySeverity;
  title: string;
  rationale: string;
  recommendedAction: string;
  slot: CapacitySlotWithResource;
  reservation: CapacitySlotReservationWithSlotCargo | null;
  approvalRequiredFor: CapacityAdvisoryOutput["recommendations"][number]["approvalRequiredFor"];
  confidenceScore: number;
  priorityScore: number;
  generatedAt: Date;
}): CapacityAdvisoryCandidate {
  const hoursUntilWindowEnd = calculateHoursUntilWindowEnd(input.slot, input.generatedAt);

  return {
    id: createCapacityAdvisoryKey(input.slot.id, input.type, input.reservation?.id),
    type: input.type,
    severity: input.severity,
    title: input.title,
    rationale: input.rationale,
    recommendedAction: input.recommendedAction,
    slot: createCapacitySlotSummary(input.slot),
    reservation:
      input.reservation === null ? null : createCapacityReservationSummary(input.reservation),
    metrics: {
      utilizationPercent: calculateCapacityUtilizationPercent(input.slot),
      availableUnits: calculateCapacityAvailableUnits(input.slot),
      hoursUntilWindowEnd,
    },
    humanApprovalRequired: true,
    approvalRequiredFor: input.approvalRequiredFor,
    confidenceScore: input.confidenceScore,
    source: "rule_based_capacity_optimizer",
    priorityScore: input.priorityScore,
  };
}

function createCapacityResourceRegisterOutput(input: {
  organizationId: string;
  resource: CapacityResourceRecord;
  replayed: boolean;
  businessRules?: CapacityResourceRegisterOutput["businessRules"];
}): CapacityResourceRegisterOutput {
  if (input.resource.recordIdempotencyKey === null) {
    throw new Error("capacity.resource.idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    resourceId: input.resource.id,
    resource: createCapacityResourceSummary(input.resource),
    businessRules:
      input.businessRules ??
      resolveCapacityResourceRegisterBusinessRules(null, {
        organizationId: input.organizationId,
        resourceCode: input.resource.resourceCode,
        resourceName: input.resource.resourceName,
        resourceType: input.resource.resourceType,
        locationName: input.resource.locationName,
        maxConcurrentBookings: input.resource.maxConcurrentBookings,
        idempotencyKey: input.resource.recordIdempotencyKey,
        sourceSystem: input.resource.sourceSystem,
        actorType: "user",
        actorId: "replay",
        correlationId: "replay",
      }),
    idempotency: {
      key: input.resource.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.resource.registered",
      subjectType: "capacity_resource",
      subjectId: input.resource.id,
    },
    outbox: {
      eventType: "capacity.resource.registered",
      aggregateType: "capacity",
      aggregateId: input.resource.id,
    },
  };
}

function createCapacitySlotOpenOutput(input: {
  organizationId: string;
  resource: CapacityResourceRecord;
  slot: CapacitySlotWithResource;
  replayed: boolean;
  businessRules?: CapacitySlotOpenOutput["businessRules"];
}): CapacitySlotOpenOutput {
  if (input.slot.recordIdempotencyKey === null) {
    throw new Error("capacity.slot.idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    resourceId: input.resource.id,
    slotId: input.slot.id,
    resource: createCapacityResourceSummary(input.resource),
    slot: createCapacitySlotSummary(input.slot),
    businessRules:
      input.businessRules ??
      resolveCapacitySlotOpenBusinessRules(input.resource, null, {
        organizationId: input.organizationId,
        resourceId: input.resource.id,
        slotReference: input.slot.slotReference,
        windowStartAt: input.slot.windowStartAt.toISOString(),
        windowEndAt: input.slot.windowEndAt.toISOString(),
        capacityUnits: input.slot.capacityUnits,
        idempotencyKey: input.slot.recordIdempotencyKey,
        sourceSystem: input.slot.sourceSystem,
        actorType: "user",
        actorId: "replay",
        correlationId: "replay",
      }),
    idempotency: {
      key: input.slot.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.slot.opened",
      subjectType: "capacity_slot",
      subjectId: input.slot.id,
    },
    outbox: {
      eventType: "capacity.slot.opened",
      aggregateType: "capacity",
      aggregateId: input.slot.id,
    },
  };
}

function createCapacitySlotReserveOutput(input: {
  organizationId: string;
  reservation: CapacitySlotReservationWithSlotCargo;
  replayed: boolean;
  businessRules?: CapacitySlotReserveOutput["businessRules"];
}): CapacitySlotReserveOutput {
  if (input.reservation.reserveIdempotencyKey === null) {
    throw new Error("capacity.reservation.reserve_idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    cargoId: input.reservation.cargoId,
    slotId: input.reservation.slotId,
    reservationId: input.reservation.id,
    cargo: createCapacityCargoSummary(input.reservation.cargo),
    resource: createCapacityResourceSummary(input.reservation.slot.resource),
    slot: createCapacitySlotSummary(input.reservation.slot),
    reservation: createCapacityReservationSummary(input.reservation),
    businessRules:
      input.businessRules ??
      resolveCapacitySlotReserveBusinessRules({
        cargo: input.reservation.cargo,
        slot: input.reservation.slot,
        duplicateReference: null,
        duplicateCargoSlot: null,
        input: {
          organizationId: input.organizationId,
          cargoId: input.reservation.cargoId,
          slotId: input.reservation.slotId,
          reservationReference: input.reservation.reservationReference,
          reservationPurpose: input.reservation.reservationPurpose,
          reservedUnits: input.reservation.reservedUnits,
          reservedByName: input.reservation.reservedByName,
          reservedAt: input.reservation.reservedAt.toISOString(),
          idempotencyKey: input.reservation.reserveIdempotencyKey,
          sourceSystem: input.reservation.sourceSystem,
          actorType: "user",
          actorId: "replay",
          correlationId: "replay",
        },
      }),
    idempotency: {
      key: input.reservation.reserveIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.slot.reserved",
      subjectType: "capacity_slot_reservation",
      subjectId: input.reservation.id,
    },
    outbox: {
      eventType: "capacity.slot.reserved",
      aggregateType: "capacity",
      aggregateId: input.reservation.id,
    },
  };
}

function createCapacitySlotCancelOutput(input: {
  organizationId: string;
  reservation: CapacitySlotReservationWithSlotCargo;
  replayed: boolean;
  businessRules?: CapacitySlotCancelOutput["businessRules"];
}): CapacitySlotCancelOutput {
  if (input.reservation.cancelIdempotencyKey === null) {
    throw new Error("capacity.reservation.cancel_idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    cargoId: input.reservation.cargoId,
    slotId: input.reservation.slotId,
    reservationId: input.reservation.id,
    cargo: createCapacityCargoSummary(input.reservation.cargo),
    resource: createCapacityResourceSummary(input.reservation.slot.resource),
    slot: createCapacitySlotSummary(input.reservation.slot),
    reservation: createCapacityReservationSummary(input.reservation),
    businessRules:
      input.businessRules ??
      resolveCapacitySlotCancelBusinessRules(input.reservation, {
        organizationId: input.organizationId,
        reservationId: input.reservation.id,
        cancellationReference: input.reservation.cancellationReference ?? "REPLAY-CANCEL",
        cancelledByName: input.reservation.cancelledByName ?? "Replay",
        cancellationReason: input.reservation.cancellationReason ?? "Replay",
        cancelledAt: toRequiredIsoString(input.reservation.cancelledAt),
        idempotencyKey: input.reservation.cancelIdempotencyKey,
        sourceSystem: input.reservation.sourceSystem,
        actorType: "user",
        actorId: "replay",
        correlationId: "replay",
      }),
    idempotency: {
      key: input.reservation.cancelIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.slot_reservation.cancelled",
      subjectType: "capacity_slot_reservation",
      subjectId: input.reservation.id,
    },
    outbox: {
      eventType: "capacity.slot_reservation.cancelled",
      aggregateType: "capacity",
      aggregateId: input.reservation.id,
    },
  };
}

function createCapacityAdvisoryDecisionRecordOutput(input: {
  organizationId: string;
  decision: CapacityAdvisoryDecisionRecord;
  replayed: boolean;
  businessRules?: CapacityAdvisoryDecisionRecordOutput["businessRules"];
}): CapacityAdvisoryDecisionRecordOutput {
  if (input.decision.decisionIdempotencyKey === null) {
    throw new Error("capacity.advisory_decision.idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    decisionId: input.decision.id,
    decision: createCapacityAdvisoryDecisionSummary(input.decision),
    businessRules:
      input.businessRules ??
      resolveCapacityAdvisoryDecisionBusinessRules({
        existingDecision: null,
        slot: {
          id: input.decision.slotId ?? "replay-slot",
          organizationId: input.organizationId,
          resourceId: "replay-resource",
          slotReference: "REPLAY-SLOT",
          windowStartAt: input.decision.decidedAt,
          windowEndAt: input.decision.decidedAt,
          capacityUnits: 1,
          reservedUnits: 0,
          status: "open",
          sourceSystem: input.decision.sourceSystem,
          recordIdempotencyKey: "replay",
          createdAt: input.decision.createdAt,
          updatedAt: input.decision.updatedAt,
          resource: {
            id: "replay-resource",
            organizationId: input.organizationId,
            resourceCode: "REPLAY",
            resourceName: "Replay",
            resourceType: "terminal",
            locationName: "Replay",
            maxConcurrentBookings: 1,
            sourceSystem: input.decision.sourceSystem,
            recordIdempotencyKey: "replay",
            createdAt: input.decision.createdAt,
            updatedAt: input.decision.updatedAt,
          },
        },
        reservation: null,
        input: {
          organizationId: input.organizationId,
          recommendationId: input.decision.recommendationId,
          recommendationType: input.decision.recommendationType,
          decisionStatus: input.decision.decisionStatus,
          decidedByName: input.decision.decidedByName,
          decisionReason: input.decision.decisionReason,
          ...(input.decision.approvalReference === null
            ? {}
            : { approvalReference: input.decision.approvalReference }),
          requiredPermission: normalizeCapacityAdvisoryRequiredPermission(
            input.decision.requiredPermission,
          ),
          ...(input.decision.slotId === null ? {} : { slotId: input.decision.slotId }),
          ...(input.decision.reservationId === null
            ? {}
            : { reservationId: input.decision.reservationId }),
          decidedAt: input.decision.decidedAt.toISOString(),
          idempotencyKey: input.decision.decisionIdempotencyKey,
          sourceSystem: input.decision.sourceSystem,
          actorType: "user",
          actorId: "replay",
          correlationId: "replay",
        },
      }),
    idempotency: {
      key: input.decision.decisionIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "capacity.advisory.decision.recorded",
      subjectType: "capacity_advisory_decision",
      subjectId: input.decision.id,
    },
    outbox: {
      eventType: "capacity.advisory.decision.recorded",
      aggregateType: "capacity",
      aggregateId: input.decision.id,
    },
  };
}

function createCapacityAdvisoryDecisionAnalyticsOutput(input: {
  organizationId: string;
  generatedAt: Date;
  windowStartedAt: Date;
  windowDays: number;
  decisions: readonly CapacityAdvisoryDecisionRecord[];
  limit: number;
}): CapacityAdvisoryDecisionAnalyticsOutput {
  return {
    generatedAt: input.generatedAt.toISOString(),
    organizationId: input.organizationId,
    window: {
      startedAt: input.windowStartedAt.toISOString(),
      endedAt: input.generatedAt.toISOString(),
      windowDays: input.windowDays,
    },
    totals: {
      ...createCapacityAdvisoryDecisionAnalyticsGroup(input.decisions),
      decisionsWithApprovalReference: input.decisions.filter(
        (decision) => decision.approvalReference !== null,
      ).length,
      decisionsRequiringOperationalPermission: input.decisions.filter(
        (decision) => decision.requiredPermission.trim().length > 0,
      ).length,
    },
    byRecommendationType: createCapacityAdvisoryDecisionRecommendationTypeGroups(input.decisions),
    byRequiredPermission: createCapacityAdvisoryDecisionRequiredPermissionGroups(input.decisions),
    recentDecisions: input.decisions
      .slice(0, input.limit)
      .map(createCapacityAdvisoryDecisionSummary),
    governance: {
      readOnly: true,
      automationAllowed: false,
      humanApprovalRequired: true,
      source: "capacity_advisory_decision_analytics",
    },
  };
}

function createCapacityAdvisoryDecisionAnalyticsGroup(
  decisions: readonly CapacityAdvisoryDecisionRecord[],
) {
  const approved = decisions.filter((decision) => decision.decisionStatus === "approved").length;
  const rejected = decisions.filter((decision) => decision.decisionStatus === "rejected").length;
  const total = decisions.length;

  return {
    decisions: total,
    approved,
    rejected,
    approvalRatePercent: calculateCapacityAdvisoryDecisionApprovalRate(approved, total),
  };
}

function createCapacityAdvisoryDecisionRecommendationTypeGroups(
  decisions: readonly CapacityAdvisoryDecisionRecord[],
): CapacityAdvisoryDecisionAnalyticsOutput["byRecommendationType"] {
  return capacityAdvisoryRecommendationTypes
    .map((recommendationType) => {
      const groupDecisions = decisions.filter(
        (decision) => decision.recommendationType === recommendationType,
      );

      return {
        recommendationType,
        ...createCapacityAdvisoryDecisionAnalyticsGroup(groupDecisions),
      };
    })
    .filter((group) => group.decisions > 0);
}

function createCapacityAdvisoryDecisionRequiredPermissionGroups(
  decisions: readonly CapacityAdvisoryDecisionRecord[],
): CapacityAdvisoryDecisionAnalyticsOutput["byRequiredPermission"] {
  return capacityAdvisoryApprovalPermissions
    .map((requiredPermission) => {
      const groupDecisions = decisions.filter(
        (decision) =>
          normalizeCapacityAdvisoryRequiredPermission(decision.requiredPermission) ===
          requiredPermission,
      );

      return {
        requiredPermission,
        ...createCapacityAdvisoryDecisionAnalyticsGroup(groupDecisions),
      };
    })
    .filter((group) => group.decisions > 0);
}

function createCapacityResourceSummary(
  resource: CapacityResourceRecord,
): CapacityOverviewOutput["upcomingSlots"][number]["resourceType"] extends never
  ? never
  : CapacityResourceRegisterOutput["resource"] {
  return {
    id: resource.id,
    resourceCode: resource.resourceCode,
    resourceName: resource.resourceName,
    resourceType: resource.resourceType,
    locationName: resource.locationName,
    maxConcurrentBookings: resource.maxConcurrentBookings,
    sourceSystem: resource.sourceSystem,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}

function createCapacitySlotSummary(
  slot: CapacitySlotWithResource,
): CapacityOverviewOutput["upcomingSlots"][number] {
  return {
    id: slot.id,
    resourceId: slot.resourceId,
    resourceCode: slot.resource.resourceCode,
    resourceType: slot.resource.resourceType,
    locationName: slot.resource.locationName,
    slotReference: slot.slotReference,
    windowStartAt: slot.windowStartAt.toISOString(),
    windowEndAt: slot.windowEndAt.toISOString(),
    capacityUnits: slot.capacityUnits,
    reservedUnits: slot.reservedUnits,
    availableUnits: Math.max(slot.capacityUnits - slot.reservedUnits, 0),
    status: slot.status,
    sourceSystem: slot.sourceSystem,
    createdAt: slot.createdAt.toISOString(),
    updatedAt: slot.updatedAt.toISOString(),
  };
}

function createCapacityReservationSummary(
  reservation: CapacitySlotReservationWithSlotCargo,
): CapacityOverviewOutput["recentReservations"][number] {
  return {
    id: reservation.id,
    cargoId: reservation.cargoId,
    cargoReference: reservation.cargo.cargoReference,
    slotId: reservation.slotId,
    reservationReference: reservation.reservationReference,
    reservationPurpose: reservation.reservationPurpose,
    status: reservation.status,
    reservedUnits: reservation.reservedUnits,
    reservedByName: reservation.reservedByName,
    reservedAt: reservation.reservedAt.toISOString(),
    cancellationReference: reservation.cancellationReference,
    cancelledByName: reservation.cancelledByName,
    cancellationReason: reservation.cancellationReason,
    cancelledAt: toIsoStringOrNull(reservation.cancelledAt),
    sourceSystem: reservation.sourceSystem,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

function createCapacityCargoSummary(
  cargo: CapacityCargoRecord,
): CapacitySlotReserveOutput["cargo"] {
  return {
    id: cargo.id,
    cargoReference: cargo.cargoReference,
    cargoDescription: cargo.cargoDescription,
    status: cargo.status,
    custodyOwnerName: cargo.custodyOwnerName,
  };
}

function createCapacityAdvisoryDecisionSummary(
  decision: CapacityAdvisoryDecisionRecord,
): CapacityAdvisoryDecisionRecordOutput["decision"] {
  return {
    id: decision.id,
    recommendationId: decision.recommendationId,
    recommendationType: decision.recommendationType,
    decisionStatus: decision.decisionStatus,
    decidedByName: decision.decidedByName,
    decisionReason: decision.decisionReason,
    approvalReference: decision.approvalReference,
    requiredPermission: normalizeCapacityAdvisoryRequiredPermission(decision.requiredPermission),
    slotId: decision.slotId,
    reservationId: decision.reservationId,
    sourceSystem: decision.sourceSystem,
    decidedAt: decision.decidedAt.toISOString(),
    createdAt: decision.createdAt.toISOString(),
    updatedAt: decision.updatedAt.toISOString(),
  };
}

function createCapacitySlotStatusCounts(groups: CapacitySlotStatusGroup[]) {
  const counts = {
    open: 0,
    blocked: 0,
    closed: 0,
  };

  for (const group of groups) {
    counts[group.status] = group._count._all;
  }

  return counts;
}

function createCapacityResourceRegisterAuditAfter(input: {
  resource: CapacityResourceRecord;
  businessRules: CapacityResourceRegisterOutput["businessRules"];
}): AuditJsonValue {
  return {
    resourceId: input.resource.id,
    resourceCode: input.resource.resourceCode,
    resourceName: input.resource.resourceName,
    resourceType: input.resource.resourceType,
    locationName: input.resource.locationName,
    maxConcurrentBookings: input.resource.maxConcurrentBookings,
    resourceAccepted: input.businessRules.resourceAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.resource.recordIdempotencyKey,
    sourceSystem: input.resource.sourceSystem,
  };
}

function createCapacitySlotOpenAuditBefore(input: {
  resource: CapacityResourceRecord;
  duplicateReference: CapacitySlotWithResource | null;
  businessRules: CapacitySlotOpenOutput["businessRules"];
}): AuditJsonValue {
  return {
    resourceId: input.resource.id,
    resourceCode: input.resource.resourceCode,
    maxConcurrentBookings: input.resource.maxConcurrentBookings,
    duplicateSlotId: input.duplicateReference?.id ?? null,
    slotOpened: input.businessRules.slotOpened,
    capacityWithinResourceLimit: input.businessRules.capacityWithinResourceLimit,
    duplicateReferenceBlocked: input.businessRules.duplicateReferenceBlocked,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCapacitySlotOpenAuditAfter(input: {
  slot: CapacitySlotWithResource;
  businessRules: CapacitySlotOpenOutput["businessRules"];
}): AuditJsonValue {
  return {
    slotId: input.slot.id,
    slotReference: input.slot.slotReference,
    resourceId: input.slot.resourceId,
    resourceCode: input.slot.resource.resourceCode,
    windowStartAt: input.slot.windowStartAt.toISOString(),
    windowEndAt: input.slot.windowEndAt.toISOString(),
    capacityUnits: input.slot.capacityUnits,
    reservedUnits: input.slot.reservedUnits,
    status: input.slot.status,
    slotOpened: input.businessRules.slotOpened,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.slot.recordIdempotencyKey,
    sourceSystem: input.slot.sourceSystem,
  };
}

function createCapacitySlotReserveAuditBefore(input: {
  cargo: CapacityCargoRecord;
  slot: CapacitySlotWithResource;
  duplicateReference: CapacitySlotReservationRecord | null;
  duplicateCargoSlot: CapacitySlotReservationRecord | null;
  businessRules: CapacitySlotReserveOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    slotId: input.slot.id,
    slotReference: input.slot.slotReference,
    slotStatus: input.slot.status,
    capacityUnits: input.slot.capacityUnits,
    reservedUnits: input.slot.reservedUnits,
    availableUnits: input.slot.capacityUnits - input.slot.reservedUnits,
    duplicateReservationId: input.duplicateReference?.id ?? null,
    duplicateCargoSlotReservationId: input.duplicateCargoSlot?.id ?? null,
    reservationAllowed: input.businessRules.reservationAllowed,
    capacityAvailable: input.businessRules.capacityAvailable,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCapacitySlotReserveAuditAfter(input: {
  reservation: CapacitySlotReservationWithSlotCargo;
  businessRules: CapacitySlotReserveOutput["businessRules"];
}): AuditJsonValue {
  return {
    reservationId: input.reservation.id,
    reservationReference: input.reservation.reservationReference,
    reservationPurpose: input.reservation.reservationPurpose,
    status: input.reservation.status,
    cargoId: input.reservation.cargoId,
    cargoReference: input.reservation.cargo.cargoReference,
    slotId: input.reservation.slotId,
    slotReference: input.reservation.slot.slotReference,
    reservedUnits: input.reservation.reservedUnits,
    reservedAt: input.reservation.reservedAt.toISOString(),
    reservationAllowed: input.businessRules.reservationAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.reservation.reserveIdempotencyKey,
    sourceSystem: input.reservation.sourceSystem,
  };
}

function createCapacitySlotCancelAuditBefore(input: {
  reservation: CapacitySlotReservationWithSlotCargo;
  businessRules: CapacitySlotCancelOutput["businessRules"];
}): AuditJsonValue {
  return {
    reservationId: input.reservation.id,
    reservationReference: input.reservation.reservationReference,
    status: input.reservation.status,
    slotId: input.reservation.slotId,
    slotReference: input.reservation.slot.slotReference,
    reservedUnits: input.reservation.reservedUnits,
    reservedAt: input.reservation.reservedAt.toISOString(),
    cancellationAllowed: input.businessRules.cancellationAllowed,
    reservationActive: input.businessRules.reservationActive,
    cancellationAfterReservation: input.businessRules.cancellationAfterReservation,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCapacitySlotCancelAuditAfter(input: {
  reservation: CapacitySlotReservationWithSlotCargo;
  businessRules: CapacitySlotCancelOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    reservationId: input.reservation.id,
    reservationReference: input.reservation.reservationReference,
    status: input.reservation.status,
    cancellationReference: input.reservation.cancellationReference,
    cancellationReason: input.reservation.cancellationReason,
    cancelledByName: input.reservation.cancelledByName,
    cancelledAt: toIsoStringOrNull(input.reservation.cancelledAt),
    releasedUnits: input.reservation.reservedUnits,
    cancellationAllowed: input.businessRules.cancellationAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.reservation.cancelIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCapacityAdvisoryDecisionAuditBefore(input: {
  existingDecision: CapacityAdvisoryDecisionRecord | null;
  slot: CapacitySlotWithResource | null;
  reservation: CapacitySlotReservationWithSlotCargo | null;
  businessRules: CapacityAdvisoryDecisionRecordOutput["businessRules"];
}): AuditJsonValue {
  return {
    existingDecisionId: input.existingDecision?.id ?? null,
    slotId: input.slot?.id ?? null,
    reservationId: input.reservation?.id ?? null,
    recommendationTraceable: input.businessRules.recommendationTraceable,
    duplicateDecisionBlocked: input.businessRules.duplicateDecisionBlocked,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCapacityAdvisoryDecisionAuditAfter(input: {
  decision: CapacityAdvisoryDecisionRecord;
  businessRules: CapacityAdvisoryDecisionRecordOutput["businessRules"];
}): AuditJsonValue {
  return {
    decisionId: input.decision.id,
    recommendationId: input.decision.recommendationId,
    recommendationType: input.decision.recommendationType,
    decisionStatus: input.decision.decisionStatus,
    decidedByName: input.decision.decidedByName,
    approvalReference: input.decision.approvalReference,
    requiredPermission: input.decision.requiredPermission,
    slotId: input.decision.slotId,
    reservationId: input.decision.reservationId,
    decidedAt: input.decision.decidedAt.toISOString(),
    decisionAccepted: input.businessRules.decisionAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.decision.decisionIdempotencyKey,
    sourceSystem: input.decision.sourceSystem,
  };
}

function normalizeCapacityCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

function normalizeAdvisoryLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 5, 1), 20);
}

function normalizeAdvisoryDecisionAnalyticsLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

function normalizeAdvisoryDecisionAnalyticsWindowDays(windowDays: number | undefined): number {
  return Math.min(Math.max(windowDays ?? 30, 1), 365);
}

function calculateCapacityAdvisoryDecisionApprovalRate(approved: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((approved / total) * 10_000) / 100;
}

function calculateCapacityAvailableUnits(slot: CapacitySlotRecord): number {
  return Math.max(slot.capacityUnits - slot.reservedUnits, 0);
}

function calculateCapacityUtilizationPercent(slot: CapacitySlotRecord): number {
  if (slot.capacityUnits <= 0) {
    return 100;
  }

  return Math.min(Math.round((slot.reservedUnits / slot.capacityUnits) * 1000) / 10, 100);
}

function calculateHoursUntilWindowEnd(slot: CapacitySlotRecord, generatedAt: Date): number | null {
  if (slot.windowEndAt.getTime() <= generatedAt.getTime()) {
    return 0;
  }

  return Math.round(((slot.windowEndAt.getTime() - generatedAt.getTime()) / 3_600_000) * 10) / 10;
}

function createCapacityAdvisoryKey(
  slotId: string,
  type: CapacityAdvisoryRecommendationType,
  reservationId?: string,
): string {
  return `capacity-advisory:${type}:${slotId}${reservationId === undefined ? "" : `:${reservationId}`}`;
}

function normalizeCapacityAdvisoryRequiredPermission(
  value: string,
): CapacityAdvisoryDecisionRecordOutput["decision"]["requiredPermission"] {
  if (
    value === "capacity.manage" ||
    value === "capacity.slot.reserve" ||
    value === "capacity.slot.cancel"
  ) {
    return value;
  }

  throw new Error("capacity.advisory_decision.required_permission_invalid");
}

function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

function toRequiredIsoString(value: Date | null | undefined): string {
  if (value === null || value === undefined) {
    throw new Error("required_date_missing");
  }

  return value.toISOString();
}
