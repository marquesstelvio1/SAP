import type {
  cargoConditionStatuses,
  cargoCustomsStatuses,
  cargoStatuses,
  cargoTypes,
  trackingEventTypes,
  trackingShipmentStatuses,
  trackingTransportModes,
} from "@saptm/rpc";

export type CargoStatus = (typeof cargoStatuses)[number];
export type CargoType = (typeof cargoTypes)[number];
export type CargoCustomsStatus = (typeof cargoCustomsStatuses)[number];
export type CargoConditionStatus = (typeof cargoConditionStatuses)[number];
export type TrackingEventType = (typeof trackingEventTypes)[number];
export type TrackingShipmentStatus = (typeof trackingShipmentStatuses)[number];
export type TrackingTransportMode = (typeof trackingTransportModes)[number];

export class CargoReference {
  private constructor(readonly value: string) {}

  static create(value: string): CargoReference {
    const trimmed = value.trim().toUpperCase();

    if (trimmed.length < 3 || trimmed.length > 80) {
      throw new Error("cargo.reference.invalid_length");
    }

    return new CargoReference(trimmed);
  }

  static from(value: string): CargoReference {
    return new CargoReference(value);
  }

  equals(other: CargoReference): boolean {
    return this.value === other.value;
  }
}

export class GrossWeight {
  private constructor(
    readonly value: number,
    readonly unit: "kg",
  ) {}

  static kilograms(value: number): GrossWeight {
    if (value <= 0 || value > 1_000_000) {
      throw new Error("cargo.gross_weight.invalid");
    }

    return new GrossWeight(value, "kg");
  }

  toNumber(): number {
    return this.value;
  }
}

export interface CargoEntity {
  id: string;
  organizationId: string;
  teamId: string | null;
  cargoReference: CargoReference;
  externalReference: string | null;
  cargoDescription: string;
  cargoType: CargoType;
  status: CargoStatus;
  customsStatus: CargoCustomsStatus;
  customsReference: string | null;
  conditionStatus: CargoConditionStatus;
  grossWeight: GrossWeight;
  packageCount: number;
  volumeM3: number | null;
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
  registeredAt: Date | null;
  releasedAt: Date | null;
  transportPlannedAt: Date | null;
  departedAt: Date | null;
  arrivedAt: Date | null;
  deliveredAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TrackingShipmentEntity {
  id: string;
  organizationId: string;
  teamId: string | null;
  referenceCode: string;
  externalReference: string | null;
  cargoDescription: string;
  originName: string;
  destinationName: string;
  transportMode: TrackingTransportMode;
  status: TrackingShipmentStatus;
  priority: number;
  plannedDepartureAt: Date | null;
  estimatedArrivalAt: Date | null;
  actualArrivalAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type CargoComplianceEvidenceStatus =
  typeof import("@saptm/rpc").cargoComplianceEvidenceStatuses[number];
export type CargoComplianceEvidenceType =
  typeof import("@saptm/rpc").cargoComplianceEvidenceTypes[number];
export type CargoDeliveryExceptionType =
  typeof import("@saptm/rpc").cargoDeliveryExceptionTypes[number];
export type CargoDeliveryExceptionStatus =
  typeof import("@saptm/rpc").cargoDeliveryExceptionStatuses[number];
export type CargoDeliveryExceptionResolutionCode =
  typeof import("@saptm/rpc").cargoDeliveryExceptionResolutionCodes[number];
export type CargoOperationalHandoffType =
  typeof import("@saptm/rpc").cargoOperationalHandoffTypes[number];
export type CargoClaimSettlementType =
  typeof import("@saptm/rpc").cargoClaimSettlementTypes[number];
export type CargoClaimSettlementStatus =
  typeof import("@saptm/rpc").cargoClaimSettlementStatuses[number];

export interface CargoComplianceEvidenceEntity {
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
}

export interface CargoDeliveryExceptionEntity {
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
}

export interface CargoOperationalHandoffEntity {
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
}

export interface CargoClaimSettlementEntity {
  id: string;
  organizationId: string;
  cargoId: string;
  deliveryExceptionId: string;
  claimReference: string;
  settlementReference: string;
  settlementType: CargoClaimSettlementType;
  settlementStatus: CargoClaimSettlementStatus;
  currencyCode: string;
  settlementAmount: number;
  settledByName: string;
  counterpartyName: string;
  settlementSummary: string;
  settledAt: Date;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CargoComplianceEvidenceStatusCounts = {
  approved: number;
  pendingReview: number;
  rejected: number;
};

export type CargoStatusGroup = {
  status: CargoStatus;
  _count: {
    _all: number;
  };
};

export type CargoOverviewData = {
  statusGroups: readonly CargoStatusGroup[];
  hazardousCount: number;
  inspectionRequiredCount: number;
  recentCargo: readonly CargoEntity[];
  totalCount: number;
};

export type TrackingEventPayload = Record<string, unknown>;

export interface TrackingEventEntity {
  id: string;
  organizationId: string;
  shipmentId: string;
  eventType: TrackingEventType;
  occurredAt: Date;
  locationName: string | null;
  notes: string | null;
  payload: TrackingEventPayload | null;
  sourceSystem: string;
  correlationId: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CargoComplianceEvidenceWithCargoEntity extends CargoComplianceEvidenceEntity {
  cargo: CargoEntity;
}

export interface CargoDeliveryExceptionWithCargoEntity extends CargoDeliveryExceptionEntity {
  cargo: CargoEntity;
}
