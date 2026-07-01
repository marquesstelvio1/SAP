import { z } from "zod";

import { cargoStatusCountSchema, cargoSummarySchema } from "./cargo.js";
import { createRpcOperationMetadata } from "./metadata.js";

export const deliveryOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 10,
    offset: 0,
  });

export const deliveryOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    delivered: z.number().int().nonnegative(),
    inTransport: z.number().int().nonnegative(),
    arrived: z.number().int().nonnegative(),
    readyForTransport: z.number().int().nonnegative(),
    exceptions: z.number().int().nonnegative(),
  }),
  statusCounts: z.array(cargoStatusCountSchema),
  recentDeliveries: z.array(cargoSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export type DeliveryOverviewInput = z.infer<typeof deliveryOverviewInputSchema>;
export type DeliveryOverviewOutput = z.infer<typeof deliveryOverviewOutputSchema>;

export const deliveryOverviewMetadata = createRpcOperationMetadata({
  name: "cargo.delivery.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["cargo.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});
