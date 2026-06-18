import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

export const auditActorTypes = [
  "anonymous",
  "user",
  "service_account",
  "integration",
  "platform",
  "ai_agent",
] as const;
export const auditSeverities = ["low", "medium", "high", "critical"] as const;
export const auditExportFormats = ["csv"] as const;

const auditFilterTextSchema = z.string().trim().min(1).max(160);
const auditDateTimeSchema = z.string().datetime();

export const auditSearchInputSchema = z
  .object({
    action: auditFilterTextSchema.optional(),
    actorId: auditFilterTextSchema.optional(),
    actorType: z.enum(auditActorTypes).optional(),
    correlationId: auditFilterTextSchema.optional(),
    createdFrom: auditDateTimeSchema.optional(),
    createdTo: auditDateTimeSchema.optional(),
    limit: z.number().int().min(1).max(100).default(25),
    severity: z.enum(auditSeverities).optional(),
    subjectId: auditFilterTextSchema.optional(),
    subjectType: auditFilterTextSchema.optional(),
  })
  .default({
    limit: 25,
  })
  .superRefine((input, context) => {
    if (
      input.createdFrom !== undefined &&
      input.createdTo !== undefined &&
      Date.parse(input.createdTo) < Date.parse(input.createdFrom)
    ) {
      context.addIssue({
        code: "custom",
        message: "createdTo must be after createdFrom.",
        path: ["createdTo"],
      });
    }
  });

export const auditExportInputSchema = z
  .object({
    action: auditFilterTextSchema.optional(),
    actorId: auditFilterTextSchema.optional(),
    actorType: z.enum(auditActorTypes).optional(),
    correlationId: auditFilterTextSchema.optional(),
    createdFrom: auditDateTimeSchema.optional(),
    createdTo: auditDateTimeSchema.optional(),
    format: z.enum(auditExportFormats).default("csv"),
    limit: z.number().int().min(1).max(500).default(100),
    severity: z.enum(auditSeverities).optional(),
    subjectId: auditFilterTextSchema.optional(),
    subjectType: auditFilterTextSchema.optional(),
  })
  .default({
    format: "csv",
    limit: 100,
  })
  .superRefine((input, context) => {
    if (
      input.createdFrom !== undefined &&
      input.createdTo !== undefined &&
      Date.parse(input.createdTo) < Date.parse(input.createdFrom)
    ) {
      context.addIssue({
        code: "custom",
        message: "createdTo must be after createdFrom.",
        path: ["createdTo"],
      });
    }
  });

export const auditRecordSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable(),
  actorType: z.enum(auditActorTypes),
  actorId: z.string().nullable(),
  action: z.string(),
  subjectType: z.string(),
  subjectId: z.string().nullable(),
  severity: z.enum(auditSeverities),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  reason: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  correlationId: z.string(),
  createdAt: z.string(),
});

export const auditTotalsSchema = z.object({
  records: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
});

export const auditSearchOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  filters: auditSearchInputSchema,
  totals: auditTotalsSchema,
  records: z.array(auditRecordSummarySchema),
});

export const auditExportOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  format: z.literal("csv"),
  filename: z.string(),
  contentType: z.literal("text/csv; charset=utf-8"),
  rowCount: z.number().int().nonnegative(),
  content: z.string(),
  audit: z.object({
    action: z.string(),
    subjectType: z.string(),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.string(),
    aggregateType: z.string(),
    aggregateId: z.string(),
  }),
});

export type AuditSearchInput = z.infer<typeof auditSearchInputSchema>;
export type AuditSearchOutput = z.infer<typeof auditSearchOutputSchema>;
export type AuditExportInput = z.infer<typeof auditExportInputSchema>;
export type AuditExportOutput = z.infer<typeof auditExportOutputSchema>;

export const auditSearchMetadata = createRpcOperationMetadata({
  name: "audit.records.search",
  kind: "query",
  permissions: ["audit.read"],
  organizationRequired: true,
  audit: "sensitive",
  criticality: "high",
});

export const auditExportMetadata = createRpcOperationMetadata({
  name: "audit.records.export",
  kind: "query",
  permissions: ["audit.read", "report.export"],
  organizationRequired: true,
  audit: "critical",
  criticality: "critical",
});
