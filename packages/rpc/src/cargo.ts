import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";
import {
  trackingShipmentStatuses,
  trackingTeamSummarySchema,
  trackingTransportModes,
} from "./tracking.js";

export const cargoStatuses = [
  "registered",
  "ready_for_transport",
  "in_transport",
  "held",
  "delivered",
  "cancelled",
] as const;

export const cargoTypes = [
  "container",
  "bulk",
  "break_bulk",
  "liquid_bulk",
  "refrigerated",
  "hazardous",
  "vehicle",
  "other",
] as const;

export const cargoCustomsStatuses = ["not_required", "pending", "cleared", "held"] as const;

export const cargoConditionStatuses = ["sound", "damaged", "requires_inspection"] as const;

export const cargoReleaseCustomsStatuses = ["not_required", "cleared"] as const;

export const cargoReleaseInspectionOutcomes = ["not_required", "passed"] as const;

export const cargoDeliveryExceptionTypes = [
  "damage",
  "shortage",
  "temperature_excursion",
  "documentation_mismatch",
  "security_seal_breach",
  "other",
] as const;

export const cargoDeliveryExceptionConditionStatuses = ["damaged", "requires_inspection"] as const;

export const cargoDeliveryExceptionStatuses = ["open", "resolved"] as const;

export const cargoDeliveryExceptionResolutionCodes = [
  "inspection_passed",
  "claim_accepted",
  "waiver_approved",
  "recovered",
  "other",
] as const;

export const cargoOperationalHandoffTypes = [
  "rail_to_port",
  "port_to_rail",
  "terminal_to_carrier",
  "carrier_to_terminal",
  "yard_transfer",
  "customs_to_operations",
  "other",
] as const;

export const cargoClaimSettlementTypes = [
  "carrier_liability",
  "insurance_recovery",
  "customer_credit",
  "supplier_recovery",
  "write_off",
  "other",
] as const;

export const cargoClaimSettlementStatuses = ["settled"] as const;

export const cargoComplianceEvidenceTypes = [
  "bill_of_lading",
  "customs_declaration",
  "inspection_certificate",
  "hazardous_goods_declaration",
  "packing_list",
  "insurance_certificate",
  "release_authorization",
  "other",
] as const;

export const cargoComplianceEvidenceStatuses = ["pending_review", "approved", "rejected"] as const;

const optionalCargoString = (max: number) => z.string().trim().min(1).max(max).optional();
const cargoCurrencyCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Currency code must use ISO 4217 alpha-3 format.")
  .transform((value) => value.toUpperCase());

export const cargoOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).default(0),
    teamId: z.string().optional(),
  })
  .default({
    limit: 10,
    offset: 0,
  });

export const cargoRegisterInputSchema = z
  .object({
    teamId: z.string().optional(),
    cargoReference: z.string().trim().min(3).max(80),
    externalReference: optionalCargoString(120),
    cargoDescription: z.string().trim().min(3).max(240),
    cargoType: z.enum(cargoTypes),
    grossWeightKg: z.number().positive().max(1_000_000),
    packageCount: z.number().int().min(1).max(100_000),
    volumeM3: z.number().positive().max(100_000).optional(),
    shipperName: z.string().trim().min(2).max(160),
    consigneeName: z.string().trim().min(2).max(160),
    originName: z.string().trim().min(2).max(180),
    destinationName: z.string().trim().min(2).max(180),
    custodyOwnerName: z.string().trim().min(2).max(160),
    priority: z.number().int().min(1).max(5).default(3),
    customsStatus: z.enum(cargoCustomsStatuses).default("pending"),
    customsReference: optionalCargoString(120),
    conditionStatus: z.enum(cargoConditionStatuses).default("sound"),
    hazardous: z.boolean().default(false),
    unNumber: optionalCargoString(32),
    hazardClass: optionalCargoString(64),
    requiresInspection: z.boolean().default(false),
    expectedReadyAt: z.string().datetime().optional(),
    idempotencyKey: z.string().trim().min(12).max(128),
    sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
  })
  .superRefine((cargo, context) => {
    if (cargo.cargoType === "hazardous" && !cargo.hazardous) {
      context.addIssue({
        code: "custom",
        message: "Hazardous cargo type must set hazardous=true.",
        path: ["hazardous"],
      });
    }

    if (cargo.hazardous && cargo.unNumber === undefined) {
      context.addIssue({
        code: "custom",
        message: "Hazardous cargo requires UN number.",
        path: ["unNumber"],
      });
    }

    if (cargo.hazardous && cargo.hazardClass === undefined) {
      context.addIssue({
        code: "custom",
        message: "Hazardous cargo requires hazard class.",
        path: ["hazardClass"],
      });
    }

    if (cargo.customsStatus === "held" && cargo.customsReference === undefined) {
      context.addIssue({
        code: "custom",
        message: "Customs-held cargo requires customs reference.",
        path: ["customsReference"],
      });
    }

    if (cargo.conditionStatus === "damaged" && !cargo.requiresInspection) {
      context.addIssue({
        code: "custom",
        message: "Damaged cargo requires inspection.",
        path: ["requiresInspection"],
      });
    }
  });

export const cargoReleaseInputSchema = z
  .object({
    cargoId: z.string().min(1),
    customsStatus: z.enum(cargoReleaseCustomsStatuses),
    inspectionOutcome: z.enum(cargoReleaseInspectionOutcomes).default("not_required"),
    releaseReference: optionalCargoString(120),
    releaseReason: z.string().trim().min(3).max(240),
    releasedAt: z.string().datetime().optional(),
    idempotencyKey: z.string().trim().min(12).max(128),
    sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
  })
  .superRefine((release, context) => {
    if (release.customsStatus === "cleared" && release.releaseReference === undefined) {
      context.addIssue({
        code: "custom",
        message: "Cleared cargo release requires a release reference.",
        path: ["releaseReference"],
      });
    }
  });

export const cargoTransportPlanInputSchema = z
  .object({
    cargoId: z.string().min(1),
    referenceCode: optionalCargoString(80),
    transportMode: z.enum(trackingTransportModes),
    plannedDepartureAt: z.string().datetime(),
    estimatedArrivalAt: z.string().datetime(),
    operationsOwnerTeam: z.string().trim().min(2).max(120),
    planningReference: optionalCargoString(120),
    firstCheckpointName: optionalCargoString(180),
    idempotencyKey: z.string().trim().min(12).max(128),
    sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
  })
  .superRefine((plan, context) => {
    const plannedDepartureAt = Date.parse(plan.plannedDepartureAt);
    const estimatedArrivalAt = Date.parse(plan.estimatedArrivalAt);

    if (estimatedArrivalAt <= plannedDepartureAt) {
      context.addIssue({
        code: "custom",
        message: "Estimated arrival must be after planned departure.",
        path: ["estimatedArrivalAt"],
      });
    }
  });

export const cargoTransportDepartInputSchema = z.object({
  cargoId: z.string().min(1),
  departedAt: z.string().datetime(),
  departureLocationName: z.string().trim().min(2).max(180),
  operatorName: z.string().trim().min(2).max(120),
  departureReference: optionalCargoString(120),
  carrierReference: optionalCargoString(120),
  idempotencyKey: z.string().trim().min(12).max(128),
  sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
});

export const cargoTransportArriveInputSchema = z.object({
  cargoId: z.string().min(1),
  arrivedAt: z.string().datetime(),
  arrivalLocationName: z.string().trim().min(2).max(180),
  operatorName: z.string().trim().min(2).max(120),
  arrivalReference: optionalCargoString(120),
  idempotencyKey: z.string().trim().min(12).max(128),
  sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
});

export const cargoDeliveryCompleteInputSchema = z
  .object({
    cargoId: z.string().min(1),
    deliveredAt: z.string().datetime(),
    receivedByName: z.string().trim().min(2).max(120),
    deliveryReference: z.string().trim().min(3).max(120),
    deliveryConditionStatus: z.enum(cargoConditionStatuses).default("sound"),
    deliveryNotes: optionalCargoString(500),
    idempotencyKey: z.string().trim().min(12).max(128),
    sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
  })
  .superRefine((delivery, context) => {
    if (delivery.deliveryConditionStatus === "sound") {
      return;
    }

    if (delivery.deliveryNotes === undefined) {
      context.addIssue({
        code: "custom",
        message: "Non-sound delivery condition requires delivery notes.",
        path: ["deliveryNotes"],
      });
    }
  });

export const cargoDeliveryExceptionRecordInputSchema = z.object({
  cargoId: z.string().min(1),
  exceptionType: z.enum(cargoDeliveryExceptionTypes),
  deliveryConditionStatus: z.enum(cargoDeliveryExceptionConditionStatuses),
  occurredAt: z.string().datetime(),
  reportedByName: z.string().trim().min(2).max(120),
  exceptionSummary: z.string().trim().min(3).max(500),
  evidenceReference: z.string().trim().min(3).max(180),
  claimReference: optionalCargoString(120),
  idempotencyKey: z.string().trim().min(12).max(128),
  sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
});

export const cargoDeliveryExceptionResolveInputSchema = z.object({
  exceptionId: z.string().min(1),
  resolutionCode: z.enum(cargoDeliveryExceptionResolutionCodes),
  resolvedAt: z.string().datetime(),
  resolverName: z.string().trim().min(2).max(120),
  resolutionReference: z.string().trim().min(3).max(120),
  resolutionSummary: z.string().trim().min(3).max(500),
  finalConditionStatus: z.literal("sound").default("sound"),
  idempotencyKey: z.string().trim().min(12).max(128),
  sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
});

export const cargoClaimSettlementRecordInputSchema = z.object({
  exceptionId: z.string().min(1),
  claimReference: z.string().trim().min(3).max(120),
  settlementReference: z.string().trim().min(3).max(120),
  settlementType: z.enum(cargoClaimSettlementTypes),
  currencyCode: cargoCurrencyCodeSchema,
  settlementAmount: z.number().positive().max(100_000_000),
  settledByName: z.string().trim().min(2).max(120),
  counterpartyName: z.string().trim().min(2).max(160),
  settlementSummary: z.string().trim().min(3).max(500),
  settledAt: z.string().datetime(),
  idempotencyKey: z.string().trim().min(12).max(128),
  sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
});

export const cargoOperationalHandoffRecordInputSchema = z.object({
  cargoId: z.string().min(1),
  handoffType: z.enum(cargoOperationalHandoffTypes),
  handoffAt: z.string().datetime(),
  handoffLocationName: z.string().trim().min(2).max(180),
  fromCustodyOwnerName: z.string().trim().min(2).max(160),
  toCustodyOwnerName: z.string().trim().min(2).max(160),
  operatorName: z.string().trim().min(2).max(120),
  handoffReference: z.string().trim().min(3).max(120),
  sealReference: optionalCargoString(120),
  conditionStatus: z.literal("sound").default("sound"),
  handoffNotes: optionalCargoString(500),
  idempotencyKey: z.string().trim().min(12).max(128),
  sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
});

export const cargoComplianceEvidenceRecordInputSchema = z
  .object({
    cargoId: z.string().min(1),
    evidenceType: z.enum(cargoComplianceEvidenceTypes),
    documentReference: z.string().trim().min(3).max(120),
    documentTitle: z.string().trim().min(3).max(180),
    documentUri: optionalCargoString(500),
    issuerName: z.string().trim().min(2).max(160),
    issuedAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    idempotencyKey: z.string().trim().min(12).max(128),
    sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
  })
  .superRefine((evidence, context) => {
    if (evidence.issuedAt === undefined || evidence.expiresAt === undefined) {
      return;
    }

    if (Date.parse(evidence.expiresAt) <= Date.parse(evidence.issuedAt)) {
      context.addIssue({
        code: "custom",
        message: "Evidence expiry must be after issue date.",
        path: ["expiresAt"],
      });
    }
  });

export const cargoComplianceEvidenceVerifyInputSchema = z
  .object({
    evidenceId: z.string().min(1),
    status: z.enum(["approved", "rejected"]),
    reviewerName: z.string().trim().min(2).max(120),
    reviewReference: z.string().trim().min(3).max(120),
    reviewSummary: z.string().trim().min(3).max(500),
    rejectionReason: optionalCargoString(500),
    reviewedAt: z.string().datetime().optional(),
    idempotencyKey: z.string().trim().min(12).max(128),
    sourceSystem: z.string().trim().min(1).max(80).default("saptm"),
  })
  .superRefine((review, context) => {
    if (review.status === "rejected" && review.rejectionReason === undefined) {
      context.addIssue({
        code: "custom",
        message: "Rejected evidence requires a rejection reason.",
        path: ["rejectionReason"],
      });
    }
  });

export const cargoStatusCountSchema = z.object({
  status: z.enum(cargoStatuses),
  count: z.number().int().nonnegative(),
});

export const cargoSummarySchema = z.object({
  id: z.string(),
  cargoReference: z.string(),
  teamId: z.string().nullable().optional(),
  team: trackingTeamSummarySchema.nullable().optional(),
  externalReference: z.string().nullable(),
  cargoDescription: z.string(),
  cargoType: z.enum(cargoTypes),
  status: z.enum(cargoStatuses),
  customsStatus: z.enum(cargoCustomsStatuses),
  conditionStatus: z.enum(cargoConditionStatuses),
  grossWeightKg: z.number().positive(),
  packageCount: z.number().int().positive(),
  hazardous: z.boolean(),
  requiresInspection: z.boolean(),
  originName: z.string(),
  destinationName: z.string(),
  custodyOwnerName: z.string(),
  priority: z.number().int().min(1).max(5),
  expectedReadyAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cargoOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    cargo: z.number().int().nonnegative(),
    activeCargo: z.number().int().nonnegative(),
    heldCargo: z.number().int().nonnegative(),
    hazardousCargo: z.number().int().nonnegative(),
    inspectionRequiredCargo: z.number().int().nonnegative(),
  }),
  statusCounts: z.array(cargoStatusCountSchema),
  recentCargo: z.array(cargoSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export const cargoRegisterOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  cargo: cargoSummarySchema.extend({
    shipperName: z.string(),
    consigneeName: z.string(),
    customsReference: z.string().nullable(),
    unNumber: z.string().nullable(),
    hazardClass: z.string().nullable(),
    sourceSystem: z.string(),
  }),
  businessRules: z.object({
    movementBlocked: z.boolean(),
    inspectionRequired: z.boolean(),
    customsBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.registered"),
    subjectType: z.literal("cargo"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.registered"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoReleaseOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  cargo: cargoSummarySchema.extend({
    customsReference: z.string().nullable(),
    releaseReference: z.string().nullable(),
    releaseReason: z.string().nullable(),
    releasedAt: z.string().nullable(),
    sourceSystem: z.string(),
  }),
  businessRules: z.object({
    releaseAllowed: z.boolean(),
    movementBlocked: z.boolean(),
    customsReleaseRequired: z.boolean(),
    inspectionRequiredBeforeRelease: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.released"),
    subjectType: z.literal("cargo"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.released"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoTransportPlanOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  shipmentId: z.string().nullable(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string(),
    transportPlannedAt: z.string(),
    transportPlanningReference: z.string().nullable(),
    transportOwnerTeam: z.string(),
  }),
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      transportMode: z.enum(trackingTransportModes),
      status: z.literal("planned"),
      plannedDepartureAt: z.string(),
      estimatedArrivalAt: z.string(),
    })
    .nullable(),
  businessRules: z.object({
    planningAllowed: z.boolean(),
    cargoReadyForTracking: z.boolean(),
    trackingLinked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.transport_planned"),
    subjectType: z.literal("cargo"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.transport_planned"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoTransportDepartOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  shipmentId: z.string().nullable(),
  eventId: z.string().nullable(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string(),
    departedAt: z.string(),
    departureReference: z.string().nullable(),
    departureLocationName: z.string(),
    departureOperatorName: z.string(),
    carrierReference: z.string().nullable(),
  }),
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      transportMode: z.enum(trackingTransportModes),
      previousStatus: z.enum(trackingShipmentStatuses),
      status: z.literal("in_transit"),
    })
    .nullable(),
  event: z
    .object({
      id: z.string(),
      eventType: z.literal("departed"),
      occurredAt: z.string(),
      locationName: z.string(),
    })
    .nullable(),
  businessRules: z.object({
    departureAllowed: z.boolean(),
    cargoReadyForDeparture: z.boolean(),
    trackingShipmentPlanned: z.boolean(),
    approvedComplianceEvidencePresent: z.boolean(),
    openComplianceReviewBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.transport_departed"),
    subjectType: z.literal("cargo"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.transport_departed"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoTransportArriveOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  shipmentId: z.string().nullable(),
  eventId: z.string().nullable(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string(),
    arrivedAt: z.string(),
    arrivalReference: z.string().nullable(),
    arrivalLocationName: z.string(),
    arrivalOperatorName: z.string(),
  }),
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      transportMode: z.enum(trackingTransportModes),
      previousStatus: z.enum(trackingShipmentStatuses),
      status: z.literal("arrived"),
      actualArrivalAt: z.string(),
    })
    .nullable(),
  event: z
    .object({
      id: z.string(),
      eventType: z.literal("arrived"),
      occurredAt: z.string(),
      locationName: z.string(),
    })
    .nullable(),
  businessRules: z.object({
    arrivalAllowed: z.boolean(),
    cargoInTransport: z.boolean(),
    trackingShipmentInTransit: z.boolean(),
    arrivalAfterDeparture: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.transport_arrived"),
    subjectType: z.literal("cargo"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.transport_arrived"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoDeliveryCompleteOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  shipmentId: z.string().nullable(),
  eventId: z.string().nullable(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string(),
    deliveredAt: z.string(),
    deliveryReference: z.string(),
    receivedByName: z.string(),
    deliveryNotes: z.string().nullable(),
  }),
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      transportMode: z.enum(trackingTransportModes),
      previousStatus: z.enum(trackingShipmentStatuses),
      status: z.literal("completed"),
    })
    .nullable(),
  event: z
    .object({
      id: z.string(),
      eventType: z.literal("handover_completed"),
      occurredAt: z.string(),
      locationName: z.string(),
    })
    .nullable(),
  businessRules: z.object({
    deliveryAllowed: z.boolean(),
    cargoArrivedForDelivery: z.boolean(),
    trackingShipmentArrived: z.boolean(),
    deliveryAfterArrival: z.boolean(),
    deliveryConditionAccepted: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.delivery_completed"),
    subjectType: z.literal("cargo"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.delivery_completed"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoDeliveryExceptionSummarySchema = z.object({
  id: z.string(),
  cargoId: z.string(),
  trackingShipmentId: z.string().nullable(),
  exceptionType: z.enum(cargoDeliveryExceptionTypes),
  deliveryConditionStatus: z.enum(cargoConditionStatuses),
  status: z.enum(cargoDeliveryExceptionStatuses),
  reportedByName: z.string(),
  exceptionSummary: z.string(),
  evidenceReference: z.string(),
  claimReference: z.string().nullable(),
  occurredAt: z.string(),
  resolverName: z.string().nullable(),
  resolutionCode: z.enum(cargoDeliveryExceptionResolutionCodes).nullable(),
  resolutionReference: z.string().nullable(),
  resolutionSummary: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cargoDeliveryExceptionRecordOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  exceptionId: z.string(),
  shipmentId: z.string().nullable(),
  eventId: z.string().nullable(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string(),
  }),
  exception: cargoDeliveryExceptionSummarySchema,
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      transportMode: z.enum(trackingTransportModes),
      previousStatus: z.enum(trackingShipmentStatuses),
      status: z.literal("exception"),
    })
    .nullable(),
  event: z
    .object({
      id: z.string(),
      eventType: z.literal("exception"),
      occurredAt: z.string(),
      locationName: z.string(),
    })
    .nullable(),
  businessRules: z.object({
    exceptionAccepted: z.boolean(),
    cargoArrivedForException: z.boolean(),
    trackingShipmentArrived: z.boolean(),
    openExceptionBlocked: z.boolean(),
    exceptionAfterArrival: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.delivery_exception.recorded"),
    subjectType: z.literal("cargo_delivery_exception"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.delivery_exception.recorded"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoDeliveryExceptionResolveOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  exceptionId: z.string(),
  shipmentId: z.string().nullable(),
  eventId: z.string().nullable(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string(),
  }),
  exception: cargoDeliveryExceptionSummarySchema,
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      transportMode: z.enum(trackingTransportModes),
      previousStatus: z.enum(trackingShipmentStatuses),
      status: z.literal("arrived"),
    })
    .nullable(),
  event: z
    .object({
      id: z.string(),
      eventType: z.literal("released"),
      occurredAt: z.string(),
      locationName: z.string(),
    })
    .nullable(),
  businessRules: z.object({
    resolutionAllowed: z.boolean(),
    openException: z.boolean(),
    cargoHeldForInspection: z.boolean(),
    trackingShipmentException: z.boolean(),
    resolutionAfterException: z.boolean(),
    cargoRestoredForDelivery: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.delivery_exception.resolved"),
    subjectType: z.literal("cargo_delivery_exception"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.delivery_exception.resolved"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoClaimSettlementSummarySchema = z.object({
  id: z.string(),
  cargoId: z.string(),
  deliveryExceptionId: z.string(),
  claimReference: z.string(),
  settlementReference: z.string(),
  settlementType: z.enum(cargoClaimSettlementTypes),
  settlementStatus: z.enum(cargoClaimSettlementStatuses),
  currencyCode: z.string().length(3),
  settlementAmount: z.number().positive(),
  settledByName: z.string(),
  counterpartyName: z.string(),
  settlementSummary: z.string(),
  settledAt: z.string(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cargoClaimSettlementRecordOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  exceptionId: z.string(),
  settlementId: z.string(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string().nullable(),
  }),
  exception: cargoDeliveryExceptionSummarySchema,
  settlement: cargoClaimSettlementSummarySchema,
  businessRules: z.object({
    settlementAllowed: z.boolean(),
    resolvedException: z.boolean(),
    claimReferencePresent: z.boolean(),
    claimReferenceMatched: z.boolean(),
    claimResolutionAccepted: z.boolean(),
    settlementAfterResolution: z.boolean(),
    duplicateSettlementBlocked: z.boolean(),
    duplicateReferenceBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.claim_settlement.recorded"),
    subjectType: z.literal("cargo_claim_settlement"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.claim_settlement.recorded"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoOperationalHandoffSummarySchema = z.object({
  id: z.string(),
  cargoId: z.string(),
  trackingShipmentId: z.string().nullable(),
  handoffType: z.enum(cargoOperationalHandoffTypes),
  fromCustodyOwnerName: z.string(),
  toCustodyOwnerName: z.string(),
  handoffLocationName: z.string(),
  operatorName: z.string(),
  handoffReference: z.string(),
  sealReference: z.string().nullable(),
  conditionStatus: z.enum(cargoConditionStatuses),
  handoffNotes: z.string().nullable(),
  handoffAt: z.string(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cargoOperationalHandoffRecordOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  handoffId: z.string(),
  shipmentId: z.string().nullable(),
  eventId: z.string().nullable(),
  cargo: cargoSummarySchema.extend({
    trackingShipmentId: z.string(),
    custodyOwnerName: z.string(),
  }),
  handoff: cargoOperationalHandoffSummarySchema,
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      transportMode: z.enum(trackingTransportModes),
      previousStatus: z.enum(trackingShipmentStatuses),
      status: z.literal("in_transit"),
    })
    .nullable(),
  event: z
    .object({
      id: z.string(),
      eventType: z.literal("location_updated"),
      occurredAt: z.string(),
      locationName: z.string(),
    })
    .nullable(),
  businessRules: z.object({
    handoffAllowed: z.boolean(),
    cargoInTransport: z.boolean(),
    trackingShipmentInTransit: z.boolean(),
    handoffAfterDeparture: z.boolean(),
    handoffBeforeArrival: z.boolean(),
    currentCustodyMatched: z.boolean(),
    custodyChanged: z.boolean(),
    conditionAccepted: z.boolean(),
    duplicateReferenceBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.operational_handoff.recorded"),
    subjectType: z.literal("cargo_operational_handoff"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.operational_handoff.recorded"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoComplianceEvidenceSummarySchema = z.object({
  id: z.string(),
  cargoId: z.string(),
  evidenceType: z.enum(cargoComplianceEvidenceTypes),
  documentReference: z.string(),
  documentTitle: z.string(),
  documentUri: z.string().nullable(),
  issuerName: z.string(),
  issuedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  status: z.enum(cargoComplianceEvidenceStatuses),
  reviewerName: z.string().nullable(),
  reviewReference: z.string().nullable(),
  reviewSummary: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  sourceSystem: z.string(),
  recordedAt: z.string(),
  updatedAt: z.string(),
});

export const cargoComplianceEvidenceRecordOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  evidenceId: z.string(),
  evidence: cargoComplianceEvidenceSummarySchema,
  businessRules: z.object({
    evidenceAccepted: z.boolean(),
    reviewRequired: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.compliance_evidence.recorded"),
    subjectType: z.literal("cargo_compliance_evidence"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.compliance_evidence.recorded"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export const cargoComplianceEvidenceVerifyOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  evidenceId: z.string(),
  evidence: cargoComplianceEvidenceSummarySchema,
  businessRules: z.object({
    verificationAllowed: z.boolean(),
    evidenceApproved: z.boolean(),
    evidenceRejected: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("cargo.compliance_evidence.verified"),
    subjectType: z.literal("cargo_compliance_evidence"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("cargo.compliance_evidence.verified"),
    aggregateType: z.literal("cargo"),
    aggregateId: z.string(),
  }),
});

export type CargoComplianceEvidenceRecordInput = z.infer<
  typeof cargoComplianceEvidenceRecordInputSchema
>;
export type CargoComplianceEvidenceRecordOutput = z.infer<
  typeof cargoComplianceEvidenceRecordOutputSchema
>;
export type CargoComplianceEvidenceVerifyInput = z.infer<
  typeof cargoComplianceEvidenceVerifyInputSchema
>;
export type CargoComplianceEvidenceVerifyOutput = z.infer<
  typeof cargoComplianceEvidenceVerifyOutputSchema
>;
export type CargoClaimSettlementRecordInput = z.infer<typeof cargoClaimSettlementRecordInputSchema>;
export type CargoClaimSettlementRecordOutput = z.infer<
  typeof cargoClaimSettlementRecordOutputSchema
>;
export type CargoDeliveryExceptionRecordInput = z.infer<
  typeof cargoDeliveryExceptionRecordInputSchema
>;
export type CargoDeliveryExceptionRecordOutput = z.infer<
  typeof cargoDeliveryExceptionRecordOutputSchema
>;
export type CargoDeliveryExceptionResolveInput = z.infer<
  typeof cargoDeliveryExceptionResolveInputSchema
>;
export type CargoDeliveryExceptionResolveOutput = z.infer<
  typeof cargoDeliveryExceptionResolveOutputSchema
>;
export type CargoOperationalHandoffRecordInput = z.infer<
  typeof cargoOperationalHandoffRecordInputSchema
>;
export type CargoOperationalHandoffRecordOutput = z.infer<
  typeof cargoOperationalHandoffRecordOutputSchema
>;
export type CargoOverviewInput = z.infer<typeof cargoOverviewInputSchema>;
export type CargoOverviewOutput = z.infer<typeof cargoOverviewOutputSchema>;
export type CargoReleaseInput = z.infer<typeof cargoReleaseInputSchema>;
export type CargoReleaseOutput = z.infer<typeof cargoReleaseOutputSchema>;
export type CargoRegisterInput = z.infer<typeof cargoRegisterInputSchema>;
export type CargoRegisterOutput = z.infer<typeof cargoRegisterOutputSchema>;
export type CargoTransportArriveInput = z.infer<typeof cargoTransportArriveInputSchema>;
export type CargoTransportArriveOutput = z.infer<typeof cargoTransportArriveOutputSchema>;
export type CargoTransportDepartInput = z.infer<typeof cargoTransportDepartInputSchema>;
export type CargoTransportDepartOutput = z.infer<typeof cargoTransportDepartOutputSchema>;
export type CargoTransportPlanInput = z.infer<typeof cargoTransportPlanInputSchema>;
export type CargoTransportPlanOutput = z.infer<typeof cargoTransportPlanOutputSchema>;
export type CargoDeliveryCompleteInput = z.infer<typeof cargoDeliveryCompleteInputSchema>;
export type CargoDeliveryCompleteOutput = z.infer<typeof cargoDeliveryCompleteOutputSchema>;

export const cargoOverviewMetadata = createRpcOperationMetadata({
  name: "cargo.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["cargo.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const cargoRegisterMetadata = createRpcOperationMetadata({
  name: "cargo.register",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.register"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoReleaseMetadata = createRpcOperationMetadata({
  name: "cargo.release",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.release"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoTransportPlanMetadata = createRpcOperationMetadata({
  name: "cargo.transport.plan",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.transport.plan"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoTransportDepartMetadata = createRpcOperationMetadata({
  name: "cargo.transport.depart",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.transport.depart"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoTransportArriveMetadata = createRpcOperationMetadata({
  name: "cargo.transport.arrive",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.transport.arrive"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoDeliveryCompleteMetadata = createRpcOperationMetadata({
  name: "cargo.delivery.complete",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.delivery.complete"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoDeliveryExceptionRecordMetadata = createRpcOperationMetadata({
  name: "cargo.delivery.exception.record",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.delivery.exception.record"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoDeliveryExceptionResolveMetadata = createRpcOperationMetadata({
  name: "cargo.delivery.exception.resolve",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.delivery.exception.resolve"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoClaimSettlementRecordMetadata = createRpcOperationMetadata({
  name: "cargo.claim.settle",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.claim.settle"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoOperationalHandoffRecordMetadata = createRpcOperationMetadata({
  name: "cargo.handoff.record",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.handoff.record"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const cargoComplianceEvidenceRecordMetadata = createRpcOperationMetadata({
  name: "cargo.compliance.evidence.record",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.compliance.record"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const cargoComplianceEvidenceVerifyMetadata = createRpcOperationMetadata({
  name: "cargo.compliance.evidence.verify",
  kind: "mutation",
  auth: "session",
  permissions: ["cargo.compliance.verify"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});
