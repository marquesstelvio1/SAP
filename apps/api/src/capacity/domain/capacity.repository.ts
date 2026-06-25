import type { PrismaTx } from "@saptm/database";
import type {
  CapacityAdvisoryDecisionRecord,
  CapacityAdvisoryRecommendationType,
  CapacityCargoRecord,
  CapacityReservationPurpose,
  CapacityReservationStatus,
  CapacityResourceRecord,
  CapacityResourceType,
  CapacitySlotReservationRecord,
  CapacitySlotReservationWithSlotCargo,
  CapacitySlotStatus,
  CapacitySlotStatusGroup,
  CapacitySlotWithResource,
} from "./capacity.business-rules.js";

export const CAPACITY_REPOSITORY = Symbol("CapacityRepository");

export type CapacityResourceCreateInput = {
  organizationId: string;
  resourceCode: string;
  resourceName: string;
  resourceType: CapacityResourceType;
  locationName: string;
  maxConcurrentBookings: number;
  sourceSystem: string;
  recordIdempotencyKey: string;
};

export type CapacitySlotCreateInput = {
  organizationId: string;
  resourceId: string;
  slotReference: string;
  windowStartAt: Date;
  windowEndAt: Date;
  capacityUnits: number;
  reservedUnits: number;
  status: CapacitySlotStatus;
  sourceSystem: string;
  recordIdempotencyKey: string;
};

export type CapacitySlotReservationCreateInput = {
  organizationId: string;
  cargoId: string;
  slotId: string;
  reservationReference: string;
  reservationPurpose: CapacityReservationPurpose;
  status: CapacityReservationStatus;
  reservedUnits: number;
  reservedByName: string;
  reservedAt: Date;
  sourceSystem: string;
  reserveIdempotencyKey: string;
};

export type CapacityAdvisoryDecisionCreateInput = {
  organizationId: string;
  recommendationId: string;
  recommendationType: CapacityAdvisoryRecommendationType;
  decisionStatus: string;
  decidedByName: string;
  decisionReason: string;
  approvalReference: string | null;
  requiredPermission: string;
  slotId: string | null;
  reservationId: string | null;
  sourceSystem: string;
  decisionIdempotencyKey: string;
  decidedAt: Date;
};

export type CapacitySlotWithResourceSummary = {
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
  resource: CapacityResourceRecord;
};

export interface CapacityRepository {
  // Overview queries
  countResources(organizationId: string): Promise<number>;
  groupSlotStatuses(organizationId: string): Promise<CapacitySlotStatusGroup[]>;
  countActiveReservations(organizationId: string): Promise<number>;
  findUpcomingSlots(
    organizationId: string,
    limit: number,
  ): Promise<CapacitySlotWithResourceSummary[]>;
  findRecentReservations(
    organizationId: string,
    limit: number,
  ): Promise<CapacitySlotReservationWithSlotCargo[]>;

  // Advisory queries
  findOpenSlots(organizationId: string, limit: number): Promise<CapacitySlotWithResourceSummary[]>;
  findRecentReservationsForAdvisory(
    organizationId: string,
    limit: number,
  ): Promise<CapacitySlotReservationWithSlotCargo[]>;

  // Advisory decision analytics
  findAdvisoryDecisionsInWindow(
    organizationId: string,
    windowStart: Date,
    windowEnd: Date,
    limit: number,
  ): Promise<CapacityAdvisoryDecisionRecord[]>;

  // Idempotency lookups
  findResourceByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacityResourceRecord | null>;

  findResourceByCode(
    organizationId: string,
    resourceCode: string,
  ): Promise<CapacityResourceRecord | null>;

  findResourceById(
    organizationId: string,
    resourceId: string,
  ): Promise<CapacityResourceRecord | null>;

  findSlotByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotWithResource | null>;

  findSlotByReference(
    organizationId: string,
    slotReference: string,
  ): Promise<CapacitySlotWithResource | null>;

  findSlotById(organizationId: string, slotId: string): Promise<CapacitySlotWithResource | null>;

  findReservationByReserveIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null>;

  findReservationByCancelIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null>;

  findReservationById(
    organizationId: string,
    reservationId: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null>;

  findReservationByReference(
    organizationId: string,
    reservationReference: string,
  ): Promise<CapacitySlotReservationRecord | null>;

  findReservationByCargoSlotPurpose(
    organizationId: string,
    cargoId: string,
    slotId: string,
    reservationPurpose: string,
  ): Promise<CapacitySlotReservationRecord | null>;

  findCargoById(organizationId: string, cargoId: string): Promise<CapacityCargoRecord | null>;

  findAdvisoryDecisionByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacityAdvisoryDecisionRecord | null>;

  findAdvisoryDecisionByRecommendationId(
    organizationId: string,
    recommendationId: string,
  ): Promise<CapacityAdvisoryDecisionRecord | null>;

  // Transactional writes
  createResource(tx: PrismaTx, data: CapacityResourceCreateInput): Promise<CapacityResourceRecord>;

  createSlot(tx: PrismaTx, data: CapacitySlotCreateInput): Promise<CapacitySlotWithResourceSummary>;

  updateSlotReservedUnitsIncrement(
    tx: PrismaTx,
    slotId: string,
    organizationId: string,
    status: CapacitySlotStatus,
    maxReservedUnits: number,
    increment: number,
  ): Promise<{ count: number }>;

  createReservation(
    tx: PrismaTx,
    data: CapacitySlotReservationCreateInput,
  ): Promise<CapacitySlotReservationWithSlotCargo>;

  updateReservationCancel(
    tx: PrismaTx,
    reservationId: string,
    organizationId: string,
    currentStatus: CapacityReservationStatus,
    data: {
      status: CapacityReservationStatus;
      cancellationReference: string;
      cancelledByName: string;
      cancellationReason: string;
      cancelledAt: Date;
      cancelIdempotencyKey: string;
    },
  ): Promise<{ count: number }>;

  updateSlotReservedUnitsDecrement(tx: PrismaTx, slotId: string, decrement: number): Promise<void>;

  findReservationByIdAfterUpdate(
    tx: PrismaTx,
    reservationId: string,
    organizationId: string,
  ): Promise<CapacitySlotReservationWithSlotCargo>;

  createAdvisoryDecision(
    tx: PrismaTx,
    data: CapacityAdvisoryDecisionCreateInput,
  ): Promise<CapacityAdvisoryDecisionRecord>;
}
