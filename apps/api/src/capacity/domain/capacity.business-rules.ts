import type {
  CapacityAdvisoryDecisionRecordOutput,
  CapacityResourceRegisterOutput,
  CapacitySlotCancelOutput,
  CapacitySlotOpenOutput,
  CapacitySlotReserveOutput,
  capacityAdvisoryRecommendationTypes,
  capacityAdvisorySeverities,
  capacityReservationPurposes,
  capacityReservationStatuses,
  capacityResourceTypes,
  capacitySlotStatuses,
  cargoStatuses,
} from "@saptm/rpc";

export type CapacityResourceType = (typeof capacityResourceTypes)[number];
export type CapacitySlotStatus = (typeof capacitySlotStatuses)[number];
export type CapacityReservationPurpose = (typeof capacityReservationPurposes)[number];
export type CapacityReservationStatus = (typeof capacityReservationStatuses)[number];
export type CapacityAdvisoryRecommendationType =
  (typeof capacityAdvisoryRecommendationTypes)[number];
export type CapacityAdvisorySeverity = (typeof capacityAdvisorySeverities)[number];
export type CargoStatus = (typeof cargoStatuses)[number];

export type CapacityResourceRecord = {
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

export type CapacitySlotRecord = {
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

export type CapacitySlotWithResource = CapacitySlotRecord & {
  resource: CapacityResourceRecord;
};

export type CapacityCargoRecord = {
  id: string;
  organizationId: string;
  cargoReference: string;
  cargoDescription: string;
  status: CargoStatus;
  custodyOwnerName: string;
};

export type CapacitySlotReservationRecord = {
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

export type CapacitySlotReservationWithSlotCargo = CapacitySlotReservationRecord & {
  cargo: CapacityCargoRecord;
  slot: CapacitySlotWithResource;
};

export type CapacitySlotStatusGroup = {
  status: CapacitySlotStatus;
  _count: {
    _all: number;
  };
};

export type CapacityAdvisoryDecisionRecord = {
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

export type RegisterCapacityResourceInput = {
  organizationId: string;
  resourceCode: string;
  resourceName: string;
  resourceType: CapacityResourceType;
  locationName: string;
  maxConcurrentBookings: number;
  idempotencyKey: string;
  sourceSystem: string;
};

export type OpenCapacitySlotInput = {
  organizationId: string;
  resourceId: string;
  slotReference: string;
  windowStartAt: string;
  windowEndAt: string;
  capacityUnits: number;
  idempotencyKey: string;
  sourceSystem: string;
};

export type ReserveCapacitySlotInput = {
  organizationId: string;
  cargoId: string;
  slotId: string;
  reservationReference: string;
  reservationPurpose: CapacityReservationPurpose;
  reservedUnits: number;
  reservedByName: string;
  reservedAt: string;
  idempotencyKey: string;
  sourceSystem: string;
};

export type CancelCapacitySlotInput = {
  organizationId: string;
  reservationId: string;
  cancellationReference: string;
  cancelledByName: string;
  cancellationReason: string;
  cancelledAt: string;
  idempotencyKey: string;
  sourceSystem: string;
};

export type RecordCapacityAdvisoryDecisionBusinessRulesInput = {
  recommendationId: string;
  recommendationType: CapacityAdvisoryRecommendationType;
  decisionStatus: string;
  decidedByName: string;
  decisionReason: string;
  approvalReference?: string;
  requiredPermission: string;
  slotId?: string;
  reservationId?: string;
  decidedAt: string;
  idempotencyKey: string;
  sourceSystem: string;
};

export function resolveCapacityResourceRegisterBusinessRules(
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

export function resolveCapacitySlotOpenBusinessRules(
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

export function resolveCapacitySlotReserveBusinessRules(input: {
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

export function resolveCapacitySlotCancelBusinessRules(
  reservation: CapacitySlotReservationWithSlotCargo,
  input: CancelCapacitySlotInput,
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

export function resolveCapacityAdvisoryDecisionBusinessRules(input: {
  existingDecision: CapacityAdvisoryDecisionRecord | null;
  slot: CapacitySlotWithResource | null;
  reservation: CapacitySlotReservationWithSlotCargo | null;
  input: RecordCapacityAdvisoryDecisionBusinessRulesInput;
}): CapacityAdvisoryDecisionRecordOutput["businessRules"] {
  const recommendationTraceable =
    input.input.recommendationId.startsWith("capacity-advisory:") &&
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

export function isCargoEligibleForReservationPurpose(
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
