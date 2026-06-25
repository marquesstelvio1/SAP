import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

// ─── Constants ───────────────────────────────────────────────────────────

export const organizationStatuses = ["active", "suspended", "archived"] as const;

// ─── Schemas ──────────────────────────────────────────────────────────────

export const organizationProfileOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(organizationStatuses),
  memberCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const organizationStatusUpdateInputSchema = z.object({
  status: z.enum(organizationStatuses),
  reason: z.string().trim().min(8).max(320),
});

export const organizationStatusUpdateOutputSchema = z.object({
  organizationId: z.string(),
  status: z.enum(organizationStatuses),
  updatedAt: z.string(),
});

// ─── Types ────────────────────────────────────────────────────────────────

export type OrganizationProfileOutput = z.infer<typeof organizationProfileOutputSchema>;
export type OrganizationStatusUpdateInput = z.infer<typeof organizationStatusUpdateInputSchema>;
export type OrganizationStatusUpdateOutput = z.infer<typeof organizationStatusUpdateOutputSchema>;

// ─── Metadata ─────────────────────────────────────────────────────────────

export const organizationProfileMetadata = createRpcOperationMetadata({
  name: "organization.profile.read",
  kind: "query",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "standard",
  criticality: "low",
});

export const organizationStatusUpdateMetadata = createRpcOperationMetadata({
  name: "organization.status.update",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "high",
});
