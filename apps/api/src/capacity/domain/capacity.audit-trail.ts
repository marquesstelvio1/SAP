import type { AuditJsonValue } from "@saptm/database";
import type {
  CapacityAdvisoryDecisionRecordOutput,
  CapacityResourceRegisterOutput,
  CapacitySlotCancelOutput,
  CapacitySlotOpenOutput,
  CapacitySlotReserveOutput,
} from "@saptm/rpc";
import type {
  CapacityAdvisoryDecisionRecord,
  CapacityCargoRecord,
  CapacityResourceRecord,
  CapacitySlotReservationRecord,
  CapacitySlotReservationWithSlotCargo,
  CapacitySlotWithResource,
} from "./capacity.business-rules.js";

export function createCapacityResourceRegisterAuditAfter(input: {
  resource: CapacityResourceRecord;
  businessRules: CapacityResourceRegisterOutput["businessRules"];
}): AuditJsonValue {
  return {
    resourceId: input.resource.id,
    resourceCode: input.resource.resourceCode,
    resourceName: input.resource.resourceName,
    resourceType: input.resource.resourceType,
    locationName: input.resource.locationName,
    maxConcurrentBookings: input.resource.maxConcurrentBookings,
    resourceAccepted: input.businessRules.resourceAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.resource.recordIdempotencyKey,
    sourceSystem: input.resource.sourceSystem,
  };
}

export function createCapacitySlotOpenAuditBefore(input: {
  resource: CapacityResourceRecord;
  duplicateReference: CapacitySlotWithResource | null;
  businessRules: CapacitySlotOpenOutput["businessRules"];
}): AuditJsonValue {
  return {
    resourceId: input.resource.id,
    resourceCode: input.resource.resourceCode,
    maxConcurrentBookings: input.resource.maxConcurrentBookings,
    duplicateSlotId: input.duplicateReference?.id ?? null,
    slotOpened: input.businessRules.slotOpened,
    capacityWithinResourceLimit: input.businessRules.capacityWithinResourceLimit,
    duplicateReferenceBlocked: input.businessRules.duplicateReferenceBlocked,
    appliedRules: input.businessRules.appliedRules,
  };
}

export function createCapacitySlotOpenAuditAfter(input: {
  slot: CapacitySlotWithResource;
  businessRules: CapacitySlotOpenOutput["businessRules"];
}): AuditJsonValue {
  return {
    slotId: input.slot.id,
    slotReference: input.slot.slotReference,
    resourceId: input.slot.resourceId,
    resourceCode: input.slot.resource.resourceCode,
    windowStartAt: input.slot.windowStartAt.toISOString(),
    windowEndAt: input.slot.windowEndAt.toISOString(),
    capacityUnits: input.slot.capacityUnits,
    reservedUnits: input.slot.reservedUnits,
    status: input.slot.status,
    slotOpened: input.businessRules.slotOpened,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.slot.recordIdempotencyKey,
    sourceSystem: input.slot.sourceSystem,
  };
}

export function createCapacitySlotReserveAuditBefore(input: {
  cargo: CapacityCargoRecord;
  slot: CapacitySlotWithResource;
  duplicateReference: CapacitySlotReservationRecord | null;
  duplicateCargoSlot: CapacitySlotReservationRecord | null;
  businessRules: CapacitySlotReserveOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    slotId: input.slot.id,
    slotReference: input.slot.slotReference,
    slotStatus: input.slot.status,
    capacityUnits: input.slot.capacityUnits,
    reservedUnits: input.slot.reservedUnits,
    availableUnits: input.slot.capacityUnits - input.slot.reservedUnits,
    duplicateReservationId: input.duplicateReference?.id ?? null,
    duplicateCargoSlotReservationId: input.duplicateCargoSlot?.id ?? null,
    reservationAllowed: input.businessRules.reservationAllowed,
    capacityAvailable: input.businessRules.capacityAvailable,
    appliedRules: input.businessRules.appliedRules,
  };
}

export function createCapacitySlotReserveAuditAfter(input: {
  reservation: CapacitySlotReservationWithSlotCargo;
  businessRules: CapacitySlotReserveOutput["businessRules"];
}): AuditJsonValue {
  return {
    reservationId: input.reservation.id,
    reservationReference: input.reservation.reservationReference,
    reservationPurpose: input.reservation.reservationPurpose,
    status: input.reservation.status,
    cargoId: input.reservation.cargoId,
    cargoReference: input.reservation.cargo.cargoReference,
    slotId: input.reservation.slotId,
    slotReference: input.reservation.slot.slotReference,
    reservedUnits: input.reservation.reservedUnits,
    reservedAt: input.reservation.reservedAt.toISOString(),
    reservationAllowed: input.businessRules.reservationAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.reservation.reserveIdempotencyKey,
    sourceSystem: input.reservation.sourceSystem,
  };
}

export function createCapacitySlotCancelAuditBefore(input: {
  reservation: CapacitySlotReservationWithSlotCargo;
  businessRules: CapacitySlotCancelOutput["businessRules"];
}): AuditJsonValue {
  return {
    reservationId: input.reservation.id,
    reservationReference: input.reservation.reservationReference,
    status: input.reservation.status,
    slotId: input.reservation.slotId,
    slotReference: input.reservation.slot.slotReference,
    reservedUnits: input.reservation.reservedUnits,
    reservedAt: input.reservation.reservedAt.toISOString(),
    cancellationAllowed: input.businessRules.cancellationAllowed,
    reservationActive: input.businessRules.reservationActive,
    cancellationAfterReservation: input.businessRules.cancellationAfterReservation,
    appliedRules: input.businessRules.appliedRules,
  };
}

export function createCapacitySlotCancelAuditAfter(input: {
  reservation: CapacitySlotReservationWithSlotCargo;
  businessRules: CapacitySlotCancelOutput["businessRules"];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    reservationId: input.reservation.id,
    reservationReference: input.reservation.reservationReference,
    status: input.reservation.status,
    cancellationReference: input.reservation.cancellationReference,
    cancellationReason: input.reservation.cancellationReason,
    cancelledByName: input.reservation.cancelledByName,
    cancelledAt: toIsoStringOrNull(input.reservation.cancelledAt),
    releasedUnits: input.reservation.reservedUnits,
    cancellationAllowed: input.businessRules.cancellationAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.reservation.cancelIdempotencyKey,
    sourceSystem: input.sourceSystem,
  };
}

export function createCapacityAdvisoryDecisionAuditBefore(input: {
  existingDecision: CapacityAdvisoryDecisionRecord | null;
  slot: CapacitySlotWithResource | null;
  reservation: CapacitySlotReservationWithSlotCargo | null;
  businessRules: CapacityAdvisoryDecisionRecordOutput["businessRules"];
}): AuditJsonValue {
  return {
    existingDecisionId: input.existingDecision?.id ?? null,
    slotId: input.slot?.id ?? null,
    reservationId: input.reservation?.id ?? null,
    recommendationTraceable: input.businessRules.recommendationTraceable,
    duplicateDecisionBlocked: input.businessRules.duplicateDecisionBlocked,
    appliedRules: input.businessRules.appliedRules,
  };
}

export function createCapacityAdvisoryDecisionAuditAfter(input: {
  decision: CapacityAdvisoryDecisionRecord;
  businessRules: CapacityAdvisoryDecisionRecordOutput["businessRules"];
}): AuditJsonValue {
  return {
    decisionId: input.decision.id,
    recommendationId: input.decision.recommendationId,
    recommendationType: input.decision.recommendationType,
    decisionStatus: input.decision.decisionStatus,
    decidedByName: input.decision.decidedByName,
    approvalReference: input.decision.approvalReference,
    requiredPermission: input.decision.requiredPermission,
    slotId: input.decision.slotId,
    reservationId: input.decision.reservationId,
    decidedAt: input.decision.decidedAt.toISOString(),
    decisionAccepted: input.businessRules.decisionAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.decision.decisionIdempotencyKey,
    sourceSystem: input.decision.sourceSystem,
  };
}

function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}
