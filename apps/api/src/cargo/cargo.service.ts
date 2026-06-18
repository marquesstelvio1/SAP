import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AuditJsonValue,
  type DatabaseActorType,
  getPrismaClient,
  type SaptmPrismaClient,
} from "@saptm/database";
import {
  type CargoClaimSettlementRecordInput,
  type CargoClaimSettlementRecordOutput,
  type CargoComplianceEvidenceRecordInput,
  type CargoComplianceEvidenceRecordOutput,
  type CargoComplianceEvidenceVerifyInput,
  type CargoComplianceEvidenceVerifyOutput,
  type CargoDeliveryCompleteInput,
  type CargoDeliveryCompleteOutput,
  type CargoDeliveryExceptionRecordInput,
  type CargoDeliveryExceptionRecordOutput,
  type CargoDeliveryExceptionResolveInput,
  type CargoDeliveryExceptionResolveOutput,
  type CargoOperationalHandoffRecordInput,
  type CargoOperationalHandoffRecordOutput,
  type CargoOverviewOutput,
  type CargoRegisterInput,
  type CargoRegisterOutput,
  type CargoReleaseInput,
  type CargoReleaseOutput,
  type CargoTransportArriveInput,
  type CargoTransportArriveOutput,
  type CargoTransportDepartInput,
  type CargoTransportDepartOutput,
  type CargoTransportPlanInput,
  type CargoTransportPlanOutput,
  type cargoClaimSettlementStatuses,
  type cargoClaimSettlementTypes,
  type cargoComplianceEvidenceStatuses,
  type cargoComplianceEvidenceTypes,
  type cargoConditionStatuses,
  type cargoCustomsStatuses,
  type cargoDeliveryExceptionResolutionCodes,
  type cargoDeliveryExceptionStatuses,
  type cargoDeliveryExceptionTypes,
  type cargoOperationalHandoffTypes,
  cargoStatuses,
  type cargoTypes,
  type trackingEventTypes,
  type trackingShipmentStatuses,
  type trackingTransportModes,
} from "@saptm/rpc";

export type GetCargoOverviewInput = {
  organizationId: string;
  limit?: number;
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

type CargoStatus = (typeof cargoStatuses)[number];
type CargoType = (typeof cargoTypes)[number];
type CargoCustomsStatus = (typeof cargoCustomsStatuses)[number];
type CargoConditionStatus = (typeof cargoConditionStatuses)[number];
type CargoComplianceEvidenceType = (typeof cargoComplianceEvidenceTypes)[number];
type CargoComplianceEvidenceStatus = (typeof cargoComplianceEvidenceStatuses)[number];
type CargoDeliveryExceptionType = (typeof cargoDeliveryExceptionTypes)[number];
type CargoDeliveryExceptionStatus = (typeof cargoDeliveryExceptionStatuses)[number];
type CargoDeliveryExceptionResolutionCode = (typeof cargoDeliveryExceptionResolutionCodes)[number];
type CargoOperationalHandoffType = (typeof cargoOperationalHandoffTypes)[number];
type CargoClaimSettlementType = (typeof cargoClaimSettlementTypes)[number];
type CargoClaimSettlementStatus = (typeof cargoClaimSettlementStatuses)[number];
type TrackingEventType = (typeof trackingEventTypes)[number];
type TrackingShipmentStatus = (typeof trackingShipmentStatuses)[number];
type TrackingTransportMode = (typeof trackingTransportModes)[number];
type CargoRecord = {
  id: string;
  organizationId: string;
  cargoReference: string;
  externalReference: string | null;
  cargoDescription: string;
  cargoType: CargoType;
  status: CargoStatus;
  customsStatus: CargoCustomsStatus;
  customsReference: string | null;
  conditionStatus: CargoConditionStatus;
  grossWeightKg: unknown;
  packageCount: number;
  volumeM3: unknown | null;
  hazardous: boolean;
  unNumber: string | null;
  hazardClass: string | null;
  requiresInspection: boolean;
  shipperName: string;
  consigneeName: string;
  originName: string;
  destinationName: string;
  custodyOwnerName: string;
  priority: number;
  expectedReadyAt: Date | null;
  sourceSystem: string;
  registrationIdempotencyKey: string | null;
  releaseIdempotencyKey: string | null;
  releaseReference: string | null;
  releaseReason: string | null;
  transportPlanIdempotencyKey: string | null;
  departureIdempotencyKey: string | null;
  arrivalIdempotencyKey: string | null;
  deliveryIdempotencyKey: string | null;
  transportPlanningReference: string | null;
  transportOwnerTeam: string | null;
  departureReference: string | null;
  departureLocationName: string | null;
  departureOperatorName: string | null;
  carrierReference: string | null;
  arrivalReference: string | null;
  arrivalLocationName: string | null;
  arrivalOperatorName: string | null;
  deliveryReference: string | null;
  receivedByName: string | null;
  deliveryNotes: string | null;
  trackingShipmentId: string | null;
  createdAt: Date;
  releasedAt: Date | null;
  transportPlannedAt: Date | null;
  departedAt: Date | null;
  arrivedAt: Date | null;
  deliveredAt: Date | null;
  updatedAt: Date;
};
type TrackingShipmentRecord = {
  id: string;
  organizationId: string;
  referenceCode: string;
  transportMode: TrackingTransportMode;
  status: TrackingShipmentStatus;
  plannedDepartureAt: Date | null;
  estimatedArrivalAt: Date | null;
  actualArrivalAt: Date | null;
};
type TrackingDepartureEventRecord = {
  id: string;
  eventType: TrackingEventType;
  occurredAt: Date;
  locationName: string | null;
};
type TrackingLifecycleEventRecord = TrackingDepartureEventRecord;
type CargoComplianceEvidenceRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  evidenceType: CargoComplianceEvidenceType;
  documentReference: string;
  documentTitle: string;
  documentUri: string | null;
  issuerName: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
  status: CargoComplianceEvidenceStatus;
  reviewerName: string | null;
  reviewReference: string | null;
  reviewSummary: string | null;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  verifyIdempotencyKey: string | null;
  recordedByActorId: string;
  reviewedByActorId: string | null;
  recordedAt: Date;
  updatedAt: Date;
};
type CargoComplianceEvidenceWithCargo = CargoComplianceEvidenceRecord & {
  cargo: CargoRecord;
};
type CargoDeliveryExceptionRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  trackingShipmentId: string | null;
  exceptionType: CargoDeliveryExceptionType;
  deliveryConditionStatus: CargoConditionStatus;
  status: CargoDeliveryExceptionStatus;
  reportedByName: string;
  exceptionSummary: string;
  evidenceReference: string;
  claimReference: string | null;
  occurredAt: Date;
  resolverName: string | null;
  resolutionCode: CargoDeliveryExceptionResolutionCode | null;
  resolutionReference: string | null;
  resolutionSummary: string | null;
  resolvedAt: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  resolveIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};
type CargoDeliveryExceptionWithCargo = CargoDeliveryExceptionRecord & {
  cargo: CargoRecord;
};
type CargoOperationalHandoffRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  trackingShipmentId: string | null;
  handoffType: CargoOperationalHandoffType;
  fromCustodyOwnerName: string;
  toCustodyOwnerName: string;
  handoffLocationName: string;
  operatorName: string;
  handoffReference: string;
  sealReference: string | null;
  conditionStatus: CargoConditionStatus;
  handoffNotes: string | null;
  handoffAt: Date;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};
type CargoClaimSettlementRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  deliveryExceptionId: string;
  claimReference: string;
  settlementReference: string;
  settlementType: CargoClaimSettlementType;
  settlementStatus: CargoClaimSettlementStatus;
  currencyCode: string;
  settlementAmount: unknown;
  settledByName: string;
  counterpartyName: string;
  settlementSummary: string;
  settledAt: Date;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};
type CargoComplianceEvidenceStatusCounts = {
  approved: number;
  pendingReview: number;
  rejected: number;
};
type CargoStatusGroup = {
  status: CargoStatus;
  _count: {
    _all: number;
  };
};

@Injectable()
export class CargoService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async getOverview(input: GetCargoOverviewInput): Promise<CargoOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const [statusGroups, hazardousCargo, inspectionRequiredCargo, recentCargo] = await Promise.all([
      this.database.cargo.groupBy({
        by: ["status"],
        where: {
          organizationId: input.organizationId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.cargo.count({
        where: {
          organizationId: input.organizationId,
          hazardous: true,
        },
      }),
      this.database.cargo.count({
        where: {
          organizationId: input.organizationId,
          requiresInspection: true,
        },
      }),
      this.database.cargo.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
    ]);
    const statusCounts = createCargoStatusCounts(statusGroups);

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        cargo: sumCargoStatusCounts(statusCounts),
        activeCargo: sumActiveCargo(statusCounts),
        heldCargo: readCargoStatusCount(statusCounts, "held"),
        hazardousCargo,
        inspectionRequiredCargo,
      },
      statusCounts,
      recentCargo: recentCargo.map(createCargoSummary),
    };
  }

  async registerCargo(input: RegisterCargoInput): Promise<CargoRegisterOutput> {
    const cargoReference = normalizeCargoReference(input.cargoReference);
    const replayedCargo = await this.findCargoByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      return createCargoRegisterOutput({
        organizationId: input.organizationId,
        cargo: replayedCargo,
        replayed: true,
      });
    }

    const existingCargo = await this.database.cargo.findFirst({
      where: {
        organizationId: input.organizationId,
        cargoReference,
      },
      select: {
        id: true,
      },
    });

    if (existingCargo !== null) {
      throw new BadRequestException("cargo.reference_conflict");
    }

    const businessRules = resolveCargoBusinessRules(input);
    const expectedReadyAt =
      input.expectedReadyAt === undefined ? null : new Date(input.expectedReadyAt);

    const cargo = await this.database.$transaction(async (transaction) => {
      const createdCargo = await transaction.cargo.create({
        data: {
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
        },
      });
      const auditAfter = createCargoRegistrationAuditAfter({
        cargo: createdCargo,
        businessRules,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return createdCargo;
    });

    return createCargoRegisterOutput({
      organizationId: input.organizationId,
      cargo,
      replayed: false,
    });
  }

  async releaseCargo(input: ReleaseCargoInput): Promise<CargoReleaseOutput> {
    const replayedCargo = await this.findCargoByReleaseIdempotencyKey(
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

    const existingCargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

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
    const cargo = await this.database.$transaction(async (transaction) => {
      const releasedCargo = await transaction.cargo.update({
        where: {
          id: existingCargo.id,
        },
        data: {
          status: "ready_for_transport",
          customsStatus: input.customsStatus,
          conditionStatus: existingCargo.requiresInspection
            ? "sound"
            : existingCargo.conditionStatus,
          requiresInspection: false,
          releaseIdempotencyKey: input.idempotencyKey,
          releaseReason: input.releaseReason.trim(),
          releasedAt,
          ...(input.releaseReference === undefined
            ? {}
            : { releaseReference: input.releaseReference.trim() }),
        },
      });
      const auditAfter = createCargoReleaseAuditAfter({
        cargo: releasedCargo,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
    const replayedCargo = await this.findCargoByTransportPlanIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.transport_plan_idempotency_conflict");
      }

      const replayedShipment = await this.findTrackingShipmentById(
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

    const cargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.transportPlanIdempotencyKey !== null || cargo.trackingShipmentId !== null) {
      throw new BadRequestException("cargo.transport_already_planned");
    }

    const referenceCode = normalizeCargoReference(input.referenceCode ?? cargo.cargoReference);
    const existingShipment = await this.database.trackingShipment.findFirst({
      where: {
        organizationId: input.organizationId,
        referenceCode,
      },
      select: {
        id: true,
      },
    });

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
    const result = await this.database.$transaction(async (transaction) => {
      const shipment = await transaction.trackingShipment.create({
        data: {
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
        },
      });

      await transaction.trackingEvent.create({
        data: {
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
        },
      });

      const plannedCargo = await transaction.cargo.update({
        where: {
          id: cargo.id,
        },
        data: {
          trackingShipmentId: shipment.id,
          transportPlanIdempotencyKey: input.idempotencyKey,
          transportOwnerTeam: input.operationsOwnerTeam.trim(),
          transportPlannedAt,
          ...(input.planningReference === undefined
            ? {}
            : { transportPlanningReference: input.planningReference.trim() }),
        },
      });
      const auditAfter = createCargoTransportPlanAuditAfter({
        cargo: plannedCargo,
        shipment,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        cargo: plannedCargo,
        shipment,
      };
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
    const replayedCargo = await this.findCargoByDepartureIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.transport_departure_idempotency_conflict");
      }

      const [shipment, event] = await Promise.all([
        this.findTrackingShipmentById(input.organizationId, replayedCargo.trackingShipmentId),
        this.findTrackingDepartureEventByIdempotencyKey(input.organizationId, input.idempotencyKey),
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

    const cargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.departureIdempotencyKey !== null || cargo.departedAt !== null) {
      throw new BadRequestException("cargo.transport_already_departed");
    }

    const [shipment, complianceEvidenceCounts] = await Promise.all([
      this.findTrackingShipmentById(input.organizationId, cargo.trackingShipmentId),
      this.getComplianceEvidenceStatusCounts(input.organizationId, cargo.id),
    ]);

    if (shipment === null) {
      throw new BadRequestException("cargo.transport_departure_tracking_link_missing");
    }

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
    const result = await this.database.$transaction(async (transaction) => {
      const event = await transaction.trackingEvent.create({
        data: {
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
        },
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          locationName: true,
        },
      });
      const departedCargo = await transaction.cargo.update({
        where: {
          id: cargo.id,
        },
        data: {
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
        },
      });
      const departedShipment = await transaction.trackingShipment.update({
        where: {
          id: shipment.id,
        },
        data: {
          status: "in_transit",
        },
      });
      const auditAfter = createCargoTransportDepartAuditAfter({
        cargo: departedCargo,
        shipment: departedShipment,
        event,
        businessRules,
        complianceEvidenceCounts,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        cargo: departedCargo,
        shipment: departedShipment,
        event,
      };
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
    const replayedCargo = await this.findCargoByArrivalIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.transport_arrival_idempotency_conflict");
      }

      const [shipment, event] = await Promise.all([
        this.findTrackingShipmentById(input.organizationId, replayedCargo.trackingShipmentId),
        this.findTrackingLifecycleEventByIdempotencyKey(
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

    const cargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.arrivalIdempotencyKey !== null || cargo.arrivedAt !== null) {
      throw new BadRequestException("cargo.transport_already_arrived");
    }

    const shipment = await this.findTrackingShipmentById(
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
    const result = await this.database.$transaction(async (transaction) => {
      const event = await transaction.trackingEvent.create({
        data: {
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
        },
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          locationName: true,
        },
      });
      const arrivedCargo = await transaction.cargo.update({
        where: {
          id: cargo.id,
        },
        data: {
          arrivalIdempotencyKey: input.idempotencyKey,
          arrivalLocationName: input.arrivalLocationName.trim(),
          arrivalOperatorName: input.operatorName.trim(),
          arrivedAt,
          ...(input.arrivalReference === undefined
            ? {}
            : { arrivalReference: input.arrivalReference.trim() }),
        },
      });
      const arrivedShipment = await transaction.trackingShipment.update({
        where: {
          id: shipment.id,
        },
        data: {
          status: "arrived",
          actualArrivalAt: arrivedAt,
        },
      });
      const auditAfter = createCargoTransportArriveAuditAfter({
        cargo: arrivedCargo,
        shipment: arrivedShipment,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        cargo: arrivedCargo,
        shipment: arrivedShipment,
        event,
      };
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
    const replayedHandoff = await this.findOperationalHandoffByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedHandoff !== null) {
      if (replayedHandoff.cargoId !== input.cargoId) {
        throw new BadRequestException("cargo.handoff_record_idempotency_conflict");
      }

      const [cargo, shipment, event] = await Promise.all([
        this.findCargoById(input.organizationId, replayedHandoff.cargoId),
        this.findTrackingShipmentById(input.organizationId, replayedHandoff.trackingShipmentId),
        this.findTrackingLifecycleEventByIdempotencyKey(
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

    const cargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    const [shipment, duplicateReference] = await Promise.all([
      this.findTrackingShipmentById(input.organizationId, cargo.trackingShipmentId),
      this.database.cargoOperationalHandoff.findFirst({
        where: {
          organizationId: input.organizationId,
          handoffReference: input.handoffReference.trim(),
        },
      }),
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
    const result = await this.database.$transaction(async (transaction) => {
      const handoff = await transaction.cargoOperationalHandoff.create({
        data: {
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
          ...(input.sealReference === undefined
            ? {}
            : { sealReference: input.sealReference.trim() }),
          ...(input.handoffNotes === undefined ? {} : { handoffNotes: input.handoffNotes.trim() }),
        },
      });
      const event = await transaction.trackingEvent.create({
        data: {
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
        },
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          locationName: true,
        },
      });
      const handedOffCargo = await transaction.cargo.update({
        where: {
          id: cargo.id,
        },
        data: {
          custodyOwnerName: input.toCustodyOwnerName.trim(),
          conditionStatus: input.conditionStatus,
        },
      });
      const auditAfter = createCargoOperationalHandoffRecordAuditAfter({
        cargo: handedOffCargo,
        shipment,
        handoff,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        cargo: handedOffCargo,
        handoff,
        event,
      };
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
    const replayedCargo = await this.findCargoByDeliveryIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedCargo !== null) {
      if (replayedCargo.id !== input.cargoId) {
        throw new BadRequestException("cargo.delivery_idempotency_conflict");
      }

      const [shipment, event] = await Promise.all([
        this.findTrackingShipmentById(input.organizationId, replayedCargo.trackingShipmentId),
        this.findTrackingLifecycleEventByIdempotencyKey(
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

    const cargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    if (cargo.deliveryIdempotencyKey !== null || cargo.deliveredAt !== null) {
      throw new BadRequestException("cargo.delivery_already_completed");
    }

    const shipment = await this.findTrackingShipmentById(
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
    const result = await this.database.$transaction(async (transaction) => {
      const event = await transaction.trackingEvent.create({
        data: {
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
        },
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          locationName: true,
        },
      });
      const deliveredCargo = await transaction.cargo.update({
        where: {
          id: cargo.id,
        },
        data: {
          status: "delivered",
          conditionStatus: input.deliveryConditionStatus,
          deliveryIdempotencyKey: input.idempotencyKey,
          deliveryReference: input.deliveryReference.trim(),
          receivedByName: input.receivedByName.trim(),
          deliveryNotes: input.deliveryNotes?.trim() ?? null,
          deliveredAt,
        },
      });
      const completedShipment = await transaction.trackingShipment.update({
        where: {
          id: shipment.id,
        },
        data: {
          status: "completed",
        },
      });
      const auditAfter = createCargoDeliveryCompleteAuditAfter({
        cargo: deliveredCargo,
        shipment: completedShipment,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        cargo: deliveredCargo,
        shipment: completedShipment,
        event,
      };
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
    const replayedException = await this.findDeliveryExceptionByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedException !== null) {
      if (replayedException.cargoId !== input.cargoId) {
        throw new BadRequestException("cargo.delivery_exception_record_idempotency_conflict");
      }

      const [cargo, shipment, event] = await Promise.all([
        this.findCargoById(input.organizationId, replayedException.cargoId),
        this.findTrackingShipmentById(input.organizationId, replayedException.trackingShipmentId),
        this.findTrackingLifecycleEventByIdempotencyKey(
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

    const cargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    const [shipment, openException] = await Promise.all([
      this.findTrackingShipmentById(input.organizationId, cargo.trackingShipmentId),
      this.findOpenDeliveryExceptionForCargo(input.organizationId, cargo.id),
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
    const result = await this.database.$transaction(async (transaction) => {
      const exception = await transaction.cargoDeliveryException.create({
        data: {
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
        },
      });
      const event = await transaction.trackingEvent.create({
        data: {
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
        },
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          locationName: true,
        },
      });
      const heldCargo = await transaction.cargo.update({
        where: {
          id: cargo.id,
        },
        data: {
          status: "held",
          conditionStatus: input.deliveryConditionStatus,
          requiresInspection: true,
        },
      });
      const exceptionShipment = await transaction.trackingShipment.update({
        where: {
          id: shipment.id,
        },
        data: {
          status: "exception",
        },
      });
      const auditAfter = createCargoDeliveryExceptionRecordAuditAfter({
        cargo: heldCargo,
        shipment: exceptionShipment,
        exception,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
        },
      });

      return {
        cargo: heldCargo,
        exception,
        shipment: exceptionShipment,
        event,
      };
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
    const replayedException = await this.findDeliveryExceptionByResolveIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedException !== null) {
      if (replayedException.id !== input.exceptionId) {
        throw new BadRequestException("cargo.delivery_exception_resolve_idempotency_conflict");
      }

      const [cargo, shipment, event] = await Promise.all([
        this.findCargoById(input.organizationId, replayedException.cargoId),
        this.findTrackingShipmentById(input.organizationId, replayedException.trackingShipmentId),
        this.findTrackingLifecycleEventByIdempotencyKey(
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

    const exception = await this.findDeliveryExceptionById(input.organizationId, input.exceptionId);

    if (exception === null) {
      throw new NotFoundException("cargo.delivery_exception_not_found");
    }

    if (exception.status === "resolved") {
      throw new BadRequestException("cargo.delivery_exception_already_resolved");
    }

    const shipment = await this.findTrackingShipmentById(
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
    const result = await this.database.$transaction(async (transaction) => {
      const resolvedException = await transaction.cargoDeliveryException.update({
        where: {
          id: exception.id,
        },
        data: {
          status: "resolved",
          resolverName: input.resolverName.trim(),
          resolutionCode: input.resolutionCode,
          resolutionReference: input.resolutionReference.trim(),
          resolutionSummary: input.resolutionSummary.trim(),
          resolvedAt,
          resolveIdempotencyKey: input.idempotencyKey,
        },
      });
      const event = await transaction.trackingEvent.create({
        data: {
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
        },
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          locationName: true,
        },
      });
      const restoredCargo = await transaction.cargo.update({
        where: {
          id: exception.cargo.id,
        },
        data: {
          status: "in_transport",
          conditionStatus: input.finalConditionStatus,
          requiresInspection: false,
        },
      });
      const restoredShipment = await transaction.trackingShipment.update({
        where: {
          id: shipment.id,
        },
        data: {
          status: "arrived",
        },
      });
      const auditAfter = createCargoDeliveryExceptionResolveAuditAfter({
        cargo: restoredCargo,
        shipment: restoredShipment,
        exception: resolvedException,
        event,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
    const replayedSettlement = await this.findClaimSettlementByRecordIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );

    if (replayedSettlement !== null) {
      if (replayedSettlement.deliveryExceptionId !== input.exceptionId) {
        throw new BadRequestException("cargo.claim_settlement_record_idempotency_conflict");
      }

      const exception = await this.findDeliveryExceptionById(
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

    const exception = await this.findDeliveryExceptionById(input.organizationId, input.exceptionId);

    if (exception === null) {
      throw new NotFoundException("cargo.delivery_exception_not_found");
    }

    const [duplicateSettlement, duplicateReference] = await Promise.all([
      this.findClaimSettlementByExceptionId(input.organizationId, exception.id),
      this.findClaimSettlementBySettlementReference(
        input.organizationId,
        input.settlementReference.trim(),
      ),
    ]);
    const businessRules = resolveCargoClaimSettlementRecordBusinessRules(
      exception,
      duplicateSettlement,
      duplicateReference,
      input,
    );

    if (!businessRules.settlementAllowed) {
      throw new BadRequestException("cargo.claim_settlement_record_blocked");
    }

    const settledAt = new Date(input.settledAt);
    const previousAuditState = createCargoClaimSettlementRecordAuditBefore({
      exception,
      duplicateSettlement,
      duplicateReference,
      businessRules,
    });
    const settlement = await this.database.$transaction(async (transaction) => {
      const recordedSettlement = await transaction.cargoClaimSettlement.create({
        data: {
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
        },
      });
      const auditAfter = createCargoClaimSettlementRecordAuditAfter({
        exception,
        settlement: recordedSettlement,
        businessRules,
        sourceSystem: input.sourceSystem,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
    const replayedEvidence = await this.findComplianceEvidenceByRecordIdempotencyKey(
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

    const cargo = await this.database.cargo.findFirst({
      where: {
        id: input.cargoId,
        organizationId: input.organizationId,
      },
    });

    if (cargo === null) {
      throw new NotFoundException("cargo.not_found");
    }

    const documentReference = normalizeCargoReference(input.documentReference);
    const duplicateEvidence = await this.database.cargoComplianceEvidence.findFirst({
      where: {
        organizationId: input.organizationId,
        cargoId: input.cargoId,
        evidenceType: input.evidenceType,
        documentReference,
      },
      select: {
        id: true,
      },
    });

    if (duplicateEvidence !== null) {
      throw new BadRequestException("cargo.compliance_evidence_reference_conflict");
    }

    const businessRules = resolveCargoComplianceEvidenceRecordBusinessRules(cargo, input);

    if (!businessRules.evidenceAccepted) {
      throw new BadRequestException("cargo.compliance_evidence_record_blocked");
    }

    const issuedAt = input.issuedAt === undefined ? null : new Date(input.issuedAt);
    const expiresAt = input.expiresAt === undefined ? null : new Date(input.expiresAt);
    const evidence = await this.database.$transaction(async (transaction) => {
      const createdEvidence = await transaction.cargoComplianceEvidence.create({
        data: {
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
        },
      });
      const auditAfter = createCargoComplianceEvidenceRecordAuditAfter({
        evidence: createdEvidence,
        businessRules,
        cargo,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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
    const replayedEvidence = await this.findComplianceEvidenceByVerifyIdempotencyKey(
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

    const evidence = await this.database.cargoComplianceEvidence.findFirst({
      where: {
        id: input.evidenceId,
        organizationId: input.organizationId,
      },
      include: {
        cargo: true,
      },
    });

    if (evidence === null) {
      throw new NotFoundException("cargo.compliance_evidence_not_found");
    }

    const businessRules = resolveCargoComplianceEvidenceVerifyBusinessRules(evidence, input);

    if (!businessRules.verificationAllowed) {
      throw new BadRequestException("cargo.compliance_evidence_verify_blocked");
    }

    const reviewedAt = input.reviewedAt === undefined ? new Date() : new Date(input.reviewedAt);
    const previousAuditState = createCargoComplianceEvidenceVerifyAuditBefore(evidence);
    const verifiedEvidence = await this.database.$transaction(async (transaction) => {
      const updatedEvidence = await transaction.cargoComplianceEvidence.update({
        where: {
          id: evidence.id,
        },
        data: {
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
        },
      });
      const auditAfter = createCargoComplianceEvidenceVerifyAuditAfter({
        evidence: updatedEvidence,
        businessRules,
      });

      await transaction.auditRecord.create({
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

      await transaction.outboxEvent.create({
        data: {
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

  private async findCargoByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        organizationId,
        registrationIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findCargoById(
    organizationId: string,
    cargoId: string,
  ): Promise<CargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        id: cargoId,
        organizationId,
      },
    });
  }

  private async findCargoByReleaseIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        organizationId,
        releaseIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findCargoByTransportPlanIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        organizationId,
        transportPlanIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findCargoByDepartureIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        organizationId,
        departureIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findCargoByArrivalIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        organizationId,
        arrivalIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findCargoByDeliveryIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        organizationId,
        deliveryIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findTrackingShipmentById(
    organizationId: string,
    shipmentId: string | null,
  ): Promise<TrackingShipmentRecord | null> {
    if (shipmentId === null) {
      return null;
    }

    return this.database.trackingShipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
    });
  }

  private async findTrackingDepartureEventByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TrackingDepartureEventRecord | null> {
    return this.database.trackingEvent.findFirst({
      where: {
        organizationId,
        idempotencyKey,
        eventType: "departed",
      },
      select: {
        id: true,
        eventType: true,
        occurredAt: true,
        locationName: true,
      },
    });
  }

  private async findTrackingLifecycleEventByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
    eventType: TrackingEventType,
  ): Promise<TrackingLifecycleEventRecord | null> {
    return this.database.trackingEvent.findFirst({
      where: {
        organizationId,
        idempotencyKey,
        eventType,
      },
      select: {
        id: true,
        eventType: true,
        occurredAt: true,
        locationName: true,
      },
    });
  }

  private async getComplianceEvidenceStatusCounts(
    organizationId: string,
    cargoId: string,
  ): Promise<CargoComplianceEvidenceStatusCounts> {
    const groups = await this.database.cargoComplianceEvidence.groupBy({
      by: ["status"],
      where: {
        organizationId,
        cargoId,
      },
      _count: {
        _all: true,
      },
    });
    const countByStatus = new Map(
      groups.map((group) => [group.status as CargoComplianceEvidenceStatus, group._count._all]),
    );

    return {
      approved: countByStatus.get("approved") ?? 0,
      pendingReview: countByStatus.get("pending_review") ?? 0,
      rejected: countByStatus.get("rejected") ?? 0,
    };
  }

  private async findOpenDeliveryExceptionForCargo(
    organizationId: string,
    cargoId: string,
  ): Promise<CargoDeliveryExceptionRecord | null> {
    return this.database.cargoDeliveryException.findFirst({
      where: {
        organizationId,
        cargoId,
        status: "open",
      },
    });
  }

  private async findOperationalHandoffByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoOperationalHandoffRecord | null> {
    return this.database.cargoOperationalHandoff.findFirst({
      where: {
        organizationId,
        recordIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findDeliveryExceptionByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoDeliveryExceptionRecord | null> {
    return this.database.cargoDeliveryException.findFirst({
      where: {
        organizationId,
        recordIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findDeliveryExceptionByResolveIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoDeliveryExceptionRecord | null> {
    return this.database.cargoDeliveryException.findFirst({
      where: {
        organizationId,
        resolveIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findDeliveryExceptionById(
    organizationId: string,
    exceptionId: string,
  ): Promise<CargoDeliveryExceptionWithCargo | null> {
    return this.database.cargoDeliveryException.findFirst({
      where: {
        id: exceptionId,
        organizationId,
      },
      include: {
        cargo: true,
      },
    });
  }

  private async findClaimSettlementByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoClaimSettlementRecord | null> {
    return this.database.cargoClaimSettlement.findFirst({
      where: {
        organizationId,
        recordIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findClaimSettlementByExceptionId(
    organizationId: string,
    deliveryExceptionId: string,
  ): Promise<CargoClaimSettlementRecord | null> {
    return this.database.cargoClaimSettlement.findFirst({
      where: {
        organizationId,
        deliveryExceptionId,
      },
    });
  }

  private async findClaimSettlementBySettlementReference(
    organizationId: string,
    settlementReference: string,
  ): Promise<CargoClaimSettlementRecord | null> {
    return this.database.cargoClaimSettlement.findFirst({
      where: {
        organizationId,
        settlementReference,
      },
    });
  }

  private async findComplianceEvidenceByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoComplianceEvidenceRecord | null> {
    return this.database.cargoComplianceEvidence.findFirst({
      where: {
        organizationId,
        recordIdempotencyKey: idempotencyKey,
      },
    });
  }

  private async findComplianceEvidenceByVerifyIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CargoComplianceEvidenceRecord | null> {
    return this.database.cargoComplianceEvidence.findFirst({
      where: {
        organizationId,
        verifyIdempotencyKey: idempotencyKey,
      },
    });
  }
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 10;
  }

  return Math.min(Math.max(limit, 1), 50);
}

function normalizeCargoReference(reference: string): string {
  return reference.trim().toUpperCase();
}

function normalizeComparisonValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function createCargoStatusCounts(
  statusGroups: readonly CargoStatusGroup[],
): CargoOverviewOutput["statusCounts"] {
  const countByStatus = new Map(
    statusGroups.map((group) => [group.status as CargoStatus, group._count._all]),
  );

  return cargoStatuses.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
  }));
}

function sumCargoStatusCounts(statusCounts: CargoOverviewOutput["statusCounts"]): number {
  return statusCounts.reduce((total, item) => total + item.count, 0);
}

function sumActiveCargo(statusCounts: CargoOverviewOutput["statusCounts"]): number {
  const terminalStatuses = new Set<CargoStatus>(["cancelled", "delivered"]);

  return statusCounts.reduce(
    (total, item) => (terminalStatuses.has(item.status) ? total : total + item.count),
    0,
  );
}

function readCargoStatusCount(
  statusCounts: CargoOverviewOutput["statusCounts"],
  status: CargoStatus,
): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}

function resolveCargoBusinessRules(
  input: CargoRegisterInput,
): CargoRegisterOutput["businessRules"] {
  const customsBlocked = input.customsStatus === "held";
  const inspectionRequired =
    input.requiresInspection ||
    input.hazardous ||
    input.conditionStatus === "damaged" ||
    input.conditionStatus === "requires_inspection";
  const movementBlocked = customsBlocked || inspectionRequired;
  const appliedRules = [
    "tenant_scoped_cargo_identity",
    "unique_cargo_reference",
    "idempotent_registration",
    "positive_weight_and_package_count",
    "custody_origin_destination_required",
  ];

  if (input.hazardous) {
    appliedRules.push("hazardous_cargo_requires_un_number_and_hazard_class");
  }

  if (customsBlocked) {
    appliedRules.push("customs_hold_requires_reference");
  }

  if (input.conditionStatus === "damaged") {
    appliedRules.push("damaged_cargo_requires_inspection");
  }

  if (inspectionRequired) {
    appliedRules.push("inspection_required_before_unrestricted_movement");
  }

  if (movementBlocked) {
    appliedRules.push("movement_blocked_until_governed_release");
  }

  return {
    movementBlocked,
    inspectionRequired,
    customsBlocked,
    appliedRules,
  };
}

function resolveCargoReleaseBusinessRules(
  cargo: CargoRecord,
  input: CargoReleaseInput,
): CargoReleaseOutput["businessRules"] {
  const releasableStatus = cargo.status === "registered" || cargo.status === "held";
  const customsReleaseRequired = cargo.customsStatus !== "not_required";
  const customsReleased =
    input.customsStatus === "cleared" ||
    (!customsReleaseRequired && input.customsStatus === "not_required");
  const inspectionRequiredBeforeRelease =
    cargo.requiresInspection ||
    cargo.conditionStatus === "damaged" ||
    cargo.conditionStatus === "requires_inspection";
  const inspectionPassed = !inspectionRequiredBeforeRelease || input.inspectionOutcome === "passed";
  const hazardousComplianceComplete =
    !cargo.hazardous || (cargo.unNumber !== null && cargo.hazardClass !== null);
  const releaseAllowed =
    releasableStatus && customsReleased && inspectionPassed && hazardousComplianceComplete;
  const appliedRules = [
    "tenant_scoped_cargo_release",
    "idempotent_release",
    "release_requires_registered_or_held_status",
    "release_requires_customs_clearance_when_applicable",
    "release_requires_inspection_pass_when_applicable",
    "hazardous_cargo_release_requires_un_number_and_hazard_class",
    "release_creates_audit_and_outbox",
  ];

  if (!releasableStatus) {
    appliedRules.push("release_blocked_for_non_releasable_status");
  }

  if (customsReleaseRequired) {
    appliedRules.push("customs_release_required_before_transport");
  }

  if (!customsReleased) {
    appliedRules.push("release_blocked_until_customs_cleared");
  }

  if (inspectionRequiredBeforeRelease) {
    appliedRules.push("inspection_required_before_release");
  }

  if (!inspectionPassed) {
    appliedRules.push("release_blocked_until_inspection_passed");
  }

  if (!hazardousComplianceComplete) {
    appliedRules.push("release_blocked_until_hazardous_compliance_complete");
  }

  if (releaseAllowed) {
    appliedRules.push("cargo_ready_for_transport_after_governed_release");
  }

  return {
    releaseAllowed,
    movementBlocked: !releaseAllowed,
    customsReleaseRequired,
    inspectionRequiredBeforeRelease,
    appliedRules,
  };
}

function createReleasedCargoBusinessRules(cargo: CargoRecord): CargoReleaseOutput["businessRules"] {
  return {
    releaseAllowed: cargo.status === "ready_for_transport",
    movementBlocked: cargo.status !== "ready_for_transport",
    customsReleaseRequired: false,
    inspectionRequiredBeforeRelease: false,
    appliedRules: [
      "tenant_scoped_cargo_release",
      "idempotent_release_replay",
      "cargo_ready_for_transport_after_governed_release",
    ],
  };
}

function resolveCargoTransportPlanBusinessRules(
  cargo: CargoRecord,
  input: CargoTransportPlanInput,
): CargoTransportPlanOutput["businessRules"] {
  const plannedDepartureAt = new Date(input.plannedDepartureAt);
  const estimatedArrivalAt = new Date(input.estimatedArrivalAt);
  const releasedAt = cargo.releasedAt;
  const cargoReadyForTracking =
    cargo.status === "ready_for_transport" &&
    cargo.releaseIdempotencyKey !== null &&
    releasedAt !== null &&
    !cargo.requiresInspection &&
    (cargo.customsStatus === "cleared" || cargo.customsStatus === "not_required");
  const trackingNotLinked = cargo.trackingShipmentId === null;
  const departureAfterRelease = releasedAt === null || plannedDepartureAt >= releasedAt;
  const arrivalAfterDeparture = estimatedArrivalAt > plannedDepartureAt;
  const planningAllowed =
    cargoReadyForTracking && trackingNotLinked && departureAfterRelease && arrivalAfterDeparture;
  const appliedRules = [
    "tenant_scoped_cargo_tracking_linkage",
    "idempotent_transport_planning",
    "transport_planning_requires_released_cargo",
    "transport_planning_requires_no_open_inspection",
    "transport_planning_requires_customs_clearance",
    "transport_planning_requires_unique_tracking_reference",
    "transport_planning_creates_tracking_shipment",
    "transport_planning_creates_initial_tracking_event",
    "transport_planning_creates_audit_and_outbox",
  ];

  if (!cargoReadyForTracking) {
    appliedRules.push("transport_planning_blocked_until_cargo_ready");
  }

  if (!trackingNotLinked) {
    appliedRules.push("transport_planning_blocked_when_tracking_already_linked");
  }

  if (!departureAfterRelease) {
    appliedRules.push("transport_departure_cannot_precede_cargo_release");
  }

  if (!arrivalAfterDeparture) {
    appliedRules.push("transport_arrival_must_follow_departure");
  }

  if (input.transportMode === "multimodal") {
    appliedRules.push("multimodal_transport_requires_high_severity_audit");
  }

  if (planningAllowed) {
    appliedRules.push("cargo_linked_to_tracking_shipment");
  }

  return {
    planningAllowed,
    cargoReadyForTracking,
    trackingLinked: !trackingNotLinked || planningAllowed,
    appliedRules,
  };
}

function createPlannedCargoBusinessRules(
  cargo: CargoRecord,
): CargoTransportPlanOutput["businessRules"] {
  return {
    planningAllowed: cargo.trackingShipmentId !== null,
    cargoReadyForTracking: cargo.status === "ready_for_transport",
    trackingLinked: cargo.trackingShipmentId !== null,
    appliedRules: [
      "tenant_scoped_cargo_tracking_linkage",
      "idempotent_transport_planning_replay",
      "cargo_linked_to_tracking_shipment",
    ],
  };
}

function resolveCargoTransportDepartBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  complianceEvidenceCounts: CargoComplianceEvidenceStatusCounts,
  input: CargoTransportDepartInput,
): CargoTransportDepartOutput["businessRules"] {
  const departedAt = new Date(input.departedAt);
  const cargoReadyForDeparture =
    cargo.status === "ready_for_transport" &&
    cargo.releaseIdempotencyKey !== null &&
    cargo.releasedAt !== null &&
    cargo.transportPlanIdempotencyKey !== null &&
    cargo.trackingShipmentId !== null &&
    cargo.requiresInspection === false &&
    (cargo.customsStatus === "cleared" || cargo.customsStatus === "not_required");
  const trackingShipmentPlanned = shipment.status === "planned";
  const approvedComplianceEvidencePresent = complianceEvidenceCounts.approved > 0;
  const openComplianceReviewBlocked =
    complianceEvidenceCounts.pendingReview > 0 || complianceEvidenceCounts.rejected > 0;
  const departureAfterRelease = cargo.releasedAt === null || departedAt >= cargo.releasedAt;
  const departureAfterPlanning =
    cargo.transportPlannedAt === null || departedAt >= cargo.transportPlannedAt;
  const departureAllowed =
    cargoReadyForDeparture &&
    trackingShipmentPlanned &&
    approvedComplianceEvidencePresent &&
    !openComplianceReviewBlocked &&
    departureAfterRelease &&
    departureAfterPlanning;
  const appliedRules = [
    "tenant_scoped_cargo_departure",
    "idempotent_cargo_departure",
    "departure_requires_ready_cargo",
    "departure_requires_governed_release",
    "departure_requires_tracking_plan",
    "departure_requires_planned_tracking_shipment",
    "departure_requires_approved_compliance_evidence",
    "departure_blocks_pending_or_rejected_compliance_evidence",
    "departure_creates_tracking_departed_event",
    "departure_updates_cargo_and_tracking_transactionally",
    "departure_creates_audit_and_outbox",
  ];

  if (!cargoReadyForDeparture) {
    appliedRules.push("departure_blocked_until_cargo_ready_for_transport");
  }

  if (!trackingShipmentPlanned) {
    appliedRules.push("departure_blocked_when_tracking_not_planned");
  }

  if (!approvedComplianceEvidencePresent) {
    appliedRules.push("departure_blocked_without_approved_compliance_evidence");
  }

  if (openComplianceReviewBlocked) {
    appliedRules.push("departure_blocked_by_open_compliance_review");
  }

  if (!departureAfterRelease) {
    appliedRules.push("departure_cannot_precede_cargo_release");
  }

  if (!departureAfterPlanning) {
    appliedRules.push("departure_cannot_precede_transport_planning");
  }

  if (departureAllowed) {
    appliedRules.push("cargo_departed_to_in_transport");
    appliedRules.push("tracking_shipment_moved_to_in_transit");
  }

  return {
    departureAllowed,
    cargoReadyForDeparture,
    trackingShipmentPlanned,
    approvedComplianceEvidencePresent,
    openComplianceReviewBlocked,
    appliedRules,
  };
}

function createDepartedCargoBusinessRules(
  cargo: CargoRecord,
): CargoTransportDepartOutput["businessRules"] {
  return {
    departureAllowed: cargo.departureIdempotencyKey !== null,
    cargoReadyForDeparture: cargo.status === "in_transport",
    trackingShipmentPlanned: true,
    approvedComplianceEvidencePresent: true,
    openComplianceReviewBlocked: false,
    appliedRules: [
      "tenant_scoped_cargo_departure",
      "idempotent_cargo_departure_replay",
      "cargo_departed_to_in_transport",
      "tracking_shipment_moved_to_in_transit",
    ],
  };
}

function resolveCargoTransportArriveBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  input: CargoTransportArriveInput,
): CargoTransportArriveOutput["businessRules"] {
  const arrivedAt = new Date(input.arrivedAt);
  const cargoInTransport =
    cargo.status === "in_transport" &&
    cargo.departureIdempotencyKey !== null &&
    cargo.departedAt !== null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentInTransit = shipment.status === "in_transit";
  const arrivalAfterDeparture = cargo.departedAt === null || arrivedAt >= cargo.departedAt;
  const arrivalAllowed = cargoInTransport && trackingShipmentInTransit && arrivalAfterDeparture;
  const appliedRules = [
    "tenant_scoped_cargo_arrival",
    "idempotent_cargo_arrival",
    "arrival_requires_departed_cargo",
    "arrival_requires_in_transit_tracking_shipment",
    "arrival_cannot_precede_departure",
    "arrival_creates_tracking_arrived_event",
    "arrival_updates_tracking_actual_arrival",
    "arrival_creates_audit_and_outbox",
  ];

  if (!cargoInTransport) {
    appliedRules.push("arrival_blocked_until_cargo_in_transport");
  }

  if (!trackingShipmentInTransit) {
    appliedRules.push("arrival_blocked_when_tracking_not_in_transit");
  }

  if (!arrivalAfterDeparture) {
    appliedRules.push("arrival_cannot_precede_departure_timestamp");
  }

  if (arrivalAllowed) {
    appliedRules.push("tracking_shipment_moved_to_arrived");
  }

  return {
    arrivalAllowed,
    cargoInTransport,
    trackingShipmentInTransit,
    arrivalAfterDeparture,
    appliedRules,
  };
}

function createArrivedCargoBusinessRules(
  cargo: CargoRecord,
): CargoTransportArriveOutput["businessRules"] {
  return {
    arrivalAllowed: cargo.arrivalIdempotencyKey !== null,
    cargoInTransport: cargo.status === "in_transport",
    trackingShipmentInTransit: true,
    arrivalAfterDeparture: true,
    appliedRules: [
      "tenant_scoped_cargo_arrival",
      "idempotent_cargo_arrival_replay",
      "tracking_shipment_moved_to_arrived",
    ],
  };
}

function resolveCargoOperationalHandoffBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  duplicateReference: CargoOperationalHandoffRecord | null,
  input: CargoOperationalHandoffRecordInput,
): CargoOperationalHandoffRecordOutput["businessRules"] {
  const handoffAt = new Date(input.handoffAt);
  const currentCustodyOwner = normalizeComparisonValue(cargo.custodyOwnerName);
  const fromCustodyOwner = normalizeComparisonValue(input.fromCustodyOwnerName);
  const toCustodyOwner = normalizeComparisonValue(input.toCustodyOwnerName);
  const cargoInTransport =
    cargo.status === "in_transport" &&
    cargo.departureIdempotencyKey !== null &&
    cargo.departedAt !== null &&
    cargo.arrivalIdempotencyKey === null &&
    cargo.arrivedAt === null &&
    cargo.deliveredAt === null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentInTransit = shipment.status === "in_transit";
  const handoffAfterDeparture = cargo.departedAt === null || handoffAt >= cargo.departedAt;
  const handoffBeforeArrival = cargo.arrivedAt === null || handoffAt <= cargo.arrivedAt;
  const currentCustodyMatched = currentCustodyOwner === fromCustodyOwner;
  const custodyChanged = fromCustodyOwner !== toCustodyOwner;
  const conditionAccepted = input.conditionStatus === "sound";
  const duplicateReferenceBlocked = duplicateReference !== null;
  const handoffAllowed =
    cargoInTransport &&
    trackingShipmentInTransit &&
    handoffAfterDeparture &&
    handoffBeforeArrival &&
    currentCustodyMatched &&
    custodyChanged &&
    conditionAccepted &&
    !duplicateReferenceBlocked;
  const appliedRules = [
    "tenant_scoped_operational_handoff",
    "idempotent_operational_handoff_record",
    "handoff_requires_in_transit_cargo",
    "handoff_requires_in_transit_tracking_shipment",
    "handoff_cannot_precede_departure",
    "handoff_cannot_follow_arrival",
    "handoff_requires_current_custody_match",
    "handoff_requires_custody_change",
    "handoff_requires_sound_condition",
    "handoff_blocks_duplicate_reference",
    "handoff_creates_tracking_location_update_event",
    "handoff_updates_custody_owner_transactionally",
    "handoff_creates_audit_and_outbox",
  ];

  if (!cargoInTransport) {
    appliedRules.push("handoff_blocked_until_cargo_in_transport");
  }

  if (!trackingShipmentInTransit) {
    appliedRules.push("handoff_blocked_when_tracking_not_in_transit");
  }

  if (!handoffAfterDeparture) {
    appliedRules.push("handoff_cannot_precede_departure_timestamp");
  }

  if (!handoffBeforeArrival) {
    appliedRules.push("handoff_cannot_follow_arrival_timestamp");
  }

  if (!currentCustodyMatched) {
    appliedRules.push("handoff_blocked_when_from_custody_mismatches_current_owner");
  }

  if (!custodyChanged) {
    appliedRules.push("handoff_blocked_without_custody_change");
  }

  if (!conditionAccepted) {
    appliedRules.push("handoff_blocked_until_exception_workflow");
  }

  if (duplicateReferenceBlocked) {
    appliedRules.push("handoff_blocked_by_duplicate_reference");
  }

  if (handoffAllowed) {
    appliedRules.push("cargo_custody_transferred");
    appliedRules.push("tracking_location_updated_for_handoff");
  }

  return {
    handoffAllowed,
    cargoInTransport,
    trackingShipmentInTransit,
    handoffAfterDeparture,
    handoffBeforeArrival,
    currentCustodyMatched,
    custodyChanged,
    conditionAccepted,
    duplicateReferenceBlocked,
    appliedRules,
  };
}

function createRecordedOperationalHandoffBusinessRules(
  handoff: CargoOperationalHandoffRecord,
): CargoOperationalHandoffRecordOutput["businessRules"] {
  return {
    handoffAllowed: handoff.recordIdempotencyKey !== null,
    cargoInTransport: true,
    trackingShipmentInTransit: true,
    handoffAfterDeparture: true,
    handoffBeforeArrival: true,
    currentCustodyMatched: true,
    custodyChanged: true,
    conditionAccepted: handoff.conditionStatus === "sound",
    duplicateReferenceBlocked: false,
    appliedRules: [
      "tenant_scoped_operational_handoff",
      "idempotent_operational_handoff_record_replay",
      "cargo_custody_transferred",
      "tracking_location_updated_for_handoff",
    ],
  };
}

function resolveCargoDeliveryCompleteBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  input: CargoDeliveryCompleteInput,
): CargoDeliveryCompleteOutput["businessRules"] {
  const deliveredAt = new Date(input.deliveredAt);
  const cargoArrivedForDelivery =
    cargo.status === "in_transport" &&
    cargo.arrivalIdempotencyKey !== null &&
    cargo.arrivedAt !== null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentArrived = shipment.status === "arrived";
  const deliveryAfterArrival = cargo.arrivedAt === null || deliveredAt >= cargo.arrivedAt;
  const deliveryConditionAccepted = input.deliveryConditionStatus === "sound";
  const deliveryAllowed =
    cargoArrivedForDelivery &&
    trackingShipmentArrived &&
    deliveryAfterArrival &&
    deliveryConditionAccepted;
  const appliedRules = [
    "tenant_scoped_cargo_delivery",
    "idempotent_cargo_delivery",
    "delivery_requires_arrived_cargo",
    "delivery_requires_arrived_tracking_shipment",
    "delivery_cannot_precede_arrival",
    "delivery_requires_sound_condition",
    "delivery_creates_handover_completed_event",
    "delivery_updates_cargo_and_tracking_transactionally",
    "delivery_creates_audit_and_outbox",
  ];

  if (!cargoArrivedForDelivery) {
    appliedRules.push("delivery_blocked_until_cargo_arrived");
  }

  if (!trackingShipmentArrived) {
    appliedRules.push("delivery_blocked_when_tracking_not_arrived");
  }

  if (!deliveryAfterArrival) {
    appliedRules.push("delivery_cannot_precede_arrival_timestamp");
  }

  if (!deliveryConditionAccepted) {
    appliedRules.push("delivery_blocked_until_exception_or_inspection_resolution");
  }

  if (deliveryAllowed) {
    appliedRules.push("cargo_marked_delivered");
    appliedRules.push("tracking_shipment_moved_to_completed");
  }

  return {
    deliveryAllowed,
    cargoArrivedForDelivery,
    trackingShipmentArrived,
    deliveryAfterArrival,
    deliveryConditionAccepted,
    appliedRules,
  };
}

function createDeliveredCargoBusinessRules(
  cargo: CargoRecord,
): CargoDeliveryCompleteOutput["businessRules"] {
  return {
    deliveryAllowed: cargo.deliveryIdempotencyKey !== null,
    cargoArrivedForDelivery: cargo.arrivedAt !== null,
    trackingShipmentArrived: true,
    deliveryAfterArrival: true,
    deliveryConditionAccepted: cargo.conditionStatus === "sound",
    appliedRules: [
      "tenant_scoped_cargo_delivery",
      "idempotent_cargo_delivery_replay",
      "cargo_marked_delivered",
      "tracking_shipment_moved_to_completed",
    ],
  };
}

function resolveCargoDeliveryExceptionRecordBusinessRules(
  cargo: CargoRecord,
  shipment: TrackingShipmentRecord,
  openException: CargoDeliveryExceptionRecord | null,
  input: CargoDeliveryExceptionRecordInput,
): CargoDeliveryExceptionRecordOutput["businessRules"] {
  const occurredAt = new Date(input.occurredAt);
  const cargoArrivedForException =
    cargo.status === "in_transport" &&
    cargo.arrivalIdempotencyKey !== null &&
    cargo.arrivedAt !== null &&
    cargo.deliveryIdempotencyKey === null &&
    cargo.deliveredAt === null &&
    cargo.trackingShipmentId !== null;
  const trackingShipmentArrived = shipment.status === "arrived";
  const openExceptionBlocked = openException !== null;
  const exceptionAfterArrival = cargo.arrivedAt === null || occurredAt >= cargo.arrivedAt;
  const exceptionAccepted =
    cargoArrivedForException &&
    trackingShipmentArrived &&
    !openExceptionBlocked &&
    exceptionAfterArrival;
  const appliedRules = [
    "tenant_scoped_delivery_exception",
    "idempotent_delivery_exception_record",
    "delivery_exception_requires_arrived_cargo",
    "delivery_exception_requires_arrived_tracking_shipment",
    "delivery_exception_blocks_duplicate_open_exception",
    "delivery_exception_cannot_precede_arrival",
    "delivery_exception_creates_tracking_exception_event",
    "delivery_exception_moves_cargo_to_held",
    "delivery_exception_creates_audit_and_outbox",
  ];

  if (!cargoArrivedForException) {
    appliedRules.push("delivery_exception_blocked_until_cargo_arrived");
  }

  if (!trackingShipmentArrived) {
    appliedRules.push("delivery_exception_blocked_when_tracking_not_arrived");
  }

  if (openExceptionBlocked) {
    appliedRules.push("delivery_exception_blocked_by_existing_open_exception");
  }

  if (!exceptionAfterArrival) {
    appliedRules.push("delivery_exception_cannot_precede_arrival_timestamp");
  }

  if (exceptionAccepted) {
    appliedRules.push("cargo_delivery_exception_opened");
    appliedRules.push("tracking_shipment_moved_to_exception");
  }

  return {
    exceptionAccepted,
    cargoArrivedForException,
    trackingShipmentArrived,
    openExceptionBlocked,
    exceptionAfterArrival,
    appliedRules,
  };
}

function createRecordedDeliveryExceptionBusinessRules(
  exception: CargoDeliveryExceptionRecord,
): CargoDeliveryExceptionRecordOutput["businessRules"] {
  return {
    exceptionAccepted: exception.recordIdempotencyKey !== null,
    cargoArrivedForException: true,
    trackingShipmentArrived: true,
    openExceptionBlocked: false,
    exceptionAfterArrival: true,
    appliedRules: [
      "tenant_scoped_delivery_exception",
      "idempotent_delivery_exception_record_replay",
      "cargo_delivery_exception_opened",
      "tracking_shipment_moved_to_exception",
    ],
  };
}

function resolveCargoDeliveryExceptionResolveBusinessRules(
  exception: CargoDeliveryExceptionWithCargo,
  shipment: TrackingShipmentRecord,
  input: CargoDeliveryExceptionResolveInput,
): CargoDeliveryExceptionResolveOutput["businessRules"] {
  const resolvedAt = new Date(input.resolvedAt);
  const openException = exception.status === "open";
  const cargoHeldForInspection =
    exception.cargo.status === "held" &&
    exception.cargo.requiresInspection &&
    exception.cargo.deliveredAt === null;
  const trackingShipmentException = shipment.status === "exception";
  const resolutionAfterException = resolvedAt >= exception.occurredAt;
  const cargoRestoredForDelivery = input.finalConditionStatus === "sound";
  const resolutionAllowed =
    openException &&
    cargoHeldForInspection &&
    trackingShipmentException &&
    resolutionAfterException &&
    cargoRestoredForDelivery;
  const appliedRules = [
    "tenant_scoped_delivery_exception_resolution",
    "idempotent_delivery_exception_resolution",
    "delivery_exception_resolution_requires_open_exception",
    "delivery_exception_resolution_requires_held_cargo",
    "delivery_exception_resolution_requires_tracking_exception",
    "delivery_exception_resolution_cannot_precede_exception",
    "delivery_exception_resolution_restores_sound_condition",
    "delivery_exception_resolution_reopens_delivery_completion",
    "delivery_exception_resolution_creates_audit_and_outbox",
  ];

  if (!openException) {
    appliedRules.push("delivery_exception_resolution_blocked_when_not_open");
  }

  if (!cargoHeldForInspection) {
    appliedRules.push("delivery_exception_resolution_blocked_when_cargo_not_held");
  }

  if (!trackingShipmentException) {
    appliedRules.push("delivery_exception_resolution_blocked_when_tracking_not_exception");
  }

  if (!resolutionAfterException) {
    appliedRules.push("delivery_exception_resolution_cannot_precede_exception_timestamp");
  }

  if (!cargoRestoredForDelivery) {
    appliedRules.push("delivery_exception_resolution_requires_sound_final_condition");
  }

  if (resolutionAllowed) {
    appliedRules.push("cargo_restored_for_delivery_completion");
    appliedRules.push("tracking_shipment_restored_to_arrived");
  }

  return {
    resolutionAllowed,
    openException,
    cargoHeldForInspection,
    trackingShipmentException,
    resolutionAfterException,
    cargoRestoredForDelivery,
    appliedRules,
  };
}

function createResolvedDeliveryExceptionBusinessRules(
  exception: CargoDeliveryExceptionRecord,
): CargoDeliveryExceptionResolveOutput["businessRules"] {
  return {
    resolutionAllowed: exception.resolveIdempotencyKey !== null,
    openException: false,
    cargoHeldForInspection: false,
    trackingShipmentException: false,
    resolutionAfterException: true,
    cargoRestoredForDelivery: true,
    appliedRules: [
      "tenant_scoped_delivery_exception_resolution",
      "idempotent_delivery_exception_resolution_replay",
      "cargo_restored_for_delivery_completion",
      "tracking_shipment_restored_to_arrived",
    ],
  };
}

function resolveCargoClaimSettlementRecordBusinessRules(
  exception: CargoDeliveryExceptionWithCargo,
  duplicateSettlement: CargoClaimSettlementRecord | null,
  duplicateReference: CargoClaimSettlementRecord | null,
  input: CargoClaimSettlementRecordInput,
): CargoClaimSettlementRecordOutput["businessRules"] {
  const settledAt = new Date(input.settledAt);
  const resolvedException = exception.status === "resolved" && exception.resolvedAt !== null;
  const claimReferencePresent = exception.claimReference !== null;
  const claimReferenceMatched =
    claimReferencePresent &&
    normalizeComparisonValue(exception.claimReference ?? "") ===
      normalizeComparisonValue(input.claimReference);
  const claimResolutionAccepted = exception.resolutionCode === "claim_accepted";
  const settlementAfterResolution =
    exception.resolvedAt === null || settledAt >= exception.resolvedAt;
  const duplicateSettlementBlocked = duplicateSettlement !== null;
  const duplicateReferenceBlocked = duplicateReference !== null;
  const settlementAllowed =
    resolvedException &&
    claimReferencePresent &&
    claimReferenceMatched &&
    claimResolutionAccepted &&
    settlementAfterResolution &&
    !duplicateSettlementBlocked &&
    !duplicateReferenceBlocked;
  const appliedRules = [
    "tenant_scoped_claim_settlement",
    "idempotent_claim_settlement_record",
    "claim_settlement_requires_resolved_delivery_exception",
    "claim_settlement_requires_claim_reference",
    "claim_settlement_requires_matching_claim_reference",
    "claim_settlement_requires_claim_accepted_resolution",
    "claim_settlement_cannot_precede_exception_resolution",
    "claim_settlement_blocks_duplicate_exception_settlement",
    "claim_settlement_blocks_duplicate_settlement_reference",
    "claim_settlement_creates_audit_and_outbox",
  ];

  if (!resolvedException) {
    appliedRules.push("claim_settlement_blocked_until_exception_resolved");
  }

  if (!claimReferencePresent) {
    appliedRules.push("claim_settlement_blocked_without_claim_reference");
  }

  if (!claimReferenceMatched) {
    appliedRules.push("claim_settlement_blocked_by_claim_reference_mismatch");
  }

  if (!claimResolutionAccepted) {
    appliedRules.push("claim_settlement_blocked_until_claim_accepted");
  }

  if (!settlementAfterResolution) {
    appliedRules.push("claim_settlement_cannot_precede_resolution_timestamp");
  }

  if (duplicateSettlementBlocked) {
    appliedRules.push("claim_settlement_blocked_by_existing_exception_settlement");
  }

  if (duplicateReferenceBlocked) {
    appliedRules.push("claim_settlement_blocked_by_duplicate_reference");
  }

  if (settlementAllowed) {
    appliedRules.push("claim_settlement_accounting_recorded");
  }

  return {
    settlementAllowed,
    resolvedException,
    claimReferencePresent,
    claimReferenceMatched,
    claimResolutionAccepted,
    settlementAfterResolution,
    duplicateSettlementBlocked,
    duplicateReferenceBlocked,
    appliedRules,
  };
}

function createRecordedClaimSettlementBusinessRules(
  exception: CargoDeliveryExceptionRecord,
): CargoClaimSettlementRecordOutput["businessRules"] {
  return {
    settlementAllowed: true,
    resolvedException: exception.status === "resolved",
    claimReferencePresent: exception.claimReference !== null,
    claimReferenceMatched: true,
    claimResolutionAccepted: exception.resolutionCode === "claim_accepted",
    settlementAfterResolution: true,
    duplicateSettlementBlocked: false,
    duplicateReferenceBlocked: false,
    appliedRules: [
      "tenant_scoped_claim_settlement",
      "idempotent_claim_settlement_record_replay",
      "claim_settlement_accounting_recorded",
    ],
  };
}

function resolveCargoComplianceEvidenceRecordBusinessRules(
  cargo: CargoRecord,
  input: CargoComplianceEvidenceRecordInput,
): CargoComplianceEvidenceRecordOutput["businessRules"] {
  const notCancelled = cargo.status !== "cancelled";
  const notExpiredAtRecord =
    input.expiresAt === undefined || Date.parse(input.expiresAt) > Date.now();
  const hazardousEvidenceMatchesCargo =
    input.evidenceType !== "hazardous_goods_declaration" || cargo.hazardous;
  const evidenceAccepted = notCancelled && notExpiredAtRecord && hazardousEvidenceMatchesCargo;
  const appliedRules = [
    "tenant_scoped_compliance_evidence",
    "idempotent_compliance_evidence_record",
    "unique_document_reference_per_cargo_and_type",
    "compliance_evidence_requires_human_review",
    "compliance_evidence_creates_audit_and_outbox",
  ];

  if (!notCancelled) {
    appliedRules.push("compliance_evidence_blocked_for_cancelled_cargo");
  }

  if (!notExpiredAtRecord) {
    appliedRules.push("compliance_evidence_blocked_when_already_expired");
  }

  if (!hazardousEvidenceMatchesCargo) {
    appliedRules.push("hazardous_declaration_requires_hazardous_cargo");
  }

  if (cargo.hazardous) {
    appliedRules.push("hazardous_cargo_requires_dedicated_compliance_evidence");
  }

  return {
    evidenceAccepted,
    reviewRequired: true,
    appliedRules,
  };
}

function resolveCargoComplianceEvidenceVerifyBusinessRules(
  evidence: CargoComplianceEvidenceWithCargo,
  input: CargoComplianceEvidenceVerifyInput,
): CargoComplianceEvidenceVerifyOutput["businessRules"] {
  const reviewedAt = input.reviewedAt === undefined ? new Date() : new Date(input.reviewedAt);
  const pendingReview = evidence.status === "pending_review";
  const cargoNotCancelled = evidence.cargo.status !== "cancelled";
  const approvalNotExpired =
    input.status === "rejected" || evidence.expiresAt === null || evidence.expiresAt > reviewedAt;
  const verificationAllowed = pendingReview && cargoNotCancelled && approvalNotExpired;
  const appliedRules = [
    "tenant_scoped_compliance_review",
    "idempotent_compliance_evidence_verify",
    "verification_requires_pending_review_status",
    "approved_evidence_must_not_be_expired",
    "rejected_evidence_requires_rejection_reason",
    "compliance_verification_creates_audit_and_outbox",
  ];

  if (!pendingReview) {
    appliedRules.push("compliance_verification_blocked_after_terminal_review");
  }

  if (!cargoNotCancelled) {
    appliedRules.push("compliance_verification_blocked_for_cancelled_cargo");
  }

  if (!approvalNotExpired) {
    appliedRules.push("compliance_approval_blocked_for_expired_evidence");
  }

  if (input.status === "approved") {
    appliedRules.push("compliance_evidence_approved_for_operations");
  }

  if (input.status === "rejected") {
    appliedRules.push("compliance_evidence_rejected_blocks_automation");
  }

  return {
    verificationAllowed,
    evidenceApproved: verificationAllowed && input.status === "approved",
    evidenceRejected: verificationAllowed && input.status === "rejected",
    appliedRules,
  };
}

function createRecordedComplianceEvidenceBusinessRules(
  evidence: CargoComplianceEvidenceRecord,
): CargoComplianceEvidenceRecordOutput["businessRules"] {
  return {
    evidenceAccepted: evidence.recordIdempotencyKey !== null,
    reviewRequired: true,
    appliedRules: [
      "tenant_scoped_compliance_evidence",
      "idempotent_compliance_evidence_record_replay",
      "compliance_evidence_requires_human_review",
    ],
  };
}

function createVerifiedComplianceEvidenceBusinessRules(
  evidence: CargoComplianceEvidenceRecord,
): CargoComplianceEvidenceVerifyOutput["businessRules"] {
  return {
    verificationAllowed: evidence.verifyIdempotencyKey !== null,
    evidenceApproved: evidence.status === "approved",
    evidenceRejected: evidence.status === "rejected",
    appliedRules: [
      "tenant_scoped_compliance_review",
      "idempotent_compliance_evidence_verify_replay",
      evidence.status === "approved"
        ? "compliance_evidence_approved_for_operations"
        : "compliance_evidence_rejected_blocks_automation",
    ],
  };
}

function createCargoSummary(cargo: CargoRecord): CargoOverviewOutput["recentCargo"][number] {
  return {
    id: cargo.id,
    cargoReference: cargo.cargoReference,
    externalReference: cargo.externalReference,
    cargoDescription: cargo.cargoDescription,
    cargoType: cargo.cargoType,
    status: cargo.status,
    customsStatus: cargo.customsStatus,
    conditionStatus: cargo.conditionStatus,
    grossWeightKg: Number(cargo.grossWeightKg),
    packageCount: cargo.packageCount,
    hazardous: cargo.hazardous,
    requiresInspection: cargo.requiresInspection,
    originName: cargo.originName,
    destinationName: cargo.destinationName,
    custodyOwnerName: cargo.custodyOwnerName,
    priority: cargo.priority,
    expectedReadyAt: toIsoStringOrNull(cargo.expectedReadyAt),
    createdAt: cargo.createdAt.toISOString(),
    updatedAt: cargo.updatedAt.toISOString(),
  };
}

function createCargoRegisterOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
}): CargoRegisterOutput {
  if (input.cargo.registrationIdempotencyKey === null) {
    throw new Error("cargo.registration.idempotency_key_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = resolveCargoBusinessRules({
    cargoReference: input.cargo.cargoReference,
    cargoDescription: input.cargo.cargoDescription,
    cargoType: input.cargo.cargoType,
    grossWeightKg: Number(input.cargo.grossWeightKg),
    packageCount: input.cargo.packageCount,
    shipperName: input.cargo.shipperName,
    consigneeName: input.cargo.consigneeName,
    originName: input.cargo.originName,
    destinationName: input.cargo.destinationName,
    custodyOwnerName: input.cargo.custodyOwnerName,
    priority: input.cargo.priority,
    customsStatus: input.cargo.customsStatus,
    conditionStatus: input.cargo.conditionStatus,
    hazardous: input.cargo.hazardous,
    requiresInspection: input.cargo.requiresInspection,
    idempotencyKey: input.cargo.registrationIdempotencyKey,
    sourceSystem: input.cargo.sourceSystem,
    ...(input.cargo.externalReference === null
      ? {}
      : { externalReference: input.cargo.externalReference }),
    ...(input.cargo.customsReference === null
      ? {}
      : { customsReference: input.cargo.customsReference }),
    ...(input.cargo.unNumber === null ? {} : { unNumber: input.cargo.unNumber }),
    ...(input.cargo.hazardClass === null ? {} : { hazardClass: input.cargo.hazardClass }),
    ...(input.cargo.volumeM3 === null ? {} : { volumeM3: Number(input.cargo.volumeM3) }),
    ...(input.cargo.expectedReadyAt === null
      ? {}
      : { expectedReadyAt: input.cargo.expectedReadyAt.toISOString() }),
  });

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    cargo: {
      ...summary,
      shipperName: input.cargo.shipperName,
      consigneeName: input.cargo.consigneeName,
      customsReference: input.cargo.customsReference,
      unNumber: input.cargo.unNumber,
      hazardClass: input.cargo.hazardClass,
      sourceSystem: input.cargo.sourceSystem,
    },
    businessRules,
    idempotency: {
      key: input.cargo.registrationIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.registered",
      subjectType: "cargo",
      subjectId: input.cargo.id,
    },
    outbox: {
      eventType: "cargo.registered",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoReleaseOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
  businessRules?: CargoReleaseOutput["businessRules"];
}): CargoReleaseOutput {
  if (input.cargo.releaseIdempotencyKey === null) {
    throw new Error("cargo.release.idempotency_key_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? createReleasedCargoBusinessRules(input.cargo);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    cargo: {
      ...summary,
      customsReference: input.cargo.customsReference,
      releaseReference: input.cargo.releaseReference,
      releaseReason: input.cargo.releaseReason,
      releasedAt: toIsoStringOrNull(input.cargo.releasedAt),
      sourceSystem: input.cargo.sourceSystem,
    },
    businessRules,
    idempotency: {
      key: input.cargo.releaseIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.released",
      subjectType: "cargo",
      subjectId: input.cargo.id,
    },
    outbox: {
      eventType: "cargo.released",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoTransportPlanOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  replayed: boolean;
  businessRules?: CargoTransportPlanOutput["businessRules"];
}): CargoTransportPlanOutput {
  if (input.cargo.transportPlanIdempotencyKey === null) {
    throw new Error("cargo.transport_plan.idempotency_key_missing");
  }

  if (input.cargo.trackingShipmentId === null || input.cargo.transportPlannedAt === null) {
    throw new Error("cargo.transport_plan.tracking_link_missing");
  }

  if (input.cargo.transportOwnerTeam === null) {
    throw new Error("cargo.transport_plan.owner_team_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? createPlannedCargoBusinessRules(input.cargo);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: input.shipment.id,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId,
      transportPlannedAt: input.cargo.transportPlannedAt.toISOString(),
      transportPlanningReference: input.cargo.transportPlanningReference,
      transportOwnerTeam: input.cargo.transportOwnerTeam,
    },
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      transportMode: input.shipment.transportMode,
      status: "planned",
      plannedDepartureAt: toRequiredIsoString(input.shipment.plannedDepartureAt),
      estimatedArrivalAt: toRequiredIsoString(input.shipment.estimatedArrivalAt),
    },
    businessRules,
    idempotency: {
      key: input.cargo.transportPlanIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.transport_planned",
      subjectType: "cargo",
      subjectId: input.cargo.id,
    },
    outbox: {
      eventType: "cargo.transport_planned",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoTransportDepartOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingDepartureEventRecord;
  previousShipmentStatus: TrackingShipmentStatus;
  replayed: boolean;
  businessRules?: CargoTransportDepartOutput["businessRules"];
}): CargoTransportDepartOutput {
  if (input.cargo.departureIdempotencyKey === null) {
    throw new Error("cargo.transport_departure.idempotency_key_missing");
  }

  if (
    input.cargo.trackingShipmentId === null ||
    input.cargo.departedAt === null ||
    input.cargo.departureLocationName === null ||
    input.cargo.departureOperatorName === null
  ) {
    throw new Error("cargo.transport_departure.evidence_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? createDepartedCargoBusinessRules(input.cargo);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: input.shipment.id,
    eventId: input.event.id,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId,
      departedAt: input.cargo.departedAt.toISOString(),
      departureReference: input.cargo.departureReference,
      departureLocationName: input.cargo.departureLocationName,
      departureOperatorName: input.cargo.departureOperatorName,
      carrierReference: input.cargo.carrierReference,
    },
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      transportMode: input.shipment.transportMode,
      previousStatus: input.previousShipmentStatus,
      status: "in_transit",
    },
    event: {
      id: input.event.id,
      eventType: "departed",
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName ?? input.cargo.departureLocationName,
    },
    businessRules,
    idempotency: {
      key: input.cargo.departureIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.transport_departed",
      subjectType: "cargo",
      subjectId: input.cargo.id,
    },
    outbox: {
      eventType: "cargo.transport_departed",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoTransportArriveOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingLifecycleEventRecord;
  previousShipmentStatus: TrackingShipmentStatus;
  replayed: boolean;
  businessRules?: CargoTransportArriveOutput["businessRules"];
}): CargoTransportArriveOutput {
  if (input.cargo.arrivalIdempotencyKey === null) {
    throw new Error("cargo.transport_arrival.idempotency_key_missing");
  }

  if (
    input.cargo.trackingShipmentId === null ||
    input.cargo.arrivedAt === null ||
    input.cargo.arrivalLocationName === null ||
    input.cargo.arrivalOperatorName === null
  ) {
    throw new Error("cargo.transport_arrival.evidence_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? createArrivedCargoBusinessRules(input.cargo);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: input.shipment.id,
    eventId: input.event.id,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId,
      arrivedAt: input.cargo.arrivedAt.toISOString(),
      arrivalReference: input.cargo.arrivalReference,
      arrivalLocationName: input.cargo.arrivalLocationName,
      arrivalOperatorName: input.cargo.arrivalOperatorName,
    },
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      transportMode: input.shipment.transportMode,
      previousStatus: input.previousShipmentStatus,
      status: "arrived",
      actualArrivalAt: toRequiredIsoString(input.shipment.actualArrivalAt),
    },
    event: {
      id: input.event.id,
      eventType: "arrived",
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName ?? input.cargo.arrivalLocationName,
    },
    businessRules,
    idempotency: {
      key: input.cargo.arrivalIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.transport_arrived",
      subjectType: "cargo",
      subjectId: input.cargo.id,
    },
    outbox: {
      eventType: "cargo.transport_arrived",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoOperationalHandoffSummary(
  handoff: CargoOperationalHandoffRecord,
): CargoOperationalHandoffRecordOutput["handoff"] {
  return {
    id: handoff.id,
    cargoId: handoff.cargoId,
    trackingShipmentId: handoff.trackingShipmentId,
    handoffType: handoff.handoffType,
    fromCustodyOwnerName: handoff.fromCustodyOwnerName,
    toCustodyOwnerName: handoff.toCustodyOwnerName,
    handoffLocationName: handoff.handoffLocationName,
    operatorName: handoff.operatorName,
    handoffReference: handoff.handoffReference,
    sealReference: handoff.sealReference,
    conditionStatus: handoff.conditionStatus,
    handoffNotes: handoff.handoffNotes,
    handoffAt: handoff.handoffAt.toISOString(),
    sourceSystem: handoff.sourceSystem,
    createdAt: handoff.createdAt.toISOString(),
    updatedAt: handoff.updatedAt.toISOString(),
  };
}

function createCargoOperationalHandoffRecordOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  handoff: CargoOperationalHandoffRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingLifecycleEventRecord;
  previousShipmentStatus: TrackingShipmentStatus;
  replayed: boolean;
  businessRules?: CargoOperationalHandoffRecordOutput["businessRules"];
}): CargoOperationalHandoffRecordOutput {
  if (input.handoff.recordIdempotencyKey === null) {
    throw new Error("cargo.operational_handoff.record_idempotency_key_missing");
  }

  if (input.cargo.trackingShipmentId === null || input.handoff.trackingShipmentId === null) {
    throw new Error("cargo.operational_handoff.tracking_link_missing");
  }

  const businessRules =
    input.businessRules ?? createRecordedOperationalHandoffBusinessRules(input.handoff);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    handoffId: input.handoff.id,
    shipmentId: input.shipment.id,
    eventId: input.event.id,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId,
      custodyOwnerName: input.cargo.custodyOwnerName,
    },
    handoff: createCargoOperationalHandoffSummary(input.handoff),
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      transportMode: input.shipment.transportMode,
      previousStatus: input.previousShipmentStatus,
      status: "in_transit",
    },
    event: {
      id: input.event.id,
      eventType: "location_updated",
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName ?? input.handoff.handoffLocationName,
    },
    businessRules,
    idempotency: {
      key: input.handoff.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.operational_handoff.recorded",
      subjectType: "cargo_operational_handoff",
      subjectId: input.handoff.id,
    },
    outbox: {
      eventType: "cargo.operational_handoff.recorded",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoDeliveryCompleteOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingLifecycleEventRecord;
  previousShipmentStatus: TrackingShipmentStatus;
  replayed: boolean;
  businessRules?: CargoDeliveryCompleteOutput["businessRules"];
}): CargoDeliveryCompleteOutput {
  if (input.cargo.deliveryIdempotencyKey === null) {
    throw new Error("cargo.delivery.idempotency_key_missing");
  }

  if (
    input.cargo.trackingShipmentId === null ||
    input.cargo.deliveredAt === null ||
    input.cargo.deliveryReference === null ||
    input.cargo.receivedByName === null
  ) {
    throw new Error("cargo.delivery.evidence_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? createDeliveredCargoBusinessRules(input.cargo);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: input.shipment.id,
    eventId: input.event.id,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId,
      deliveredAt: input.cargo.deliveredAt.toISOString(),
      deliveryReference: input.cargo.deliveryReference,
      receivedByName: input.cargo.receivedByName,
      deliveryNotes: input.cargo.deliveryNotes,
    },
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      transportMode: input.shipment.transportMode,
      previousStatus: input.previousShipmentStatus,
      status: "completed",
    },
    event: {
      id: input.event.id,
      eventType: "handover_completed",
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName ?? input.cargo.destinationName,
    },
    businessRules,
    idempotency: {
      key: input.cargo.deliveryIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.delivery_completed",
      subjectType: "cargo",
      subjectId: input.cargo.id,
    },
    outbox: {
      eventType: "cargo.delivery_completed",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoDeliveryExceptionSummary(
  exception: CargoDeliveryExceptionRecord,
): CargoDeliveryExceptionRecordOutput["exception"] {
  return {
    id: exception.id,
    cargoId: exception.cargoId,
    trackingShipmentId: exception.trackingShipmentId,
    exceptionType: exception.exceptionType,
    deliveryConditionStatus: exception.deliveryConditionStatus,
    status: exception.status,
    reportedByName: exception.reportedByName,
    exceptionSummary: exception.exceptionSummary,
    evidenceReference: exception.evidenceReference,
    claimReference: exception.claimReference,
    occurredAt: exception.occurredAt.toISOString(),
    resolverName: exception.resolverName,
    resolutionCode: exception.resolutionCode,
    resolutionReference: exception.resolutionReference,
    resolutionSummary: exception.resolutionSummary,
    resolvedAt: toIsoStringOrNull(exception.resolvedAt),
    sourceSystem: exception.sourceSystem,
    createdAt: exception.createdAt.toISOString(),
    updatedAt: exception.updatedAt.toISOString(),
  };
}

function createCargoDeliveryExceptionRecordOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  exception: CargoDeliveryExceptionRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingLifecycleEventRecord;
  previousShipmentStatus: TrackingShipmentStatus;
  replayed: boolean;
  businessRules?: CargoDeliveryExceptionRecordOutput["businessRules"];
}): CargoDeliveryExceptionRecordOutput {
  if (input.exception.recordIdempotencyKey === null) {
    throw new Error("cargo.delivery_exception.record_idempotency_key_missing");
  }

  if (input.cargo.trackingShipmentId === null || input.exception.trackingShipmentId === null) {
    throw new Error("cargo.delivery_exception.tracking_link_missing");
  }

  const businessRules =
    input.businessRules ?? createRecordedDeliveryExceptionBusinessRules(input.exception);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    exceptionId: input.exception.id,
    shipmentId: input.shipment.id,
    eventId: input.event.id,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId,
    },
    exception: createCargoDeliveryExceptionSummary(input.exception),
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      transportMode: input.shipment.transportMode,
      previousStatus: input.previousShipmentStatus,
      status: "exception",
    },
    event: {
      id: input.event.id,
      eventType: "exception",
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName ?? input.cargo.destinationName,
    },
    businessRules,
    idempotency: {
      key: input.exception.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.delivery_exception.recorded",
      subjectType: "cargo_delivery_exception",
      subjectId: input.exception.id,
    },
    outbox: {
      eventType: "cargo.delivery_exception.recorded",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoDeliveryExceptionResolveOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  exception: CargoDeliveryExceptionRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingLifecycleEventRecord;
  previousShipmentStatus: TrackingShipmentStatus;
  replayed: boolean;
  businessRules?: CargoDeliveryExceptionResolveOutput["businessRules"];
}): CargoDeliveryExceptionResolveOutput {
  if (input.exception.resolveIdempotencyKey === null) {
    throw new Error("cargo.delivery_exception.resolve_idempotency_key_missing");
  }

  if (input.cargo.trackingShipmentId === null || input.exception.trackingShipmentId === null) {
    throw new Error("cargo.delivery_exception_resolution.tracking_link_missing");
  }

  const businessRules =
    input.businessRules ?? createResolvedDeliveryExceptionBusinessRules(input.exception);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    exceptionId: input.exception.id,
    shipmentId: input.shipment.id,
    eventId: input.event.id,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId,
    },
    exception: createCargoDeliveryExceptionSummary(input.exception),
    shipment: {
      id: input.shipment.id,
      referenceCode: input.shipment.referenceCode,
      transportMode: input.shipment.transportMode,
      previousStatus: input.previousShipmentStatus,
      status: "arrived",
    },
    event: {
      id: input.event.id,
      eventType: "released",
      occurredAt: input.event.occurredAt.toISOString(),
      locationName: input.event.locationName ?? input.cargo.destinationName,
    },
    businessRules,
    idempotency: {
      key: input.exception.resolveIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.delivery_exception.resolved",
      subjectType: "cargo_delivery_exception",
      subjectId: input.exception.id,
    },
    outbox: {
      eventType: "cargo.delivery_exception.resolved",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoClaimSettlementSummary(
  settlement: CargoClaimSettlementRecord,
): CargoClaimSettlementRecordOutput["settlement"] {
  return {
    id: settlement.id,
    cargoId: settlement.cargoId,
    deliveryExceptionId: settlement.deliveryExceptionId,
    claimReference: settlement.claimReference,
    settlementReference: settlement.settlementReference,
    settlementType: settlement.settlementType,
    settlementStatus: settlement.settlementStatus,
    currencyCode: settlement.currencyCode,
    settlementAmount: Number(settlement.settlementAmount),
    settledByName: settlement.settledByName,
    counterpartyName: settlement.counterpartyName,
    settlementSummary: settlement.settlementSummary,
    settledAt: settlement.settledAt.toISOString(),
    sourceSystem: settlement.sourceSystem,
    createdAt: settlement.createdAt.toISOString(),
    updatedAt: settlement.updatedAt.toISOString(),
  };
}

function createCargoClaimSettlementRecordOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  exception: CargoDeliveryExceptionRecord;
  settlement: CargoClaimSettlementRecord;
  replayed: boolean;
  businessRules?: CargoClaimSettlementRecordOutput["businessRules"];
}): CargoClaimSettlementRecordOutput {
  if (input.settlement.recordIdempotencyKey === null) {
    throw new Error("cargo.claim_settlement.record_idempotency_key_missing");
  }

  const businessRules =
    input.businessRules ?? createRecordedClaimSettlementBusinessRules(input.exception);

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    exceptionId: input.exception.id,
    settlementId: input.settlement.id,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId,
    },
    exception: createCargoDeliveryExceptionSummary(input.exception),
    settlement: createCargoClaimSettlementSummary(input.settlement),
    businessRules,
    idempotency: {
      key: input.settlement.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.claim_settlement.recorded",
      subjectType: "cargo_claim_settlement",
      subjectId: input.settlement.id,
    },
    outbox: {
      eventType: "cargo.claim_settlement.recorded",
      aggregateType: "cargo",
      aggregateId: input.cargo.id,
    },
  };
}

function createCargoComplianceEvidenceSummary(
  evidence: CargoComplianceEvidenceRecord,
): CargoComplianceEvidenceRecordOutput["evidence"] {
  return {
    id: evidence.id,
    cargoId: evidence.cargoId,
    evidenceType: evidence.evidenceType,
    documentReference: evidence.documentReference,
    documentTitle: evidence.documentTitle,
    documentUri: evidence.documentUri,
    issuerName: evidence.issuerName,
    issuedAt: toIsoStringOrNull(evidence.issuedAt),
    expiresAt: toIsoStringOrNull(evidence.expiresAt),
    status: evidence.status,
    reviewerName: evidence.reviewerName,
    reviewReference: evidence.reviewReference,
    reviewSummary: evidence.reviewSummary,
    rejectionReason: evidence.rejectionReason,
    reviewedAt: toIsoStringOrNull(evidence.reviewedAt),
    sourceSystem: evidence.sourceSystem,
    recordedAt: evidence.recordedAt.toISOString(),
    updatedAt: evidence.updatedAt.toISOString(),
  };
}

function createCargoComplianceEvidenceRecordOutput(input: {
  organizationId: string;
  evidence: CargoComplianceEvidenceRecord;
  replayed: boolean;
  businessRules?: CargoComplianceEvidenceRecordOutput["businessRules"];
}): CargoComplianceEvidenceRecordOutput {
  if (input.evidence.recordIdempotencyKey === null) {
    throw new Error("cargo.compliance_evidence.record_idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    cargoId: input.evidence.cargoId,
    evidenceId: input.evidence.id,
    evidence: createCargoComplianceEvidenceSummary(input.evidence),
    businessRules:
      input.businessRules ?? createRecordedComplianceEvidenceBusinessRules(input.evidence),
    idempotency: {
      key: input.evidence.recordIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.compliance_evidence.recorded",
      subjectType: "cargo_compliance_evidence",
      subjectId: input.evidence.id,
    },
    outbox: {
      eventType: "cargo.compliance_evidence.recorded",
      aggregateType: "cargo",
      aggregateId: input.evidence.cargoId,
    },
  };
}

function createCargoComplianceEvidenceVerifyOutput(input: {
  organizationId: string;
  evidence: CargoComplianceEvidenceRecord;
  replayed: boolean;
  businessRules?: CargoComplianceEvidenceVerifyOutput["businessRules"];
}): CargoComplianceEvidenceVerifyOutput {
  if (input.evidence.verifyIdempotencyKey === null) {
    throw new Error("cargo.compliance_evidence.verify_idempotency_key_missing");
  }

  return {
    organizationId: input.organizationId,
    cargoId: input.evidence.cargoId,
    evidenceId: input.evidence.id,
    evidence: createCargoComplianceEvidenceSummary(input.evidence),
    businessRules:
      input.businessRules ?? createVerifiedComplianceEvidenceBusinessRules(input.evidence),
    idempotency: {
      key: input.evidence.verifyIdempotencyKey,
      replayed: input.replayed,
    },
    audit: {
      action: "cargo.compliance_evidence.verified",
      subjectType: "cargo_compliance_evidence",
      subjectId: input.evidence.id,
    },
    outbox: {
      eventType: "cargo.compliance_evidence.verified",
      aggregateType: "cargo",
      aggregateId: input.evidence.cargoId,
    },
  };
}

function createCargoRegistrationAuditAfter(input: {
  cargo: CargoRecord;
  businessRules: CargoRegisterOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoType: input.cargo.cargoType,
    status: input.cargo.status,
    customsStatus: input.cargo.customsStatus,
    conditionStatus: input.cargo.conditionStatus,
    hazardous: input.cargo.hazardous,
    requiresInspection: input.cargo.requiresInspection,
    movementBlocked: input.businessRules.movementBlocked,
    inspectionRequired: input.businessRules.inspectionRequired,
    customsBlocked: input.businessRules.customsBlocked,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.cargo.registrationIdempotencyKey,
    sourceSystem: input.cargo.sourceSystem,
  };
}

function createCargoReleaseAuditBefore(
  cargo: CargoRecord,
  businessRules: CargoReleaseOutput["businessRules"],
): AuditJsonValue {
  return {
    cargoId: cargo.id,
    cargoReference: cargo.cargoReference,
    status: cargo.status,
    customsStatus: cargo.customsStatus,
    conditionStatus: cargo.conditionStatus,
    hazardous: cargo.hazardous,
    requiresInspection: cargo.requiresInspection,
    releaseAllowed: businessRules.releaseAllowed,
    movementBlocked: businessRules.movementBlocked,
    customsReleaseRequired: businessRules.customsReleaseRequired,
    inspectionRequiredBeforeRelease: businessRules.inspectionRequiredBeforeRelease,
    appliedRules: businessRules.appliedRules,
  };
}

function createCargoReleaseAuditAfter(input: {
  cargo: CargoRecord;
  businessRules: CargoReleaseOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    status: input.cargo.status,
    customsStatus: input.cargo.customsStatus,
    conditionStatus: input.cargo.conditionStatus,
    releaseReference: input.cargo.releaseReference,
    releaseReason: input.cargo.releaseReason,
    releasedAt: toIsoStringOrNull(input.cargo.releasedAt),
    requiresInspection: input.cargo.requiresInspection,
    releaseAllowed: input.businessRules.releaseAllowed,
    movementBlocked: input.businessRules.movementBlocked,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.cargo.releaseIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoTransportPlanAuditBefore(
  cargo: CargoRecord,
  businessRules: CargoTransportPlanOutput["businessRules"],
): AuditJsonValue {
  return {
    cargoId: cargo.id,
    cargoReference: cargo.cargoReference,
    status: cargo.status,
    customsStatus: cargo.customsStatus,
    requiresInspection: cargo.requiresInspection,
    releasedAt: toIsoStringOrNull(cargo.releasedAt),
    trackingShipmentId: cargo.trackingShipmentId,
    planningAllowed: businessRules.planningAllowed,
    cargoReadyForTracking: businessRules.cargoReadyForTracking,
    trackingLinked: businessRules.trackingLinked,
    appliedRules: businessRules.appliedRules,
  };
}

function createCargoTransportPlanAuditAfter(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  businessRules: CargoTransportPlanOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    status: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    transportPlannedAt: toIsoStringOrNull(input.cargo.transportPlannedAt),
    transportPlanningReference: input.cargo.transportPlanningReference,
    transportOwnerTeam: input.cargo.transportOwnerTeam,
    shipmentReferenceCode: input.shipment.referenceCode,
    transportMode: input.shipment.transportMode,
    plannedDepartureAt: toIsoStringOrNull(input.shipment.plannedDepartureAt),
    estimatedArrivalAt: toIsoStringOrNull(input.shipment.estimatedArrivalAt),
    planningAllowed: input.businessRules.planningAllowed,
    cargoReadyForTracking: input.businessRules.cargoReadyForTracking,
    trackingLinked: input.businessRules.trackingLinked,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.cargo.transportPlanIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoTransportDepartAuditBefore(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  businessRules: CargoTransportDepartOutput["businessRules"];
  complianceEvidenceCounts: CargoComplianceEvidenceStatusCounts;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    customsStatus: input.cargo.customsStatus,
    requiresInspection: input.cargo.requiresInspection,
    releasedAt: toIsoStringOrNull(input.cargo.releasedAt),
    transportPlannedAt: toIsoStringOrNull(input.cargo.transportPlannedAt),
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    approvedComplianceEvidence: input.complianceEvidenceCounts.approved,
    pendingComplianceEvidence: input.complianceEvidenceCounts.pendingReview,
    rejectedComplianceEvidence: input.complianceEvidenceCounts.rejected,
    departureAllowed: input.businessRules.departureAllowed,
    cargoReadyForDeparture: input.businessRules.cargoReadyForDeparture,
    trackingShipmentPlanned: input.businessRules.trackingShipmentPlanned,
    approvedComplianceEvidencePresent: input.businessRules.approvedComplianceEvidencePresent,
    openComplianceReviewBlocked: input.businessRules.openComplianceReviewBlocked,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCargoTransportDepartAuditAfter(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingDepartureEventRecord;
  businessRules: CargoTransportDepartOutput["businessRules"];
  complianceEvidenceCounts: CargoComplianceEvidenceStatusCounts;
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    eventId: input.event.id,
    eventType: input.event.eventType,
    departedAt: toIsoStringOrNull(input.cargo.departedAt),
    departureReference: input.cargo.departureReference,
    departureLocationName: input.cargo.departureLocationName,
    departureOperatorName: input.cargo.departureOperatorName,
    carrierReference: input.cargo.carrierReference,
    approvedComplianceEvidence: input.complianceEvidenceCounts.approved,
    pendingComplianceEvidence: input.complianceEvidenceCounts.pendingReview,
    rejectedComplianceEvidence: input.complianceEvidenceCounts.rejected,
    departureAllowed: input.businessRules.departureAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.cargo.departureIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoTransportArriveAuditBefore(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  businessRules: CargoTransportArriveOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    departedAt: toIsoStringOrNull(input.cargo.departedAt),
    arrivalAllowed: input.businessRules.arrivalAllowed,
    cargoInTransport: input.businessRules.cargoInTransport,
    trackingShipmentInTransit: input.businessRules.trackingShipmentInTransit,
    arrivalAfterDeparture: input.businessRules.arrivalAfterDeparture,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCargoTransportArriveAuditAfter(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingLifecycleEventRecord;
  businessRules: CargoTransportArriveOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    eventId: input.event.id,
    eventType: input.event.eventType,
    arrivedAt: toIsoStringOrNull(input.cargo.arrivedAt),
    arrivalReference: input.cargo.arrivalReference,
    arrivalLocationName: input.cargo.arrivalLocationName,
    arrivalOperatorName: input.cargo.arrivalOperatorName,
    actualArrivalAt: toIsoStringOrNull(input.shipment.actualArrivalAt),
    arrivalAllowed: input.businessRules.arrivalAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.cargo.arrivalIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoOperationalHandoffRecordAuditBefore(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  duplicateReference: CargoOperationalHandoffRecord | null;
  businessRules: CargoOperationalHandoffRecordOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    custodyOwnerName: input.cargo.custodyOwnerName,
    departedAt: toIsoStringOrNull(input.cargo.departedAt),
    arrivedAt: toIsoStringOrNull(input.cargo.arrivedAt),
    duplicateHandoffId: input.duplicateReference?.id ?? null,
    handoffAllowed: input.businessRules.handoffAllowed,
    cargoInTransport: input.businessRules.cargoInTransport,
    trackingShipmentInTransit: input.businessRules.trackingShipmentInTransit,
    currentCustodyMatched: input.businessRules.currentCustodyMatched,
    custodyChanged: input.businessRules.custodyChanged,
    conditionAccepted: input.businessRules.conditionAccepted,
    duplicateReferenceBlocked: input.businessRules.duplicateReferenceBlocked,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCargoOperationalHandoffRecordAuditAfter(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  handoff: CargoOperationalHandoffRecord;
  event: TrackingLifecycleEventRecord;
  businessRules: CargoOperationalHandoffRecordOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    handoffId: input.handoff.id,
    handoffType: input.handoff.handoffType,
    handoffReference: input.handoff.handoffReference,
    fromCustodyOwnerName: input.handoff.fromCustodyOwnerName,
    toCustodyOwnerName: input.handoff.toCustodyOwnerName,
    custodyOwnerName: input.cargo.custodyOwnerName,
    conditionStatus: input.handoff.conditionStatus,
    eventId: input.event.id,
    eventType: input.event.eventType,
    handoffAt: input.handoff.handoffAt.toISOString(),
    handoffAllowed: input.businessRules.handoffAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.handoff.recordIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoDeliveryCompleteAuditBefore(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  businessRules: CargoDeliveryCompleteOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    arrivedAt: toIsoStringOrNull(input.cargo.arrivedAt),
    conditionStatus: input.cargo.conditionStatus,
    deliveryAllowed: input.businessRules.deliveryAllowed,
    cargoArrivedForDelivery: input.businessRules.cargoArrivedForDelivery,
    trackingShipmentArrived: input.businessRules.trackingShipmentArrived,
    deliveryAfterArrival: input.businessRules.deliveryAfterArrival,
    deliveryConditionAccepted: input.businessRules.deliveryConditionAccepted,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCargoDeliveryCompleteAuditAfter(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  event: TrackingLifecycleEventRecord;
  businessRules: CargoDeliveryCompleteOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    eventId: input.event.id,
    eventType: input.event.eventType,
    deliveredAt: toIsoStringOrNull(input.cargo.deliveredAt),
    deliveryReference: input.cargo.deliveryReference,
    receivedByName: input.cargo.receivedByName,
    deliveryNotes: input.cargo.deliveryNotes,
    conditionStatus: input.cargo.conditionStatus,
    deliveryAllowed: input.businessRules.deliveryAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.cargo.deliveryIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoDeliveryExceptionRecordAuditBefore(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  openException: CargoDeliveryExceptionRecord | null;
  businessRules: CargoDeliveryExceptionRecordOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    conditionStatus: input.cargo.conditionStatus,
    requiresInspection: input.cargo.requiresInspection,
    trackingShipmentId: input.cargo.trackingShipmentId,
    shipmentStatus: input.shipment.status,
    arrivedAt: toIsoStringOrNull(input.cargo.arrivedAt),
    openExceptionId: input.openException?.id ?? null,
    exceptionAccepted: input.businessRules.exceptionAccepted,
    cargoArrivedForException: input.businessRules.cargoArrivedForException,
    trackingShipmentArrived: input.businessRules.trackingShipmentArrived,
    openExceptionBlocked: input.businessRules.openExceptionBlocked,
    exceptionAfterArrival: input.businessRules.exceptionAfterArrival,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCargoDeliveryExceptionRecordAuditAfter(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  exception: CargoDeliveryExceptionRecord;
  event: TrackingLifecycleEventRecord;
  businessRules: CargoDeliveryExceptionRecordOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    conditionStatus: input.cargo.conditionStatus,
    requiresInspection: input.cargo.requiresInspection,
    shipmentStatus: input.shipment.status,
    exceptionId: input.exception.id,
    exceptionType: input.exception.exceptionType,
    deliveryConditionStatus: input.exception.deliveryConditionStatus,
    exceptionStatus: input.exception.status,
    evidenceReference: input.exception.evidenceReference,
    claimReference: input.exception.claimReference,
    eventId: input.event.id,
    eventType: input.event.eventType,
    occurredAt: input.exception.occurredAt.toISOString(),
    exceptionAccepted: input.businessRules.exceptionAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.exception.recordIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoDeliveryExceptionResolveAuditBefore(input: {
  exception: CargoDeliveryExceptionWithCargo;
  shipment: TrackingShipmentRecord;
  businessRules: CargoDeliveryExceptionResolveOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.exception.cargo.id,
    cargoReference: input.exception.cargo.cargoReference,
    cargoStatus: input.exception.cargo.status,
    conditionStatus: input.exception.cargo.conditionStatus,
    requiresInspection: input.exception.cargo.requiresInspection,
    shipmentStatus: input.shipment.status,
    exceptionId: input.exception.id,
    exceptionStatus: input.exception.status,
    exceptionType: input.exception.exceptionType,
    occurredAt: input.exception.occurredAt.toISOString(),
    resolutionAllowed: input.businessRules.resolutionAllowed,
    openException: input.businessRules.openException,
    cargoHeldForInspection: input.businessRules.cargoHeldForInspection,
    trackingShipmentException: input.businessRules.trackingShipmentException,
    resolutionAfterException: input.businessRules.resolutionAfterException,
    cargoRestoredForDelivery: input.businessRules.cargoRestoredForDelivery,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCargoDeliveryExceptionResolveAuditAfter(input: {
  cargo: CargoRecord;
  shipment: TrackingShipmentRecord;
  exception: CargoDeliveryExceptionRecord;
  event: TrackingLifecycleEventRecord;
  businessRules: CargoDeliveryExceptionResolveOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    conditionStatus: input.cargo.conditionStatus,
    requiresInspection: input.cargo.requiresInspection,
    shipmentStatus: input.shipment.status,
    exceptionId: input.exception.id,
    exceptionStatus: input.exception.status,
    resolutionCode: input.exception.resolutionCode,
    resolutionReference: input.exception.resolutionReference,
    resolvedAt: toIsoStringOrNull(input.exception.resolvedAt),
    eventId: input.event.id,
    eventType: input.event.eventType,
    resolutionAllowed: input.businessRules.resolutionAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.exception.resolveIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoClaimSettlementRecordAuditBefore(input: {
  exception: CargoDeliveryExceptionWithCargo;
  duplicateSettlement: CargoClaimSettlementRecord | null;
  duplicateReference: CargoClaimSettlementRecord | null;
  businessRules: CargoClaimSettlementRecordOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.exception.cargoId,
    cargoReference: input.exception.cargo.cargoReference,
    cargoStatus: input.exception.cargo.status,
    exceptionId: input.exception.id,
    exceptionStatus: input.exception.status,
    resolutionCode: input.exception.resolutionCode,
    claimReference: input.exception.claimReference,
    resolvedAt: toIsoStringOrNull(input.exception.resolvedAt),
    duplicateSettlementId: input.duplicateSettlement?.id ?? null,
    duplicateReferenceSettlementId: input.duplicateReference?.id ?? null,
    settlementAllowed: input.businessRules.settlementAllowed,
    resolvedException: input.businessRules.resolvedException,
    claimReferenceMatched: input.businessRules.claimReferenceMatched,
    claimResolutionAccepted: input.businessRules.claimResolutionAccepted,
    duplicateSettlementBlocked: input.businessRules.duplicateSettlementBlocked,
    duplicateReferenceBlocked: input.businessRules.duplicateReferenceBlocked,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createCargoClaimSettlementRecordAuditAfter(input: {
  exception: CargoDeliveryExceptionWithCargo;
  settlement: CargoClaimSettlementRecord;
  businessRules: CargoClaimSettlementRecordOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    cargoId: input.exception.cargoId,
    cargoReference: input.exception.cargo.cargoReference,
    exceptionId: input.exception.id,
    settlementId: input.settlement.id,
    claimReference: input.settlement.claimReference,
    settlementReference: input.settlement.settlementReference,
    settlementType: input.settlement.settlementType,
    settlementStatus: input.settlement.settlementStatus,
    currencyCode: input.settlement.currencyCode,
    settlementAmount: Number(input.settlement.settlementAmount),
    settledByName: input.settlement.settledByName,
    counterpartyName: input.settlement.counterpartyName,
    settledAt: input.settlement.settledAt.toISOString(),
    settlementAllowed: input.businessRules.settlementAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.settlement.recordIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

function createCargoComplianceEvidenceRecordAuditAfter(input: {
  evidence: CargoComplianceEvidenceRecord;
  businessRules: CargoComplianceEvidenceRecordOutput["businessRules"];
  cargo: CargoRecord;
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    hazardous: input.cargo.hazardous,
    evidenceId: input.evidence.id,
    evidenceType: input.evidence.evidenceType,
    documentReference: input.evidence.documentReference,
    documentTitle: input.evidence.documentTitle,
    issuerName: input.evidence.issuerName,
    issuedAt: toIsoStringOrNull(input.evidence.issuedAt),
    expiresAt: toIsoStringOrNull(input.evidence.expiresAt),
    status: input.evidence.status,
    evidenceAccepted: input.businessRules.evidenceAccepted,
    reviewRequired: input.businessRules.reviewRequired,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.evidence.recordIdempotencyKey,
    sourceSystem: input.evidence.sourceSystem,
  };
}

function createCargoComplianceEvidenceVerifyAuditBefore(
  evidence: CargoComplianceEvidenceWithCargo,
): AuditJsonValue {
  return {
    cargoId: evidence.cargoId,
    cargoReference: evidence.cargo.cargoReference,
    cargoStatus: evidence.cargo.status,
    evidenceId: evidence.id,
    evidenceType: evidence.evidenceType,
    documentReference: evidence.documentReference,
    status: evidence.status,
    reviewerName: evidence.reviewerName,
    reviewReference: evidence.reviewReference,
    reviewedAt: toIsoStringOrNull(evidence.reviewedAt),
    rejectionReason: evidence.rejectionReason,
    verifyIdempotencyKey: evidence.verifyIdempotencyKey,
  };
}

function createCargoComplianceEvidenceVerifyAuditAfter(input: {
  evidence: CargoComplianceEvidenceRecord;
  businessRules: CargoComplianceEvidenceVerifyOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.evidence.cargoId,
    evidenceId: input.evidence.id,
    evidenceType: input.evidence.evidenceType,
    documentReference: input.evidence.documentReference,
    status: input.evidence.status,
    reviewerName: input.evidence.reviewerName,
    reviewReference: input.evidence.reviewReference,
    reviewSummary: input.evidence.reviewSummary,
    rejectionReason: input.evidence.rejectionReason,
    reviewedAt: toIsoStringOrNull(input.evidence.reviewedAt),
    verificationAllowed: input.businessRules.verificationAllowed,
    evidenceApproved: input.businessRules.evidenceApproved,
    evidenceRejected: input.businessRules.evidenceRejected,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.evidence.verifyIdempotencyKey,
    sourceSystem: input.evidence.sourceSystem,
  };
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
