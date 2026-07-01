import type {
  CapacityAdvisoryRecommendationType,
  CapacityReservationPurpose,
  CapacityReservationStatus,
  CapacityResourceType,
  CapacitySlotStatus,
} from "./capacity.business-rules.js";

export class ResourceCode {
  private constructor(readonly value: string) {}

  static create(value: string): ResourceCode {
    const trimmed = value.trim().toUpperCase();

    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new Error("capacity.resource_code.invalid_length");
    }

    return new ResourceCode(trimmed);
  }

  static from(value: string): ResourceCode {
    return new ResourceCode(value);
  }

  equals(other: ResourceCode): boolean {
    return this.value === other.value;
  }
}

export class SlotReference {
  private constructor(readonly value: string) {}

  static create(value: string): SlotReference {
    const trimmed = value.trim().toUpperCase();

    if (trimmed.length < 2 || trimmed.length > 80) {
      throw new Error("capacity.slot_reference.invalid_length");
    }

    return new SlotReference(trimmed);
  }

  static from(value: string): SlotReference {
    return new SlotReference(value);
  }

  equals(other: SlotReference): boolean {
    return this.value === other.value;
  }
}

export interface CapacityResourceEntity {
  id: string;
  organizationId: string;
  resourceCode: ResourceCode;
  resourceName: string;
  resourceType: CapacityResourceType;
  locationName: string;
  maxConcurrentBookings: number;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacitySlotEntity {
  id: string;
  organizationId: string;
  resourceId: string;
  slotReference: SlotReference;
  windowStartAt: Date;
  windowEndAt: Date;
  capacityUnits: number;
  reservedUnits: number;
  status: CapacitySlotStatus;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacitySlotReservationEntity {
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
}

export interface CapacityAdvisoryDecisionEntity {
  id: string;
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
  decisionIdempotencyKey: string | null;
  decidedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CapacitySlotUtilization = {
  slotId: string;
  slotReference: string;
  capacityUnits: number;
  reservedUnits: number;
  availableUnits: number;
  utilizationPercent: number;
  hoursUntilWindowEnd: number | null;
  status: CapacitySlotStatus;
};
