import { z } from "zod";

import { cargoDeliveryExceptionStatuses, cargoDeliveryExceptionSummarySchema } from "./cargo.js";
import { createRpcOperationMetadata } from "./metadata.js";
import {
  trackingEventTypes,
  trackingExceptionWorkflowStates,
  trackingTransportModes,
} from "./tracking.js";

export const exceptionOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 10,
    offset: 0,
  });

export const cargoDeliveryExceptionStatusCountSchema = z.object({
  status: z.enum(cargoDeliveryExceptionStatuses),
  count: z.number().int().nonnegative(),
});

export const trackingExceptionStatusCountSchema = z.object({
  status: z.enum(trackingExceptionWorkflowStates),
  count: z.number().int().nonnegative(),
});

export const trackingExceptionSummarySchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  referenceCode: z.string(),
  transportMode: z.enum(trackingTransportModes),
  eventType: z.enum(trackingEventTypes),
  category: z.string().nullable(),
  severity: z.string().nullable(),
  summary: z.string().nullable(),
  workflowState: z.enum(trackingExceptionWorkflowStates).nullable(),
  occurredAt: z.string(),
  locationName: z.string().nullable(),
});

export const exceptionOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    cargoDeliveryExceptions: z.number().int().nonnegative(),
    openCargoDeliveryExceptions: z.number().int().nonnegative(),
    trackingExceptionEvents: z.number().int().nonnegative(),
    trackingExceptionShipments: z.number().int().nonnegative(),
  }),
  statusCounts: z.object({
    cargo: z.array(cargoDeliveryExceptionStatusCountSchema),
    tracking: z.array(trackingExceptionStatusCountSchema),
  }),
  recentCargoDeliveryExceptions: z.array(cargoDeliveryExceptionSummarySchema),
  recentTrackingExceptions: z.array(trackingExceptionSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export type ExceptionOverviewInput = z.infer<typeof exceptionOverviewInputSchema>;
export type ExceptionOverviewOutput = z.infer<typeof exceptionOverviewOutputSchema>;

export const exceptionOverviewMetadata = createRpcOperationMetadata({
  name: "tracking.exception.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["tracking.shipment.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});
