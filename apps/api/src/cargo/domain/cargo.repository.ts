import type { PrismaTx } from "@saptm/database";
import type { CargoEntity } from "./cargo.entity.js";
import type {
  CargoClaimSettlementRecord,
  CargoComplianceEvidenceRecord,
  CargoDeliveryExceptionRecord,
  CargoOperationalHandoffRecord,
  CargoOverviewRawData,
  CargoRecord,
} from "./dto.js";

export const CARGO_REPOSITORY = Symbol("CargoRepository");

export interface CargoRepository {
  // --- Domain entity methods ---
  findCargoEntityByOrganizationId(orgId: string): Promise<CargoEntity[]>;
  findCargoEntityById(id: string): Promise<CargoEntity | null>;
  findCargoEntityByReference(orgId: string, reference: string): Promise<CargoEntity | null>;
  saveCargoEntity(entity: CargoEntity): Promise<void>;
  deleteCargoEntity(id: string): Promise<void>;

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;

  // --- Existing data mapper methods ---
  findById(organizationId: string, id: string): Promise<CargoRecord | null>;
  findByIdempotencyKey(organizationId: string, key: string): Promise<CargoRecord | null>;
  findByReleaseIdempotencyKey(organizationId: string, key: string): Promise<CargoRecord | null>;
  findByTransportPlanIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoRecord | null>;
  findByDepartureIdempotencyKey(organizationId: string, key: string): Promise<CargoRecord | null>;
  findByArrivalIdempotencyKey(organizationId: string, key: string): Promise<CargoRecord | null>;
  findByDeliveryIdempotencyKey(organizationId: string, key: string): Promise<CargoRecord | null>;
  findExistingReference(
    organizationId: string,
    cargoReference: string,
  ): Promise<{ id: string } | null>;
  getComplianceEvidenceStatusCounts(
    organizationId: string,
    cargoId: string,
  ): Promise<{ status: string; count: number }[]>;
  getComplianceEvidenceOverview(
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
  }>;
  findOpenDeliveryExceptionForCargo(
    organizationId: string,
    cargoId: string,
  ): Promise<CargoDeliveryExceptionRecord | null>;
  countDeliveryExceptionsByStatus(
    organizationId: string,
  ): Promise<{ status: string; count: number }[]>;
  findRecentDeliveryExceptions(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<CargoDeliveryExceptionRecord[]>;
  findOperationalHandoffByRecordIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoOperationalHandoffRecord | null>;
  findDeliveryExceptionByRecordIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoDeliveryExceptionRecord | null>;
  findDeliveryExceptionByResolveIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoDeliveryExceptionRecord | null>;
  findDeliveryExceptionById(
    organizationId: string,
    id: string,
  ): Promise<(CargoDeliveryExceptionRecord & { cargo: CargoRecord }) | null>;
  findClaimSettlementByRecordIdempotencyKey(
    organizationId: string,
    key: string,
  ): Promise<CargoClaimSettlementRecord | null>;
  findClaimSettlementByExceptionId(
    organizationId: string,
    exceptionId: string,
  ): Promise<CargoClaimSettlementRecord | null>;
  findClaimSettlementBySettlementReference(
    organizationId: string,
    ref: string,
  ): Promise<CargoClaimSettlementRecord | null>;
  findComplianceEvidenceById(
    orgId: string,
    id: string,
  ): Promise<CargoComplianceEvidenceRecord | null>;
  findComplianceEvidenceByRecordIdempotencyKey(
    orgId: string,
    key: string,
  ): Promise<CargoComplianceEvidenceRecord | null>;
  findComplianceEvidenceByVerifyIdempotencyKey(
    orgId: string,
    key: string,
  ): Promise<CargoComplianceEvidenceRecord | null>;
  findComplianceEvidenceMany(
    orgId: string,
    filters: {
      cargoId: string | undefined;
      evidenceType: string | undefined;
      status: string | undefined;
      limit: number;
      offset: number;
    },
  ): Promise<CargoComplianceEvidenceRecord[]>;
  countComplianceEvidence(
    orgId: string,
    filters: {
      cargoId: string | undefined;
      evidenceType: string | undefined;
      status: string | undefined;
    },
  ): Promise<number>;
  getOverview(organizationId: string, limit: number, offset: number): Promise<CargoOverviewRawData>;

  // Transactional write operations - receive a transaction client
  createCargo(
    tx: PrismaTx,
    data: {
      organizationId: string;
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
  ): Promise<CargoRecord>;

  updateCargo(tx: PrismaTx, id: string, data: Record<string, unknown>): Promise<CargoRecord>;

  createDeliveryException(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoDeliveryExceptionRecord>;

  updateDeliveryException(tx: PrismaTx, id: string, data: Record<string, unknown>): Promise<void>;

  createOperationalHandoff(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoOperationalHandoffRecord>;

  createClaimSettlement(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoClaimSettlementRecord>;

  createComplianceEvidence(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<CargoComplianceEvidenceRecord>;

  updateComplianceEvidence(tx: PrismaTx, id: string, data: Record<string, unknown>): Promise<void>;
}
