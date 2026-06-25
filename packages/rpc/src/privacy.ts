import { z } from "zod/v4";
import { createRpcOperationMetadata } from "./metadata.js";

export const privacyExportInputSchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  includeAuditLogs: z.boolean().default(true),
  includeSessions: z.boolean().default(false),
});

export const privacyAccountSummarySchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const privacyAssociatedAccountSchema = z.object({
  providerId: z.string(),
  accountId: z.string(),
  createdAt: z.string(),
});

export const privacyMembershipSchema = z.object({
  organizationId: z.string(),
  organizationName: z.string(),
  status: z.string(),
  roles: z.array(z.string()),
  createdAt: z.string(),
});

export const privacyAuditRecordSchema = z.object({
  id: z.string(),
  action: z.string(),
  subjectType: z.string(),
  subjectId: z.string().optional(),
  severity: z.string(),
  createdAt: z.string(),
});

export const privacySessionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type PrivacyExportInput = z.infer<typeof privacyExportInputSchema>;
export type PrivacyAccountSummary = z.infer<typeof privacyAccountSummarySchema>;
export type PrivacyAssociatedAccount = z.infer<typeof privacyAssociatedAccountSchema>;
export type PrivacyMembership = z.infer<typeof privacyMembershipSchema>;
export type PrivacyAuditRecord = z.infer<typeof privacyAuditRecordSchema>;
export type PrivacySession = z.infer<typeof privacySessionSchema>;

export const privacyExportOutputSchema = z.object({
  exportedAt: z.string(),
  account: privacyAccountSummarySchema,
  associatedAccounts: z.array(privacyAssociatedAccountSchema).optional(),
  memberships: z.array(privacyMembershipSchema).optional(),
  auditRecords: z.array(privacyAuditRecordSchema).optional(),
  sessions: z.array(privacySessionSchema).optional(),
});

export type PrivacyExportOutput = z.infer<typeof privacyExportOutputSchema>;

export const privacyExportMetadata = createRpcOperationMetadata({
  name: "privacy.data.export",
  kind: "query",
  permissions: [],
  organizationRequired: false,
  audit: "sensitive",
  criticality: "high",
});

export const privacyDeleteInputSchema = z.object({
  confirmation: z.literal("CONFIRM_DELETE_MY_ACCOUNT"),
});

export type PrivacyDeleteInput = z.infer<typeof privacyDeleteInputSchema>;

export const privacyDeleteOutputSchema = z.object({
  scheduledAt: z.string(),
  message: z.string(),
});

export type PrivacyDeleteOutput = z.infer<typeof privacyDeleteOutputSchema>;

export const privacyDeleteMetadata = createRpcOperationMetadata({
  name: "privacy.account.delete",
  kind: "mutation",
  auth: "session",
  permissions: [],
  organizationRequired: false,
  audit: "critical",
  criticality: "critical",
  idempotency: "recommended",
});
