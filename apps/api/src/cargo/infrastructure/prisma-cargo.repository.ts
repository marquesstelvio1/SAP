import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";
import type { CargoRepository } from "../domain/cargo.repository.js";
import {
  type CargoClaimSettlementRecord,
  type CargoComplianceEvidenceRecord,
  type CargoDeliveryExceptionRecord,
  type CargoEntity,
  type CargoOperationalHandoffRecord,
  type CargoOverviewRawData,
  type CargoRecord,
  CargoReference,
  type CargoStatus,
  type GrossWeight,
} from "../domain/index.js";

@Injectable()
export class PrismaCargoRepository implements CargoRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  private mapCargo(raw: Record<string, unknown>): CargoRecord {
    return {
      id: raw.id as string,
      organizationId: raw.organizationId as string,
      teamId: (raw.teamId as string) ?? null,
      cargoReference: raw.cargoReference as string,
      externalReference: (raw.externalReference as string) ?? null,
      cargoDescription: raw.cargoDescription as string,
      cargoType: raw.cargoType as CargoRecord["cargoType"],
      status: raw.status as CargoRecord["status"],
      customsStatus: raw.customsStatus as CargoRecord["customsStatus"],
      customsReference: (raw.customsReference as string) ?? null,
      conditionStatus: raw.conditionStatus as CargoRecord["conditionStatus"],
      grossWeightKg: raw.grossWeightKg,
      packageCount: raw.packageCount as number,
      volumeM3: (raw.volumeM3 as unknown) ?? null,
      hazardous: raw.hazardous as boolean,
      unNumber: (raw.unNumber as string) ?? null,
      hazardClass: (raw.hazardClass as string) ?? null,
      requiresInspection: raw.requiresInspection as boolean,
      shipperName: raw.shipperName as string,
      consigneeName: raw.consigneeName as string,
      originName: raw.originName as string,
      destinationName: raw.destinationName as string,
      custodyOwnerName: raw.custodyOwnerName as string,
      priority: raw.priority as number,
      expectedReadyAt: (raw.expectedReadyAt as Date) ?? null,
      sourceSystem: raw.sourceSystem as string,
      registrationIdempotencyKey: (raw.registrationIdempotencyKey as string) ?? null,
      releaseIdempotencyKey: (raw.releaseIdempotencyKey as string) ?? null,
      releaseReference: (raw.releaseReference as string) ?? null,
      releaseReason: (raw.releaseReason as string) ?? null,
      transportPlanIdempotencyKey: (raw.transportPlanIdempotencyKey as string) ?? null,
      departureIdempotencyKey: (raw.departureIdempotencyKey as string) ?? null,
      arrivalIdempotencyKey: (raw.arrivalIdempotencyKey as string) ?? null,
      deliveryIdempotencyKey: (raw.deliveryIdempotencyKey as string) ?? null,
      transportPlanningReference: (raw.transportPlanningReference as string) ?? null,
      transportOwnerTeam: (raw.transportOwnerTeam as string) ?? null,
      departureReference: (raw.departureReference as string) ?? null,
      departureLocationName: (raw.departureLocationName as string) ?? null,
      departureOperatorName: (raw.departureOperatorName as string) ?? null,
      carrierReference: (raw.carrierReference as string) ?? null,
      arrivalReference: (raw.arrivalReference as string) ?? null,
      arrivalLocationName: (raw.arrivalLocationName as string) ?? null,
      arrivalOperatorName: (raw.arrivalOperatorName as string) ?? null,
      deliveryReference: (raw.deliveryReference as string) ?? null,
      receivedByName: (raw.receivedByName as string) ?? null,
      deliveryNotes: (raw.deliveryNotes as string) ?? null,
      trackingShipmentId: (raw.trackingShipmentId as string) ?? null,
      createdAt: raw.createdAt as Date,
      releasedAt: (raw.releasedAt as Date) ?? null,
      transportPlannedAt: (raw.transportPlannedAt as Date) ?? null,
      departedAt: (raw.departedAt as Date) ?? null,
      arrivedAt: (raw.arrivedAt as Date) ?? null,
      deliveredAt: (raw.deliveredAt as Date) ?? null,
      updatedAt: raw.updatedAt as Date,
    };
  }

  async findById(organizationId: string, id: string): Promise<CargoRecord | null> {
    const raw = await this.database.cargo.findFirst({
      where: { id, organizationId },
    });
    return raw ? this.mapCargo(raw as unknown as Record<string, unknown>) : null;
  }

  async findByIdempotencyKey(organizationId: string, key: string): Promise<CargoRecord | null> {
    const raw = await this.database.cargo.findFirst({
      where: { organizationId, registrationIdempotencyKey: key },
    });
    return raw ? this.mapCargo(raw as unknown as Record<string, unknown>) : null;
  }

  async findByReleaseIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoRecord | null> {
    const raw = await this.database.cargo.findFirst({
      where: { organizationId, releaseIdempotencyKey: key },
    });
    return raw ? this.mapCargo(raw as unknown as Record<string, unknown>) : null;
  }

  async findByTransportPlanIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoRecord | null> {
    const raw = await this.database.cargo.findFirst({
      where: { organizationId, transportPlanIdempotencyKey: key },
    });
    return raw ? this.mapCargo(raw as unknown as Record<string, unknown>) : null;
  }

  async findByDepartureIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoRecord | null> {
    const raw = await this.database.cargo.findFirst({
      where: { organizationId, departureIdempotencyKey: key },
    });
    return raw ? this.mapCargo(raw as unknown as Record<string, unknown>) : null;
  }

  async findByArrivalIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoRecord | null> {
    const raw = await this.database.cargo.findFirst({
      where: { organizationId, arrivalIdempotencyKey: key },
    });
    return raw ? this.mapCargo(raw as unknown as Record<string, unknown>) : null;
  }

  async findByDeliveryIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoRecord | null> {
    const raw = await this.database.cargo.findFirst({
      where: { organizationId, deliveryIdempotencyKey: key },
    });
    return raw ? this.mapCargo(raw as unknown as Record<string, unknown>) : null;
  }

  async findExistingReference(
    organizationId: string,
    cargoReference: string,
  ): Promise<{ id: string } | null> {
    return this.database.cargo.findFirst({
      where: { organizationId, cargoReference },
      select: { id: true },
    }) as unknown as Promise<{ id: string } | null>;
  }

  async getComplianceEvidenceStatusCounts(
    organizationId: string,
    cargoId: string,
  ): Promise<{ status: string; count: number }[]> {
    const groups = await this.database.cargoComplianceEvidence.groupBy({
      by: ["status"],
      where: { organizationId, cargoId },
      _count: { _all: true },
    });
    return (groups as Array<{ status: string; _count: { _all: number } }>).map((g) => ({
      status: g.status,
      count: g._count._all,
    }));
  }

  async getComplianceEvidenceOverview(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<{
    statusGroups: { status: string; count: number }[];
    typeGroups: { evidenceType: string; count: number }[];
    expiringCount: number;
    expiredCount: number;
    totalCount: number;
    recentEvidence: CargoComplianceEvidenceRecord[];
  }> {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [statusGroups, typeGroups, expiringCount, expiredCount, totalCount, recentEvidence] =
      await Promise.all([
        this.database.cargoComplianceEvidence.groupBy({
          by: ["status"],
          where: { organizationId },
          _count: { _all: true },
        }),
        this.database.cargoComplianceEvidence.groupBy({
          by: ["evidenceType"],
          where: { organizationId },
          _count: { _all: true },
        }),
        this.database.cargoComplianceEvidence.count({
          where: {
            organizationId,
            expiresAt: { gte: now, lte: in7Days },
          },
        }),
        this.database.cargoComplianceEvidence.count({
          where: {
            organizationId,
            expiresAt: { lt: now },
          },
        }),
        this.database.cargoComplianceEvidence.count({
          where: { organizationId },
        }),
        this.database.cargoComplianceEvidence.findMany({
          where: { organizationId },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          skip: offset,
          take: limit,
        }),
      ]);

    return {
      statusGroups: (statusGroups as Array<{ status: string; _count: { _all: number } }>).map(
        (g) => ({
          status: g.status,
          count: g._count._all,
        }),
      ),
      typeGroups: (typeGroups as Array<{ evidenceType: string; _count: { _all: number } }>).map(
        (g) => ({
          evidenceType: g.evidenceType,
          count: g._count._all,
        }),
      ),
      expiringCount,
      expiredCount,
      totalCount,
      recentEvidence: recentEvidence as unknown as CargoComplianceEvidenceRecord[],
    };
  }

  async findOpenDeliveryExceptionForCargo(
    organizationId: string,
    cargoId: string,
  ): Promise<CargoDeliveryExceptionRecord | null> {
    const raw = await this.database.cargoDeliveryException.findFirst({
      where: { organizationId, cargoId, status: "open" },
    });
    return raw as unknown as CargoDeliveryExceptionRecord | null;
  }

  async findOperationalHandoffByRecordIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoOperationalHandoffRecord | null> {
    const raw = await this.database.cargoOperationalHandoff.findFirst({
      where: { organizationId, recordIdempotencyKey: key },
    });
    return raw as unknown as CargoOperationalHandoffRecord | null;
  }

  async findDeliveryExceptionByRecordIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoDeliveryExceptionRecord | null> {
    const raw = await this.database.cargoDeliveryException.findFirst({
      where: { organizationId, recordIdempotencyKey: key },
    });
    return raw as unknown as CargoDeliveryExceptionRecord | null;
  }

  async findDeliveryExceptionByResolveIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoDeliveryExceptionRecord | null> {
    const raw = await this.database.cargoDeliveryException.findFirst({
      where: { organizationId, resolveIdempotencyKey: key },
    });
    return raw as unknown as CargoDeliveryExceptionRecord | null;
  }

  async findDeliveryExceptionById(
    organizationId: string,
    id: string,
  ): Promise<(CargoDeliveryExceptionRecord & { cargo: CargoRecord }) | null> {
    const raw = await this.database.cargoDeliveryException.findFirst({
      where: { id, organizationId },
      include: { cargo: true },
    });
    if (!raw) return null;
    return {
      ...(raw as unknown as CargoDeliveryExceptionRecord),
      cargo: this.mapCargo((raw as Record<string, unknown>).cargo as Record<string, unknown>),
    };
  }

  async countDeliveryExceptionsByStatus(
    organizationId: string,
  ): Promise<{ status: string; count: number }[]> {
    const groups = await this.database.cargoDeliveryException.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    });
    return (groups as Array<{ status: string; _count: { _all: number } }>).map((g) => ({
      status: g.status,
      count: g._count._all,
    }));
  }

  async findRecentDeliveryExceptions(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<CargoDeliveryExceptionRecord[]> {
    const raws = await this.database.cargoDeliveryException.findMany({
      where: { organizationId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    });
    return raws as unknown as CargoDeliveryExceptionRecord[];
  }

  async findClaimSettlementByRecordIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoClaimSettlementRecord | null> {
    const raw = await this.database.cargoClaimSettlement.findFirst({
      where: { organizationId, recordIdempotencyKey: key },
    });
    return raw as unknown as CargoClaimSettlementRecord | null;
  }

  async findClaimSettlementByExceptionId(
    organizationId: string,
    exceptionId: string,
  ): Promise<CargoClaimSettlementRecord | null> {
    const raw = await this.database.cargoClaimSettlement.findFirst({
      where: { organizationId, deliveryExceptionId: exceptionId },
    });
    return raw as unknown as CargoClaimSettlementRecord | null;
  }

  async findClaimSettlementBySettlementReference(
    organizationId: string,
    ref: string,
  ): Promise<CargoClaimSettlementRecord | null> {
    const raw = await this.database.cargoClaimSettlement.findFirst({
      where: { organizationId, settlementReference: ref },
    });
    return raw as unknown as CargoClaimSettlementRecord | null;
  }

  async findComplianceEvidenceById(
    orgId: string,
    id: string,
  ): Promise<CargoComplianceEvidenceRecord | null> {
    const raw = await this.database.cargoComplianceEvidence.findFirst({
      where: { organizationId: orgId, id },
    });
    return raw as unknown as CargoComplianceEvidenceRecord | null;
  }

  async findComplianceEvidenceByRecordIdempotencyKey(
    orgId: string,
    key: string,
  ): Promise<CargoComplianceEvidenceRecord | null> {
    const raw = await this.database.cargoComplianceEvidence.findFirst({
      where: { organizationId: orgId, recordIdempotencyKey: key },
    });
    return raw as unknown as CargoComplianceEvidenceRecord | null;
  }

  async findComplianceEvidenceByVerifyIdempotencyKey(
    orgId: string,
    key: string,
  ): Promise<CargoComplianceEvidenceRecord | null> {
    const raw = await this.database.cargoComplianceEvidence.findFirst({
      where: { organizationId: orgId, verifyIdempotencyKey: key },
    });
    return raw as unknown as CargoComplianceEvidenceRecord | null;
  }

  async findComplianceEvidenceMany(
    orgId: string,
    filters: {
      cargoId: string | undefined;
      evidenceType: string | undefined;
      status: string | undefined;
      limit: number;
      offset: number;
    },
  ): Promise<CargoComplianceEvidenceRecord[]> {
    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters.cargoId !== undefined) {
      where.cargoId = filters.cargoId;
    }

    if (filters.evidenceType !== undefined) {
      where.evidenceType = filters.evidenceType;
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    const raw = await this.database.cargoComplianceEvidence.findMany({
      where: where as never,
      orderBy: { recordedAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    });

    return raw as unknown as CargoComplianceEvidenceRecord[];
  }

  async countComplianceEvidence(
    orgId: string,
    filters: {
      cargoId: string | undefined;
      evidenceType: string | undefined;
      status: string | undefined;
    },
  ): Promise<number> {
    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters.cargoId !== undefined) {
      where.cargoId = filters.cargoId;
    }

    if (filters.evidenceType !== undefined) {
      where.evidenceType = filters.evidenceType;
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    const count = await this.database.cargoComplianceEvidence.count({
      where: where as never,
    });

    return count;
  }

  async getOverview(
    organizationId: string,
    limit: number,
    offset: number,
    teamId?: string,
  ): Promise<CargoOverviewRawData> {
    const where: Record<string, unknown> = { organizationId };

    if (teamId !== undefined) {
      where.teamId = teamId;
    }

    const hazardousWhere: Record<string, unknown> = { ...where, hazardous: true };
    const inspectionWhere: Record<string, unknown> = { ...where, requiresInspection: true };

    const [statusGroups, hazardousCount, inspectionRequiredCount, totalCount, recentCargo] =
      await Promise.all([
        this.database.cargo.groupBy({
          by: ["status"],
          where: where as never,
          _count: { _all: true },
        }),
        this.database.cargo.count({
          where: hazardousWhere as never,
        }),
        this.database.cargo.count({
          where: inspectionWhere as never,
        }),
        this.database.cargo.count({
          where: where as never,
        }),
        this.database.cargo.findMany({
          where: where as never,
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          skip: offset,
          take: limit,
        }),
      ]);

    return {
      statusGroups: (statusGroups as Array<{ status: string; _count: { _all: number } }>).map(
        (g) => ({
          status: g.status as CargoStatus,
          _count: { _all: g._count._all },
        }),
      ),
      hazardousCount,
      inspectionRequiredCount,
      totalCount,
      recentCargo: recentCargo.map((c: Record<string, unknown>) =>
        this.mapCargo(c as unknown as Record<string, unknown>),
      ),
    };
  }

  async createCargo(
    tx: PrismaTx,
    data: {
      organizationId: string;
      teamId?: string;
      cargoReference: string;
      cargoDescription: string;
      cargoType: string;
      status: string;
      customsStatus: string;
      conditionStatus: string;
      grossWeightKg: unknown;
      packageCount: number;
      hazardous: boolean;
      requiresInspection: boolean;
      shipperName: string;
      consigneeName: string;
      originName: string;
      destinationName: string;
      custodyOwnerName: string;
      priority: number;
      sourceSystem: string;
      registrationIdempotencyKey: string;
      externalReference?: string;
      customsReference?: string;
      unNumber?: string;
      hazardClass?: string;
      volumeM3?: unknown;
      expectedReadyAt?: Date;
    },
  ): Promise<CargoRecord> {
    const raw = await tx.cargo.create({ data: data as never });
    return this.mapCargo(raw as unknown as Record<string, unknown>);
  }

  async updateCargo(tx: PrismaTx, id: string, data: Record<string, unknown>): Promise<CargoRecord> {
    const raw = await tx.cargo.update({ where: { id }, data: data as never });
    return this.mapCargo(raw as unknown as Record<string, unknown>);
  }

  async createDeliveryException(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoDeliveryExceptionRecord> {
    const raw = await tx.cargoDeliveryException.create({ data: data as never });
    return raw as unknown as CargoDeliveryExceptionRecord;
  }

  async updateDeliveryException(
    tx: PrismaTx,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await tx.cargoDeliveryException.update({ where: { id }, data: data as never });
  }

  async createOperationalHandoff(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoOperationalHandoffRecord> {
    const raw = await tx.cargoOperationalHandoff.create({ data: data as never });
    return raw as unknown as CargoOperationalHandoffRecord;
  }

  async createClaimSettlement(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoClaimSettlementRecord> {
    const raw = await tx.cargoClaimSettlement.create({ data: data as never });
    return raw as unknown as CargoClaimSettlementRecord;
  }

  async createComplianceEvidence(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoComplianceEvidenceRecord> {
    const raw = await tx.cargoComplianceEvidence.create({ data: data as never });
    return raw as unknown as CargoComplianceEvidenceRecord;
  }

  async updateComplianceEvidence(
    tx: PrismaTx,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await tx.cargoComplianceEvidence.update({ where: { id }, data: data as never });
  }

  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.database.$transaction(fn);
  }

  // --- Domain entity methods ---

  private mapCargoEntity(raw: Record<string, unknown>): CargoEntity {
    const cargoReference = CargoReference.from(raw.cargoReference as string);

    return {
      id: raw.id as string,
      organizationId: raw.organizationId as string,
      teamId: (raw.teamId as string) ?? null,
      cargoReference,
      externalReference: (raw.externalReference as string) ?? null,
      cargoDescription: raw.cargoDescription as string,
      cargoType: raw.cargoType as CargoEntity["cargoType"],
      status: raw.status as CargoEntity["status"],
      customsStatus: raw.customsStatus as CargoEntity["customsStatus"],
      customsReference: (raw.customsReference as string) ?? null,
      conditionStatus: raw.conditionStatus as CargoEntity["conditionStatus"],
      grossWeight: { value: Number(raw.grossWeightKg), unit: "kg" } as GrossWeight,
      packageCount: raw.packageCount as number,
      volumeM3: (raw.volumeM3 as number) ?? null,
      hazardous: raw.hazardous as boolean,
      unNumber: (raw.unNumber as string) ?? null,
      hazardClass: (raw.hazardClass as string) ?? null,
      requiresInspection: raw.requiresInspection as boolean,
      shipperName: raw.shipperName as string,
      consigneeName: raw.consigneeName as string,
      originName: raw.originName as string,
      destinationName: raw.destinationName as string,
      custodyOwnerName: raw.custodyOwnerName as string,
      priority: raw.priority as number,
      expectedReadyAt: (raw.expectedReadyAt as Date) ?? null,
      sourceSystem: raw.sourceSystem as string,
      registrationIdempotencyKey: (raw.registrationIdempotencyKey as string) ?? null,
      releaseIdempotencyKey: (raw.releaseIdempotencyKey as string) ?? null,
      releaseReference: (raw.releaseReference as string) ?? null,
      releaseReason: (raw.releaseReason as string) ?? null,
      transportPlanIdempotencyKey: (raw.transportPlanIdempotencyKey as string) ?? null,
      departureIdempotencyKey: (raw.departureIdempotencyKey as string) ?? null,
      arrivalIdempotencyKey: (raw.arrivalIdempotencyKey as string) ?? null,
      deliveryIdempotencyKey: (raw.deliveryIdempotencyKey as string) ?? null,
      transportPlanningReference: (raw.transportPlanningReference as string) ?? null,
      transportOwnerTeam: (raw.transportOwnerTeam as string) ?? null,
      departureReference: (raw.departureReference as string) ?? null,
      departureLocationName: (raw.departureLocationName as string) ?? null,
      departureOperatorName: (raw.departureOperatorName as string) ?? null,
      carrierReference: (raw.carrierReference as string) ?? null,
      arrivalReference: (raw.arrivalReference as string) ?? null,
      arrivalLocationName: (raw.arrivalLocationName as string) ?? null,
      arrivalOperatorName: (raw.arrivalOperatorName as string) ?? null,
      deliveryReference: (raw.deliveryReference as string) ?? null,
      receivedByName: (raw.receivedByName as string) ?? null,
      deliveryNotes: (raw.deliveryNotes as string) ?? null,
      trackingShipmentId: (raw.trackingShipmentId as string) ?? null,
      registeredAt: (raw.registeredAt as Date) ?? null,
      releasedAt: (raw.releasedAt as Date) ?? null,
      transportPlannedAt: (raw.transportPlannedAt as Date) ?? null,
      departedAt: (raw.departedAt as Date) ?? null,
      arrivedAt: (raw.arrivedAt as Date) ?? null,
      deliveredAt: (raw.deliveredAt as Date) ?? null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    };
  }

  async findCargoEntityByOrganizationId(orgId: string): Promise<CargoEntity[]> {
    const raws = await this.database.cargo.findMany({
      where: { organizationId: orgId },
    });
    return raws.map((r: Record<string, unknown>) => this.mapCargoEntity(r));
  }

  async findCargoEntityById(id: string): Promise<CargoEntity | null> {
    const raw = await this.database.cargo.findUnique({
      where: { id },
    });
    return raw ? this.mapCargoEntity(raw as unknown as Record<string, unknown>) : null;
  }

  async findCargoEntityByReference(orgId: string, reference: string): Promise<CargoEntity | null> {
    const raw = await this.database.cargo.findFirst({
      where: { organizationId: orgId, cargoReference: reference },
    });
    return raw ? this.mapCargoEntity(raw as unknown as Record<string, unknown>) : null;
  }

  async saveCargoEntity(entity: CargoEntity): Promise<void> {
    await this.database.cargo.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        organizationId: entity.organizationId,
        teamId: entity.teamId,
        cargoReference: entity.cargoReference.value,
        externalReference: entity.externalReference,
        cargoDescription: entity.cargoDescription,
        cargoType: entity.cargoType,
        status: entity.status,
        customsStatus: entity.customsStatus,
        customsReference: entity.customsReference,
        conditionStatus: entity.conditionStatus,
        grossWeightKg: entity.grossWeight.value,
        packageCount: entity.packageCount,
        volumeM3: entity.volumeM3,
        hazardous: entity.hazardous,
        unNumber: entity.unNumber,
        hazardClass: entity.hazardClass,
        requiresInspection: entity.requiresInspection,
        shipperName: entity.shipperName,
        consigneeName: entity.consigneeName,
        originName: entity.originName,
        destinationName: entity.destinationName,
        custodyOwnerName: entity.custodyOwnerName,
        priority: entity.priority,
        expectedReadyAt: entity.expectedReadyAt,
        sourceSystem: entity.sourceSystem,
        registrationIdempotencyKey: entity.registrationIdempotencyKey,
        releaseIdempotencyKey: entity.releaseIdempotencyKey,
        releaseReference: entity.releaseReference,
        releaseReason: entity.releaseReason,
        transportPlanIdempotencyKey: entity.transportPlanIdempotencyKey,
        departureIdempotencyKey: entity.departureIdempotencyKey,
        arrivalIdempotencyKey: entity.arrivalIdempotencyKey,
        deliveryIdempotencyKey: entity.deliveryIdempotencyKey,
        transportPlanningReference: entity.transportPlanningReference,
        transportOwnerTeam: entity.transportOwnerTeam,
        departureReference: entity.departureReference,
        departureLocationName: entity.departureLocationName,
        departureOperatorName: entity.departureOperatorName,
        carrierReference: entity.carrierReference,
        arrivalReference: entity.arrivalReference,
        arrivalLocationName: entity.arrivalLocationName,
        arrivalOperatorName: entity.arrivalOperatorName,
        deliveryReference: entity.deliveryReference,
        receivedByName: entity.receivedByName,
        deliveryNotes: entity.deliveryNotes,
        trackingShipmentId: entity.trackingShipmentId,
        registeredAt: entity.registeredAt,
        releasedAt: entity.releasedAt,
        transportPlannedAt: entity.transportPlannedAt,
        departedAt: entity.departedAt,
        arrivedAt: entity.arrivedAt,
        deliveredAt: entity.deliveredAt,
      },
      update: {
        teamId: entity.teamId,
        cargoReference: entity.cargoReference.value,
        externalReference: entity.externalReference,
        cargoDescription: entity.cargoDescription,
        cargoType: entity.cargoType,
        status: entity.status,
        customsStatus: entity.customsStatus,
        customsReference: entity.customsReference,
        conditionStatus: entity.conditionStatus,
        grossWeightKg: entity.grossWeight.value,
        packageCount: entity.packageCount,
        volumeM3: entity.volumeM3,
        hazardous: entity.hazardous,
        unNumber: entity.unNumber,
        hazardClass: entity.hazardClass,
        requiresInspection: entity.requiresInspection,
        shipperName: entity.shipperName,
        consigneeName: entity.consigneeName,
        originName: entity.originName,
        destinationName: entity.destinationName,
        custodyOwnerName: entity.custodyOwnerName,
        priority: entity.priority,
        expectedReadyAt: entity.expectedReadyAt,
        sourceSystem: entity.sourceSystem,
        registrationIdempotencyKey: entity.registrationIdempotencyKey,
        releaseIdempotencyKey: entity.releaseIdempotencyKey,
        releaseReference: entity.releaseReference,
        releaseReason: entity.releaseReason,
        transportPlanIdempotencyKey: entity.transportPlanIdempotencyKey,
        departureIdempotencyKey: entity.departureIdempotencyKey,
        arrivalIdempotencyKey: entity.arrivalIdempotencyKey,
        deliveryIdempotencyKey: entity.deliveryIdempotencyKey,
        transportPlanningReference: entity.transportPlanningReference,
        transportOwnerTeam: entity.transportOwnerTeam,
        departureReference: entity.departureReference,
        departureLocationName: entity.departureLocationName,
        departureOperatorName: entity.departureOperatorName,
        carrierReference: entity.carrierReference,
        arrivalReference: entity.arrivalReference,
        arrivalLocationName: entity.arrivalLocationName,
        arrivalOperatorName: entity.arrivalOperatorName,
        deliveryReference: entity.deliveryReference,
        receivedByName: entity.receivedByName,
        deliveryNotes: entity.deliveryNotes,
        trackingShipmentId: entity.trackingShipmentId,
        registeredAt: entity.registeredAt,
        releasedAt: entity.releasedAt,
        transportPlannedAt: entity.transportPlannedAt,
        departedAt: entity.departedAt,
        arrivedAt: entity.arrivedAt,
        deliveredAt: entity.deliveredAt,
      },
    });
  }

  async deleteCargoEntity(id: string): Promise<void> {
    await this.database.cargo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
