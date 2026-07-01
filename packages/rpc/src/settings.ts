import { z } from "zod";
import {
  sharedAuditSchema,
  sharedIdempotencyKeySchema,
  sharedIdempotencyResultSchema,
  sharedOutboxSchema,
} from "./foundation.js";
import { createRpcOperationMetadata } from "./metadata.js";

export type SettingsOrganizationUpdateInput = z.infer<typeof settingsOrganizationUpdateInputSchema>;
export type SettingsBrandingUpdateInput = z.infer<typeof settingsBrandingUpdateInputSchema>;
export type SettingsMutationOutput = z.infer<typeof settingsMutationOutputSchema>;
export type SettingsOverviewOutput = z.infer<typeof settingsOverviewOutputSchema>;

export const settingsOrganizationStatuses = ["active", "suspended"] as const;

export const settingsOrganizationUpdateInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug deve ser URL-safe, usando minusculas, numeros e hifens.",
    ),
  idempotencyKey: sharedIdempotencyKeySchema,
});

export const settingsBrandingUpdateInputSchema = z.object({
  logo: z.instanceof(File).optional(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor primaria deve ser um hex valido (ex: #FF6600).")
    .optional(),
  favicon: z.instanceof(File).optional(),
  idempotencyKey: sharedIdempotencyKeySchema,
});

export const settingsMutationOutputSchema = z.object({
  organizationId: z.string(),
  updatedAt: z.string(),
  idempotency: sharedIdempotencyResultSchema,
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const settingsOverviewOutputSchema = z.object({
  organizationId: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(settingsOrganizationStatuses),
  createdAt: z.string(),
  updatedAt: z.string(),
  memberCount: z.number().int().nonnegative(),
});

export const settingsOrganizationUpdateMetadata = createRpcOperationMetadata({
  name: "settings.organization.update",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  idempotency: "recommended",
  criticality: "low",
  signals: ["log", "metric", "span"],
});

export const settingsBrandingUpdateMetadata = createRpcOperationMetadata({
  name: "settings.branding.update",
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

export const settingsOverviewMetadata = createRpcOperationMetadata({
  name: "settings.overview",
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
