import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

export const webhookUrlSchema = z.string().trim().url().max(2048);
export const webhookNameSchema = z.string().trim().min(2).max(160);
export const webhookEventsSchema = z.array(z.string().trim().min(1)).min(1).max(50);

export const createWebhookInputSchema = z.object({
  name: webhookNameSchema,
  url: webhookUrlSchema,
  events: webhookEventsSchema,
});

export const updateWebhookInputSchema = z.object({
  webhookId: z.string().trim().min(1),
  name: webhookNameSchema.optional(),
  url: webhookUrlSchema.optional(),
  events: webhookEventsSchema.optional(),
  isActive: z.boolean().optional(),
});

export const deleteWebhookInputSchema = z.object({
  webhookId: z.string().trim().min(1),
});

export const listWebhooksInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(25),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 25,
    offset: 0,
  });

export const getWebhookDeliveryLogInputSchema = z.object({
  webhookId: z.string().trim().min(1),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

export const retryWebhookDeliveryInputSchema = z.object({
  deliveryId: z.string().trim().min(1),
});

export const webhookEndpointSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  isActive: z.boolean(),
  lastTriggeredAt: z.string().nullable(),
  failureCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const webhookDeliverySummarySchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  eventType: z.string(),
  status: z.string(),
  statusCode: z.number().int().nullable(),
  responseBody: z.string().nullable(),
  attemptCount: z.number().int().nonnegative(),
  nextRetryAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  createdAt: z.string(),
});

export const createWebhookOutputSchema = z.object({
  webhook: webhookEndpointSummarySchema,
});

export const updateWebhookOutputSchema = z.object({
  webhook: webhookEndpointSummarySchema,
});

export const deleteWebhookOutputSchema = z.object({
  webhookId: z.string(),
});

export const listWebhooksOutputSchema = z.object({
  webhooks: z.array(webhookEndpointSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export const getWebhookDeliveryLogOutputSchema = z.object({
  deliveries: z.array(webhookDeliverySummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export const retryWebhookDeliveryOutputSchema = z.object({
  deliveryId: z.string(),
  status: z.string(),
});

export type CreateWebhookInput = z.infer<typeof createWebhookInputSchema>;
export type CreateWebhookOutput = z.infer<typeof createWebhookOutputSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookInputSchema>;
export type UpdateWebhookOutput = z.infer<typeof updateWebhookOutputSchema>;
export type DeleteWebhookInput = z.infer<typeof deleteWebhookInputSchema>;
export type DeleteWebhookOutput = z.infer<typeof deleteWebhookOutputSchema>;
export type ListWebhooksInput = z.infer<typeof listWebhooksInputSchema>;
export type ListWebhooksOutput = z.infer<typeof listWebhooksOutputSchema>;
export type GetWebhookDeliveryLogInput = z.infer<typeof getWebhookDeliveryLogInputSchema>;
export type GetWebhookDeliveryLogOutput = z.infer<typeof getWebhookDeliveryLogOutputSchema>;
export type RetryWebhookDeliveryInput = z.infer<typeof retryWebhookDeliveryInputSchema>;
export type RetryWebhookDeliveryOutput = z.infer<typeof retryWebhookDeliveryOutputSchema>;
export type WebhookEndpointSummary = z.infer<typeof webhookEndpointSummarySchema>;
export type WebhookDeliverySummary = z.infer<typeof webhookDeliverySummarySchema>;

export const createWebhookMetadata = createRpcOperationMetadata({
  name: "webhook.create",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "none",
  criticality: "medium",
});

export const updateWebhookMetadata = createRpcOperationMetadata({
  name: "webhook.update",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "none",
  criticality: "medium",
});

export const deleteWebhookMetadata = createRpcOperationMetadata({
  name: "webhook.delete",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "none",
  criticality: "medium",
});

export const listWebhooksMetadata = createRpcOperationMetadata({
  name: "webhook.list",
  kind: "query",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
});

export const getWebhookDeliveryLogMetadata = createRpcOperationMetadata({
  name: "webhook.deliveryLog",
  kind: "query",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
});

export const retryWebhookDeliveryMetadata = createRpcOperationMetadata({
  name: "webhook.retryDelivery",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "none",
  criticality: "medium",
});
