import { z } from "zod";
import { createRpcOperationMetadata } from "./metadata.js";

export const planSlugs = ["free", "pro", "enterprise"] as const;

export const planLimitsSchema = z.object({
  maxMembers: z.number().int().nonnegative().default(5),
  maxCargos: z.number().int().nonnegative().default(50),
  maxTrackingEvents: z.number().int().nonnegative().default(1000),
  maxApiCalls: z.number().int().nonnegative().default(1000),
  maxTeams: z.number().int().nonnegative().default(0),
  hasSso: z.boolean().default(false),
  hasApi: z.boolean().default(false),
  hasWebhooks: z.boolean().default(false),
  hasReports: z.boolean().default(true),
  hasAuditLog: z.boolean().default(false),
});

export const planFeatureSchema = z.object({
  key: z.string(),
  label: z.string(),
  included: z.boolean(),
  limit: z.string().optional(),
});

export const planSchema = z.object({
  id: z.string(),
  slug: z.enum(planSlugs),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().int().nonnegative(),
  currency: z.string(),
  interval: z.string(),
  features: z.array(planFeatureSchema),
  limits: planLimitsSchema,
  isPublic: z.boolean(),
  sortOrder: z.number().int(),
});

export const listPlansInputSchema = z.object({
  includeInternal: z.boolean().optional().default(false),
});

export const listPlansOutputSchema = z.object({
  plans: z.array(planSchema),
});

export const getPlanInputSchema = z.object({
  slug: z.enum(planSlugs),
});

export const getPlanOutputSchema = z.object({
  plan: planSchema,
});

// Types
export type Plan = z.infer<typeof planSchema>;
export type PlanFeature = z.infer<typeof planFeatureSchema>;
export type PlanLimits = z.infer<typeof planLimitsSchema>;
export type ListPlansInput = z.infer<typeof listPlansInputSchema>;
export type ListPlansOutput = z.infer<typeof listPlansOutputSchema>;
export type GetPlanInput = z.infer<typeof getPlanInputSchema>;
export type GetPlanOutput = z.infer<typeof getPlanOutputSchema>;

// Metadata
export const listPlansMetadata = createRpcOperationMetadata({
  name: "billing.plans.list",
  kind: "query",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: false,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
  signals: ["log", "metric", "span"],
});

export const getPlanMetadata = createRpcOperationMetadata({
  name: "billing.plans.get",
  kind: "query",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
  signals: ["log", "metric", "span"],
});
