import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  CargoClaimSettlementRecordInput,
  CargoClaimSettlementRecordOutput,
  CargoComplianceEvidenceRecordInput,
  CargoComplianceEvidenceRecordOutput,
  CargoComplianceEvidenceVerifyInput,
  CargoComplianceEvidenceVerifyOutput,
  CargoDeliveryCompleteInput,
  CargoDeliveryCompleteOutput,
  CargoDeliveryExceptionRecordInput,
  CargoDeliveryExceptionRecordOutput,
  CargoDeliveryExceptionResolveInput,
  CargoDeliveryExceptionResolveOutput,
  CargoOperationalHandoffRecordInput,
  CargoOperationalHandoffRecordOutput,
  CargoOverviewOutput,
  CargoRegisterInput,
  CargoRegisterOutput,
  CargoReleaseInput,
  CargoReleaseOutput,
  CargoTransportArriveInput,
  CargoTransportArriveOutput,
  CargoTransportDepartInput,
  CargoTransportDepartOutput,
  CargoTransportPlanInput,
  CargoTransportPlanOutput,
} from "@saptm/rpc";
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";
import {
  createCargoClaimSettlementRecordAuditAfter,
  createCargoClaimSettlementRecordAuditBefore,
  createCargoComplianceEvidenceRecordAuditAfter,
  createCargoComplianceEvidenceVerifyAuditAfter,
  createCargoComplianceEvidenceVerifyAuditBefore,
  createCargoRegistrationAuditAfter,
  createCargoReleaseAuditAfter,
  createCargoReleaseAuditBefore,
  createCargoTransportPlanAuditBefore,
} from "./domain/audit-trail.js";
import {
  normalizeCargoReference,
  normalizeLimit,
  resolveCargoBusinessRules,
  resolveCargoClaimSettlementRecordBusinessRules,
  resolveCargoComplianceEvidenceRecordBusinessRules,
  resolveCargoComplianceEvidenceVerifyBusinessRules,
  resolveCargoReleaseBusinessRules,
  resolveCargoTransportPlanBusinessRules,
} from "./domain/business-rules.js";
import { CARGO_REPOSITORY, type CargoRepository } from "./domain/cargo.repository.js";
import {
  type CargoComplianceEvidenceWithCargo,
  createCargoClaimSettlementRecordOutput,
  createCargoComplianceEvidenceRecordOutput,
  createCargoComplianceEvidenceVerifyOutput,
  createCargoDeliveryCompleteOutput,
  createCargoDeliveryExceptionRecordOutput,
  createCargoDeliveryExceptionResolveOutput,
  createCargoOperationalHandoffRecordOutput,
  createCargoRegisterOutput,
  createCargoReleaseOutput,
  createCargoStatusCounts,
  createCargoSummary,
  createCargoTransportArriveOutput,
  createCargoTransportDepartOutput,
  createCargoTransportPlanOutput,
  readCargoStatusCount,
  sumActiveCargo,
  sumCargoStatusCounts,
} from "./domain/dto.js";

export type GetCargoOverviewInput = {
  organizationId: string;
  limit?: number;
  offset?: number;
  generatedAt?: Date;
};

export type RegisterCargoInput = CargoRegisterInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ReleaseCargoInput = CargoReleaseInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type PlanCargoTransportInput = CargoTransportPlanInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type DepartCargoTransportInput = CargoTransportDepartInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ArriveCargoTransportInput = CargoTransportArriveInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CompleteCargoDeliveryInput = CargoDeliveryCompleteInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RecordCargoDeliveryExceptionInput = CargoDeliveryExceptionRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ResolveCargoDeliveryExceptionInput = CargoDeliveryExceptionResolveInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RecordCargoOperationalHandoffInput = CargoOperationalHandoffRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RecordCargoClaimSettlementInput = CargoClaimSettlementRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RecordCargoComplianceEvidenceInput = CargoComplianceEvidenceRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type VerifyCargoComplianceEvidenceInput = CargoComplianceEvidenceVerifyInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class CargoService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  constructor(
    @Inject(CARGO_REPOSITORY) private readonly cargoRepo: CargoRepository,
    private readonly eventBus: OutboxEventBusAdapter,
  ) {}

  async getOverview(input: GetCargoOverviewInput): Promise<CargoOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const offset = input.offset ?? 0;
    const data = await this.cargoRepo.getOverview(input.organizationId, limit, offset);
    const statusCounts = createCargoStatusCounts(data.statusGroups);

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        cargo: sumCargoStatusCounts(statusCounts),
        activeCargo: sumActiveCargo(statusCounts),
        heldCargo: readCargoStatusCount(statusCounts, "held"),
        hazardousCargo: data.hazardousCount,
        inspectionRequiredCargo: data.inspectionRequiredCount,
      },
      statusCounts,
      recentCargo: data.recentCargo.map(createCargoSummary),
      pagination: {
        totalCount: data.totalCount,
        limit,
        offset,
      },
    };
  }

  async registerCargo(input: RegisterCargoInput): Promise<CargoRegisterOutput> {
    const cargoReference = normalizeCargoReference(input.cargoReference);
    const replayedCargo = await this.cargoRepo.findByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      return createCargoRegisterOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        replayed: true,
        businessRules: resolveCargoBusinessRules(input),
      });
    }

    const existingCargo = await this.cargoRepo.findExistingReference(
      input.organizationId,
      cargoReference,
    );

    if (existingCargo !== null) {
      throw new BadRequestException("cargo.reference_conflict");
    }

    const businessRules = resolveCargoBusinessRules(input);
    const expectedReadyAt =
      input.expectedReadyAt === undefined ? null : new Date(input.expectedReadyAt);

    const cargo = await this.database.$transaction(async (tx: PrismaTx) => {
      const createdCargo = await this.cargoRepo.createCargo(tx, {
        organizationId: input.organizationId,
        cargoReference,
        cargoDescription: input.cargoDescription.trim(),
        cargoType: input.cargoType,
        status: businessRules.movementBlocked ? "held" : "registered",
        customsStatus: input.customsStatus,
        conditionStatus: input.conditionStatus,
        grossWeightKg: input.grossWeightKg,
        packageCount: input.packageCount,
        hazardous: input.hazardous,
        requiresInspection: businessRules.inspectionRequired,
        shipperName: input.shipperName.trim(),
        consigneeName: input.consigneeName.trim(),
        originName: input.originName.trim(),
        destinationName: input.destinationName.trim(),
        custodyOwnerName: input.custodyOwnerName.trim(),
        priority: input.priority,
        sourceSystem: input.sourceSystem,
        registrationIdempotencyKey: input.idempotencyKey,
        ...(input.externalReference === undefined
          ? {}
          : { externalReference: input.externalReference.trim() }),
        ...(input.customsReference === undefined
          ? {}
          : { customsReference: input.customsReference.trim() }),
        ...(input.unNumber === undefined ? {} : { unNumber: input.unNumber.trim() }),
        ...(input.hazardClass === undefined ? {} : { hazardClass: input.hazardClass.trim() }),
        ...(input.volumeM3 === undefined ? {} : { volumeM3: input.volumeM3 }),
        ...(expectedReadyAt === null ? {} : { expectedReadyAt }),
      });

      const auditAfter = createCargoRegistrationAuditAfter({
        cargo: createdCargo,
        businessRules,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.registered",
          subjectType: "cargo",
          subjectId: createdCargo.id,
          severity: businessRules.movementBlocked || input.hazardous ? "high" : "medium",
          before: {},
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.registered",
        aggregateType: "cargo",
        aggregateId: createdCargo.id,
        eventVersion: 1,
        payload: {
          cargoId: createdCargo.id,
          cargoReference: createdCargo.cargoReference,
          cargoType: createdCargo.cargoType,
          status: createdCargo.status,
          customsStatus: createdCargo.customsStatus,
          conditionStatus: createdCargo.conditionStatus,
          hazardous: createdCargo.hazardous,
          requiresInspection: createdCargo.requiresInspection,
          movementBlocked: businessRules.movementBlocked,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
        },
      });

      return createdCargo;
    });

    return createCargoRegisterOutput({
      organizationId: input.organizationId,
      cargo,
      replayed: false,
      businessRules,
    });
  }

  async releaseCargo(input: ReleaseCargoInput): Promise<CargoReleaseOutput> {
    const replayedCargo = await this.cargoRepo.findByReleaseIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.release_idempotency_conflict");
      }

      return createCargoReleaseOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        replayed: true,
      });
    }

    const existingCargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (existingCargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (existingCargo.releaseIdempotencyKey !== null) {
      throw new BadRequestException("cargo.already_released");
    }

    const businessRules = resolveCargoReleaseBusinessRules(existingCargo, input);

    if (!businessRules.releaseAllowed) {
      throw new BadRequestException("cargo.release_blocked");
    }

    const releasedAt = input.releasedAt === undefined ? new Date() : new Date(input.releasedAt);
    const previousAuditState = createCargoReleaseAuditBefore(existingCargo, businessRules);
    const cargo = await this.database.$transaction(async (tx: PrismaTx) => {
      const releasedCargo = await this.cargoRepo.updateCargo(tx, existingCargo.id, {
        status: "ready_for_transport",
        customsStatus: input.customsStatus,
        conditionStatus: existingCargo.requiresInspection ? "sound" : existingCargo.conditionStatus,
        requiresInspection: false,
        releaseIdempotencyKey: input.idempotencyKey,
        releaseReason: input.releaseReason.trim(),
        releasedAt,
        ...(input.releaseReference === undefined
          ? {}
          : { releaseReference: input.releaseReference.trim() }),
      });

      const auditAfter = createCargoReleaseAuditAfter({
        cargo: releasedCargo,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.released",
          subjectType: "cargo",
          subjectId: releasedCargo.id,
          severity:
            existingCargo.hazardous || businessRules.customsReleaseRequired ? "high" : "medium",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.released",
        aggregateType: "cargo",
        aggregateId: releasedCargo.id,
        eventVersion: 1,
        payload: {
          cargoId: releasedCargo.id,
          cargoReference: releasedCargo.cargoReference,
          status: releasedCargo.status,
          customsStatus: releasedCargo.customsStatus,
          conditionStatus: releasedCargo.conditionStatus,
          releaseReference: releasedCargo.releaseReference,
          releasedAt: releasedCargo.releasedAt?.toISOString() ?? null,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return releasedCargo;
    });

    return createCargoReleaseOutput({
      organizationId: input.organizationId,
      cargo,
      replayed: false,
      businessRules,
    });
  }

  async planTransport(input: PlanCargoTransportInput): Promise<CargoTransportPlanOutput> {
    const replayedCargo = await this.cargoRepo.findByTransportPlanIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.transport_plan_idempotency_conflict");
      }

      return createCargoTransportPlanOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.transportPlanIdempotencyKey !== null || cargo.trackingShipmentId !== null) {
      throw new BadRequestException("cargo.transport_already_planned");
    }

    const businessRules = resolveCargoTransportPlanBusinessRules(cargo, input);

    if (!businessRules.planningAllowed) {
      throw new BadRequestException("cargo.transport_plan_blocked");
    }

    const transportPlannedAt = new Date();
    const previousAuditState = createCargoTransportPlanAuditBefore(cargo, businessRules);
    const plannedCargo = await this.database.$transaction(async (tx: PrismaTx) => {
      const updatedCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        transportPlanIdempotencyKey: input.idempotencyKey,
        transportOwnerTeam: input.operationsOwnerTeam.trim(),
        transportPlannedAt,
        ...(input.planningReference === undefined
          ? {}
          : { transportPlanningReference: input.planningReference.trim() }),
      });

      const auditAfter = {
        cargoId: updatedCargo.id,
        cargoReference: updatedCargo.cargoReference,
        status: updatedCargo.status,
        trackingShipmentId: updatedCargo.trackingShipmentId,
        transportPlannedAt: updatedCargo.transportPlannedAt?.toISOString() ?? null,
        transportPlanningReference: updatedCargo.transportPlanningReference,
        transportOwnerTeam: updatedCargo.transportOwnerTeam,
        planningAllowed: businessRules.planningAllowed,
        cargoReadyForTracking: businessRules.cargoReadyForTracking,
        trackingLinked: businessRules.trackingLinked,
        appliedRules: businessRules.appliedRules,
        idempotencyKey: updatedCargo.transportPlanIdempotencyKey,
        sourceSystem: input.sourceSystem,
      };

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.transport_planned",
          subjectType: "cargo",
          subjectId: updatedCargo.id,
          severity: cargo.hazardous || input.transportMode === "multimodal" ? "high" : "medium",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.transport_planned",
        aggregateType: "cargo",
        aggregateId: updatedCargo.id,
        eventVersion: 1,
        payload: {
          cargoId: updatedCargo.id,
          cargoReference: updatedCargo.cargoReference,
          transportMode: input.transportMode,
          plannedDepartureAt: input.plannedDepartureAt,
          estimatedArrivalAt: input.estimatedArrivalAt,
          operationsOwnerTeam: input.operationsOwnerTeam.trim(),
          planningReference: input.planningReference?.trim() ?? null,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return updatedCargo;
    });

    return createCargoTransportPlanOutput({
      organizationId: input.organizationId,
      cargo: plannedCargo,
      replayed: false,
      businessRules,
    });
  }

  async departTransport(input: DepartCargoTransportInput): Promise<CargoTransportDepartOutput> {
    const replayedCargo = await this.cargoRepo.findByDepartureIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.transport_departure_idempotency_conflict");
      }

      return createCargoTransportDepartOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.departureIdempotencyKey !== null || cargo.departedAt !== null) {
      throw new BadRequestException("cargo.transport_already_departed");
    }

    if (cargo.trackingShipmentId === null) {
      throw new BadRequestException("cargo.transport_departure_tracking_link_missing");
    }

    const complianceCounts = await this.cargoRepo.getComplianceEvidenceStatusCounts(
      input.organizationId,
      cargo.id,
    );

    const complianceEvidenceCounts = {
      approved: complianceCounts.find((c) => c.status === "approved")?.count ?? 0,
      pendingReview: complianceCounts.find((c) => c.status === "pending_review")?.count ?? 0,
      rejected: complianceCounts.find((c) => c.status === "rejected")?.count ?? 0,
    };

    const cargoReadyForDeparture =
      cargo.status === "ready_for_transport" &&
      cargo.releaseIdempotencyKey !== null &&
      cargo.releasedAt !== null &&
      cargo.transportPlanIdempotencyKey !== null &&
      cargo.trackingShipmentId !== null &&
      cargo.requiresInspection === false &&
      (cargo.customsStatus === "cleared" || cargo.customsStatus === "not_required");
    const approvedComplianceEvidencePresent = complianceEvidenceCounts.approved > 0;
    const openComplianceReviewBlocked =
      complianceEvidenceCounts.pendingReview > 0 || complianceEvidenceCounts.rejected > 0;

    const departedAt = new Date(input.departedAt);
    const departureAfterRelease =
      cargo.releasedAt === null || departedAt >= cargo.releasedAt;
    const departureAfterPlanning =
      cargo.transportPlannedAt === null || departedAt >= cargo.transportPlannedAt;
    const departureAllowed =
      cargoReadyForDeparture &&
      approvedComplianceEvidencePresent &&
      !openComplianceReviewBlocked &&
      departureAfterRelease &&
      departureAfterPlanning;
    const appliedDepartRules = [
      "tenant_scoped_cargo_departure",
      "idempotent_cargo_departure",
      "departure_requires_ready_cargo",
      "departure_requires_tracking_plan",
      "departure_requires_approved_compliance_evidence",
      "departure_blocks_pending_or_rejected_compliance_evidence",
      "departure_creates_audit_and_outbox",
    ];

    if (!cargoReadyForDeparture) {
      appliedDepartRules.push("departure_blocked_until_cargo_ready_for_transport");
    }

    if (!approvedComplianceEvidencePresent) {
      appliedDepartRules.push("departure_blocked_without_approved_compliance_evidence");
    }

    if (openComplianceReviewBlocked) {
      appliedDepartRules.push("departure_blocked_by_open_compliance_review");
    }

    if (!departureAfterRelease) {
      appliedDepartRules.push("departure_cannot_precede_cargo_release");
    }

    if (!departureAfterPlanning) {
      appliedDepartRules.push("departure_cannot_precede_transport_planning");
    }

    if (!departureAllowed) {
      throw new BadRequestException("cargo.transport_departure_blocked");
    }

    const previousAuditState = {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference,
      cargoStatus: cargo.status,
      customsStatus: cargo.customsStatus,
      requiresInspection: cargo.requiresInspection,
      releasedAt: cargo.releasedAt?.toISOString() ?? null,
      transportPlannedAt: cargo.transportPlannedAt?.toISOString() ?? null,
      trackingShipmentId: cargo.trackingShipmentId,
      approvedComplianceEvidence: complianceEvidenceCounts.approved,
      pendingComplianceEvidence: complianceEvidenceCounts.pendingReview,
      rejectedComplianceEvidence: complianceEvidenceCounts.rejected,
      departureAllowed,
      cargoReadyForDeparture,
      approvedComplianceEvidencePresent,
      openComplianceReviewBlocked,
      appliedRules: appliedDepartRules,
    };

    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const departedCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        status: "in_transport",
        departureIdempotencyKey: input.idempotencyKey,
        departureLocationName: input.departureLocationName.trim(),
        departureOperatorName: input.operatorName.trim(),
        departedAt,
        ...(input.departureReference === undefined
          ? {}
          : { departureReference: input.departureReference.trim() }),
        ...(input.carrierReference === undefined
          ? {}
          : { carrierReference: input.carrierReference.trim() }),
      });

      const auditAfter = {
        cargoId: departedCargo.id,
        cargoReference: departedCargo.cargoReference,
        cargoStatus: departedCargo.status,
        trackingShipmentId: departedCargo.trackingShipmentId,
        departedAt: departedCargo.departedAt?.toISOString() ?? null,
        departureReference: departedCargo.departureReference,
        departureLocationName: departedCargo.departureLocationName,
        departureOperatorName: departedCargo.departureOperatorName,
        carrierReference: departedCargo.carrierReference,
        approvedComplianceEvidence: complianceEvidenceCounts.approved,
        pendingComplianceEvidence: complianceEvidenceCounts.pendingReview,
        rejectedComplianceEvidence: complianceEvidenceCounts.rejected,
        departureAllowed,
        appliedRules: appliedDepartRules,
        idempotencyKey: departedCargo.departureIdempotencyKey,
        sourceSystem: input.sourceSystem,
      };

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.transport_departed",
          subjectType: "cargo",
          subjectId: cargo.id,
          severity: cargo.hazardous ? "high" : "medium",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.transport_departed",
        aggregateType: "cargo",
        aggregateId: cargo.id,
        eventVersion: 1,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          departedAt: departedAt.toISOString(),
          departureLocationName: departedCargo.departureLocationName,
          operatorName: departedCargo.departureOperatorName,
          appliedRules: appliedDepartRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return departedCargo;
    });

    return createCargoTransportDepartOutput({
      organizationId: input.organizationId,
      cargo: result,
      replayed: false,
      businessRules: {
        departureAllowed,
        cargoReadyForDeparture,
        trackingShipmentPlanned: true,
        approvedComplianceEvidencePresent,
        openComplianceReviewBlocked,
        appliedRules: appliedDepartRules,
      },
    });
  }

  async arriveTransport(input: ArriveCargoTransportInput): Promise<CargoTransportArriveOutput> {
    const replayedCargo = await this.cargoRepo.findByArrivalIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.transport_arrival_idempotency_conflict");
      }

      return createCargoTransportArriveOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.arrivalIdempotencyKey !== null || cargo.arrivedAt !== null) {
      throw new BadRequestException("cargo.transport_already_arrived");
    }

    if (cargo.trackingShipmentId === null) {
      throw new BadRequestException("cargo.transport_arrival_tracking_link_missing");
    }

    const cargoInTransport =
      cargo.status === "in_transport" &&
      cargo.departureIdempotencyKey !== null &&
      cargo.departedAt !== null &&
      cargo.trackingShipmentId !== null;
    const arrivedAt = new Date(input.arrivedAt);
    const arrivalAfterDeparture = cargo.departedAt === null || arrivedAt >= cargo.departedAt;
    const arrivalAllowed = cargoInTransport && arrivalAfterDeparture;
    const appliedArriveRules = [
      "tenant_scoped_cargo_arrival",
      "idempotent_cargo_arrival",
      "arrival_requires_departed_cargo",
      "arrival_cannot_precede_departure",
      "arrival_creates_audit_and_outbox",
    ];

    if (!cargoInTransport) {
      appliedArriveRules.push("arrival_blocked_until_cargo_in_transport");
    }

    if (!arrivalAfterDeparture) {
      appliedArriveRules.push("arrival_cannot_precede_departure_timestamp");
    }

    if (!arrivalAllowed) {
      throw new BadRequestException("cargo.transport_arrival_blocked");
    }

    const previousAuditState = {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference,
      cargoStatus: cargo.status,
      trackingShipmentId: cargo.trackingShipmentId,
      departedAt: cargo.departedAt?.toISOString() ?? null,
      arrivalAllowed,
      cargoInTransport,
      arrivalAfterDeparture,
      appliedRules: appliedArriveRules,
    };

    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const arrivedCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        arrivalIdempotencyKey: input.idempotencyKey,
        arrivalLocationName: input.arrivalLocationName.trim(),
        arrivalOperatorName: input.operatorName.trim(),
        arrivedAt,
        ...(input.arrivalReference === undefined
          ? {}
          : { arrivalReference: input.arrivalReference.trim() }),
      });

      const auditAfter = {
        cargoId: arrivedCargo.id,
        cargoReference: arrivedCargo.cargoReference,
        cargoStatus: arrivedCargo.status,
        trackingShipmentId: arrivedCargo.trackingShipmentId,
        arrivedAt: arrivedCargo.arrivedAt?.toISOString() ?? null,
        arrivalReference: arrivedCargo.arrivalReference,
        arrivalLocationName: arrivedCargo.arrivalLocationName,
        arrivalOperatorName: arrivedCargo.arrivalOperatorName,
        arrivalAllowed,
        appliedRules: appliedArriveRules,
        idempotencyKey: arrivedCargo.arrivalIdempotencyKey,
        sourceSystem: input.sourceSystem,
      };

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.transport_arrived",
          subjectType: "cargo",
          subjectId: cargo.id,
          severity: cargo.hazardous ? "high" : "medium",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.transport_arrived",
        aggregateType: "cargo",
        aggregateId: cargo.id,
        eventVersion: 1,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          arrivedAt: arrivedAt.toISOString(),
          arrivalLocationName: arrivedCargo.arrivalLocationName,
          operatorName: arrivedCargo.arrivalOperatorName,
          appliedRules: appliedArriveRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return arrivedCargo;
    });

    return createCargoTransportArriveOutput({
      organizationId: input.organizationId,
      cargo: result,
      replayed: false,
      businessRules: {
        arrivalAllowed,
        cargoInTransport,
        trackingShipmentInTransit: true,
        arrivalAfterDeparture,
        appliedRules: appliedArriveRules,
      },
    });
  }

  async recordOperationalHandoff(
    input: RecordCargoOperationalHandoffInput,
  ): Promise<CargoOperationalHandoffRecordOutput> {
    const replayedHandoff = await this.cargoRepo.findOperationalHandoffByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedHandoff !== null) {
      if (replayedHandoff.cargoId !== input.cargoId) {
        throw new BadRequestException("cargo.handoff_record_idempotency_conflict");
      }

      const cargo = await this.cargoRepo.findById(input.organizationId, replayedHandoff.cargoId);

      if (cargo === null) {
        throw new BadRequestException("cargo.handoff_record_replay_incomplete");
      }

      return createCargoOperationalHandoffRecordOutput({
        organizationId: input.organizationId,
        cargo,
        handoff: replayedHandoff,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.trackingShipmentId === null) {
      throw new BadRequestException("cargo.handoff_tracking_link_missing");
    }

    const duplicateReference = await this.cargoRepo.findOperationalHandoffByRecordIdempotencyKey(
      input.organizationId,
      input.handoffReference.trim(),
    );

    const handoffAt = new Date(input.handoffAt);
    const currentCustodyOwner = input.fromCustodyOwnerName.trim().toLocaleLowerCase();
    const fromCustodyOwner = input.fromCustodyOwnerName.trim().toLocaleLowerCase();
    const toCustodyOwner = input.toCustodyOwnerName.trim().toLocaleLowerCase();
    const cargoInTransport =
      cargo.status === "in_transport" &&
      cargo.departureIdempotencyKey !== null &&
      cargo.departedAt !== null &&
      cargo.arrivalIdempotencyKey === null &&
      cargo.arrivedAt === null &&
      cargo.deliveredAt === null &&
      cargo.trackingShipmentId !== null;
    const handoffAfterDeparture = cargo.departedAt === null || handoffAt >= cargo.departedAt;
    const handoffBeforeArrival = cargo.arrivedAt === null || handoffAt <= cargo.arrivedAt;
    const currentCustodyMatched = currentCustodyOwner === fromCustodyOwner;
    const custodyChanged = fromCustodyOwner !== toCustodyOwner;
    const conditionAccepted = input.conditionStatus === "sound";
    const duplicateReferenceBlocked = duplicateReference !== null;
    const handoffAllowed =
      cargoInTransport &&
      handoffAfterDeparture &&
      handoffBeforeArrival &&
      currentCustodyMatched &&
      custodyChanged &&
      conditionAccepted &&
      !duplicateReferenceBlocked;
    const appliedHandoffRules = [
      "tenant_scoped_operational_handoff",
      "idempotent_operational_handoff_record",
      "handoff_requires_in_transit_cargo",
      "handoff_cannot_precede_departure",
      "handoff_cannot_follow_arrival",
      "handoff_requires_current_custody_match",
      "handoff_requires_custody_change",
      "handoff_requires_sound_condition",
      "handoff_blocks_duplicate_reference",
      "handoff_creates_audit_and_outbox",
    ];

    if (!cargoInTransport) {
      appliedHandoffRules.push("handoff_blocked_until_cargo_in_transport");
    }

    if (!handoffAfterDeparture) {
      appliedHandoffRules.push("handoff_cannot_precede_departure_timestamp");
    }

    if (!handoffBeforeArrival) {
      appliedHandoffRules.push("handoff_cannot_follow_arrival_timestamp");
    }

    if (!currentCustodyMatched) {
      appliedHandoffRules.push("handoff_blocked_when_from_custody_mismatches_current_owner");
    }

    if (!custodyChanged) {
      appliedHandoffRules.push("handoff_blocked_without_custody_change");
    }

    if (!conditionAccepted) {
      appliedHandoffRules.push("handoff_blocked_until_exception_workflow");
    }

    if (duplicateReferenceBlocked) {
      appliedHandoffRules.push("handoff_blocked_by_duplicate_reference");
    }

    if (!handoffAllowed) {
      throw new BadRequestException("cargo.handoff_record_blocked");
    }

    const previousAuditState = {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference,
      cargoStatus: cargo.status,
      trackingShipmentId: cargo.trackingShipmentId,
      custodyOwnerName: cargo.custodyOwnerName,
      departedAt: cargo.departedAt?.toISOString() ?? null,
      arrivedAt: cargo.arrivedAt?.toISOString() ?? null,
      duplicateHandoffId: duplicateReference?.id ?? null,
      handoffAllowed,
      cargoInTransport,
      currentCustodyMatched,
      custodyChanged,
      conditionAccepted,
      duplicateReferenceBlocked,
      appliedRules: appliedHandoffRules,
    };

    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const handoff = await this.cargoRepo.createOperationalHandoff(tx, {
        organizationId: input.organizationId,
        cargoId: cargo.id,
        trackingShipmentId: cargo.trackingShipmentId,
        handoffType: input.handoffType,
        fromCustodyOwnerName: input.fromCustodyOwnerName.trim(),
        toCustodyOwnerName: input.toCustodyOwnerName.trim(),
        handoffLocationName: input.handoffLocationName.trim(),
        operatorName: input.operatorName.trim(),
        handoffReference: input.handoffReference.trim(),
        conditionStatus: input.conditionStatus,
        handoffAt,
        sourceSystem: input.sourceSystem,
        recordIdempotencyKey: input.idempotencyKey,
        ...(input.sealReference === undefined ? {} : { sealReference: input.sealReference.trim() }),
        ...(input.handoffNotes === undefined ? {} : { handoffNotes: input.handoffNotes.trim() }),
      });

      const handedOffCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        custodyOwnerName: input.toCustodyOwnerName.trim(),
        conditionStatus: input.conditionStatus,
      });

      const auditAfter = {
        cargoId: handedOffCargo.id,
        cargoReference: handedOffCargo.cargoReference,
        cargoStatus: handedOffCargo.status,
        trackingShipmentId: handedOffCargo.trackingShipmentId,
        handoffId: handoff.id,
        handoffType: handoff.handoffType,
        handoffReference: handoff.handoffReference,
        fromCustodyOwnerName: handoff.fromCustodyOwnerName,
        toCustodyOwnerName: handoff.toCustodyOwnerName,
        custodyOwnerName: handedOffCargo.custodyOwnerName,
        conditionStatus: handoff.conditionStatus,
        handoffAt: handoff.handoffAt.toISOString(),
        handoffAllowed,
        appliedRules: appliedHandoffRules,
        idempotencyKey: handoff.recordIdempotencyKey,
        sourceSystem: input.sourceSystem,
      };

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.operational_handoff.recorded",
          subjectType: "cargo_operational_handoff",
          subjectId: handoff.id,
          severity: "medium",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.operational_handoff.recorded",
        aggregateType: "cargo",
        aggregateId: cargo.id,
        eventVersion: 1,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          handoffId: handoff.id,
          handoffType: handoff.handoffType,
          handoffReference: handoff.handoffReference,
          fromCustodyOwnerName: handoff.fromCustodyOwnerName,
          toCustodyOwnerName: handoff.toCustodyOwnerName,
          operatorName: handoff.operatorName,
          conditionStatus: handoff.conditionStatus,
          sealReference: handoff.sealReference,
          appliedRules: appliedHandoffRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: handedOffCargo, handoff };
    });

    return createCargoOperationalHandoffRecordOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      handoff: result.handoff,
      replayed: false,
      businessRules: {
        handoffAllowed,
        cargoInTransport,
        trackingShipmentInTransit: true,
        handoffAfterDeparture,
        handoffBeforeArrival,
        currentCustodyMatched,
        custodyChanged,
        conditionAccepted,
        duplicateReferenceBlocked,
        appliedRules: appliedHandoffRules,
      },
    });
  }

  async completeDelivery(input: CompleteCargoDeliveryInput): Promise<CargoDeliveryCompleteOutput> {
    const replayedCargo = await this.cargoRepo.findByDeliveryIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.delivery_idempotency_conflict");
      }

      return createCargoDeliveryCompleteOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.deliveryIdempotencyKey !== null || cargo.deliveredAt !== null) {
      throw new BadRequestException("cargo.delivery_already_completed");
    }

    if (cargo.trackingShipmentId === null) {
      throw new BadRequestException("cargo.delivery_tracking_link_missing");
    }

    const cargoArrivedForDelivery =
      cargo.status === "in_transport" &&
      cargo.arrivalIdempotencyKey !== null &&
      cargo.arrivedAt !== null &&
      cargo.trackingShipmentId !== null;
    const deliveredAt = new Date(input.deliveredAt);
    const deliveryAfterArrival = cargo.arrivedAt === null || deliveredAt >= cargo.arrivedAt;
    const deliveryConditionAccepted = input.deliveryConditionStatus === "sound";
    const deliveryAllowed =
      cargoArrivedForDelivery &&
      deliveryAfterArrival &&
      deliveryConditionAccepted;
    const appliedDeliveryRules = [
      "tenant_scoped_cargo_delivery",
      "idempotent_cargo_delivery",
      "delivery_requires_arrived_cargo",
      "delivery_cannot_precede_arrival",
      "delivery_requires_sound_condition",
      "delivery_creates_audit_and_outbox",
    ];

    if (!cargoArrivedForDelivery) {
      appliedDeliveryRules.push("delivery_blocked_until_cargo_arrived");
    }

    if (!deliveryAfterArrival) {
      appliedDeliveryRules.push("delivery_cannot_precede_arrival_timestamp");
    }

    if (!deliveryConditionAccepted) {
      appliedDeliveryRules.push("delivery_blocked_until_exception_or_inspection_resolution");
    }

    if (!deliveryAllowed) {
      throw new BadRequestException("cargo.delivery_blocked");
    }

    const deliveryLocationName = cargo.arrivalLocationName ?? cargo.destinationName;
    const previousAuditState = {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference,
      cargoStatus: cargo.status,
      trackingShipmentId: cargo.trackingShipmentId,
      arrivedAt: cargo.arrivedAt?.toISOString() ?? null,
      conditionStatus: cargo.conditionStatus,
      deliveryAllowed,
      cargoArrivedForDelivery,
      deliveryAfterArrival,
      deliveryConditionAccepted,
      appliedRules: appliedDeliveryRules,
    };

    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const deliveredCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        status: "delivered",
        conditionStatus: input.deliveryConditionStatus,
        deliveryIdempotencyKey: input.idempotencyKey,
        deliveryReference: input.deliveryReference.trim(),
        receivedByName: input.receivedByName.trim(),
        deliveryNotes: input.deliveryNotes?.trim() ?? null,
        deliveredAt,
      });

      const auditAfter = {
        cargoId: deliveredCargo.id,
        cargoReference: deliveredCargo.cargoReference,
        cargoStatus: deliveredCargo.status,
        trackingShipmentId: deliveredCargo.trackingShipmentId,
        deliveredAt: deliveredCargo.deliveredAt?.toISOString() ?? null,
        deliveryReference: deliveredCargo.deliveryReference,
        receivedByName: deliveredCargo.receivedByName,
        deliveryNotes: deliveredCargo.deliveryNotes,
        conditionStatus: deliveredCargo.conditionStatus,
        deliveryAllowed,
        appliedRules: appliedDeliveryRules,
        idempotencyKey: deliveredCargo.deliveryIdempotencyKey,
        sourceSystem: input.sourceSystem,
      };

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.delivery_completed",
          subjectType: "cargo",
          subjectId: cargo.id,
          severity:
            cargo.hazardous || input.deliveryConditionStatus !== "sound" ? "high" : "medium",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.delivery_completed",
        aggregateType: "cargo",
        aggregateId: cargo.id,
        eventVersion: 1,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          deliveredAt: deliveredAt.toISOString(),
          deliveryReference: deliveredCargo.deliveryReference,
          receivedByName: deliveredCargo.receivedByName,
          appliedRules: appliedDeliveryRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return deliveredCargo;
    });

    return createCargoDeliveryCompleteOutput({
      organizationId: input.organizationId,
      cargo: result,
      replayed: false,
      businessRules: {
        deliveryAllowed,
        cargoArrivedForDelivery,
        trackingShipmentArrived: true,
        deliveryAfterArrival,
        deliveryConditionAccepted,
        appliedRules: appliedDeliveryRules,
      },
    });
  }

  async recordDeliveryException(
    input: RecordCargoDeliveryExceptionInput,
  ): Promise<CargoDeliveryExceptionRecordOutput> {
    const replayedException = await this.cargoRepo.findDeliveryExceptionByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedException !== null) {
      if (replayedException.cargoId !== input.cargoId) {
        throw new BadRequestException("cargo.delivery_exception_record_idempotency_conflict");
      }

      const cargo = await this.cargoRepo.findById(input.organizationId, replayedException.cargoId);

      if (cargo === null) {
        throw new BadRequestException("cargo.delivery_exception_record_replay_incomplete");
      }

      return createCargoDeliveryExceptionRecordOutput({
        organizationId: input.organizationId,
        cargo,
        exception: replayedException,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.trackingShipmentId === null) {
      throw new BadRequestException("cargo.delivery_exception_tracking_link_missing");
    }

    const cargoArrivedForException =
      cargo.status === "in_transport" &&
      cargo.arrivalIdempotencyKey !== null &&
      cargo.arrivedAt !== null &&
      cargo.deliveryIdempotencyKey === null &&
      cargo.deliveredAt === null &&
      cargo.trackingShipmentId !== null;
    const occurredAt = new Date(input.occurredAt);
    const exceptionAfterArrival = cargo.arrivedAt === null || occurredAt >= cargo.arrivedAt;
    const exceptionAccepted =
      cargoArrivedForException &&
      exceptionAfterArrival;
    const appliedExceptionRules = [
      "tenant_scoped_delivery_exception",
      "idempotent_delivery_exception_record",
      "delivery_exception_requires_arrived_cargo",
      "delivery_exception_cannot_precede_arrival",
      "delivery_exception_creates_audit_and_outbox",
    ];

    if (!cargoArrivedForException) {
      appliedExceptionRules.push("delivery_exception_blocked_until_cargo_arrived");
    }

    if (!exceptionAfterArrival) {
      appliedExceptionRules.push("delivery_exception_cannot_precede_arrival_timestamp");
    }

    if (!exceptionAccepted) {
      throw new BadRequestException("cargo.delivery_exception_record_blocked");
    }

    const eventLocationName = cargo.arrivalLocationName ?? cargo.destinationName;
    const previousAuditState = {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference,
      cargoStatus: cargo.status,
      conditionStatus: cargo.conditionStatus,
      requiresInspection: cargo.requiresInspection,
      trackingShipmentId: cargo.trackingShipmentId,
      arrivedAt: cargo.arrivedAt?.toISOString() ?? null,
      exceptionAccepted,
      cargoArrivedForException,
      exceptionAfterArrival,
      appliedRules: appliedExceptionRules,
    };

    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const exception = await this.cargoRepo.createDeliveryException(tx, {
        organizationId: input.organizationId,
        cargoId: cargo.id,
        trackingShipmentId: cargo.trackingShipmentId,
        exceptionType: input.exceptionType,
        deliveryConditionStatus: input.deliveryConditionStatus,
        reportedByName: input.reportedByName.trim(),
        exceptionSummary: input.exceptionSummary.trim(),
        evidenceReference: input.evidenceReference.trim(),
        occurredAt,
        sourceSystem: input.sourceSystem,
        recordIdempotencyKey: input.idempotencyKey,
        ...(input.claimReference === undefined
          ? {}
          : { claimReference: input.claimReference.trim() }),
      });

      const heldCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        status: "held",
        conditionStatus: input.deliveryConditionStatus,
        requiresInspection: true,
      });

      const auditAfter = {
        cargoId: heldCargo.id,
        cargoReference: heldCargo.cargoReference,
        cargoStatus: heldCargo.status,
        conditionStatus: heldCargo.conditionStatus,
        requiresInspection: heldCargo.requiresInspection,
        exceptionId: exception.id,
        exceptionType: exception.exceptionType,
        deliveryConditionStatus: exception.deliveryConditionStatus,
        exceptionStatus: exception.status,
        evidenceReference: exception.evidenceReference,
        claimReference: exception.claimReference,
        occurredAt: exception.occurredAt.toISOString(),
        exceptionAccepted,
        appliedRules: appliedExceptionRules,
        idempotencyKey: exception.recordIdempotencyKey,
        sourceSystem: input.sourceSystem,
      };

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.delivery_exception.recorded",
          subjectType: "cargo_delivery_exception",
          subjectId: exception.id,
          severity: "high",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.delivery_exception.recorded",
        aggregateType: "cargo",
        aggregateId: cargo.id,
        eventVersion: 1,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          exceptionId: exception.id,
          exceptionType: exception.exceptionType,
          deliveryConditionStatus: exception.deliveryConditionStatus,
          evidenceReference: exception.evidenceReference,
          claimReference: exception.claimReference,
          reportedByName: exception.reportedByName,
          appliedRules: appliedExceptionRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: heldCargo, exception };
    });

    return createCargoDeliveryExceptionRecordOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      exception: result.exception,
      replayed: false,
      businessRules: {
        exceptionAccepted,
        cargoArrivedForException,
        trackingShipmentArrived: true,
        openExceptionBlocked: true,
        exceptionAfterArrival,
        appliedRules: appliedExceptionRules,
      },
    });
  }

  async resolveDeliveryException(
    input: ResolveCargoDeliveryExceptionInput,
  ): Promise<CargoDeliveryExceptionResolveOutput> {
    const replayedException = await this.cargoRepo.findDeliveryExceptionByResolveIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedException !== null) {
      if (replayedException.id !== input.exceptionId) {
        throw new BadRequestException("cargo.delivery_exception_resolve_idempotency_conflict");
      }

      const cargo = await this.cargoRepo.findById(input.organizationId, replayedException.cargoId);

      if (cargo === null) {
        throw new BadRequestException("cargo.delivery_exception_resolve_replay_incomplete");
      }

      return createCargoDeliveryExceptionResolveOutput({
        organizationId: input.organizationId,
        cargo,
        exception: replayedException,
        replayed: true,
      });
    }

    const exception = await this.cargoRepo.findDeliveryExceptionById(
      input.organizationId,
      input.exceptionId,
    );

    if (exception === null) {
      throw new NotFoundException("cargo.delivery_exception_not_found");
    }

    if (exception.status === "resolved") {
      throw new BadRequestException("cargo.delivery_exception_already_resolved");
    }

    if (exception.trackingShipmentId === null) {
      throw new BadRequestException("cargo.delivery_exception_tracking_link_missing");
    }

    const openException = exception.status === "open";
    const cargoHeldForInspection =
      exception.cargo.status === "held" &&
      exception.cargo.requiresInspection &&
      exception.cargo.deliveredAt === null;
    const resolvedAt = new Date(input.resolvedAt);
    const resolutionAfterException = resolvedAt >= exception.occurredAt;
    const cargoRestoredForDelivery = input.finalConditionStatus === "sound";
    const resolutionAllowed =
      openException &&
      cargoHeldForInspection &&
      resolutionAfterException &&
      cargoRestoredForDelivery;
    const appliedResolveRules = [
      "tenant_scoped_delivery_exception_resolution",
      "idempotent_delivery_exception_resolution",
      "delivery_exception_resolution_requires_open_exception",
      "delivery_exception_resolution_requires_held_cargo",
      "delivery_exception_resolution_cannot_precede_exception",
      "delivery_exception_resolution_restores_sound_condition",
      "delivery_exception_resolution_reopens_delivery_completion",
      "delivery_exception_resolution_creates_audit_and_outbox",
    ];

    if (!openException) {
      appliedResolveRules.push("delivery_exception_resolution_blocked_when_not_open");
    }

    if (!cargoHeldForInspection) {
      appliedResolveRules.push("delivery_exception_resolution_blocked_when_cargo_not_held");
    }

    if (!resolutionAfterException) {
      appliedResolveRules.push("delivery_exception_resolution_cannot_precede_exception_timestamp");
    }

    if (!cargoRestoredForDelivery) {
      appliedResolveRules.push("delivery_exception_resolution_requires_sound_final_condition");
    }

    if (!resolutionAllowed) {
      throw new BadRequestException("cargo.delivery_exception_resolve_blocked");
    }

    const eventLocationName =
      exception.cargo.arrivalLocationName ?? exception.cargo.destinationName;
    const previousAuditState = {
      cargoId: exception.cargo.id,
      cargoReference: exception.cargo.cargoReference,
      cargoStatus: exception.cargo.status,
      conditionStatus: exception.cargo.conditionStatus,
      requiresInspection: exception.cargo.requiresInspection,
      exceptionId: exception.id,
      exceptionStatus: exception.status,
      exceptionType: exception.exceptionType,
      occurredAt: exception.occurredAt.toISOString(),
      resolutionAllowed,
      openException,
      cargoHeldForInspection,
      resolutionAfterException,
      cargoRestoredForDelivery,
      appliedRules: appliedResolveRules,
    };

    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      await this.cargoRepo.updateDeliveryException(tx, exception.id, {
        status: "resolved",
        resolverName: input.resolverName.trim(),
        resolutionCode: input.resolutionCode,
        resolutionReference: input.resolutionReference.trim(),
        resolutionSummary: input.resolutionSummary.trim(),
        resolvedAt,
        resolveIdempotencyKey: input.idempotencyKey,
      });

      const restoredCargo = await this.cargoRepo.updateCargo(tx, exception.cargo.id, {
        status: "in_transport",
        conditionStatus: input.finalConditionStatus,
        requiresInspection: false,
      });

      const resolvedException = await this.cargoRepo.findDeliveryExceptionById(
        input.organizationId,
        exception.id,
      );

      if (resolvedException === null) {
        throw new BadRequestException("cargo.delivery_exception_resolve_not_found");
      }

      const auditAfter = {
        cargoId: restoredCargo.id,
        cargoReference: restoredCargo.cargoReference,
        cargoStatus: restoredCargo.status,
        conditionStatus: restoredCargo.conditionStatus,
        requiresInspection: restoredCargo.requiresInspection,
        exceptionId: resolvedException.id,
        exceptionStatus: resolvedException.status,
        resolutionCode: resolvedException.resolutionCode,
        resolutionReference: resolvedException.resolutionReference,
        resolvedAt: resolvedException.resolvedAt?.toISOString() ?? null,
        resolutionAllowed,
        appliedRules: appliedResolveRules,
        idempotencyKey: resolvedException.resolveIdempotencyKey,
        sourceSystem: input.sourceSystem,
      };

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.delivery_exception.resolved",
          subjectType: "cargo_delivery_exception",
          subjectId: exception.id,
          severity: "high",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.delivery_exception.resolved",
        aggregateType: "cargo",
        aggregateId: exception.cargo.id,
        eventVersion: 1,
        payload: {
          cargoId: exception.cargo.id,
          cargoReference: exception.cargo.cargoReference,
          exceptionId: exception.id,
          resolutionCode: input.resolutionCode,
          resolutionReference: resolvedException.resolutionReference,
          finalConditionStatus: input.finalConditionStatus,
          resolverName: input.resolverName.trim(),
          appliedRules: appliedResolveRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return {
        cargo: restoredCargo,
        exception: resolvedException,
      };
    });

    return createCargoDeliveryExceptionResolveOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      exception: result.exception,
      replayed: false,
      businessRules: {
        resolutionAllowed,
        openException,
        cargoHeldForInspection,
        trackingShipmentException: true,
        resolutionAfterException,
        cargoRestoredForDelivery,
        appliedRules: appliedResolveRules,
      },
    });
  }

  async recordClaimSettlement(
    input: RecordCargoClaimSettlementInput,
  ): Promise<CargoClaimSettlementRecordOutput> {
    const replayedSettlement = await this.cargoRepo.findClaimSettlementByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedSettlement !== null) {
      if (replayedSettlement.deliveryExceptionId !== input.exceptionId) {
        throw new BadRequestException("cargo.claim_settlement_record_idempotency_conflict");
      }

      const exception = await this.cargoRepo.findDeliveryExceptionById(
        input.organizationId,
        replayedSettlement.deliveryExceptionId,
      );

      if (exception === null) {
        throw new BadRequestException("cargo.claim_settlement_record_replay_incomplete");
      }

      return createCargoClaimSettlementRecordOutput({
        organizationId: input.organizationId,
        cargo: exception.cargo,
        exception,
        settlement: replayedSettlement,
        replayed: true,
      });
    }

    const exception = await this.cargoRepo.findDeliveryExceptionById(
      input.organizationId,
      input.exceptionId,
    );

    if (exception === null) {
      throw new NotFoundException("cargo.delivery_exception_not_found");
    }

    const [duplicateSettlement, duplicateSettlementByRef] = await Promise.all([
      this.cargoRepo.findClaimSettlementByExceptionId(input.organizationId, exception.id),
      this.cargoRepo.findClaimSettlementBySettlementReference(
        input.organizationId,
        input.settlementReference.trim(),
      ),
    ]);

    const businessRules = resolveCargoClaimSettlementRecordBusinessRules(
      exception,
      duplicateSettlement,
      duplicateSettlementByRef,
      input,
    );

    if (!businessRules.settlementAllowed) {
      throw new BadRequestException("cargo.claim_settlement_record_blocked");
    }

    const settledAt = new Date(input.settledAt);
    const previousAuditState = createCargoClaimSettlementRecordAuditBefore({
      exception,
      duplicateSettlement,
      duplicateReference: duplicateSettlementByRef,
      businessRules,
    });
    const settlement = await this.database.$transaction(async (tx: PrismaTx) => {
      const recordedSettlement = await this.cargoRepo.createClaimSettlement(tx, {
        organizationId: input.organizationId,
        cargoId: exception.cargoId,
        deliveryExceptionId: exception.id,
        claimReference: input.claimReference.trim(),
        settlementReference: input.settlementReference.trim(),
        settlementType: input.settlementType,
        settlementStatus: "settled",
        currencyCode: input.currencyCode.trim().toUpperCase(),
        settlementAmount: input.settlementAmount,
        settledByName: input.settledByName.trim(),
        counterpartyName: input.counterpartyName.trim(),
        settlementSummary: input.settlementSummary.trim(),
        settledAt,
        sourceSystem: input.sourceSystem,
        recordIdempotencyKey: input.idempotencyKey,
      });

      const auditAfter = createCargoClaimSettlementRecordAuditAfter({
        exception,
        settlement: recordedSettlement,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.claim_settlement.recorded",
          subjectType: "cargo_claim_settlement",
          subjectId: recordedSettlement.id,
          severity: "critical",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.claim_settlement.recorded",
        aggregateType: "cargo",
        aggregateId: exception.cargoId,
        eventVersion: 1,
        payload: {
          cargoId: exception.cargoId,
          cargoReference: exception.cargo.cargoReference,
          exceptionId: exception.id,
          settlementId: recordedSettlement.id,
          claimReference: recordedSettlement.claimReference,
          settlementReference: recordedSettlement.settlementReference,
          settlementType: recordedSettlement.settlementType,
          settlementStatus: recordedSettlement.settlementStatus,
          currencyCode: recordedSettlement.currencyCode,
          settlementAmount: Number(recordedSettlement.settlementAmount),
          settledAt: recordedSettlement.settledAt.toISOString(),
          counterpartyName: recordedSettlement.counterpartyName,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return recordedSettlement;
    });

    return createCargoClaimSettlementRecordOutput({
      organizationId: input.organizationId,
      cargo: exception.cargo,
      exception,
      settlement,
      replayed: false,
      businessRules,
    });
  }

  async recordComplianceEvidence(
    input: RecordCargoComplianceEvidenceInput,
  ): Promise<CargoComplianceEvidenceRecordOutput> {
    const replayedEvidence = await this.cargoRepo.findComplianceEvidenceByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvidence !== null) {
      if (replayedEvidence.cargoId !== input.cargoId) {
        throw new BadRequestException("cargo.compliance_record_idempotency_conflict");
      }

      return createCargoComplianceEvidenceRecordOutput({
        organizationId: input.organizationId,
        evidence: replayedEvidence,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    const documentReference = normalizeCargoReference(input.documentReference);
    const duplicateEvidence = await this.cargoRepo.findComplianceEvidenceByRecordIdempotencyKey(
      input.organizationId,
      documentReference,
    );

    if (duplicateEvidence !== null) {
      throw new BadRequestException("cargo.compliance_evidence_reference_conflict");
    }

    const businessRules = resolveCargoComplianceEvidenceRecordBusinessRules(cargo, input);

    if (!businessRules.evidenceAccepted) {
      throw new BadRequestException("cargo.compliance_evidence_record_blocked");
    }

    const issuedAt = input.issuedAt === undefined ? null : new Date(input.issuedAt);
    const expiresAt = input.expiresAt === undefined ? null : new Date(input.expiresAt);
    const evidence = await this.database.$transaction(async (tx: PrismaTx) => {
      const createdEvidence = await this.cargoRepo.createComplianceEvidence(tx, {
        organizationId: input.organizationId,
        cargoId: input.cargoId,
        evidenceType: input.evidenceType,
        documentReference,
        documentTitle: input.documentTitle.trim(),
        issuerName: input.issuerName.trim(),
        sourceSystem: input.sourceSystem,
        recordIdempotencyKey: input.idempotencyKey,
        recordedByActorId: input.actorId,
        ...(input.documentUri === undefined ? {} : { documentUri: input.documentUri.trim() }),
        ...(issuedAt === null ? {} : { issuedAt }),
        ...(expiresAt === null ? {} : { expiresAt }),
      });

      const auditAfter = createCargoComplianceEvidenceRecordAuditAfter({
        evidence: createdEvidence,
        businessRules,
        cargo,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.compliance_evidence.recorded",
          subjectType: "cargo_compliance_evidence",
          subjectId: createdEvidence.id,
          severity:
            cargo.hazardous || input.evidenceType === "hazardous_goods_declaration"
              ? "high"
              : "medium",
          before: {},
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.compliance_evidence.recorded",
        aggregateType: "cargo",
        aggregateId: cargo.id,
        eventVersion: 1,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          evidenceId: createdEvidence.id,
          evidenceType: createdEvidence.evidenceType,
          documentReference: createdEvidence.documentReference,
          status: createdEvidence.status,
          reviewRequired: businessRules.reviewRequired,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return createdEvidence;
    });

    return createCargoComplianceEvidenceRecordOutput({
      organizationId: input.organizationId,
      evidence,
      replayed: false,
      businessRules,
    });
  }

  async verifyComplianceEvidence(
    input: VerifyCargoComplianceEvidenceInput,
  ): Promise<CargoComplianceEvidenceVerifyOutput> {
    const replayedEvidence = await this.cargoRepo.findComplianceEvidenceByVerifyIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedEvidence !== null) {
      if (replayedEvidence.id !== input.evidenceId) {
        throw new BadRequestException("cargo.compliance_verify_idempotency_conflict");
      }

      return createCargoComplianceEvidenceVerifyOutput({
        organizationId: input.organizationId,
        evidence: replayedEvidence,
        replayed: true,
      });
    }

    const evidence = await this.cargoRepo.findComplianceEvidenceById(
      input.organizationId,
      input.evidenceId,
    );

    if (evidence === null) {
      throw new NotFoundException("cargo.compliance_evidence_not_found");
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, evidence.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    const evidenceWithCargo: CargoComplianceEvidenceWithCargo = {
      ...evidence,
      cargo,
    };

    const businessRules = resolveCargoComplianceEvidenceVerifyBusinessRules(
      evidenceWithCargo,
      input,
    );

    if (!businessRules.verificationAllowed) {
      throw new BadRequestException("cargo.compliance_evidence_verify_blocked");
    }

    const reviewedAt = input.reviewedAt === undefined ? new Date() : new Date(input.reviewedAt);
    const previousAuditState = createCargoComplianceEvidenceVerifyAuditBefore(evidenceWithCargo);
    const verifiedEvidence = await this.database.$transaction(async (tx: PrismaTx) => {
      await this.cargoRepo.updateComplianceEvidence(tx, evidence.id, {
        status: input.status,
        reviewerName: input.reviewerName.trim(),
        reviewReference: input.reviewReference.trim(),
        reviewSummary: input.reviewSummary.trim(),
        reviewedAt,
        verifyIdempotencyKey: input.idempotencyKey,
        reviewedByActorId: input.actorId,
        ...(input.rejectionReason === undefined
          ? { rejectionReason: null }
          : { rejectionReason: input.rejectionReason.trim() }),
      });

      const updatedEvidence = await this.cargoRepo.findComplianceEvidenceByVerifyIdempotencyKey(
        input.organizationId,
        input.idempotencyKey,
      );

      if (updatedEvidence === null) {
        throw new BadRequestException("cargo.compliance_evidence_verify_update_failed");
      }

      const auditAfter = createCargoComplianceEvidenceVerifyAuditAfter({
        evidence: updatedEvidence,
        businessRules,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.compliance_evidence.verified",
          subjectType: "cargo_compliance_evidence",
          subjectId: updatedEvidence.id,
          severity: input.status === "rejected" ? "high" : "medium",
          before: previousAuditState,
          after: auditAfter,
          correlationId: input.correlationId,
          ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
          ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
        },
      });

      await this.eventBus.publish(tx, {
        organizationId: input.organizationId,
        eventType: "cargo.compliance_evidence.verified",
        aggregateType: "cargo",
        aggregateId: evidence.cargoId,
        eventVersion: 1,
        payload: {
          cargoId: evidence.cargoId,
          evidenceId: updatedEvidence.id,
          evidenceType: updatedEvidence.evidenceType,
          documentReference: updatedEvidence.documentReference,
          status: updatedEvidence.status,
          reviewReference: updatedEvidence.reviewReference,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return updatedEvidence;
    });

    return createCargoComplianceEvidenceVerifyOutput({
      organizationId: input.organizationId,
      evidence: verifiedEvidence,
      replayed: false,
      businessRules,
    });
  }
}
