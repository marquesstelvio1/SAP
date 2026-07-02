import { z } from "zod";
import {
  sharedAuditSchema,
  sharedIdempotencyResultSchema,
  sharedOutboxSchema,
} from "./foundation.js";
import { createRpcOperationMetadata } from "./metadata.js";

export const ssoConfigSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  domain: z.string().nullable(),
  idpMetadataUrl: z.string().nullable(),
  idpEntityId: z.string().nullable(),
  idpSsoUrl: z.string().nullable(),
  idpCertificate: z.string().nullable(),
  jitProvisioning: z.boolean(),
  jitDefaultRoleId: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const getSsoConfigInputSchema = z.object({
  organizationId: z.string().optional(),
});

export const getSsoConfigOutputSchema = z.object({
  config: ssoConfigSchema.nullable(),
});

export const updateSsoConfigInputSchema = z.object({
  domain: z.string().optional(),
  idpMetadataUrl: z.string().optional(),
  idpEntityId: z.string().optional(),
  idpSsoUrl: z.string().optional(),
  idpCertificate: z.string().optional(),
  jitProvisioning: z.boolean().optional(),
  jitDefaultRoleId: z.string().optional(),
  active: z.boolean().optional(),
  idempotencyKey: z.string().trim().min(12).max(128),
});

export const updateSsoConfigOutputSchema = z.object({
  config: ssoConfigSchema,
  idempotency: sharedIdempotencyResultSchema,
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const testSsoConfigInputSchema = z.object({
  domain: z.string(),
  idpSsoUrl: z.string().url(),
  idpEntityId: z.string(),
});

export const testSsoConfigOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type SsoConfig = z.infer<typeof ssoConfigSchema>;
export type GetSsoConfigInput = z.infer<typeof getSsoConfigInputSchema>;
export type GetSsoConfigOutput = z.infer<typeof getSsoConfigOutputSchema>;
export type UpdateSsoConfigInput = z.infer<typeof updateSsoConfigInputSchema>;
export type UpdateSsoConfigOutput = z.infer<typeof updateSsoConfigOutputSchema>;
export type TestSsoConfigInput = z.infer<typeof testSsoConfigInputSchema>;
export type TestSsoConfigOutput = z.infer<typeof testSsoConfigOutputSchema>;

export const getSsoConfigMetadata = createRpcOperationMetadata({
  name: "sso.config.get",
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

export const updateSsoConfigMetadata = createRpcOperationMetadata({
  name: "sso.config.update",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "sensitive",
  idempotency: "required",
  criticality: "medium",
  signals: ["log", "metric", "span"],
});

export const testSsoConfigMetadata = createRpcOperationMetadata({
  name: "sso.config.test",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "none",
  criticality: "low",
  signals: ["log", "metric", "span"],
});
