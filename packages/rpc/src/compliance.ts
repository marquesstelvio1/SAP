import { z } from "zod";

import {
  cargoComplianceEvidenceStatuses,
  cargoComplianceEvidenceSummarySchema,
  cargoComplianceEvidenceTypes,
} from "./cargo.js";
import { createRpcOperationMetadata } from "./metadata.js";

export const complianceOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 10,
    offset: 0,
  });

export const complianceEvidenceTypeCountSchema = z.object({
  evidenceType: z.enum(cargoComplianceEvidenceTypes),
  count: z.number().int().nonnegative(),
});

export const complianceStatusCountSchema = z.object({
  status: z.enum(cargoComplianceEvidenceStatuses),
  count: z.number().int().nonnegative(),
});

export const complianceOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string(),
  totals: z.object({
    evidence: z.number().int().nonnegative(),
    pendingReview: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    expiringWithin7Days: z.number().int().nonnegative(),
    expired: z.number().int().nonnegative(),
  }),
  statusCounts: z.array(complianceStatusCountSchema),
  evidenceTypeCounts: z.array(complianceEvidenceTypeCountSchema),
  recentEvidence: z.array(cargoComplianceEvidenceSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
});

export type ComplianceOverviewInput = z.infer<typeof complianceOverviewInputSchema>;
export type ComplianceOverviewOutput = z.infer<typeof complianceOverviewOutputSchema>;

export const complianceOverviewMetadata = createRpcOperationMetadata({
  name: "cargo.compliance.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["cargo.read"],
  organizationRequired: true,
  audit: "standard",
  criticality: "high",
  signals: ["log", "metric", "span"],
});
