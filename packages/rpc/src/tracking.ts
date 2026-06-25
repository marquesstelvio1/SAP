import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

export const trackingShipmentStatuses = [
  "planned",
  "in_transit",
  "delayed",
  "exception",
  "arrived",
  "completed",
  "cancelled",
] as const;

export const trackingTransportModes = ["rail", "port", "road", "multimodal"] as const;

export const trackingEventTypes = [
  "created",
  "departed",
  "arrived",
  "delayed",
  "exception",
  "location_updated",
  "handover_completed",
  "customs_hold",
  "released",
] as const;

export const trackingExceptionCategories = [
  "delay",
  "damage",
  "customs_hold",
  "security",
  "capacity",
  "documentation",
  "weather",
  "infrastructure",
  "other",
] as const;

export const trackingExceptionSeverities = ["medium", "high", "critical"] as const;

export const trackingOperatorEvidenceTypes = [
  "operator_note",
  "photo",
  "document",
  "sensor",
  "inspection",
  "external_reference",
] as const;

export const trackingApprovalStatuses = ["pending_review", "approved"] as const;

export const trackingExceptionWorkflowStates = [
  "exception_opened",
  "pending_review",
  "approved_for_resolution",
  "closed",
] as const;

export const trackingAdvisoryRecommendationTypes = [
  "sla_risk",
  "exception_recovery",
  "priority_review",
  "workflow_review",
] as const;

export const trackingAdvisorySeverities = ["medium", "high", "critical"] as const;

export const trackingAdvisoryApprovalPermissions = [
  "tracking.event.record",
  "tracking.exception.manage",
  "tracking.exception.resolve",
] as const;

export const trackingExceptionResolutionCodes = [
  "documentation_fixed",
  "customs_released",
  "capacity_reallocated",
  "infrastructure_restored",
  "cargo_recovered",
  "weather_cleared",
  "manual_override",
  "other",
] as const;

export const trackingExceptionResolutionStatuses = ["in_transit", "arrived", "completed"] as const;

export type TrackingEventPayloadValue =
  | string
  | number
  | boolean
  | null
  | TrackingEventPayloadValue[]
  | { [key: string]: TrackingEventPayloadValue };

export const trackingEventPayloadValueSchema: z.ZodType<TrackingEventPayloadValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(trackingEventPayloadValueSchema),
    z.record(z.string(), trackingEventPayloadValueSchema),
  ]),
);

export const trackingEventPayloadSchema = z.record(z.string(), trackingEventPayloadValueSchema);
export type TrackingEventPayload = z.infer<typeof trackingEventPayloadSchema>;

const trackingOperatorEvidenceBaseSchema = z.object({
  operatorName: z.string().min(2).max(120),
  evidenceType: z.enum(trackingOperatorEvidenceTypes),
  evidenceReference: z.string().min(3).max(180),
  evidenceSummary: z.string().min(3).max(500),
  approvalStatus: z.enum(trackingApprovalStatuses).default("pending_review"),
  approvalReference: z.string().min(3).max(180).optional(),
  approverName: z.string().min(2).max(120).optional(),
});

export const trackingOperatorEvidenceSchema = trackingOperatorEvidenceBaseSchema.superRefine(
  (evidence, context) => {
    if (evidence.approvalStatus !== "approved") {
      return;
    }

    if (evidence.approvalReference === undefined) {
      context.addIssue({
        code: "custom",
        message: "Approved evidence requires an approval reference.",
        path: ["approvalReference"],
      });
    }

    if (evidence.approverName === undefined) {
      context.addIssue({
        code: "custom",
        message: "Approved evidence requires an approver name.",
        path: ["approverName"],
      });
    }
  },
);

const trackingApprovedOperatorEvidenceSchema = trackingOperatorEvidenceBaseSchema.extend({
  approvalStatus: z.literal("approved"),
  approvalReference: z.string().min(3).max(180),
  approverName: z.string().min(2).max(120),
});

const trackingOperatorEvidenceOutputSchema = z.object({
  operatorName: z.string(),
  evidenceType: z.enum(trackingOperatorEvidenceTypes),
  evidenceReference: z.string(),
  evidenceSummary: z.string(),
  approvalStatus: z.enum(trackingApprovalStatuses),
  approvalReference: z.string().nullable(),
  approverName: z.string().nullable(),
});

export const trackingOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 10,
    offset: 0,
  });

export const trackingEventRecordInputSchema = z.object({
  shipmentId: z.string().min(1),
  eventType: z.enum(trackingEventTypes),
  occurredAt: z.string().datetime(),
  idempotencyKey: z.string().min(12).max(128),
  locationName: z.string().min(1).max(180).optional(),
  notes: z.string().min(1).max(2000).optional(),
  sourceSystem: z.string().min(1).max(80).default("saptm"),
  payload: trackingEventPayloadSchema.optional(),
});

export const trackingShipmentDetailInputSchema = z.object({
  shipmentId: z.string().min(1),
  eventLimit: z.number().int().min(1).max(100).default(50),
});

export const trackingExceptionManageInputSchema = z.object({
  shipmentId: z.string().min(1),
  category: z.enum(trackingExceptionCategories),
  severity: z.enum(trackingExceptionSeverities).default("high"),
  occurredAt: z.string().datetime(),
  idempotencyKey: z.string().min(12).max(128),
  summary: z.string().min(1).max(240),
  recoveryPlan: z.string().min(1).max(2000),
  evidence: trackingOperatorEvidenceSchema,
  ownerTeam: z.string().min(1).max(120).optional(),
  expectedResolutionAt: z.string().datetime().optional(),
  locationName: z.string().min(1).max(180).optional(),
  sourceSystem: z.string().min(1).max(80).default("saptm"),
  payload: trackingEventPayloadSchema.optional(),
});

export const trackingExceptionResolveInputSchema = z.object({
  shipmentId: z.string().min(1),
  occurredAt: z.string().datetime(),
  idempotencyKey: z.string().min(12).max(128),
  resolutionCode: z.enum(trackingExceptionResolutionCodes),
  summary: z.string().min(1).max(500),
  nextStatus: z.enum(trackingExceptionResolutionStatuses).default("in_transit"),
  evidence: trackingApprovedOperatorEvidenceSchema,
  ownerTeam: z.string().min(1).max(120).optional(),
  locationName: z.string().min(1).max(180).optional(),
  sourceSystem: z.string().min(1).max(80).default("saptm"),
  payload: trackingEventPayloadSchema.optional(),
});

export const trackingStatusCountSchema = z.object({
  status: z.enum(trackingShipmentStatuses),
  count: z.number().int().nonnegative(),
});

export const trackingAnalyticsInputSchema = z
  .object({
    lookbackDays: z.number().int().min(1).max(90).default(30),
  })
  .default({
    lookbackDays: 30,
  });

export const trackingAdvisoryInputSchema = z
  .object({
    limit: z.number().int().min(1).max(20).default(5),
  })
  .default({
    limit: 5,
  });

export const trackingRecentShipmentSchema = z.object({
  id: z.string(),
  referenceCode: z.string(),
  externalReference: z.string().nullable(),
  cargoDescription: z.string(),
  originName: z.string(),
  destinationName: z.string(),
  transportMode: z.enum(trackingTransportModes),
  status: z.enum(trackingShipmentStatuses),
  priority: z.number().int(),
  estimatedArrivalAt: z.string().nullable(),
  lastEventAt: z.string().nullable(),
  lastEventType: z.enum(trackingEventTypes).nullable(),
  lastKnownLocation: z.string().nullable(),
});

export const trackingOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    shipments: z.number().int().nonnegative(),
    activeShipments: z.number().int().nonnegative(),
    delayedShipments: z.number().int().nonnegative(),
    exceptionShipments: z.number().int().nonnegative(),
  }),
  statusCounts: z.array(trackingStatusCountSchema),
  recentShipments: z.array(trackingRecentShipmentSchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export const trackingModeAggregateSchema = z.object({
  transportMode: z.enum(trackingTransportModes),
  shipments: z.number().int().nonnegative(),
  activeShipments: z.number().int().nonnegative(),
  delayedShipments: z.number().int().nonnegative(),
  exceptionShipments: z.number().int().nonnegative(),
});

export const trackingEventTypeAggregateSchema = z.object({
  eventType: z.enum(trackingEventTypes),
  count: z.number().int().nonnegative(),
  latestOccurredAt: z.string().nullable(),
});

export const trackingWorkflowStateAggregateSchema = z.object({
  state: z.enum(trackingExceptionWorkflowStates),
  count: z.number().int().nonnegative(),
});

export const trackingAnalyticsOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  window: z.object({
    lookbackDays: z.number().int().min(1).max(90),
    startedAt: z.string(),
    endedAt: z.string(),
  }),
  kpis: z.object({
    totalShipments: z.number().int().nonnegative(),
    activeShipments: z.number().int().nonnegative(),
    delayedShipments: z.number().int().nonnegative(),
    exceptionShipments: z.number().int().nonnegative(),
    completedShipments: z.number().int().nonnegative(),
    highPriorityActiveShipments: z.number().int().nonnegative(),
    eventsInWindow: z.number().int().nonnegative(),
    delayRatePercent: z.number().nonnegative(),
    exceptionRatePercent: z.number().nonnegative(),
    averageEventsPerShipment: z.number().nonnegative(),
  }),
  slaRisk: z.object({
    overdueShipments: z.number().int().nonnegative(),
    dueWithin24Hours: z.number().int().nonnegative(),
    unscheduledActiveShipments: z.number().int().nonnegative(),
  }),
  modeDistribution: z.array(trackingModeAggregateSchema),
  eventTypeCounts: z.array(trackingEventTypeAggregateSchema),
  workflowStateCounts: z.array(trackingWorkflowStateAggregateSchema),
});

export const trackingAdvisoryRecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(trackingAdvisoryRecommendationTypes),
  severity: z.enum(trackingAdvisorySeverities),
  title: z.string(),
  rationale: z.string(),
  recommendedAction: z.string(),
  shipment: z
    .object({
      id: z.string(),
      referenceCode: z.string(),
      cargoDescription: z.string(),
      status: z.enum(trackingShipmentStatuses),
      transportMode: z.enum(trackingTransportModes),
      estimatedArrivalAt: z.string().nullable(),
    })
    .nullable(),
  humanApprovalRequired: z.literal(true),
  approvalRequiredFor: z.enum(trackingAdvisoryApprovalPermissions).nullable(),
  confidenceScore: z.number().min(0).max(1),
  source: z.literal("rule_based_operational_advisor"),
});

export const trackingAdvisoryOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: z.object({
    automationAllowed: z.literal(false),
    humanApprovalRequired: z.literal(true),
    source: z.literal("rule_based_operational_advisor"),
  }),
  recommendations: z.array(trackingAdvisoryRecommendationSchema),
});

export const trackingEventRecordOutputSchema = z.object({
  organizationId: z.string(),
  shipmentId: z.string(),
  event: z.object({
    id: z.string(),
    eventType: z.enum(trackingEventTypes),
    occurredAt: z.string(),
    locationName: z.string().nullable(),
    notes: z.string().nullable(),
    sourceSystem: z.string(),
    correlationId: z.string(),
    idempotencyKey: z.string(),
  }),
  shipment: z.object({
    id: z.string(),
    referenceCode: z.string(),
    currentStatus: z.enum(trackingShipmentStatuses),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("tracking.event.recorded"),
    subjectType: z.literal("tracking.shipment"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("tracking.event.recorded"),
    aggregateType: z.literal("tracking.shipment"),
    aggregateId: z.string(),
  }),
});

export const trackingShipmentDetailEventSchema = z.object({
  id: z.string(),
  eventType: z.enum(trackingEventTypes),
  occurredAt: z.string(),
  locationName: z.string().nullable(),
  notes: z.string().nullable(),
  payload: trackingEventPayloadSchema.nullable(),
  workflowState: z.enum(trackingExceptionWorkflowStates).nullable(),
  sourceSystem: z.string(),
  correlationId: z.string(),
  idempotencyKey: z.string().nullable(),
  createdAt: z.string(),
});

export const trackingShipmentDetailOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  shipment: z.object({
    id: z.string(),
    referenceCode: z.string(),
    externalReference: z.string().nullable(),
    cargoDescription: z.string(),
    originName: z.string(),
    destinationName: z.string(),
    transportMode: z.enum(trackingTransportModes),
    status: z.enum(trackingShipmentStatuses),
    priority: z.number().int(),
    plannedDepartureAt: z.string().nullable(),
    estimatedArrivalAt: z.string().nullable(),
    actualArrivalAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastEventAt: z.string().nullable(),
    lastEventType: z.enum(trackingEventTypes).nullable(),
    lastKnownLocation: z.string().nullable(),
    eventCount: z.number().int().nonnegative(),
  }),
  timeline: z.array(trackingShipmentDetailEventSchema),
});

export const trackingExceptionManageOutputSchema = z.object({
  organizationId: z.string(),
  shipmentId: z.string(),
  exception: z.object({
    category: z.enum(trackingExceptionCategories),
    severity: z.enum(trackingExceptionSeverities),
    summary: z.string(),
    recoveryPlan: z.string(),
    ownerTeam: z.string().nullable(),
    expectedResolutionAt: z.string().nullable(),
  }),
  evidence: trackingOperatorEvidenceOutputSchema,
  workflow: z.object({
    state: z.enum(trackingExceptionWorkflowStates),
    terminal: z.boolean(),
    releaseEvidenceRequired: z.boolean(),
  }),
  event: z.object({
    id: z.string(),
    eventType: z.enum(["exception", "customs_hold", "delayed"]),
    occurredAt: z.string(),
    locationName: z.string().nullable(),
    notes: z.string(),
    sourceSystem: z.string(),
    correlationId: z.string(),
    idempotencyKey: z.string(),
  }),
  shipment: z.object({
    id: z.string(),
    referenceCode: z.string(),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("tracking.exception.managed"),
    subjectType: z.literal("tracking.shipment"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("tracking.exception.managed"),
    aggregateType: z.literal("tracking.shipment"),
    aggregateId: z.string(),
  }),
});

export const trackingExceptionResolveOutputSchema = z.object({
  organizationId: z.string(),
  shipmentId: z.string(),
  resolution: z.object({
    resolutionCode: z.enum(trackingExceptionResolutionCodes),
    summary: z.string(),
    ownerTeam: z.string().nullable(),
    nextStatus: z.enum(trackingExceptionResolutionStatuses),
  }),
  evidence: trackingOperatorEvidenceOutputSchema,
  workflow: z.object({
    state: z.enum(trackingExceptionWorkflowStates),
    terminal: z.boolean(),
    releaseEvidenceRequired: z.boolean(),
  }),
  event: z.object({
    id: z.string(),
    eventType: z.literal("released"),
    occurredAt: z.string(),
    locationName: z.string().nullable(),
    notes: z.string(),
    sourceSystem: z.string(),
    correlationId: z.string(),
    idempotencyKey: z.string(),
  }),
  shipment: z.object({
    id: z.string(),
    referenceCode: z.string(),
    previousStatus: z.enum(trackingShipmentStatuses),
    currentStatus: z.enum(trackingShipmentStatuses),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("tracking.exception.resolved"),
    subjectType: z.literal("tracking.shipment"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("tracking.exception.resolved"),
    aggregateType: z.literal("tracking.shipment"),
    aggregateId: z.string(),
  }),
});

export type TrackingOverviewInput = z.infer<typeof trackingOverviewInputSchema>;
export type TrackingOverviewOutput = z.infer<typeof trackingOverviewOutputSchema>;
export type TrackingAnalyticsInput = z.infer<typeof trackingAnalyticsInputSchema>;
export type TrackingAnalyticsOutput = z.infer<typeof trackingAnalyticsOutputSchema>;
export type TrackingAdvisoryInput = z.infer<typeof trackingAdvisoryInputSchema>;
export type TrackingAdvisoryOutput = z.infer<typeof trackingAdvisoryOutputSchema>;
export type TrackingEventRecordInput = z.infer<typeof trackingEventRecordInputSchema>;
export type TrackingEventRecordOutput = z.infer<typeof trackingEventRecordOutputSchema>;
export type TrackingShipmentDetailInput = z.infer<typeof trackingShipmentDetailInputSchema>;
export type TrackingShipmentDetailOutput = z.infer<typeof trackingShipmentDetailOutputSchema>;
export type TrackingExceptionManageInput = z.infer<typeof trackingExceptionManageInputSchema>;
export type TrackingExceptionManageOutput = z.infer<typeof trackingExceptionManageOutputSchema>;
export type TrackingExceptionResolveInput = z.infer<typeof trackingExceptionResolveInputSchema>;
export type TrackingExceptionResolveOutput = z.infer<typeof trackingExceptionResolveOutputSchema>;

export const trackingOverviewMetadata = createRpcOperationMetadata({
  name: "tracking.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["tracking.shipment.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const trackingAnalyticsMetadata = createRpcOperationMetadata({
  name: "tracking.analytics.read",
  kind: "query",
  auth: "session",
  permissions: ["tracking.shipment.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const trackingAdvisoryMetadata = createRpcOperationMetadata({
  name: "tracking.ai.advisory.read",
  kind: "query",
  auth: "session",
  permissions: ["tracking.shipment.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const trackingEventRecordMetadata = createRpcOperationMetadata({
  name: "tracking.event.record",
  kind: "mutation",
  auth: "session",
  permissions: ["tracking.event.record"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const trackingShipmentDetailMetadata = createRpcOperationMetadata({
  name: "tracking.shipment.detail.read",
  kind: "query",
  auth: "session",
  permissions: ["tracking.shipment.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const trackingExceptionManageMetadata = createRpcOperationMetadata({
  name: "tracking.exception.manage",
  kind: "mutation",
  auth: "session",
  permissions: ["tracking.exception.manage"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const trackingExceptionResolveMetadata = createRpcOperationMetadata({
  name: "tracking.exception.resolve",
  kind: "mutation",
  auth: "session",
  permissions: ["tracking.exception.resolve"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});
