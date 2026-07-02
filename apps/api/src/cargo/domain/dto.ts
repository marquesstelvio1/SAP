import type {
  CargoClaimSettlementRecordOutput,
  CargoComplianceEvidenceRecordOutput,
  CargoComplianceEvidenceVerifyOutput,
  CargoDeliveryCompleteOutput,
  CargoDeliveryExceptionRecordOutput,
  CargoDeliveryExceptionResolveOutput,
  CargoOperationalHandoffRecordOutput,
  CargoOverviewOutput,
  CargoRegisterOutput,
  CargoReleaseOutput,
  CargoTransportArriveOutput,
  CargoTransportDepartOutput,
  CargoTransportPlanOutput,
} from "@saptm/rpc";
import {
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

export type CargoStatus = (typeof cargoStatuses)[number];
export type CargoType = (typeof cargoTypes)[number];
export type CargoCustomsStatus = (typeof cargoCustomsStatuses)[number];
export type CargoConditionStatus = (typeof cargoConditionStatuses)[number];
export type CargoComplianceEvidenceType = (typeof cargoComplianceEvidenceTypes)[number];
export type CargoComplianceEvidenceStatus = (typeof cargoComplianceEvidenceStatuses)[number];
export type CargoDeliveryExceptionType = (typeof cargoDeliveryExceptionTypes)[number];
export type CargoDeliveryExceptionStatus = (typeof cargoDeliveryExceptionStatuses)[number];
export type CargoDeliveryExceptionResolutionCode =
  (typeof cargoDeliveryExceptionResolutionCodes)[number];
export type CargoOperationalHandoffType = (typeof cargoOperationalHandoffTypes)[number];
export type CargoClaimSettlementType = (typeof cargoClaimSettlementTypes)[number];
export type CargoClaimSettlementStatus = (typeof cargoClaimSettlementStatuses)[number];
export type TrackingEventType = (typeof trackingEventTypes)[number];
export type TrackingShipmentStatus = (typeof trackingShipmentStatuses)[number];
export type TrackingTransportMode = (typeof trackingTransportModes)[number];

export type CargoRecord = {
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

export type CargoComplianceEvidenceRecord = {
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

export type CargoComplianceEvidenceWithCargo = CargoComplianceEvidenceRecord & {
  cargo: CargoRecord;
};

export type CargoDeliveryExceptionRecord = {
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

export type CargoDeliveryExceptionWithCargo = CargoDeliveryExceptionRecord & {
  cargo: CargoRecord;
};

export type CargoOperationalHandoffRecord = {
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

export type CargoClaimSettlementRecord = {
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

export type CargoOverviewRawData = {
  statusGroups: readonly CargoStatusGroup[];
  hazardousCount: number;
  inspectionRequiredCount: number;
  recentCargo: readonly CargoRecord[];
  totalCount: number;
};

// ---- DTO mapping helper functions ----

export function createCargoSummary(cargo: CargoRecord): CargoOverviewOutput["recentCargo"][number] {
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

export function createCargoStatusCounts(
  statusGroups: readonly CargoStatusGroup[],
): CargoOverviewOutput["statusCounts"] {
  const countByStatus = new Map(
    statusGroups.map((group) => [group.status as CargoStatus, group._count._all]),
  );

  return cargoStatuses.map((status) => ({
    status,
    count: countByStatus.get(status as CargoStatus) ?? 0,
  }));
}

export function sumCargoStatusCounts(statusCounts: CargoOverviewOutput["statusCounts"]): number {
  return statusCounts.reduce((total, item) => total + item.count, 0);
}

export function sumActiveCargo(statusCounts: CargoOverviewOutput["statusCounts"]): number {
  const terminalStatuses = new Set<CargoStatus>(["cancelled", "delivered"]);

  return statusCounts.reduce(
    (total, item) => (terminalStatuses.has(item.status) ? total : total + item.count),
    0,
  );
}

export function readCargoStatusCount(
  statusCounts: CargoOverviewOutput["statusCounts"],
  status: CargoStatus,
): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}

export function createCargoRegisterOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
  businessRules?: CargoRegisterOutput["businessRules"];
}): CargoRegisterOutput {
  if (input.cargo.registrationIdempotencyKey === null) {
    throw new Error("cargo.registration.idempotency_key_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? {
    movementBlocked: input.cargo.status === "held",
    inspectionRequired: input.cargo.requiresInspection,
    customsBlocked: input.cargo.customsStatus === "held",
    appliedRules: [
      "tenant_scoped_cargo_identity",
      "unique_cargo_reference",
      "idempotent_registration",
      "positive_weight_and_package_count",
      "custody_origin_destination_required",
    ],
  };

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

export function createCargoReleaseOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
  businessRules?: CargoReleaseOutput["businessRules"];
}): CargoReleaseOutput {
  if (input.cargo.releaseIdempotencyKey === null) {
    throw new Error("cargo.release.idempotency_key_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? {
    releaseAllowed: input.cargo.status === "ready_for_transport",
    movementBlocked: input.cargo.status !== "ready_for_transport",
    customsReleaseRequired: false,
    inspectionRequiredBeforeRelease: false,
    appliedRules: [
      "tenant_scoped_cargo_release",
      "idempotent_release_replay",
      "cargo_ready_for_transport_after_governed_release",
    ],
  };

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

export function createCargoTransportPlanOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
  businessRules?: CargoTransportPlanOutput["businessRules"];
}): CargoTransportPlanOutput {
  if (input.cargo.transportPlanIdempotencyKey === null) {
    throw new Error("cargo.transport_plan.idempotency_key_missing");
  }

  if (input.cargo.transportPlannedAt === null) {
    throw new Error("cargo.transport_plan.transport_planned_at_missing");
  }

  if (input.cargo.transportOwnerTeam === null) {
    throw new Error("cargo.transport_plan.owner_team_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? {
    planningAllowed: true,
    cargoReadyForTracking: input.cargo.status === "ready_for_transport",
    trackingLinked: false,
    appliedRules: ["tenant_scoped_cargo_tracking_linkage", "idempotent_transport_planning_replay"],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: null,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
      transportPlannedAt: input.cargo.transportPlannedAt.toISOString(),
      transportPlanningReference: input.cargo.transportPlanningReference,
      transportOwnerTeam: input.cargo.transportOwnerTeam,
    },
    shipment: null,
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

export function createCargoTransportDepartOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
  businessRules?: CargoTransportDepartOutput["businessRules"];
}): CargoTransportDepartOutput {
  if (input.cargo.departureIdempotencyKey === null) {
    throw new Error("cargo.transport_departure.idempotency_key_missing");
  }

  if (
    input.cargo.departedAt === null ||
    input.cargo.departureLocationName === null ||
    input.cargo.departureOperatorName === null
  ) {
    throw new Error("cargo.transport_departure.evidence_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? {
    departureAllowed: input.cargo.departureIdempotencyKey !== null,
    cargoReadyForDeparture: input.cargo.status === "in_transport",
    trackingShipmentPlanned: true,
    approvedComplianceEvidencePresent: true,
    openComplianceReviewBlocked: false,
    appliedRules: [
      "tenant_scoped_cargo_departure",
      "idempotent_cargo_departure_replay",
      "cargo_departed_to_in_transport",
    ],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: null,
    eventId: null,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
      departedAt: input.cargo.departedAt.toISOString(),
      departureReference: input.cargo.departureReference,
      departureLocationName: input.cargo.departureLocationName,
      departureOperatorName: input.cargo.departureOperatorName,
      carrierReference: input.cargo.carrierReference,
    },
    shipment: null,
    event: null,
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

export function createCargoTransportArriveOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
  businessRules?: CargoTransportArriveOutput["businessRules"];
}): CargoTransportArriveOutput {
  if (input.cargo.arrivalIdempotencyKey === null) {
    throw new Error("cargo.transport_arrival.idempotency_key_missing");
  }

  if (
    input.cargo.arrivedAt === null ||
    input.cargo.arrivalLocationName === null ||
    input.cargo.arrivalOperatorName === null
  ) {
    throw new Error("cargo.transport_arrival.evidence_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? {
    arrivalAllowed: input.cargo.arrivalIdempotencyKey !== null,
    cargoInTransport: input.cargo.status === "in_transport",
    trackingShipmentInTransit: true,
    arrivalAfterDeparture: true,
    appliedRules: ["tenant_scoped_cargo_arrival", "idempotent_cargo_arrival_replay"],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: null,
    eventId: null,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
      arrivedAt: input.cargo.arrivedAt.toISOString(),
      arrivalReference: input.cargo.arrivalReference,
      arrivalLocationName: input.cargo.arrivalLocationName,
      arrivalOperatorName: input.cargo.arrivalOperatorName,
    },
    shipment: null,
    event: null,
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

export function createCargoOperationalHandoffSummary(
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

export function createCargoOperationalHandoffRecordOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  handoff: CargoOperationalHandoffRecord;
  replayed: boolean;
  businessRules?: CargoOperationalHandoffRecordOutput["businessRules"];
}): CargoOperationalHandoffRecordOutput {
  if (input.handoff.recordIdempotencyKey === null) {
    throw new Error("cargo.operational_handoff.record_idempotency_key_missing");
  }

  const businessRules = input.businessRules ?? {
    handoffAllowed: input.handoff.recordIdempotencyKey !== null,
    cargoInTransport: true,
    trackingShipmentInTransit: true,
    handoffAfterDeparture: true,
    handoffBeforeArrival: true,
    currentCustodyMatched: true,
    custodyChanged: true,
    conditionAccepted: input.handoff.conditionStatus === "sound",
    duplicateReferenceBlocked: false,
    appliedRules: [
      "tenant_scoped_operational_handoff",
      "idempotent_operational_handoff_record_replay",
      "cargo_custody_transferred",
    ],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    handoffId: input.handoff.id,
    shipmentId: null,
    eventId: null,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
      custodyOwnerName: input.cargo.custodyOwnerName,
    },
    handoff: createCargoOperationalHandoffSummary(input.handoff),
    shipment: null,
    event: null,
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

export function createCargoDeliveryCompleteOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  replayed: boolean;
  businessRules?: CargoDeliveryCompleteOutput["businessRules"];
}): CargoDeliveryCompleteOutput {
  if (input.cargo.deliveryIdempotencyKey === null) {
    throw new Error("cargo.delivery.idempotency_key_missing");
  }

  if (
    input.cargo.deliveredAt === null ||
    input.cargo.deliveryReference === null ||
    input.cargo.receivedByName === null
  ) {
    throw new Error("cargo.delivery.evidence_missing");
  }

  const summary = createCargoSummary(input.cargo);
  const businessRules = input.businessRules ?? {
    deliveryAllowed: input.cargo.deliveryIdempotencyKey !== null,
    cargoArrivedForDelivery: input.cargo.arrivedAt !== null,
    trackingShipmentArrived: true,
    deliveryAfterArrival: true,
    deliveryConditionAccepted: input.cargo.conditionStatus === "sound",
    appliedRules: [
      "tenant_scoped_cargo_delivery",
      "idempotent_cargo_delivery_replay",
      "cargo_marked_delivered",
    ],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    shipmentId: null,
    eventId: null,
    cargo: {
      ...summary,
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
      deliveredAt: input.cargo.deliveredAt.toISOString(),
      deliveryReference: input.cargo.deliveryReference,
      receivedByName: input.cargo.receivedByName,
      deliveryNotes: input.cargo.deliveryNotes,
    },
    shipment: null,
    event: null,
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

export function createCargoDeliveryExceptionSummary(
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

export function createCargoDeliveryExceptionRecordOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  exception: CargoDeliveryExceptionRecord;
  replayed: boolean;
  businessRules?: CargoDeliveryExceptionRecordOutput["businessRules"];
}): CargoDeliveryExceptionRecordOutput {
  if (input.exception.recordIdempotencyKey === null) {
    throw new Error("cargo.delivery_exception.record_idempotency_key_missing");
  }

  const businessRules = input.businessRules ?? {
    exceptionAccepted: input.exception.recordIdempotencyKey !== null,
    cargoArrivedForException: true,
    trackingShipmentArrived: true,
    openExceptionBlocked: false,
    exceptionAfterArrival: true,
    appliedRules: [
      "tenant_scoped_delivery_exception",
      "idempotent_delivery_exception_record_replay",
      "cargo_delivery_exception_opened",
    ],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    exceptionId: input.exception.id,
    shipmentId: null,
    eventId: null,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
    },
    exception: createCargoDeliveryExceptionSummary(input.exception),
    shipment: null,
    event: null,
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

export function createCargoDeliveryExceptionResolveOutput(input: {
  organizationId: string;
  cargo: CargoRecord;
  exception: CargoDeliveryExceptionRecord;
  replayed: boolean;
  businessRules?: CargoDeliveryExceptionResolveOutput["businessRules"];
}): CargoDeliveryExceptionResolveOutput {
  if (input.exception.resolveIdempotencyKey === null) {
    throw new Error("cargo.delivery_exception.resolve_idempotency_key_missing");
  }

  const businessRules = input.businessRules ?? {
    resolutionAllowed: input.exception.resolveIdempotencyKey !== null,
    openException: false,
    cargoHeldForInspection: false,
    trackingShipmentException: false,
    resolutionAfterException: true,
    cargoRestoredForDelivery: true,
    appliedRules: [
      "tenant_scoped_delivery_exception_resolution",
      "idempotent_delivery_exception_resolution_replay",
      "cargo_restored_for_delivery_completion",
    ],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    exceptionId: input.exception.id,
    shipmentId: null,
    eventId: null,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
    },
    exception: createCargoDeliveryExceptionSummary(input.exception),
    shipment: null,
    event: null,
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

export function createCargoClaimSettlementSummary(
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

export function createCargoClaimSettlementRecordOutput(input: {
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

  const businessRules = input.businessRules ?? {
    settlementAllowed: true,
    resolvedException: input.exception.status === "resolved",
    claimReferencePresent: input.exception.claimReference !== null,
    claimReferenceMatched: true,
    claimResolutionAccepted: input.exception.resolutionCode === "claim_accepted",
    settlementAfterResolution: true,
    duplicateSettlementBlocked: false,
    duplicateReferenceBlocked: false,
    appliedRules: [
      "tenant_scoped_claim_settlement",
      "idempotent_claim_settlement_record_replay",
      "claim_settlement_accounting_recorded",
    ],
  };

  return {
    organizationId: input.organizationId,
    cargoId: input.cargo.id,
    exceptionId: input.exception.id,
    settlementId: input.settlement.id,
    cargo: {
      ...createCargoSummary(input.cargo),
      trackingShipmentId: input.cargo.trackingShipmentId ?? "",
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

export function createCargoComplianceEvidenceSummary(
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

export function createCargoComplianceEvidenceRecordOutput(input: {
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
    businessRules: input.businessRules ?? {
      evidenceAccepted: input.evidence.recordIdempotencyKey !== null,
      reviewRequired: true,
      appliedRules: [
        "tenant_scoped_compliance_evidence",
        "idempotent_compliance_evidence_record_replay",
        "compliance_evidence_requires_human_review",
      ],
    },
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

export function createCargoComplianceEvidenceVerifyOutput(input: {
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
    businessRules: input.businessRules ?? {
      verificationAllowed: input.evidence.verifyIdempotencyKey !== null,
      evidenceApproved: input.evidence.status === "approved",
      evidenceRejected: input.evidence.status === "rejected",
      appliedRules: [
        "tenant_scoped_compliance_review",
        "idempotent_compliance_evidence_verify_replay",
        input.evidence.status === "approved"
          ? "compliance_evidence_approved_for_operations"
          : "compliance_evidence_rejected_blocks_automation",
      ],
    },
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

// ---- Utility functions ----

export function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

export function toRequiredIsoString(value: Date | null | undefined): string {
  if (value === null || value === undefined) {
    throw new Error("required_date_missing");
  }

  return value.toISOString();
}
