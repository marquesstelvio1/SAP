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
import { UsageService } from "../billing/usage.service.js";
import { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";
import {
  createCargoClaimSettlementRecordAuditAfter,
  createCargoClaimSettlementRecordAuditBefore,
  createCargoComplianceEvidenceRecordAuditAfter,
  createCargoComplianceEvidenceVerifyAuditAfter,
  createCargoComplianceEvidenceVerifyAuditBefore,
  createCargoDeliveryCompleteAuditAfter,
  createCargoDeliveryCompleteAuditBefore,
  createCargoDeliveryExceptionRecordAuditAfter,
  createCargoDeliveryExceptionRecordAuditBefore,
  createCargoDeliveryExceptionResolveAuditAfter,
  createCargoDeliveryExceptionResolveAuditBefore,
  createCargoOperationalHandoffRecordAuditAfter,
  createCargoOperationalHandoffRecordAuditBefore,
  createCargoRegistrationAuditAfter,
  createCargoReleaseAuditAfter,
  createCargoReleaseAuditBefore,
  createCargoTransportArriveAuditAfter,
  createCargoTransportArriveAuditBefore,
  createCargoTransportDepartAuditAfter,
  createCargoTransportDepartAuditBefore,
  createCargoTransportPlanAuditAfter,
  createCargoTransportPlanAuditBefore,
} from "./domain/audit-trail.js";
import {
  normalizeCargoReference,
  normalizeLimit,
  resolveCargoBusinessRules,
  resolveCargoClaimSettlementRecordBusinessRules,
  resolveCargoComplianceEvidenceRecordBusinessRules,
  resolveCargoComplianceEvidenceVerifyBusinessRules,
  resolveCargoDeliveryCompleteBusinessRules,
  resolveCargoDeliveryExceptionRecordBusinessRules,
  resolveCargoDeliveryExceptionResolveBusinessRules,
  resolveCargoOperationalHandoffBusinessRules,
  resolveCargoReleaseBusinessRules,
  resolveCargoTransportArriveBusinessRules,
  resolveCargoTransportDepartBusinessRules,
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
    private readonly usageService: UsageService,
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

    await this.usageService.trackUsage(input.organizationId, "cargo_shipments", 1);

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

      const replayedShipment = await this.cargoRepo.findTrackingShipmentById(
        input.organizationId,
        replayedCargo.trackingShipmentId,
      );

      if (replayedShipment === null) {
        throw new BadRequestException("cargo.transport_plan_tracking_link_missing");
      }

      return createCargoTransportPlanOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        shipment: replayedShipment,
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

    const referenceCode = normalizeCargoReference(input.referenceCode ?? cargo.cargoReference);
    const existingShipment = await this.cargoRepo.findTrackingShipmentByReferenceCode(
      input.organizationId,
      referenceCode,
    );

    if (existingShipment !== null) {
      throw new BadRequestException("cargo.transport_reference_conflict");
    }

    const businessRules = resolveCargoTransportPlanBusinessRules(cargo, input);

    if (!businessRules.planningAllowed) {
      throw new BadRequestException("cargo.transport_plan_blocked");
    }

    const plannedDepartureAt = new Date(input.plannedDepartureAt);
    const estimatedArrivalAt = new Date(input.estimatedArrivalAt);
    const transportPlannedAt = new Date();
    const previousAuditState = createCargoTransportPlanAuditBefore(cargo, businessRules);
    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const shipment = await this.cargoRepo.createTrackingShipment(tx, {
        organizationId: input.organizationId,
        referenceCode,
        externalReference: input.planningReference ?? cargo.externalReference,
        cargoDescription: cargo.cargoDescription,
        originName: cargo.originName,
        destinationName: cargo.destinationName,
        transportMode: input.transportMode,
        status: "planned",
        priority: cargo.priority,
        plannedDepartureAt,
        estimatedArrivalAt,
      });

      await this.cargoRepo.createTrackingEvent(tx, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "created",
        occurredAt: transportPlannedAt,
        locationName: input.firstCheckpointName ?? cargo.originName,
        notes: `Transport plan created from cargo ${cargo.cargoReference}.`,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          planningReference: input.planningReference ?? null,
          operationsOwnerTeam: input.operationsOwnerTeam,
          appliedRules: businessRules.appliedRules,
        },
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: `${input.idempotencyKey}:tracking-created`,
      });

      const plannedCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        trackingShipmentId: shipment.id,
        transportPlanIdempotencyKey: input.idempotencyKey,
        transportOwnerTeam: input.operationsOwnerTeam.trim(),
        transportPlannedAt,
        ...(input.planningReference === undefined
          ? {}
          : { transportPlanningReference: input.planningReference.trim() }),
      });

      const auditAfter = createCargoTransportPlanAuditAfter({
        cargo: plannedCargo,
        shipment,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.transport_planned",
          subjectType: "cargo",
          subjectId: plannedCargo.id,
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
        aggregateId: plannedCargo.id,
        payload: {
          cargoId: plannedCargo.id,
          cargoReference: plannedCargo.cargoReference,
          shipmentId: shipment.id,
          shipmentReferenceCode: shipment.referenceCode,
          transportMode: shipment.transportMode,
          plannedDepartureAt: shipment.plannedDepartureAt?.toISOString() ?? null,
          estimatedArrivalAt: shipment.estimatedArrivalAt?.toISOString() ?? null,
          operationsOwnerTeam: plannedCargo.transportOwnerTeam,
          planningReference: plannedCargo.transportPlanningReference,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: plannedCargo, shipment };
    });

    return createCargoTransportPlanOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      shipment: result.shipment,
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

      const [shipment, event] = await Promise.all([
        this.cargoRepo.findTrackingShipmentById(
          input.organizationId,
          replayedCargo.trackingShipmentId,
        ),
        this.cargoRepo.findTrackingDepartureEventByIdempotencyKey(
          input.organizationId,
          input.idempotencyKey,
        ),
      ]);

      if (shipment === null || event === null) {
        throw new BadRequestException("cargo.transport_departure_replay_incomplete");
      }

      return createCargoTransportDepartOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        shipment,
        event,
        previousShipmentStatus: shipment.status,
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

    const [shipment, complianceCounts] = await Promise.all([
      this.cargoRepo.findTrackingShipmentById(input.organizationId, cargo.trackingShipmentId),
      this.cargoRepo.getComplianceEvidenceStatusCounts(input.organizationId, cargo.id),
    ]);

    if (shipment === null) {
      throw new BadRequestException("cargo.transport_departure_tracking_link_missing");
    }

    const complianceEvidenceCounts = {
      approved: complianceCounts.find((c) => c.status === "approved")?.count ?? 0,
      pendingReview: complianceCounts.find((c) => c.status === "pending_review")?.count ?? 0,
      rejected: complianceCounts.find((c) => c.status === "rejected")?.count ?? 0,
    };

    const businessRules = resolveCargoTransportDepartBusinessRules(
      cargo,
      shipment,
      complianceEvidenceCounts,
      input,
    );

    if (!businessRules.departureAllowed) {
      throw new BadRequestException("cargo.transport_departure_blocked");
    }

    const departedAt = new Date(input.departedAt);
    const previousAuditState = createCargoTransportDepartAuditBefore({
      cargo,
      shipment,
      businessRules,
      complianceEvidenceCounts,
    });
    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      await this.cargoRepo.createTrackingEvent(tx, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "departed",
        occurredAt: departedAt,
        locationName: input.departureLocationName.trim(),
        notes: `Cargo ${cargo.cargoReference} departed from ${input.departureLocationName.trim()}.`,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          departureReference: input.departureReference?.trim() ?? null,
          carrierReference: input.carrierReference?.trim() ?? null,
          operatorName: input.operatorName.trim(),
          approvedComplianceEvidence: complianceEvidenceCounts.approved,
        },
      });

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

      await this.cargoRepo.updateTrackingShipment(tx, shipment.id, {
        status: "in_transit",
      });

      const departedShipment = await this.cargoRepo.findTrackingShipmentById(
        input.organizationId,
        shipment.id,
      );

      if (departedShipment === null) {
        throw new BadRequestException("cargo.transport_departure_tracking_update_failed");
      }

      const event = await this.cargoRepo.findTrackingDepartureEventByIdempotencyKey(
        input.organizationId,
        input.idempotencyKey,
      );

      if (event === null) {
        throw new BadRequestException("cargo.transport_departure_event_not_found");
      }

      const auditAfter = createCargoTransportDepartAuditAfter({
        cargo: departedCargo,
        shipment: departedShipment,
        event,
        businessRules,
        complianceEvidenceCounts,
        sourceSystem: input.sourceSystem,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.transport_departed",
          subjectType: "cargo",
          subjectId: cargo.id,
          severity: cargo.hazardous || shipment.transportMode === "multimodal" ? "high" : "medium",
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
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          shipmentId: shipment.id,
          shipmentReferenceCode: shipment.referenceCode,
          eventId: event.id,
          departedAt: departedAt.toISOString(),
          departureLocationName: departedCargo.departureLocationName,
          operatorName: departedCargo.departureOperatorName,
          previousShipmentStatus: shipment.status,
          currentShipmentStatus: departedShipment.status,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: departedCargo, shipment: departedShipment, event };
    });

    return createCargoTransportDepartOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      shipment: result.shipment,
      event: result.event,
      previousShipmentStatus: shipment.status,
      replayed: false,
      businessRules,
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

      const [shipment, event] = await Promise.all([
        this.cargoRepo.findTrackingShipmentById(
          input.organizationId,
          replayedCargo.trackingShipmentId,
        ),
        this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
          input.organizationId,
          input.idempotencyKey,
          "arrived",
        ),
      ]);

      if (shipment === null || event === null) {
        throw new BadRequestException("cargo.transport_arrival_replay_incomplete");
      }

      return createCargoTransportArriveOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        shipment,
        event,
        previousShipmentStatus: shipment.status,
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

    const shipment = await this.cargoRepo.findTrackingShipmentById(
      input.organizationId,
      cargo.trackingShipmentId,
    );

    if (shipment === null) {
      throw new BadRequestException("cargo.transport_arrival_tracking_link_missing");
    }

    const businessRules = resolveCargoTransportArriveBusinessRules(cargo, shipment, input);

    if (!businessRules.arrivalAllowed) {
      throw new BadRequestException("cargo.transport_arrival_blocked");
    }

    const arrivedAt = new Date(input.arrivedAt);
    const previousAuditState = createCargoTransportArriveAuditBefore({
      cargo,
      shipment,
      businessRules,
    });
    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      await this.cargoRepo.createTrackingEvent(tx, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "arrived",
        occurredAt: arrivedAt,
        locationName: input.arrivalLocationName.trim(),
        notes: `Cargo ${cargo.cargoReference} arrived at ${input.arrivalLocationName.trim()}.`,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          arrivalReference: input.arrivalReference?.trim() ?? null,
          operatorName: input.operatorName.trim(),
          destinationName: cargo.destinationName,
          departedAt: cargo.departedAt?.toISOString() ?? null,
        },
      });

      const arrivedCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        arrivalIdempotencyKey: input.idempotencyKey,
        arrivalLocationName: input.arrivalLocationName.trim(),
        arrivalOperatorName: input.operatorName.trim(),
        arrivedAt,
        ...(input.arrivalReference === undefined
          ? {}
          : { arrivalReference: input.arrivalReference.trim() }),
      });

      await this.cargoRepo.updateTrackingShipment(tx, shipment.id, {
        status: "arrived",
        actualArrivalAt: arrivedAt,
      });

      const arrivedShipment = await this.cargoRepo.findTrackingShipmentById(
        input.organizationId,
        shipment.id,
      );

      if (arrivedShipment === null) {
        throw new BadRequestException("cargo.transport_arrival_tracking_update_failed");
      }

      const event = await this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
        input.organizationId,
        input.idempotencyKey,
        "arrived",
      );

      if (event === null) {
        throw new BadRequestException("cargo.transport_arrival_event_not_found");
      }

      const auditAfter = createCargoTransportArriveAuditAfter({
        cargo: arrivedCargo,
        shipment: arrivedShipment,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.transport_arrived",
          subjectType: "cargo",
          subjectId: cargo.id,
          severity: cargo.hazardous || shipment.transportMode === "multimodal" ? "high" : "medium",
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
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          shipmentId: shipment.id,
          shipmentReferenceCode: shipment.referenceCode,
          eventId: event.id,
          arrivedAt: arrivedAt.toISOString(),
          arrivalLocationName: arrivedCargo.arrivalLocationName,
          operatorName: arrivedCargo.arrivalOperatorName,
          previousShipmentStatus: shipment.status,
          currentShipmentStatus: arrivedShipment.status,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: arrivedCargo, shipment: arrivedShipment, event };
    });

    return createCargoTransportArriveOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      shipment: result.shipment,
      event: result.event,
      previousShipmentStatus: shipment.status,
      replayed: false,
      businessRules,
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

      const [cargo, shipment, event] = await Promise.all([
        this.cargoRepo.findById(input.organizationId, replayedHandoff.cargoId),
        this.cargoRepo.findTrackingShipmentById(
          input.organizationId,
          replayedHandoff.trackingShipmentId,
        ),
        this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
          input.organizationId,
          input.idempotencyKey,
          "location_updated",
        ),
      ]);

      if (cargo === null || shipment === null || event === null) {
        throw new BadRequestException("cargo.handoff_record_replay_incomplete");
      }

      return createCargoOperationalHandoffRecordOutput({
        organizationId: input.organizationId,
        cargo,
        handoff: replayedHandoff,
        shipment,
        event,
        previousShipmentStatus: shipment.status,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    const [shipment, duplicateReference] = await Promise.all([
      this.cargoRepo.findTrackingShipmentById(input.organizationId, cargo.trackingShipmentId),
      this.cargoRepo.findOperationalHandoffByRecordIdempotencyKey(
        input.organizationId,
        input.handoffReference.trim(),
      ),
    ]);

    if (shipment === null) {
      throw new BadRequestException("cargo.handoff_tracking_link_missing");
    }

    const businessRules = resolveCargoOperationalHandoffBusinessRules(
      cargo,
      shipment,
      duplicateReference,
      input,
    );

    if (!businessRules.handoffAllowed) {
      throw new BadRequestException("cargo.handoff_record_blocked");
    }

    const handoffAt = new Date(input.handoffAt);
    const previousAuditState = createCargoOperationalHandoffRecordAuditBefore({
      cargo,
      shipment,
      duplicateReference,
      businessRules,
    });
    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const handoff = await this.cargoRepo.createOperationalHandoff(tx, {
        organizationId: input.organizationId,
        cargoId: cargo.id,
        trackingShipmentId: shipment.id,
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

      await this.cargoRepo.createTrackingEvent(tx, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "location_updated",
        occurredAt: handoffAt,
        locationName: input.handoffLocationName.trim(),
        notes: `Cargo ${cargo.cargoReference} operational handoff ${input.handoffType} recorded.`,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
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
          appliedRules: businessRules.appliedRules,
        },
      });

      const handedOffCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        custodyOwnerName: input.toCustodyOwnerName.trim(),
        conditionStatus: input.conditionStatus,
      });

      const event = await this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
        input.organizationId,
        input.idempotencyKey,
        "location_updated",
      );

      if (event === null) {
        throw new BadRequestException("cargo.handoff_record_event_not_found");
      }

      const auditAfter = createCargoOperationalHandoffRecordAuditAfter({
        cargo: handedOffCargo,
        shipment,
        handoff,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "cargo.operational_handoff.recorded",
          subjectType: "cargo_operational_handoff",
          subjectId: handoff.id,
          severity: shipment.transportMode === "multimodal" ? "high" : "medium",
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
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          shipmentId: shipment.id,
          shipmentReferenceCode: shipment.referenceCode,
          eventId: event.id,
          handoffId: handoff.id,
          handoffType: handoff.handoffType,
          handoffReference: handoff.handoffReference,
          fromCustodyOwnerName: handoff.fromCustodyOwnerName,
          toCustodyOwnerName: handoff.toCustodyOwnerName,
          previousShipmentStatus: shipment.status,
          currentShipmentStatus: shipment.status,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: handedOffCargo, handoff, event };
    });

    return createCargoOperationalHandoffRecordOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      handoff: result.handoff,
      shipment,
      event: result.event,
      previousShipmentStatus: shipment.status,
      replayed: false,
      businessRules,
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

      const [shipment, event] = await Promise.all([
        this.cargoRepo.findTrackingShipmentById(
          input.organizationId,
          replayedCargo.trackingShipmentId,
        ),
        this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
          input.organizationId,
          input.idempotencyKey,
          "handover_completed",
        ),
      ]);

      if (shipment === null || event === null) {
        throw new BadRequestException("cargo.delivery_replay_incomplete");
      }

      return createCargoDeliveryCompleteOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        shipment,
        event,
        previousShipmentStatus: shipment.status,
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

    const shipment = await this.cargoRepo.findTrackingShipmentById(
      input.organizationId,
      cargo.trackingShipmentId,
    );

    if (shipment === null) {
      throw new BadRequestException("cargo.delivery_tracking_link_missing");
    }

    const businessRules = resolveCargoDeliveryCompleteBusinessRules(cargo, shipment, input);

    if (!businessRules.deliveryAllowed) {
      throw new BadRequestException("cargo.delivery_blocked");
    }

    const deliveredAt = new Date(input.deliveredAt);
    const deliveryLocationName = cargo.arrivalLocationName ?? cargo.destinationName;
    const previousAuditState = createCargoDeliveryCompleteAuditBefore({
      cargo,
      shipment,
      businessRules,
    });
    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      await this.cargoRepo.createTrackingEvent(tx, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "handover_completed",
        occurredAt: deliveredAt,
        locationName: deliveryLocationName,
        notes: `Cargo ${cargo.cargoReference} delivered to ${input.receivedByName.trim()}.`,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          deliveryReference: input.deliveryReference.trim(),
          receivedByName: input.receivedByName.trim(),
          deliveryConditionStatus: input.deliveryConditionStatus,
          deliveryNotes: input.deliveryNotes?.trim() ?? null,
          arrivedAt: cargo.arrivedAt?.toISOString() ?? null,
        },
      });

      const deliveredCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        status: "delivered",
        conditionStatus: input.deliveryConditionStatus,
        deliveryIdempotencyKey: input.idempotencyKey,
        deliveryReference: input.deliveryReference.trim(),
        receivedByName: input.receivedByName.trim(),
        deliveryNotes: input.deliveryNotes?.trim() ?? null,
        deliveredAt,
      });

      await this.cargoRepo.updateTrackingShipment(tx, shipment.id, {
        status: "completed",
      });

      const completedShipment = await this.cargoRepo.findTrackingShipmentById(
        input.organizationId,
        shipment.id,
      );

      if (completedShipment === null) {
        throw new BadRequestException("cargo.delivery_tracking_update_failed");
      }

      const event = await this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
        input.organizationId,
        input.idempotencyKey,
        "handover_completed",
      );

      if (event === null) {
        throw new BadRequestException("cargo.delivery_event_not_found");
      }

      const auditAfter = createCargoDeliveryCompleteAuditAfter({
        cargo: deliveredCargo,
        shipment: completedShipment,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

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
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          shipmentId: shipment.id,
          shipmentReferenceCode: shipment.referenceCode,
          eventId: event.id,
          deliveredAt: deliveredAt.toISOString(),
          deliveryReference: deliveredCargo.deliveryReference,
          receivedByName: deliveredCargo.receivedByName,
          previousShipmentStatus: shipment.status,
          currentShipmentStatus: completedShipment.status,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: deliveredCargo, shipment: completedShipment, event };
    });

    return createCargoDeliveryCompleteOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      shipment: result.shipment,
      event: result.event,
      previousShipmentStatus: shipment.status,
      replayed: false,
      businessRules,
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

      const [cargo, shipment, event] = await Promise.all([
        this.cargoRepo.findById(input.organizationId, replayedException.cargoId),
        this.cargoRepo.findTrackingShipmentById(
          input.organizationId,
          replayedException.trackingShipmentId,
        ),
        this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
          input.organizationId,
          input.idempotencyKey,
          "exception",
        ),
      ]);

      if (cargo === null || shipment === null || event === null) {
        throw new BadRequestException("cargo.delivery_exception_record_replay_incomplete");
      }

      return createCargoDeliveryExceptionRecordOutput({
        organizationId: input.organizationId,
        cargo,
        exception: replayedException,
        shipment,
        event,
        previousShipmentStatus: shipment.status,
        replayed: true,
      });
    }

    const cargo = await this.cargoRepo.findById(input.organizationId, input.cargoId);

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    const [shipment, openException] = await Promise.all([
      this.cargoRepo.findTrackingShipmentById(input.organizationId, cargo.trackingShipmentId),
      this.cargoRepo.findOpenDeliveryExceptionForCargo(input.organizationId, cargo.id),
    ]);

    if (shipment === null) {
      throw new BadRequestException("cargo.delivery_exception_tracking_link_missing");
    }

    const businessRules = resolveCargoDeliveryExceptionRecordBusinessRules(
      cargo,
      shipment,
      openException,
      input,
    );

    if (!businessRules.exceptionAccepted) {
      throw new BadRequestException("cargo.delivery_exception_record_blocked");
    }

    const occurredAt = new Date(input.occurredAt);
    const eventLocationName = cargo.arrivalLocationName ?? cargo.destinationName;
    const previousAuditState = createCargoDeliveryExceptionRecordAuditBefore({
      cargo,
      shipment,
      openException,
      businessRules,
    });
    const result = await this.database.$transaction(async (tx: PrismaTx) => {
      const exception = await this.cargoRepo.createDeliveryException(tx, {
        organizationId: input.organizationId,
        cargoId: cargo.id,
        trackingShipmentId: shipment.id,
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

      await this.cargoRepo.createTrackingEvent(tx, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "exception",
        occurredAt,
        locationName: eventLocationName,
        notes: `Cargo ${cargo.cargoReference} delivery exception recorded: ${input.exceptionType}.`,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          exceptionId: exception.id,
          exceptionType: exception.exceptionType,
          deliveryConditionStatus: exception.deliveryConditionStatus,
          evidenceReference: exception.evidenceReference,
          claimReference: exception.claimReference,
          reportedByName: exception.reportedByName,
          appliedRules: businessRules.appliedRules,
        },
      });

      const heldCargo = await this.cargoRepo.updateCargo(tx, cargo.id, {
        status: "held",
        conditionStatus: input.deliveryConditionStatus,
        requiresInspection: true,
      });

      await this.cargoRepo.updateTrackingShipment(tx, shipment.id, {
        status: "exception",
      });

      const exceptionShipment = await this.cargoRepo.findTrackingShipmentById(
        input.organizationId,
        shipment.id,
      );

      if (exceptionShipment === null) {
        throw new BadRequestException("cargo.delivery_exception_tracking_update_failed");
      }

      const event = await this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
        input.organizationId,
        input.idempotencyKey,
        "exception",
      );

      if (event === null) {
        throw new BadRequestException("cargo.delivery_exception_event_not_found");
      }

      const auditAfter = createCargoDeliveryExceptionRecordAuditAfter({
        cargo: heldCargo,
        shipment: exceptionShipment,
        exception,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

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
        payload: {
          cargoId: cargo.id,
          cargoReference: cargo.cargoReference,
          exceptionId: exception.id,
          shipmentId: shipment.id,
          shipmentReferenceCode: shipment.referenceCode,
          eventId: event.id,
          exceptionType: exception.exceptionType,
          deliveryConditionStatus: exception.deliveryConditionStatus,
          previousShipmentStatus: shipment.status,
          currentShipmentStatus: exceptionShipment.status,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return { cargo: heldCargo, exception, shipment: exceptionShipment, event };
    });

    return createCargoDeliveryExceptionRecordOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      exception: result.exception,
      shipment: result.shipment,
      event: result.event,
      previousShipmentStatus: shipment.status,
      replayed: false,
      businessRules,
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

      const [cargo, shipment, event] = await Promise.all([
        this.cargoRepo.findById(input.organizationId, replayedException.cargoId),
        this.cargoRepo.findTrackingShipmentById(
          input.organizationId,
          replayedException.trackingShipmentId,
        ),
        this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
          input.organizationId,
          input.idempotencyKey,
          "released",
        ),
      ]);

      if (cargo === null || shipment === null || event === null) {
        throw new BadRequestException("cargo.delivery_exception_resolve_replay_incomplete");
      }

      return createCargoDeliveryExceptionResolveOutput({
        organizationId: input.organizationId,
        cargo,
        exception: replayedException,
        shipment,
        event,
        previousShipmentStatus: shipment.status,
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

    const shipment = await this.cargoRepo.findTrackingShipmentById(
      input.organizationId,
      exception.trackingShipmentId,
    );

    if (shipment === null) {
      throw new BadRequestException("cargo.delivery_exception_tracking_link_missing");
    }

    const businessRules = resolveCargoDeliveryExceptionResolveBusinessRules(
      exception,
      shipment,
      input,
    );

    if (!businessRules.resolutionAllowed) {
      throw new BadRequestException("cargo.delivery_exception_resolve_blocked");
    }

    const resolvedAt = new Date(input.resolvedAt);
    const eventLocationName =
      exception.cargo.arrivalLocationName ?? exception.cargo.destinationName;
    const previousAuditState = createCargoDeliveryExceptionResolveAuditBefore({
      exception,
      shipment,
      businessRules,
    });
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

      await this.cargoRepo.createTrackingEvent(tx, {
        organizationId: input.organizationId,
        shipmentId: shipment.id,
        eventType: "released",
        occurredAt: resolvedAt,
        locationName: eventLocationName,
        notes: `Cargo ${exception.cargo.cargoReference} delivery exception resolved.`,
        sourceSystem: input.sourceSystem,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        payload: {
          cargoId: exception.cargo.id,
          cargoReference: exception.cargo.cargoReference,
          exceptionId: exception.id,
          resolutionCode: input.resolutionCode,
          resolutionReference: input.resolutionReference.trim(),
          finalConditionStatus: input.finalConditionStatus,
          resolverName: input.resolverName.trim(),
          appliedRules: businessRules.appliedRules,
        },
      });

      const restoredCargo = await this.cargoRepo.updateCargo(tx, exception.cargo.id, {
        status: "in_transport",
        conditionStatus: input.finalConditionStatus,
        requiresInspection: false,
      });

      await this.cargoRepo.updateTrackingShipment(tx, shipment.id, {
        status: "arrived",
      });

      const restoredShipment = await this.cargoRepo.findTrackingShipmentById(
        input.organizationId,
        shipment.id,
      );

      if (restoredShipment === null) {
        throw new BadRequestException("cargo.delivery_exception_resolve_tracking_update_failed");
      }

      const resolvedException = await this.cargoRepo.findDeliveryExceptionById(
        input.organizationId,
        exception.id,
      );

      if (resolvedException === null) {
        throw new BadRequestException("cargo.delivery_exception_resolve_not_found");
      }

      const event = await this.cargoRepo.findTrackingLifecycleEventByIdempotencyKey(
        input.organizationId,
        input.idempotencyKey,
        "released",
      );

      if (event === null) {
        throw new BadRequestException("cargo.delivery_exception_resolve_event_not_found");
      }

      const auditAfter = createCargoDeliveryExceptionResolveAuditAfter({
        cargo: restoredCargo,
        shipment: restoredShipment,
        exception: resolvedException,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

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
        payload: {
          cargoId: exception.cargo.id,
          cargoReference: exception.cargo.cargoReference,
          exceptionId: exception.id,
          shipmentId: shipment.id,
          shipmentReferenceCode: shipment.referenceCode,
          eventId: event.id,
          resolutionCode: input.resolutionCode,
          resolutionReference: resolvedException.resolutionReference,
          previousShipmentStatus: shipment.status,
          currentShipmentStatus: restoredShipment.status,
          appliedRules: businessRules.appliedRules,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          sourceSystem: input.sourceSystem,
        },
      });

      return {
        cargo: restoredCargo,
        exception: resolvedException,
        shipment: restoredShipment,
        event,
      };
    });

    return createCargoDeliveryExceptionResolveOutput({
      organizationId: input.organizationId,
      cargo: result.cargo,
      exception: result.exception,
      shipment: result.shipment,
      event: result.event,
      previousShipmentStatus: shipment.status,
      replayed: false,
      businessRules,
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
