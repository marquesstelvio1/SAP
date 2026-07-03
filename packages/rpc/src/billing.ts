import { z } from "zod";
import {
  sharedAuditSchema,
  sharedIdempotencyKeySchema,
  sharedIdempotencyResultSchema,
  sharedOutboxSchema,
} from "./foundation.js";
import { createRpcOperationMetadata } from "./metadata.js";

export type BillingOverviewOutput = z.infer<typeof billingOverviewOutputSchema>;
export type BillingCheckoutInput = z.infer<typeof billingCheckoutInputSchema>;
export type BillingCheckoutOutput = z.infer<typeof billingCheckoutOutputSchema>;
export type BillingPortalOutput = z.infer<typeof billingPortalOutputSchema>;
export type BillingSubscriptionOutput = z.infer<typeof billingSubscriptionOutputSchema>;
export type BillingInvoiceOutput = z.infer<typeof billingInvoiceOutputSchema>;
export type BillingUsageOutput = z.infer<typeof billingUsageOutputSchema>;

// Aliases for consumer-facing names
export type BillingInvoice = BillingInvoiceOutput;
export type BillingSubscription = BillingSubscriptionOutput;
export type BillingUsage = BillingUsageOutput;
export type BillingPlan = z.infer<typeof billingPlanSchema>;
export type BillingPlansOutput = z.infer<typeof billingPlansOutputSchema>;
export type CreateCheckoutSessionInput = BillingCheckoutInput;
export type CreateCheckoutSessionOutput = BillingCheckoutOutput;
export type CreatePortalSessionInput = z.infer<typeof createPortalSessionInputSchema>;
export type CreatePortalSessionOutput = BillingPortalOutput;

export const billingPlans = ["free", "pro", "enterprise"] as const;
export const billingSubscriptionStatuses = [
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "trialing",
] as const;
export const billingInvoiceStatuses = ["paid", "open", "void", "uncollectible"] as const;
export const billingUsageMetrics = ["members", "cargo_shipments", "tracking_events"] as const;

export const billingPlanIds = billingPlans;

export const billingOverviewInputSchema = z.object({
  organizationId: z.string(),
});

export const billingOverviewOutputSchema = z.object({
  plan: z.enum(billingPlans),
  status: z.enum(billingSubscriptionStatuses),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  trialEndsAt: z.string().nullable(),
  memberUsage: z.number().int().nonnegative(),
  memberLimit: z.number().int().nonnegative(),
  cargoUsage: z.number().int().nonnegative(),
  cargoLimit: z.number().int().nonnegative(),
  trackingUsage: z.number().int().nonnegative(),
  trackingLimit: z.number().int().nonnegative(),
});

export const billingPlanSchema = z.object({
  id: z.enum(billingPlans),
  name: z.string(),
  description: z.string(),
  price: z.number().int().nonnegative(),
  features: z.array(z.string()),
});

export const billingPlansOutputSchema = z.object({
  plans: z.array(billingPlanSchema),
});

export const billingCheckoutInputSchema = z.object({
  organizationId: z.string(),
  plan: z.enum(billingPlans),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  idempotencyKey: sharedIdempotencyKeySchema,
});

export const createCheckoutSessionInputSchema = billingCheckoutInputSchema;

export const billingCheckoutOutputSchema = z.object({
  url: z.string().url(),
  idempotency: sharedIdempotencyResultSchema,
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const createCheckoutSessionOutputSchema = billingCheckoutOutputSchema;

export const billingPortalOutputSchema = z.object({
  url: z.string().url(),
  idempotency: sharedIdempotencyResultSchema,
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const createPortalSessionOutputSchema = billingPortalOutputSchema;

export const billingSubscriptionOutputSchema = z.object({
  id: z.string(),
  plan: z.enum(billingPlans),
  status: z.enum(billingSubscriptionStatuses),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  trialEndsAt: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const subscriptionSchema = billingSubscriptionOutputSchema;

export const billingInvoiceOutputSchema = z.object({
  id: z.string(),
  stripeInvoiceId: z.string().nullable(),
  amount: z.number().int(),
  currency: z.string(),
  status: z.enum(billingInvoiceStatuses),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  paidAt: z.string().nullable(),
  downloadUrl: z.string().nullable(),
  createdAt: z.string(),
});

export const invoiceSchema = billingInvoiceOutputSchema;

export const billingUsageOutputSchema = z.object({
  metrics: z.array(
    z.object({
      metric: z.enum(billingUsageMetrics),
      current: z.number().int().nonnegative(),
      limit: z.number().int().nonnegative(),
      remaining: z.number().int().nonnegative(),
      displayLabel: z.string(),
      unit: z.string().optional(),
    }),
  ),
});

export const usageSchema = billingUsageOutputSchema;

export const createPortalSessionInputSchema = z.object({
  returnUrl: z.string().optional(),
  idempotencyKey: sharedIdempotencyKeySchema,
});

export const billingInvoicesListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
});

export const billingInvoicesListOutputSchema = z.object({
  invoices: z.array(invoiceSchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export const billingSubscriptionDetailSchema = subscriptionSchema.extend({
  usage: z.array(
    z.object({
      metric: z.enum(billingUsageMetrics),
      current: z.number().int().nonnegative(),
      limit: z.number().int().nonnegative(),
      remaining: z.number().int().nonnegative(),
    }),
  ),
});

export const billingSubscriptionGetOutputSchema = z.object({
  subscription: billingSubscriptionDetailSchema,
});

export type BillingInvoicesListInput = z.infer<typeof billingInvoicesListInputSchema>;
export type BillingInvoicesListOutput = z.infer<typeof billingInvoicesListOutputSchema>;
export type BillingSubscriptionDetail = z.infer<typeof billingSubscriptionDetailSchema>;
export type BillingSubscriptionGetOutput = z.infer<typeof billingSubscriptionGetOutputSchema>;

export const billingOverviewMetadata = createRpcOperationMetadata({
  name: "billing.overview",
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

export const billingPlansMetadata = createRpcOperationMetadata({
  name: "billing.plans",
  kind: "query",
  auth: "session",
  // SECURITY: Plan listing is a catalog that any authenticated user should
  // be able to view. Do NOT require tenant.manage here — users must see
  // available plans before they can upgrade their subscription.
  permissions: [],
  permissionMode: "all",
  organizationRequired: false,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
  signals: ["log", "metric", "span"],
});

export const billingCheckoutMetadata = createRpcOperationMetadata({
  name: "billing.checkout",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});

export const billingCreateCheckoutSessionMetadata = billingCheckoutMetadata;

export const billingPortalMetadata = createRpcOperationMetadata({
  name: "billing.portal",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "required",
  criticality: "low",
  signals: ["log", "metric", "span"],
});

export const billingCreatePortalSessionMetadata = billingPortalMetadata;

export const billingSubscriptionMetadata = createRpcOperationMetadata({
  name: "billing.subscription",
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

export const billingInvoicesMetadata = createRpcOperationMetadata({
  name: "billing.invoices",
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

export const billingUsageMetadata = createRpcOperationMetadata({
  name: "billing.usage",
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

export const billingSubscriptionGetMetadata = createRpcOperationMetadata({
  name: "billing.subscription.get",
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

export const billingSubscriptionUsageMetadata = createRpcOperationMetadata({
  name: "billing.subscription.usage",
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

export const billingInvoicesListMetadata = createRpcOperationMetadata({
  name: "billing.invoices.list",
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
