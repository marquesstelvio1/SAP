import { z } from "zod";

import { cargoStatuses } from "./cargo.js";
import { createRpcOperationMetadata } from "./metadata.js";

export const transportOrderStatuses = ["confirmed", "cancelled"] as const;

export const transportOrderModes = ["rail", "road", "sea", "barge", "multimodal"] as const;

const planningReferenceSchema = z.string().trim().min(3).max(120);
const planningIdempotencySchema = z.string().trim().min(12).max(128);
const planningSourceSystemSchema = z.string().trim().min(1).max(80).default("saptm");
const optionalPlanningIdSchema = z.string().trim().min(1).optional();

export const planningOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
  })
  .default({
    limit: 10,
  });

export const transportOrderConfirmInputSchema = z
  .object({
    cargoId: z.string().trim().min(1),
    trackingShipmentId: optionalPlanningIdSchema,
    capacityReservationId: optionalPlanningIdSchema,
    orderReference: planningReferenceSchema,
    mode: z.enum(transportOrderModes),
    carrierName: z.string().trim().min(2).max(160),
    routeSummary: z.string().trim().min(8).max(700),
    originName: z.string().trim().min(2).max(180),
    destinationName: z.string().trim().min(2).max(180),
    plannedDepartureAt: z.string().datetime(),
    plannedArrivalAt: z.string().datetime(),
    responsiblePlannerName: z.string().trim().min(2).max(120),
    confirmationReference: planningReferenceSchema,
    confirmedAt: z.string().datetime(),
    idempotencyKey: planningIdempotencySchema,
    sourceSystem: planningSourceSystemSchema,
  })
  .superRefine((order, context) => {
    const plannedDepartureAt = Date.parse(order.plannedDepartureAt);
    const plannedArrivalAt = Date.parse(order.plannedArrivalAt);
    const confirmedAt = Date.parse(order.confirmedAt);

    if (plannedArrivalAt <= plannedDepartureAt) {
      context.addIssue({
        code: "custom",
        message: "Planned arrival must be after planned departure.",
        path: ["plannedArrivalAt"],
      });
    }

    if (confirmedAt > plannedDepartureAt) {
      context.addIssue({
        code: "custom",
        message: "Transport order confirmation must occur before planned departure.",
        path: ["confirmedAt"],
      });
    }

    if (order.originName.toLowerCase() === order.destinationName.toLowerCase()) {
      context.addIssue({
        code: "custom",
        message: "Origin and destination must be different.",
        path: ["destinationName"],
      });
    }
  });

export const transportOrderCancelInputSchema = z
  .object({
    orderId: z.string().trim().min(1),
    cancellationReference: planningReferenceSchema,
    cancelledByName: z.string().trim().min(2).max(120),
    cancellationReason: z.string().trim().min(8).max(700),
    cancelledAt: z.string().datetime(),
    idempotencyKey: planningIdempotencySchema,
    sourceSystem: planningSourceSystemSchema,
  })
  .superRefine((cancellation, context) => {
    if (cancellation.cancellationReason.trim().length < 8) {
      context.addIssue({
        code: "custom",
        message: "Transport order cancellation requires a specific operational reason.",
        path: ["cancellationReason"],
      });
    }
  });

export const transportOrderRescheduleInputSchema = z
  .object({
    orderId: z.string().trim().min(1),
    revisionReference: planningReferenceSchema,
    mode: z.enum(transportOrderModes),
    carrierName: z.string().trim().min(2).max(160),
    routeSummary: z.string().trim().min(8).max(700),
    originName: z.string().trim().min(2).max(180),
    destinationName: z.string().trim().min(2).max(180),
    plannedDepartureAt: z.string().datetime(),
    plannedArrivalAt: z.string().datetime(),
    rescheduledByName: z.string().trim().min(2).max(120),
    rescheduleReason: z.string().trim().min(8).max(700),
    rescheduledAt: z.string().datetime(),
    idempotencyKey: planningIdempotencySchema,
    sourceSystem: planningSourceSystemSchema,
  })
  .superRefine((revision, context) => {
    const plannedDepartureAt = Date.parse(revision.plannedDepartureAt);
    const plannedArrivalAt = Date.parse(revision.plannedArrivalAt);
    const rescheduledAt = Date.parse(revision.rescheduledAt);

    if (plannedArrivalAt <= plannedDepartureAt) {
      context.addIssue({
        code: "custom",
        message: "Rescheduled arrival must be after rescheduled departure.",
        path: ["plannedArrivalAt"],
      });
    }

    if (rescheduledAt > plannedDepartureAt) {
      context.addIssue({
        code: "custom",
        message: "Transport order reschedule must occur before planned departure.",
        path: ["rescheduledAt"],
      });
    }

    if (revision.originName.toLowerCase() === revision.destinationName.toLowerCase()) {
      context.addIssue({
        code: "custom",
        message: "Origin and destination must be different.",
        path: ["destinationName"],
      });
    }
  });

export const transportOrderDispatchInputSchema = z
  .object({
    orderId: z.string().trim().min(1),
    dispatchReference: planningReferenceSchema,
    dispatchedByName: z.string().trim().min(2).max(120),
    dispatchInstructions: z.string().trim().min(8).max(700),
    dispatchedAt: z.string().datetime(),
    idempotencyKey: planningIdempotencySchema,
    sourceSystem: planningSourceSystemSchema,
  })
  .superRefine((dispatch, context) => {
    if (dispatch.dispatchInstructions.trim().length < 8) {
      context.addIssue({
        code: "custom",
        message: "Transport order dispatch requires operational instructions.",
        path: ["dispatchInstructions"],
      });
    }
  });

export const transportOrderSummarySchema = z.object({
  id: z.string(),
  cargoId: z.string(),
  cargoReference: z.string(),
  cargoDescription: z.string(),
  cargoStatus: z.enum(cargoStatuses),
  trackingShipmentId: z.string().nullable(),
  trackingReferenceCode: z.string().nullable(),
  capacityReservationId: z.string().nullable(),
  capacityReservationReference: z.string().nullable(),
  orderReference: z.string(),
  status: z.enum(transportOrderStatuses),
  mode: z.enum(transportOrderModes),
  carrierName: z.string(),
  routeSummary: z.string(),
  originName: z.string(),
  destinationName: z.string(),
  plannedDepartureAt: z.string(),
  plannedArrivalAt: z.string(),
  responsiblePlannerName: z.string(),
  confirmationReference: z.string(),
  sourceSystem: z.string(),
  confirmedAt: z.string(),
  cancellationReference: z.string().nullable(),
  cancelledByName: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  scheduleRevisionCount: z.number().int().nonnegative(),
  lastScheduleRevisionReference: z.string().nullable(),
  lastRescheduledByName: z.string().nullable(),
  lastRescheduleReason: z.string().nullable(),
  lastRescheduledAt: z.string().nullable(),
  dispatchCount: z.number().int().nonnegative(),
  lastDispatchReference: z.string().nullable(),
  lastDispatchedByName: z.string().nullable(),
  lastDispatchInstructions: z.string().nullable(),
  lastDispatchedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const planningOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    transportOrders: z.number().int().nonnegative(),
    confirmed: z.number().int().nonnegative(),
    cancelled: z.number().int().nonnegative(),
    upcomingDepartures: z.number().int().nonnegative(),
    linkedCapacityReservations: z.number().int().nonnegative(),
    linkedTrackingShipments: z.number().int().nonnegative(),
    dispatched: z.number().int().nonnegative(),
  }),
  recentOrders: z.array(transportOrderSummarySchema),
});

export const transportOrderConfirmOutputSchema = z.object({
  organizationId: z.string(),
  orderId: z.string(),
  cargoId: z.string(),
  transportOrder: transportOrderSummarySchema,
  businessRules: z.object({
    orderConfirmed: z.boolean(),
    cargoEligible: z.boolean(),
    routeDefined: z.boolean(),
    capacityReservationLinked: z.boolean(),
    trackingShipmentLinked: z.boolean(),
    responsibilityAssigned: z.boolean(),
    timingValid: z.boolean(),
    duplicateOrderBlocked: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("planning.transport_order.confirmed"),
    subjectType: z.literal("transport_order"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("planning.transport_order.confirmed"),
    aggregateType: z.literal("planning"),
    aggregateId: z.string(),
  }),
});

export const transportOrderCancelOutputSchema = z.object({
  organizationId: z.string(),
  orderId: z.string(),
  cargoId: z.string(),
  transportOrder: transportOrderSummarySchema,
  businessRules: z.object({
    orderCancelled: z.boolean(),
    cancellableState: z.boolean(),
    timingValid: z.boolean(),
    reasonProvided: z.boolean(),
    duplicateCancellationReferenceBlocked: z.boolean(),
    dispatchNotStarted: z.boolean(),
    capacityReleaseRequired: z.boolean(),
    downstreamTrackingNotificationRequired: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("planning.transport_order.cancelled"),
    subjectType: z.literal("transport_order"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("planning.transport_order.cancelled"),
    aggregateType: z.literal("planning"),
    aggregateId: z.string(),
  }),
});

export const transportOrderRescheduleOutputSchema = z.object({
  organizationId: z.string(),
  orderId: z.string(),
  cargoId: z.string(),
  revisionId: z.string(),
  revisionReference: z.string(),
  transportOrder: transportOrderSummarySchema,
  businessRules: z.object({
    orderRescheduled: z.boolean(),
    reschedulableState: z.boolean(),
    routeDefined: z.boolean(),
    responsibilityAssigned: z.boolean(),
    timingValid: z.boolean(),
    scheduleChanged: z.boolean(),
    capacityWindowAligned: z.boolean(),
    duplicateRevisionBlocked: z.boolean(),
    dispatchNotStarted: z.boolean(),
    downstreamTrackingNotificationRequired: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("planning.transport_order.rescheduled"),
    subjectType: z.literal("transport_order"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("planning.transport_order.rescheduled"),
    aggregateType: z.literal("planning"),
    aggregateId: z.string(),
  }),
});

export const transportOrderDispatchOutputSchema = z.object({
  organizationId: z.string(),
  orderId: z.string(),
  cargoId: z.string(),
  dispatchId: z.string(),
  dispatchReference: z.string(),
  transportOrder: transportOrderSummarySchema,
  businessRules: z.object({
    orderDispatched: z.boolean(),
    dispatchableState: z.boolean(),
    timingValid: z.boolean(),
    responsibilityAssigned: z.boolean(),
    latestScheduleAcknowledged: z.boolean(),
    capacityReservationReady: z.boolean(),
    duplicateDispatchBlocked: z.boolean(),
    downstreamTrackingNotificationRequired: z.boolean(),
    appliedRules: z.array(z.string()),
  }),
  idempotency: z.object({
    key: z.string(),
    replayed: z.boolean(),
  }),
  audit: z.object({
    action: z.literal("planning.transport_order.dispatched"),
    subjectType: z.literal("transport_order"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("planning.transport_order.dispatched"),
    aggregateType: z.literal("planning"),
    aggregateId: z.string(),
  }),
});

export type PlanningOverviewInput = z.infer<typeof planningOverviewInputSchema>;
export type PlanningOverviewOutput = z.infer<typeof planningOverviewOutputSchema>;
export type TransportOrderConfirmInput = z.infer<typeof transportOrderConfirmInputSchema>;
export type TransportOrderConfirmOutput = z.infer<typeof transportOrderConfirmOutputSchema>;
export type TransportOrderCancelInput = z.infer<typeof transportOrderCancelInputSchema>;
export type TransportOrderCancelOutput = z.infer<typeof transportOrderCancelOutputSchema>;
export type TransportOrderRescheduleInput = z.infer<typeof transportOrderRescheduleInputSchema>;
export type TransportOrderRescheduleOutput = z.infer<typeof transportOrderRescheduleOutputSchema>;
export type TransportOrderDispatchInput = z.infer<typeof transportOrderDispatchInputSchema>;
export type TransportOrderDispatchOutput = z.infer<typeof transportOrderDispatchOutputSchema>;

export const planningOverviewMetadata = createRpcOperationMetadata({
  name: "planning.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["planning.order.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const transportOrderConfirmMetadata = createRpcOperationMetadata({
  name: "planning.transport_order.confirm",
  kind: "mutation",
  auth: "session",
  permissions: ["planning.order.confirm"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const transportOrderCancelMetadata = createRpcOperationMetadata({
  name: "planning.transport_order.cancel",
  kind: "mutation",
  auth: "session",
  permissions: ["planning.order.cancel"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const transportOrderRescheduleMetadata = createRpcOperationMetadata({
  name: "planning.transport_order.reschedule",
  kind: "mutation",
  auth: "session",
  permissions: ["planning.order.reschedule"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const transportOrderDispatchMetadata = createRpcOperationMetadata({
  name: "planning.transport_order.dispatch",
  kind: "mutation",
  auth: "session",
  permissions: ["planning.order.dispatch"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});
