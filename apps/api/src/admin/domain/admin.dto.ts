import type { PlatformInvitationDelivery } from "@saptm/auth";
import type { DatabaseActorType } from "@saptm/database";
import type {
  AdminInvitationCancelInput,
  AdminInvitationResendInput,
  AdminMembershipStatusUpdateInput,
  AdminOverviewOutput,
  AdminRoleAssignInput,
  AdminRoleCreateInput,
  AdminRoleDeleteInput,
  AdminRolePermissionsUpdateInput,
  AdminRoleRevokeInput,
  AdminUserInviteInput,
} from "@saptm/rpc";
import { protectedRoleKeys } from "./admin.constants.js";

// Input types

export type GetAdminOverviewInput = {
  organizationId: string;
  limit?: number;
  offset?: number;
  generatedAt?: Date;
};

export type InviteAdminUserInput = AdminUserInviteInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AssignAdminRoleInput = AdminRoleAssignInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AdminAuditableInput = {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CreateAdminRoleInput = AdminRoleCreateInput & AdminAuditableInput;
export type UpdateAdminRolePermissionsInput = AdminRolePermissionsUpdateInput & AdminAuditableInput;
export type DeleteAdminRoleInput = AdminRoleDeleteInput & AdminAuditableInput;
export type RevokeAdminRoleInput = AdminRoleRevokeInput & AdminAuditableInput;
export type UpdateAdminMembershipStatusInput = AdminMembershipStatusUpdateInput &
  AdminAuditableInput;
export type ResendAdminInvitationInput = AdminInvitationResendInput & AdminAuditableInput;
export type CancelAdminInvitationInput = AdminInvitationCancelInput & AdminAuditableInput;

// Record types

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

export type MembershipRecord = {
  id: string;
  status: "invited" | "active" | "suspended" | "removed";
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  roles: {
    role: {
      id: string;
      key: string;
      name: string;
    };
  }[];
};

export type RoleRecord = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: {
    permission: {
      key: string;
    };
  }[];
  _count: {
    memberships: number;
    permissions: number;
  };
};

export type RoleForOutputRecord = RoleRecord;

export type PermissionRecord = {
  id: string;
  key: string;
  description: string | null;
  _count: {
    roles: number;
  };
};

// Mapping functions

export function mapOrganization(
  organization: OrganizationRecord,
): AdminOverviewOutput["organization"] {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

export function mapUserMembership(
  membership: MembershipRecord,
): AdminOverviewOutput["users"][number] {
  return {
    id: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    emailVerified: membership.user.emailVerified,
    createdAt: membership.user.createdAt.toISOString(),
    updatedAt: membership.user.updatedAt.toISOString(),
    membership: {
      id: membership.id,
      status: membership.status,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),
      roles: membership.roles.map((membershipRole) => ({
        id: membershipRole.role.id,
        key: membershipRole.role.key,
        name: membershipRole.role.name,
      })),
    },
  };
}

export function mapRole(role: RoleRecord): AdminOverviewOutput["roles"][number] {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    protected: protectedRoleKeys.has(role.key),
    permissionCount: role._count.permissions,
    membershipCount: role._count.memberships,
    permissions: role.permissions.map((rolePermission) => rolePermission.permission.key),
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export function mapPermission(
  permission: PermissionRecord,
): AdminOverviewOutput["permissions"][number] {
  return {
    id: permission.id,
    key: permission.key as AdminOverviewOutput["permissions"][number]["key"],
    description: permission.description,
    roleCount: permission._count.roles,
  };
}

export function createAdminInvitationDelivery(
  invitation: PlatformInvitationDelivery,
): PlatformInvitationDelivery {
  return {
    acceptUrl: invitation.acceptUrl,
    deliveryChannel: invitation.deliveryChannel,
    expiresAt: invitation.expiresAt,
  };
}

export function createAuditRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
