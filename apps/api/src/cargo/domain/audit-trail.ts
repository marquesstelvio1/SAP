import type { AuditJsonValue } from "@saptm/database";
import type {
  CargoClaimSettlementRecordOutput,
  CargoComplianceEvidenceRecordOutput,
  CargoComplianceEvidenceVerifyOutput,
  CargoDeliveryCompleteOutput,
  CargoDeliveryExceptionRecordOutput,
  CargoDeliveryExceptionResolveOutput,
  CargoOperationalHandoffRecordOutput,
  CargoRegisterOutput,
  CargoReleaseOutput,
  CargoTransportArriveOutput,
  CargoTransportDepartOutput,
  CargoTransportPlanOutput,
} from "@saptm/rpc";
import type {
  CargoClaimSettlementRecord,
  CargoComplianceEvidenceRecord,
  CargoComplianceEvidenceStatusCounts,
  CargoComplianceEvidenceWithCargo,
  CargoDeliveryExceptionRecord,
  CargoDeliveryExceptionWithCargo,
  CargoOperationalHandoffRecord,
  CargoRecord,
  TrackingDepartureEventRecord,
  TrackingLifecycleEventRecord,
  TrackingShipmentRecord,
} from "./dto.js";

export function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

export function toRequiredIsoString(value: Date | null | undefined): string {
  if (value === null || value === undefined) {
    throw new Error("required_date_missing");
  }

  return value.toISOString();
}

export function createCargoRegistrationAuditAfter(input: {
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

export function createCargoReleaseAuditBefore(
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

export function createCargoReleaseAuditAfter(input: {
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

export function createCargoTransportPlanAuditBefore(
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

export function createCargoTransportPlanAuditAfter(input: {
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

export function createCargoTransportDepartAuditBefore(input: {
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

export function createCargoTransportDepartAuditAfter(input: {
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

export function createCargoTransportArriveAuditBefore(input: {
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

export function createCargoTransportArriveAuditAfter(input: {
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

export function createCargoOperationalHandoffRecordAuditBefore(input: {
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

export function createCargoOperationalHandoffRecordAuditAfter(input: {
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

export function createCargoDeliveryCompleteAuditBefore(input: {
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

export function createCargoDeliveryCompleteAuditAfter(input: {
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

export function createCargoDeliveryExceptionRecordAuditBefore(input: {
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

export function createCargoDeliveryExceptionRecordAuditAfter(input: {
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

export function createCargoDeliveryExceptionResolveAuditBefore(input: {
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

export function createCargoDeliveryExceptionResolveAuditAfter(input: {
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

export function createCargoClaimSettlementRecordAuditBefore(input: {
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

export function createCargoClaimSettlementRecordAuditAfter(input: {
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

export function createCargoComplianceEvidenceRecordAuditAfter(input: {
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

export function createCargoComplianceEvidenceVerifyAuditBefore(
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

export function createCargoComplianceEvidenceVerifyAuditAfter(input: {
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
