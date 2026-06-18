import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

export const reportExportDomains = ["tracking", "cargo", "capacity", "planning", "tariff"] as const;
export const reportExportFormats = ["csv"] as const;

export const reportExportInputSchema = z
  .object({
    domain: z.enum(reportExportDomains),
    format: z.enum(reportExportFormats).default("csv"),
    limit: z.number().int().min(1).max(250).default(100),
  })
  .default({
    domain: "tracking",
    format: "csv",
    limit: 100,
  });

export const reportExportSectionSchema = z.object({
  name: z.string(),
  rowCount: z.number().int().nonnegative(),
});

export const reportExportOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  domain: z.enum(reportExportDomains),
  format: z.literal("csv"),
  filename: z.string(),
  contentType: z.literal("text/csv; charset=utf-8"),
  rowCount: z.number().int().nonnegative(),
  sections: z.array(reportExportSectionSchema),
  content: z.string(),
  audit: z.object({
    action: z.literal("report.exported"),
    subjectType: z.literal("report.export"),
    subjectId: z.string(),
  }),
  outbox: z.object({
    eventType: z.literal("report.exported"),
    aggregateType: z.literal("report.export"),
    aggregateId: z.string(),
  }),
});

export type ReportExportDomain = (typeof reportExportDomains)[number];
export type ReportExportFormat = (typeof reportExportFormats)[number];
export type ReportExportInput = z.infer<typeof reportExportInputSchema>;
export type ReportExportOutput = z.infer<typeof reportExportOutputSchema>;

export const reportExportMetadata = createRpcOperationMetadata({
  name: "report.export.generate",
  kind: "query",
  auth: "session",
  permissions: ["report.export"],
  organizationRequired: true,
  audit: "critical",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});
