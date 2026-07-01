import { platformPermissions } from "@saptm/auth";
import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

export const adminOrganizationStatuses = ["active", "suspended", "archived"] as const;
export const adminMembershipStatuses = ["invited", "active", "suspended", "removed"] as const;

const adminIdempotencySchema = z.string().trim().min(12).max(128);
const adminSourceSystemSchema = z.string().trim().min(1).max(80).default("saptm");

export const adminOverviewInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(25),
    offset: z.number().int().min(0).default(0),
  })
  .default({
    limit: 25,
    offset: 0,
  });

export const adminUserInviteInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((email) => email.toLowerCase()),
  name: z.string().trim().min(2).max(160),
  roleKeys: z.array(z.string().trim().min(2).max(120)).max(12).default([]),
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminRoleAssignInputSchema = z.object({
  membershipId: z.string().trim().min(1),
  roleId: z.string().trim().min(1),
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

const adminRoleKeySchema = z
  .string()
  .trim()
  .min(4)
  .max(120)
  .regex(/^[a-z][a-z0-9_.-]*$/, "Role key must be lowercase and URL-safe.");
const adminRoleNameSchema = z.string().trim().min(3).max(160);
const adminRoleDescriptionSchema = z.string().trim().min(8).max(320).optional();
const adminPermissionKeysSchema = z.array(z.enum(platformPermissions)).min(1).max(64);

export const adminRoleCreateInputSchema = z.object({
  key: adminRoleKeySchema,
  name: adminRoleNameSchema,
  description: adminRoleDescriptionSchema,
  permissionKeys: adminPermissionKeysSchema,
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminRolePermissionsUpdateInputSchema = z.object({
  roleId: z.string().trim().min(1),
  permissionKeys: adminPermissionKeysSchema,
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminRoleDeleteInputSchema = z.object({
  roleId: z.string().trim().min(1),
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminRoleRevokeInputSchema = z.object({
  membershipId: z.string().trim().min(1),
  roleId: z.string().trim().min(1),
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminMembershipLifecycleStatuses = ["active", "suspended", "removed"] as const;

export const adminMembershipStatusUpdateInputSchema = z.object({
  membershipId: z.string().trim().min(1),
  status: z.enum(adminMembershipLifecycleStatuses),
  reason: z.string().trim().min(8).max(320),
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminInvitationResendInputSchema = z.object({
  membershipId: z.string().trim().min(1),
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminInvitationCancelInputSchema = z.object({
  membershipId: z.string().trim().min(1),
  reason: z.string().trim().min(8).max(320),
  idempotencyKey: adminIdempotencySchema,
  sourceSystem: adminSourceSystemSchema,
});

export const adminOrganizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(adminOrganizationStatuses),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminRoleSummarySchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  protected: z.boolean(),
  permissionCount: z.number().int().nonnegative(),
  membershipCount: z.number().int().nonnegative(),
  permissions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminUserMembershipRoleSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
});

export const adminUserSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  membership: z.object({
    id: z.string(),
    status: z.enum(adminMembershipStatuses),
    createdAt: z.string(),
    updatedAt: z.string(),
    roles: z.array(adminUserMembershipRoleSchema),
  }),
});

export const adminPermissionSummarySchema = z.object({
  id: z.string(),
  key: z.enum(platformPermissions),
  description: z.string().nullable(),
  roleCount: z.number().int().nonnegative(),
});

export const adminOverviewOutputSchema = z.object({
  generatedAt: z.string(),
  organization: adminOrganizationSummarySchema,
  totals: z.object({
    users: z.number().int().nonnegative(),
    activeMemberships: z.number().int().nonnegative(),
    invitedMemberships: z.number().int().nonnegative(),
    roles: z.number().int().nonnegative(),
    permissions: z.number().int().nonnegative(),
  }),
  users: z.array(adminUserSummarySchema),
  roles: z.array(adminRoleSummarySchema),
  permissions: z.array(adminPermissionSummarySchema),
  pagination: z.object({
    totalCount: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
  }),
  securityModel: z.object({
    authProvider: z.literal("better-auth"),
    authorizationModel: z.literal("tenant-scoped-rbac"),
    requiredPermissions: z.array(z.enum(platformPermissions)),
    enforcedBy: z.literal("orpc-metadata-rpc-context"),
  }),
});

export const adminMutationAuditSchema = z.object({
  action: z.string(),
  subjectType: z.string(),
  subjectId: z.string(),
});

export const adminMutationOutboxSchema = z.object({
  eventType: z.string(),
  aggregateType: z.string(),
  aggregateId: z.string(),
});

export const adminIdempotencyResultSchema = z.object({
  key: z.string(),
  replayed: z.boolean(),
});

export const adminInvitationDeliverySchema = z.object({
  acceptUrl: z.string().url(),
  deliveryChannel: z.literal("outbox_email"),
  expiresAt: z.string(),
});

export const adminUserInviteOutputSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  membershipId: z.string(),
  user: adminUserSummarySchema,
  invitation: adminInvitationDeliverySchema.optional(),
  idempotency: adminIdempotencyResultSchema,
  audit: adminMutationAuditSchema,
  outbox: adminMutationOutboxSchema,
});

export const adminRoleAssignOutputSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
  roleId: z.string(),
  user: adminUserSummarySchema,
  assignedRole: adminUserMembershipRoleSchema,
  idempotency: adminIdempotencyResultSchema,
  audit: adminMutationAuditSchema,
  outbox: adminMutationOutboxSchema,
});

export const adminRoleMutationOutputSchema = z.object({
  organizationId: z.string(),
  roleId: z.string(),
  role: adminRoleSummarySchema,
  idempotency: adminIdempotencyResultSchema,
  audit: adminMutationAuditSchema,
  outbox: adminMutationOutboxSchema,
});

export const adminRoleDeleteOutputSchema = z.object({
  organizationId: z.string(),
  roleId: z.string(),
  roleKey: z.string(),
  idempotency: adminIdempotencyResultSchema,
  audit: adminMutationAuditSchema,
  outbox: adminMutationOutboxSchema,
});

export const adminRoleRevokeOutputSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
  roleId: z.string(),
  revokedRole: adminUserMembershipRoleSchema,
  user: adminUserSummarySchema,
  idempotency: adminIdempotencyResultSchema,
  audit: adminMutationAuditSchema,
  outbox: adminMutationOutboxSchema,
});

export const adminMembershipStatusUpdateOutputSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
  status: z.enum(adminMembershipStatuses),
  user: adminUserSummarySchema,
  idempotency: adminIdempotencyResultSchema,
  audit: adminMutationAuditSchema,
  outbox: adminMutationOutboxSchema,
});

export const adminInvitationLifecycleOutputSchema = z.object({
  organizationId: z.string(),
  membershipId: z.string(),
  user: adminUserSummarySchema,
  invitation: adminInvitationDeliverySchema.optional(),
  idempotency: adminIdempotencyResultSchema,
  audit: adminMutationAuditSchema,
  outbox: adminMutationOutboxSchema,
});

export type AdminOverviewInput = z.infer<typeof adminOverviewInputSchema>;
export type AdminOverviewOutput = z.infer<typeof adminOverviewOutputSchema>;
export type AdminUserInviteInput = z.infer<typeof adminUserInviteInputSchema>;
export type AdminUserInviteOutput = z.infer<typeof adminUserInviteOutputSchema>;
export type AdminInvitationDelivery = z.infer<typeof adminInvitationDeliverySchema>;
export type AdminRoleAssignInput = z.infer<typeof adminRoleAssignInputSchema>;
export type AdminRoleAssignOutput = z.infer<typeof adminRoleAssignOutputSchema>;
export type AdminRoleCreateInput = z.infer<typeof adminRoleCreateInputSchema>;
export type AdminRolePermissionsUpdateInput = z.infer<typeof adminRolePermissionsUpdateInputSchema>;
export type AdminRoleDeleteInput = z.infer<typeof adminRoleDeleteInputSchema>;
export type AdminRoleRevokeInput = z.infer<typeof adminRoleRevokeInputSchema>;
export type AdminMembershipStatusUpdateInput = z.infer<
  typeof adminMembershipStatusUpdateInputSchema
>;
export type AdminInvitationResendInput = z.infer<typeof adminInvitationResendInputSchema>;
export type AdminInvitationCancelInput = z.infer<typeof adminInvitationCancelInputSchema>;
export type AdminRoleMutationOutput = z.infer<typeof adminRoleMutationOutputSchema>;
export type AdminRoleDeleteOutput = z.infer<typeof adminRoleDeleteOutputSchema>;
export type AdminRoleRevokeOutput = z.infer<typeof adminRoleRevokeOutputSchema>;
export type AdminMembershipStatusUpdateOutput = z.infer<
  typeof adminMembershipStatusUpdateOutputSchema
>;
export type AdminInvitationLifecycleOutput = z.infer<typeof adminInvitationLifecycleOutputSchema>;

export const adminOverviewMetadata = createRpcOperationMetadata({
  name: "admin.identity.overview.read",
  kind: "query",
  auth: "session",
  permissions: ["tenant.manage", "identity.user.invite", "identity.role.assign"],
  permissionMode: "any",
  organizationRequired: true,
  audit: "sensitive",
  criticality: "high",
  signals: ["log", "metric", "span"],
});

export const adminUserInviteMetadata = createRpcOperationMetadata({
  name: "admin.user.invite",
  kind: "mutation",
  auth: "session",
  permissions: ["identity.user.invite"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminRoleAssignMetadata = createRpcOperationMetadata({
  name: "admin.role.assign",
  kind: "mutation",
  auth: "session",
  permissions: ["identity.role.assign"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminRoleCreateMetadata = createRpcOperationMetadata({
  name: "admin.role.create",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage", "identity.role.assign"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminRolePermissionsUpdateMetadata = createRpcOperationMetadata({
  name: "admin.role.permissions.update",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage", "identity.role.assign"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminRoleDeleteMetadata = createRpcOperationMetadata({
  name: "admin.role.delete",
  kind: "mutation",
  auth: "session",
  permissions: ["tenant.manage", "identity.role.assign"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminRoleRevokeMetadata = createRpcOperationMetadata({
  name: "admin.role.revoke",
  kind: "mutation",
  auth: "session",
  permissions: ["identity.role.assign"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminMembershipStatusUpdateMetadata = createRpcOperationMetadata({
  name: "admin.membership.status.update",
  kind: "mutation",
  auth: "session",
  permissions: ["identity.user.invite", "identity.role.assign"],
  permissionMode: "all",
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminInvitationResendMetadata = createRpcOperationMetadata({
  name: "admin.invitation.resend",
  kind: "mutation",
  auth: "session",
  permissions: ["identity.user.invite"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});

export const adminInvitationCancelMetadata = createRpcOperationMetadata({
  name: "admin.invitation.cancel",
  kind: "mutation",
  auth: "session",
  permissions: ["identity.user.invite"],
  organizationRequired: true,
  audit: "critical",
  idempotency: "required",
  criticality: "critical",
  signals: ["log", "metric", "span"],
});
