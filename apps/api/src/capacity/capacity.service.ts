import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  CapacityAdvisoryDecisionAnalyticsInput,
  CapacityAdvisoryDecisionAnalyticsOutput,
  CapacityAdvisoryDecisionRecordInput,
  CapacityAdvisoryDecisionRecordOutput,
  CapacityAdvisoryOutput,
  CapacityOverviewOutput,
  CapacityResourceRegisterInput,
  CapacityResourceRegisterOutput,
  CapacitySlotCancelInput,
  CapacitySlotCancelOutput,
  CapacitySlotOpenInput,
  CapacitySlotOpenOutput,
  CapacitySlotReserveInput,
  CapacitySlotReserveOutput,
} from "@saptm/rpc";
import { CacheService } from "../cache/cache.service.js";
import { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";
import {
  createCapacityAdvisoryDecisionAuditAfter,
  createCapacityAdvisoryDecisionAuditBefore,
  createCapacityResourceRegisterAuditAfter,
  createCapacitySlotCancelAuditAfter,
  createCapacitySlotCancelAuditBefore,
  createCapacitySlotOpenAuditAfter,
  createCapacitySlotOpenAuditBefore,
  createCapacitySlotReserveAuditAfter,
  createCapacitySlotReserveAuditBefore,
} from "./domain/capacity.audit-trail.js";
import {
  type RecordCapacityAdvisoryDecisionBusinessRulesInput,
  resolveCapacityAdvisoryDecisionBusinessRules,
  resolveCapacityResourceRegisterBusinessRules,
  resolveCapacitySlotCancelBusinessRules,
  resolveCapacitySlotOpenBusinessRules,
  resolveCapacitySlotReserveBusinessRules,
} from "./domain/capacity.business-rules.js";
import {
  createCapacityAdvisoryDecisionAnalyticsOutput,
  createCapacityAdvisoryDecisionRecordOutput,
  createCapacityAdvisoryRecommendations,
  createCapacityReservationSummary,
  createCapacityResourceRegisterOutput,
  createCapacitySlotCancelOutput,
  createCapacitySlotOpenOutput,
  createCapacitySlotReserveOutput,
  createCapacitySlotStatusCounts,
  createCapacitySlotSummary,
  normalizeAdvisoryDecisionAnalyticsLimit,
  normalizeAdvisoryDecisionAnalyticsWindowDays,
  normalizeAdvisoryLimit,
  normalizeCapacityCode,
  normalizeLimit,
} from "./domain/capacity.dto.js";
import { CAPACITY_REPOSITORY, type CapacityRepository } from "./domain/capacity.repository.js";

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

@Injectable()
export class CapacityService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  constructor(
    @Inject(CAPACITY_REPOSITORY) private readonly capacityRepo: CapacityRepository,
    @Inject(OutboxEventBusAdapter) private readonly eventBus: OutboxEventBusAdapter,
    @Inject(CacheService) private readonly cacheService: CacheService,
  ) {}

  async getOverview(input: GetCapacityOverviewInput): Promise<CapacityOverviewOutput> {
    const cacheKey = `capacity:overview:${input.organizationId}`;
    const cached = await this.cacheService.get<CapacityOverviewOutput>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const limit = normalizeLimit(input.limit);
    const [resourceCount, slotStatusGroups, activeReservations, upcomingSlots, recentReservations] =
      await Promise.all([
        this.capacityRepo.countResources(input.organizationId),
        this.capacityRepo.groupSlotStatuses(input.organizationId),
        this.capacityRepo.countActiveReservations(input.organizationId),
        this.capacityRepo.findUpcomingSlots(input.organizationId, limit),
        this.capacityRepo.findRecentReservations(input.organizationId, limit),
      ]);
    const slotStatusCounts = createCapacitySlotStatusCounts(slotStatusGroups);

    const result = {
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

    await this.cacheService.set(cacheKey, result, 30_000);
    return result;
  }

  async getAdvisory(input: GetCapacityAdvisoryInput): Promise<CapacityAdvisoryOutput> {
    const cacheKey = `capacity:advisory:${input.organizationId}`;
    const cached = await this.cacheService.get<CapacityAdvisoryOutput>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const limit = normalizeAdvisoryLimit(input.limit);
    const generatedAt = input.generatedAt ?? new Date();
    const [openSlots, recentReservations] = await Promise.all([
      this.capacityRepo.findOpenSlots(input.organizationId, 100),
      this.capacityRepo.findRecentReservationsForAdvisory(input.organizationId, 100),
    ]);
    const recommendations = createCapacityAdvisoryRecommendations({
      slots: openSlots,
      reservations: recentReservations,
      generatedAt,
      limit,
    });

    const result = {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      policy: {
        automationAllowed: false,
        humanApprovalRequired: true,
        source: "rule_based_capacity_optimizer",
      } as const,
      recommendations,
    };

    await this.cacheService.set(cacheKey, result, 15_000);
    return result;
  }

  async getAdvisoryDecisionAnalytics(
    input: GetCapacityAdvisoryDecisionAnalyticsInput,
  ): Promise<CapacityAdvisoryDecisionAnalyticsOutput> {
    const generatedAt = input.generatedAt ?? new Date();
    const limit = normalizeAdvisoryDecisionAnalyticsLimit(input.limit);
    const windowDays = normalizeAdvisoryDecisionAnalyticsWindowDays(input.windowDays);
    const windowStartedAt = new Date(generatedAt.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const decisions = await this.capacityRepo.findAdvisoryDecisionsInWindow(
      input.organizationId,
      windowStartedAt,
      generatedAt,
      1_000,
    );

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
    const replayedResource = await this.capacityRepo.findResourceByRecordIdempotencyKey(
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

    const existingResource = await this.capacityRepo.findResourceByCode(
      input.organizationId,
      resourceCode,
    );
    const businessRules = resolveCapacityResourceRegisterBusinessRules(existingResource, input);

    if (!businessRules.resourceAccepted) {
      throw new BadRequestException("capacity.resource_register_blocked");
    }

    const resource = await this.database.$transaction(async (transaction: PrismaTx) => {
      const createdResource = await this.capacityRepo.createResource(transaction, {
        organizationId: input.organizationId,
        resourceCode,
        resourceName: input.resourceName.trim(),
        resourceType: input.resourceType,
        locationName: input.locationName.trim(),
        maxConcurrentBookings: input.maxConcurrentBookings,
        sourceSystem: input.sourceSystem,
        recordIdempotencyKey: input.idempotencyKey,
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

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "capacity.resource.registered",
        aggregateType: "capacity",
        aggregateId: createdResource.id,
        eventVersion: 1,
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
    const replayedSlot = await this.capacityRepo.findSlotByRecordIdempotencyKey(
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
      this.capacityRepo.findResourceById(input.organizationId, input.resourceId),
      this.capacityRepo.findSlotByReference(input.organizationId, slotReference),
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
    const slot = await this.database.$transaction(async (transaction: PrismaTx) => {
      const createdSlot = await this.capacityRepo.createSlot(transaction, {
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

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "capacity.slot.opened",
        aggregateType: "capacity",
        aggregateId: createdSlot.id,
        eventVersion: 1,
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
    const replayedReservation = await this.capacityRepo.findReservationByReserveIdempotencyKey(
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
      this.capacityRepo.findCargoById(input.organizationId, input.cargoId),
      this.capacityRepo.findSlotById(input.organizationId, input.slotId),
      this.capacityRepo.findReservationByReference(input.organizationId, reservationReference),
      this.capacityRepo.findReservationByCargoSlotPurpose(
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
    const reservation = await this.database.$transaction(async (transaction: PrismaTx) => {
      const slotUpdate = await this.capacityRepo.updateSlotReservedUnitsIncrement(
        transaction,
        slot.id,
        input.organizationId,
        "open",
        slot.capacityUnits - input.reservedUnits,
        input.reservedUnits,
      );

      if (slotUpdate.count !== 1) {
        throw new BadRequestException("capacity.slot_capacity_changed");
      }

      const createdReservation = await this.capacityRepo.createReservation(transaction, {
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

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "capacity.slot.reserved",
        aggregateType: "capacity",
        aggregateId: createdReservation.id,
        eventVersion: 1,
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
    const replayedReservation = await this.capacityRepo.findReservationByCancelIdempotencyKey(
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

    const reservation = await this.capacityRepo.findReservationById(
      input.organizationId,
      input.reservationId,
    );

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
    const cancelledReservation = await this.database.$transaction(async (transaction: PrismaTx) => {
      const reservationUpdate = await this.capacityRepo.updateReservationCancel(
        transaction,
        reservation.id,
        input.organizationId,
        "reserved",
        {
          status: "cancelled",
          cancellationReference,
          cancelledByName: input.cancelledByName.trim(),
          cancellationReason: input.cancellationReason.trim(),
          cancelledAt,
          cancelIdempotencyKey: input.idempotencyKey,
        },
      );

      if (reservationUpdate.count !== 1) {
        throw new BadRequestException("capacity.reservation_state_changed");
      }

      await this.capacityRepo.updateSlotReservedUnitsDecrement(
        transaction,
        reservation.slotId,
        Math.min(reservation.reservedUnits, reservation.slot.reservedUnits),
      );

      const updatedReservation = await this.capacityRepo.findReservationByIdAfterUpdate(
        transaction,
        reservation.id,
        input.organizationId,
      );

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

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "capacity.slot_reservation.cancelled",
        aggregateType: "capacity",
        aggregateId: updatedReservation.id,
        eventVersion: 1,
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
    const replayedDecision = await this.capacityRepo.findAdvisoryDecisionByIdempotencyKey(
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
      this.capacityRepo.findAdvisoryDecisionByRecommendationId(
        input.organizationId,
        recommendationId,
      ),
      input.slotId === undefined
        ? Promise.resolve(null)
        : this.capacityRepo.findSlotById(input.organizationId, input.slotId),
      input.reservationId === undefined
        ? Promise.resolve(null)
        : this.capacityRepo.findReservationById(input.organizationId, input.reservationId),
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
      input: input as unknown as RecordCapacityAdvisoryDecisionBusinessRulesInput,
    });

    if (!businessRules.decisionAccepted) {
      throw new BadRequestException("capacity.advisory_decision_blocked");
    }

    const decidedAt = new Date(input.decidedAt);
    const decision = await this.database.$transaction(async (transaction: PrismaTx) => {
      const createdDecision = await this.capacityRepo.createAdvisoryDecision(transaction, {
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

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "capacity.advisory.decision.recorded",
        aggregateType: "capacity",
        aggregateId: createdDecision.id,
        eventVersion: 1,
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
}

function toRequiredIsoString(value: Date | null | undefined): string {
  if (value === null || value === undefined) {
    throw new Error("required_date_missing");
  }

  return value.toISOString();
}
