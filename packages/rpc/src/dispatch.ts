import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";
import { transportOrderSummarySchema } from "./planning.js";

export const dispatchOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 10,
    offset: 0,
  });

export const dispatchOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    dispatchable: z.number().int().nonnegative(),
    dispatched: z.number().int().nonnegative(),
    upcomingDepartures: z.number().int().nonnegative(),
  }),
  recentDispatchableOrders: z.array(transportOrderSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export type DispatchOverviewInput = z.infer<typeof dispatchOverviewInputSchema>;
export type DispatchOverviewOutput = z.infer<typeof dispatchOverviewOutputSchema>;

export const dispatchOverviewMetadata = createRpcOperationMetadata({
  name: "planning.dispatch.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["planning.order.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});
