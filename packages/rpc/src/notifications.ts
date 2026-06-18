import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

export const notificationStatuses = ["unread", "read", "archived"] as const;
export const notificationSeverities = ["low", "medium", "high", "critical"] as const;

export const notificationInboxInputSchema = z
  .object({
    status: z.enum(notificationStatuses).optional(),
    limit: z.number().int().min(1).max(100).default(25),
  })
  .default({
    limit: 25,
  });

export const notificationMarkReadInputSchema = z.object({
  notificationId: z.string().min(1),
});

export const notificationSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  eventType: z.string(),
  aggregateType: z.string(),
  aggregateId: z.string(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(notificationSeverities),
  status: z.enum(notificationStatuses),
  sourceOutboxEventId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  readAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
});

export const notificationInboxOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  filters: z.object({
    status: z.enum(notificationStatuses).optional(),
    limit: z.number().int().min(1).max(100),
  }),
  totals: z.object({
    notifications: z.number().int().nonnegative(),
    unread: z.number().int().nonnegative(),
    read: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
  }),
  notifications: z.array(notificationSummarySchema),
});

export const notificationMarkReadOutputSchema = z.object({
  organizationId: z.string(),
  notification: notificationSummarySchema,
  audit: z.object({
    action: z.literal("notification.marked_read"),
    subjectType: z.literal("notification"),
    subjectId: z.string(),
  }),
});

export type NotificationInboxInput = z.infer<typeof notificationInboxInputSchema>;
export type NotificationInboxOutput = z.infer<typeof notificationInboxOutputSchema>;
export type NotificationMarkReadInput = z.infer<typeof notificationMarkReadInputSchema>;
export type NotificationMarkReadOutput = z.infer<typeof notificationMarkReadOutputSchema>;
export type NotificationStatus = (typeof notificationStatuses)[number];
export type NotificationSeverity = (typeof notificationSeverities)[number];

export const notificationInboxMetadata = createRpcOperationMetadata({
  name: "notification.inbox.read",
  kind: "query",
  auth: "session",
  permissions: ["notification.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const notificationMarkReadMetadata = createRpcOperationMetadata({
  name: "notification.mark_read",
  kind: "mutation",
  auth: "session",
  permissions: ["notification.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});
