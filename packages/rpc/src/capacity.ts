import { z } from "zod";

import { cargoStatuses } from "./cargo.js";
import { createRpcOperationMetadata } from "./metadata.js";

export const capacityResourceTypes = [
  "terminal",
  "gate",
  "berth",
  "rail_track",
  "yard",
  "carrier_slot",
] as const;

export const capacitySlotStatuses = ["open", "blocked", "closed"] as const;

export const capacityReservationPurposes = [
  "handoff",
  "departure",
  "arrival",
  "delivery",
  "storage",
  "other",
] as const;

export const capacityReservationStatuses = ["reserved", "cancelled"] as const;

export const capacityAdvisoryRecommendationTypes = [
  "slot_saturation",
  "expiring_slot",
  "unused_capacity",
  "reservation_imbalance",
  "cancellation_review",
] as const;

export const capacityAdvisorySeverities = ["low", "medium", "high", "critical"] as const;

export const capacityAdvisoryApprovalPermissions = [
  "capacity.manage",
  "capacity.slot.reserve",
  "capacity.slot.cancel",
] as const;

export const capacityAdvisoryDecisionStatuses = ["approved", "rejected"] as const;

const capacityReferenceSchema = z.string().trim().min(3).max(120);
const capacityIdempotencySchema = z.string().trim().min(12).max(128);
const capacitySourceSystemSchema = z.string().trim().min(1).max(80).default("saptm");

export const capacityOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
  })
  .default({
    limit: 10,
  });

export const capacityAdvisoryInputSchema = z
  .object({
    limit: z.number().int().min(1).max(20).default(5),
  })
  .default({
    limit: 5,
  });

export const capacityAdvisoryDecisionAnalyticsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    windowDays: z.number().int().min(1).max(365).default(30),
  })
  .default({
    limit: 10,
    windowDays: 30,
  });

export const capacityResourceRegisterInputSchema = z.object({
  resourceCode: z.string().trim().min(3).max(80),
  resourceName: z.string().trim().min(3).max(180),
  resourceType: z.enum(capacityResourceTypes),
  locationName: z.string().trim().min(2).max(180),
  maxConcurrentBookings: z.number().int().min(1).max(100_000),
  idempotencyKey: capacityIdempotencySchema,
  sourceSystem: capacitySourceSystemSchema,
});

export const capacitySlotOpenInputSchema = z
  .object({
    resourceId: z.string().min(1),
    slotReference: capacityReferenceSchema,
    windowStartAt: z.string().datetime(),
    windowEndAt: z.string().datetime(),
    capacityUnits: z.number().int().min(1).max(100_000),
    idempotencyKey: capacityIdempotencySchema,
    sourceSystem: capacitySourceSystemSchema,
  })
  .superRefine((slot, context) => {
    if (Date.parse(slot.windowEndAt) <= Date.parse(slot.windowStartAt)) {
      context.addIssue({
        code: "custom",
        message: "Slot window end must be after window start.",
        path: ["windowEndAt"],
      });
    }
  });

export const capacitySlotReserveInputSchema = z.object({
  cargoId: z.string().min(1),
  slotId: z.string().min(1),
  reservationReference: capacityReferenceSchema,
  reservationPurpose: z.enum(capacityReservationPurposes),
  reservedUnits: z.number().int().min(1).max(100_000),
  reservedByName: z.string().trim().min(2).max(120),
  reservedAt: z.string().datetime(),
  idempotencyKey: capacityIdempotencySchema,
  sourceSystem: capacitySourceSystemSchema,
});

export const capacitySlotCancelInputSchema = z.object({
  reservationId: z.string().min(1),
  cancellationReference: capacityReferenceSchema,
  cancelledByName: z.string().trim().min(2).max(120),
  cancellationReason: z.string().trim().min(3).max(500),
  cancelledAt: z.string().datetime(),
  idempotencyKey: capacityIdempotencySchema,
  sourceSystem: capacitySourceSystemSchema,
});

export const capacityAdvisoryDecisionRecordInputSchema = z
  .object({
    recommendationId: z.string().trim().min(12).max(240),
    recommendationType: z.enum(capacityAdvisoryRecommendationTypes),
    decisionStatus: z.enum(capacityAdvisoryDecisionStatuses),
    decidedByName: z.string().trim().min(2).max(120),
    decisionReason: z.string().trim().min(8).max(700),
    approvalReference: z.string().trim().min(3).max(120).optional(),
    requiredPermission: z.enum(capacityAdvisoryApprovalPermissions),
    slotId: z.string().trim().min(1).optional(),
    reservationId: z.string().trim().min(1).optional(),
    decidedAt: z.string().datetime(),
    idempotencyKey: capacityIdempotencySchema,
    sourceSystem: capacitySourceSystemSchema,
  })
  .superRefine((decision, context) => {
    if (decision.decisionStatus === "approved" && decision.approvalReference === undefined) {
      context.addIssue({
        code: "custom",
        message: "Approved advisory decisions require an approval reference.",
        path: ["approvalReference"],
      });
    }
  });

export const capacityResourceSummarySchema = z.object({
  id: z.string(),
  resourceCode: z.string(),
  resourceName: z.string(),
  resourceType: z.enum(capacityResourceTypes),
  locationName: z.string(),
  maxConcurrentBookings: z.number().int().positive(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const capacitySlotSummarySchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  resourceCode: z.string(),
  resourceType: z.enum(capacityResourceTypes),
  locationName: z.string(),
  slotReference: z.string(),
  windowStartAt: z.string(),
  windowEndAt: z.string(),
  capacityUnits: z.number().int().positive(),
  reservedUnits: z.number().int().nonnegative(),
  availableUnits: z.number().int().nonnegative(),
  status: z.enum(capacitySlotStatuses),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const capacityReservationSummarySchema = z.object({
  id: z.string(),
  cargoId: z.string(),
  cargoReference: z.string(),
  slotId: z.string(),
  reservationReference: z.string(),
  reservationPurpose: z.enum(capacityReservationPurposes),
  status: z.enum(capacityReservationStatuses),
  reservedUnits: z.number().int().positive(),
  reservedByName: z.string(),
  reservedAt: z.string(),
  cancellationReference: z.string().nullable(),
  cancelledByName: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  sourceSystem: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const capacityCargoSummarySchema = z.object({
  id: z.string(),
  cargoReference: z.string(),
  cargoDescription: z.string(),
  status: z.enum(cargoStatuses),
  custodyOwnerName: z.string(),
});

export const capacityOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    resources: z.number().int().nonnegative(),
    openSlots: z.number().int().nonnegative(),
    blockedSlots: z.number().int().nonnegative(),
    closedSlots: z.number().int().nonnegative(),
    activeReservations: z.number().int().nonnegative(),
  }),
  upcomingSlots: z.array(capacitySlotSummarySchema),
  recentReservations: z.array(capacityReservationSummarySchema),
});

export const capacityAdvisoryRecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(capacityAdvisoryRecommendationTypes),
  severity: z.enum(capacityAdvisorySeverities),
  title: z.string(),
  rationale: z.string(),
  recommendedAction: z.string(),
  slot: capacitySlotSummarySchema.nullable(),
  reservation: capacityReservationSummarySchema.nullable(),
  metrics: z.object({
    utilizationPercent: z.number().min(0).max(100),
    availableUnits: z.number().int().nonnegative(),
    hoursUntilWindowEnd: z.number().nonnegative().nullable(),
  }),
  humanApprovalRequired: z.literal(true),
  approvalRequiredFor: z.enum(capacityAdvisoryApprovalPermissions).nullable(),
  confidenceScore: z.number().min(0).max(1),
  source: z.literal("rule_based_capacity_optimizer"),
});

export const capacityAdvisoryOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: z.object({
    automationAllowed: z.literal(false),
    humanApprovalRequired: z.literal(true),
    source: z.literal("rule_based_capacity_optimizer"),
  }),
  recommendations: z.array(capacityAdvisoryRecommendationSchema),
});

export const capacityAdvisoryDecisionSummarySchema = z.object({
  id: z.string(),
  recommendationId: z.string(),
  recommendationType: z.enum(capacityAdvisoryRecommendationTypes),
  decisionStatus: z.enum(capacityAdvisoryDecisionStatuses),
  decidedByName: z.string(),
  decisionReason: z.string(),
  approvalReference: z.string().nullable(),
  requiredPermission: z.enum(capacityAdvisoryApprovalPermissions),
  slotId: z.string().nullable(),
  reservationId: z.string().nullable(),
  sourceSystem: z.string(),
  decidedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const capacityAdvisoryDecisionRecordOutputSchema = z.object({
  organizationId: z.string(),
  decisionId: z.string(),
  decision: capacityAdvisoryDecisionSummarySchema,
  businessRules: z.object({
    decisionAccepted: z.boolean(),
    recommendationTraceable: z.boolean(),
    humanDecisionCaptured: z.boolean(),
    approvalReferenceRequired: z.boolean(),
    duplicateDecisionBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("capacity.advisory.decision.recorded"),
    subjectType: z.literal("capacity_advisory_decision"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("capacity.advisory.decision.recorded"),
    aggregateType: z.literal("capacity"),
    aggregateId: z.string(),
  }),
});

const capacityAdvisoryDecisionAnalyticsGroupSchema = z.object({
  decisions: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  approvalRatePercent: z.number().min(0).max(100),
});

export const capacityAdvisoryDecisionAnalyticsOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  window: z.object({
    startedAt: z.string(),
    endedAt: z.string(),
    windowDays: z.number().int().positive(),
  }),
  totals: capacityAdvisoryDecisionAnalyticsGroupSchema.extend({
    decisionsWithApprovalReference: z.number().int().nonnegative(),
    decisionsRequiringOperationalPermission: z.number().int().nonnegative(),
  }),
  byRecommendationType: z.array(
    capacityAdvisoryDecisionAnalyticsGroupSchema.extend({
      recommendationType: z.enum(capacityAdvisoryRecommendationTypes),
    }),
  ),
  byRequiredPermission: z.array(
    capacityAdvisoryDecisionAnalyticsGroupSchema.extend({
      requiredPermission: z.enum(capacityAdvisoryApprovalPermissions),
    }),
  ),
  recentDecisions: z.array(capacityAdvisoryDecisionSummarySchema),
  governance: z.object({
    readOnly: z.literal(true),
    automationAllowed: z.literal(false),
    humanApprovalRequired: z.literal(true),
    source: z.literal("capacity_advisory_decision_analytics"),
  }),
});

export const capacityResourceRegisterOutputSchema = z.object({
  organizationId: z.string(),
  resourceId: z.string(),
  resource: capacityResourceSummarySchema,
  businessRules: z.object({
    resourceAccepted: z.boolean(),
    uniqueResourceCode: z.boolean(),
    capacityPositive: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("capacity.resource.registered"),
    subjectType: z.literal("capacity_resource"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("capacity.resource.registered"),
    aggregateType: z.literal("capacity"),
    aggregateId: z.string(),
  }),
});

export const capacitySlotOpenOutputSchema = z.object({
  organizationId: z.string(),
  resourceId: z.string(),
  slotId: z.string(),
  resource: capacityResourceSummarySchema,
  slot: capacitySlotSummarySchema,
  businessRules: z.object({
    slotOpened: z.boolean(),
    resourceActive: z.boolean(),
    windowValid: z.boolean(),
    capacityWithinResourceLimit: z.boolean(),
    duplicateReferenceBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("capacity.slot.opened"),
    subjectType: z.literal("capacity_slot"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("capacity.slot.opened"),
    aggregateType: z.literal("capacity"),
    aggregateId: z.string(),
  }),
});

export const capacitySlotReserveOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  slotId: z.string(),
  reservationId: z.string(),
  cargo: capacityCargoSummarySchema,
  resource: capacityResourceSummarySchema,
  slot: capacitySlotSummarySchema,
  reservation: capacityReservationSummarySchema,
  businessRules: z.object({
    reservationAllowed: z.boolean(),
    cargoEligible: z.boolean(),
    slotOpen: z.boolean(),
    reservationWithinWindow: z.boolean(),
    capacityAvailable: z.boolean(),
    duplicateReservationBlocked: z.boolean(),
    duplicateCargoSlotBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("capacity.slot.reserved"),
    subjectType: z.literal("capacity_slot_reservation"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("capacity.slot.reserved"),
    aggregateType: z.literal("capacity"),
    aggregateId: z.string(),
  }),
});

export const capacitySlotCancelOutputSchema = z.object({
  organizationId: z.string(),
  cargoId: z.string(),
  slotId: z.string(),
  reservationId: z.string(),
  cargo: capacityCargoSummarySchema,
  resource: capacityResourceSummarySchema,
  slot: capacitySlotSummarySchema,
  reservation: capacityReservationSummarySchema,
  businessRules: z.object({
    cancellationAllowed: z.boolean(),
    reservationActive: z.boolean(),
    cancellationAfterReservation: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("capacity.slot_reservation.cancelled"),
    subjectType: z.literal("capacity_slot_reservation"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("capacity.slot_reservation.cancelled"),
    aggregateType: z.literal("capacity"),
    aggregateId: z.string(),
  }),
});

export type CapacityOverviewInput = z.infer<typeof capacityOverviewInputSchema>;
export type CapacityOverviewOutput = z.infer<typeof capacityOverviewOutputSchema>;
export type CapacityAdvisoryInput = z.infer<typeof capacityAdvisoryInputSchema>;
export type CapacityAdvisoryOutput = z.infer<typeof capacityAdvisoryOutputSchema>;
export type CapacityAdvisoryDecisionAnalyticsInput = z.infer<
  typeof capacityAdvisoryDecisionAnalyticsInputSchema
>;
export type CapacityAdvisoryDecisionAnalyticsOutput = z.infer<
  typeof capacityAdvisoryDecisionAnalyticsOutputSchema
>;
export type CapacityResourceRegisterInput = z.infer<typeof capacityResourceRegisterInputSchema>;
export type CapacityResourceRegisterOutput = z.infer<typeof capacityResourceRegisterOutputSchema>;
export type CapacitySlotOpenInput = z.infer<typeof capacitySlotOpenInputSchema>;
export type CapacitySlotOpenOutput = z.infer<typeof capacitySlotOpenOutputSchema>;
export type CapacitySlotReserveInput = z.infer<typeof capacitySlotReserveInputSchema>;
export type CapacitySlotReserveOutput = z.infer<typeof capacitySlotReserveOutputSchema>;
export type CapacitySlotCancelInput = z.infer<typeof capacitySlotCancelInputSchema>;
export type CapacitySlotCancelOutput = z.infer<typeof capacitySlotCancelOutputSchema>;
export type CapacityAdvisoryDecisionRecordInput = z.infer<
  typeof capacityAdvisoryDecisionRecordInputSchema
>;
export type CapacityAdvisoryDecisionRecordOutput = z.infer<
  typeof capacityAdvisoryDecisionRecordOutputSchema
>;

export const capacityOverviewMetadata = createRpcOperationMetadata({
  name: "capacity.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["capacity.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const capacityAdvisoryMetadata = createRpcOperationMetadata({
  name: "capacity.optimization.advisory.read",
  kind: "query",
  auth: "session",
  permissions: ["capacity.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const capacityAdvisoryDecisionAnalyticsMetadata = createRpcOperationMetadata({
  name: "capacity.advisory.decision.analytics.read",
  kind: "query",
  auth: "session",
  permissions: ["capacity.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const capacityResourceRegisterMetadata = createRpcOperationMetadata({
  name: "capacity.resource.register",
  kind: "mutation",
  auth: "session",
  permissions: ["capacity.manage"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const capacitySlotOpenMetadata = createRpcOperationMetadata({
  name: "capacity.slot.open",
  kind: "mutation",
  auth: "session",
  permissions: ["capacity.manage"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const capacitySlotReserveMetadata = createRpcOperationMetadata({
  name: "capacity.slot.reserve",
  kind: "mutation",
  auth: "session",
  permissions: ["capacity.slot.reserve"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const capacitySlotCancelMetadata = createRpcOperationMetadata({
  name: "capacity.slot.cancel",
  kind: "mutation",
  auth: "session",
  permissions: ["capacity.slot.cancel"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const capacityAdvisoryDecisionRecordMetadata = createRpcOperationMetadata({
  name: "capacity.advisory.decision.record",
  kind: "mutation",
  auth: "session",
  permissions: ["capacity.advisory.decide"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});
