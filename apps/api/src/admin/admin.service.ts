import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  createPlatformInvitationToken,
  deletePlatformInvitationToken,
  type PlatformInvitationDelivery,
} from "@saptm/auth";
import {
  type DatabaseActorType,
  getPrismaClient,
  rbacBootstrapRoleTemplates,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  AdminInvitationCancelInput,
  AdminInvitationLifecycleOutput,
  AdminInvitationResendInput,
  AdminMembershipStatusUpdateInput,
  AdminMembershipStatusUpdateOutput,
  AdminOverviewOutput,
  AdminRoleAssignInput,
  AdminRoleAssignOutput,
  AdminRoleCreateInput,
  AdminRoleDeleteInput,
  AdminRoleDeleteOutput,
  AdminRoleMutationOutput,
  AdminRolePermissionsUpdateInput,
  AdminRoleRevokeInput,
  AdminRoleRevokeOutput,
  AdminUserInviteInput,
  AdminUserInviteOutput,
} from "@saptm/rpc";

export type GetAdminOverviewInput = {
  organizationId: string;
  limit?: number;
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

type AdminAuditableInput = {
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

type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

type MembershipRecord = {
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

type RoleRecord = {
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

type RoleForOutputRecord = RoleRecord;

type PermissionRecord = {
  id: string;
  key: string;
  description: string | null;
  _count: {
    roles: number;
  };
};

const protectedRoleKeys = new Set(
  rbacBootstrapRoleTemplates.map((template: { key: string }) => template.key),
);
const tenantAdminRoleKey = "tenant.admin";

@Injectable()
export class AdminService {
  constructor(private readonly database: SaptmPrismaClient = getPrismaClient()) {}

  async getOverview(input: GetAdminOverviewInput): Promise<AdminOverviewOutput> {
    const limit = input.limit ?? 25;
    const generatedAt = input.generatedAt ?? new Date();
    const organization = await this.database.organization.findUnique({
      where: {
        id: input.organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (organization === null) {
      throw new NotFoundException("admin.organization_not_found");
    }

    const [memberships, roles, permissions, totals] = await Promise.all([
      this.database.membership.findMany({
        where: {
          organizationId: input.organizationId,
          status: {
            not: "removed",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          roles: {
            orderBy: {
              role: {
                key: "asc",
              },
            },
            select: {
              role: {
                select: {
                  id: true,
                  key: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.database.role.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: {
          key: "asc",
        },
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          permissions: {
            orderBy: {
              permission: {
                key: "asc",
              },
            },
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
          _count: {
            select: {
              memberships: true,
              permissions: true,
            },
          },
        },
      }),
      this.database.permission.findMany({
        orderBy: {
          key: "asc",
        },
        select: {
          id: true,
          key: true,
          description: true,
          _count: {
            select: {
              roles: true,
            },
          },
        },
      }),
      resolveAdminTotals(this.database, input.organizationId),
    ]);

    return {
      generatedAt: generatedAt.toISOString(),
      organization: mapOrganization(organization),
      totals,
      users: memberships.map(mapUserMembership),
      roles: roles.map(mapRole),
      permissions: permissions.map(mapPermission),
      securityModel: {
        authProvider: "better-auth",
        authorizationModel: "tenant-scoped-rbac",
        requiredPermissions: ["tenant.manage", "identity.user.invite", "identity.role.assign"],
        enforcedBy: "orpc-metadata-rpc-context",
      },
    };
  }

  async inviteUser(input: InviteAdminUserInput): Promise<AdminUserInviteOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const roles = await findRolesByKeys(transaction, input.organizationId, input.roleKeys);
      const missingRoleKeys = input.roleKeys.filter(
        (roleKey) => !roles.some((role) => role.key === roleKey),
      );

      if (missingRoleKeys.length > 0) {
        throw new BadRequestException(`admin.role_missing:${missingRoleKeys.join(",")}`);
      }

      const existingUser = await transaction.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          id: true,
        },
      });
      const user = await transaction.user.upsert({
        where: {
          email: input.email,
        },
        update: {
          name: input.name,
        },
        create: {
          id: `admin_user_${crypto.randomUUID()}`,
          email: input.email,
          emailVerified: false,
          name: input.name,
        },
      });
      const existingMembership =
        existingUser === null
          ? null
          : await transaction.membership.findUnique({
              where: {
                organizationId_userId: {
                  organizationId: input.organizationId,
                  userId: user.id,
                },
              },
              select: {
                id: true,
              },
            });
      const membership = await transaction.membership.upsert({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: user.id,
          },
        },
        update: {
          status: "invited",
        },
        create: {
          organizationId: input.organizationId,
          userId: user.id,
          status: "invited",
        },
      });

      for (const role of roles) {
        await transaction.membershipRole.upsert({
          where: {
            membershipId_roleId: {
              membershipId: membership.id,
              roleId: role.id,
            },
          },
          update: {},
          create: {
            membershipId: membership.id,
            roleId: role.id,
          },
        });
      }

      const invitation = createAdminInvitationDelivery(
        await createPlatformInvitationToken(transaction, {
          membershipId: membership.id,
        }),
      );

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "identity.user.invited",
          subjectType: "user",
          subjectId: user.id,
          severity: "critical",
          after: {
            email: user.email,
            invitationDeliveryChannel: invitation.deliveryChannel,
            invitationExpiresAt: invitation.expiresAt,
            membershipId: membership.id,
            roleKeys: roles.map((role) => role.key),
            sourceSystem: input.sourceSystem,
          },
          reason: "Governed tenant user invitation.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "identity.user.invited",
          aggregateType: "identity.user",
          aggregateId: user.id,
          payload: {
            userId: user.id,
            email: user.email,
            invitation,
            membershipId: membership.id,
            roleKeys: roles.map((role) => role.key),
            idempotencyKey: input.idempotencyKey,
            sourceSystem: input.sourceSystem,
          },
        },
      });

      const reloadedMembership = await findMembershipForOutput(transaction, membership.id);

      return {
        organizationId: input.organizationId,
        userId: user.id,
        membershipId: membership.id,
        user: mapUserMembership(reloadedMembership),
        invitation,
        idempotency: {
          key: input.idempotencyKey,
          replayed: existingMembership !== null,
        },
        audit: {
          action: "identity.user.invited",
          subjectType: "user",
          subjectId: user.id,
        },
        outbox: {
          eventType: "identity.user.invited",
          aggregateType: "identity.user",
          aggregateId: user.id,
        },
      };
    });
  }

  async assignRole(input: AssignAdminRoleInput): Promise<AdminRoleAssignOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const membership = await transaction.membership.findFirst({
        where: {
          id: input.membershipId,
          organizationId: input.organizationId,
          status: {
            not: "removed",
          },
        },
        select: {
          id: true,
        },
      });

      if (membership === null) {
        throw new NotFoundException("admin.membership_not_found");
      }

      const role = await transaction.role.findFirst({
        where: {
          id: input.roleId,
          organizationId: input.organizationId,
        },
        select: {
          id: true,
          key: true,
          name: true,
        },
      });

      if (role === null) {
        throw new NotFoundException("admin.role_not_found");
      }

      const existingAssignment = await transaction.membershipRole.findUnique({
        where: {
          membershipId_roleId: {
            membershipId: input.membershipId,
            roleId: input.roleId,
          },
        },
        select: {
          membershipId: true,
        },
      });

      await transaction.membershipRole.upsert({
        where: {
          membershipId_roleId: {
            membershipId: input.membershipId,
            roleId: input.roleId,
          },
        },
        update: {},
        create: {
          membershipId: input.membershipId,
          roleId: input.roleId,
        },
      });
      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "identity.role.assigned",
          subjectType: "membership",
          subjectId: input.membershipId,
          severity: "critical",
          after: {
            membershipId: input.membershipId,
            roleId: role.id,
            roleKey: role.key,
            sourceSystem: input.sourceSystem,
          },
          reason: "Governed tenant role assignment.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "identity.role.assigned",
          aggregateType: "identity.membership",
          aggregateId: input.membershipId,
          payload: {
            membershipId: input.membershipId,
            roleId: role.id,
            roleKey: role.key,
            idempotencyKey: input.idempotencyKey,
            sourceSystem: input.sourceSystem,
          },
        },
      });

      const reloadedMembership = await findMembershipForOutput(transaction, input.membershipId);

      return {
        organizationId: input.organizationId,
        membershipId: input.membershipId,
        roleId: role.id,
        user: mapUserMembership(reloadedMembership),
        assignedRole: {
          id: role.id,
          key: role.key,
          name: role.name,
        },
        idempotency: {
          key: input.idempotencyKey,
          replayed: existingAssignment !== null,
        },
        audit: {
          action: "identity.role.assigned",
          subjectType: "membership",
          subjectId: input.membershipId,
        },
        outbox: {
          eventType: "identity.role.assigned",
          aggregateType: "identity.membership",
          aggregateId: input.membershipId,
        },
      };
    });
  }

  async createRole(input: CreateAdminRoleInput): Promise<AdminRoleMutationOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      assertCustomRoleKey(input.key);
      const permissionRecords = await findPermissionsByKeys(transaction, input.permissionKeys);
      const existingRole = await transaction.role.findUnique({
        where: {
          organizationId_key: {
            organizationId: input.organizationId,
            key: input.key,
          },
        },
        select: {
          id: true,
        },
      });
      const role =
        existingRole ??
        (await transaction.role.create({
          data: {
            organizationId: input.organizationId,
            key: input.key,
            name: input.name,
            description: input.description ?? null,
          },
          select: {
            id: true,
          },
        }));

      if (existingRole === null) {
        for (const permission of permissionRecords) {
          await transaction.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }

      await writeAdminAuditAndOutbox(transaction, {
        ...input,
        action: "identity.role.created",
        subjectType: "role",
        subjectId: role.id,
        aggregateType: "identity.role",
        aggregateId: role.id,
        after: {
          roleId: role.id,
          roleKey: input.key,
          permissionKeys: input.permissionKeys,
          sourceSystem: input.sourceSystem,
        },
        reason: "Governed tenant custom role creation.",
      });

      return {
        organizationId: input.organizationId,
        roleId: role.id,
        role: mapRole(await findRoleForOutput(transaction, role.id)),
        idempotency: {
          key: input.idempotencyKey,
          replayed: existingRole !== null,
        },
        audit: {
          action: "identity.role.created",
          subjectType: "role",
          subjectId: role.id,
        },
        outbox: {
          eventType: "identity.role.created",
          aggregateType: "identity.role",
          aggregateId: role.id,
        },
      };
    });
  }

  async updateRolePermissions(
    input: UpdateAdminRolePermissionsInput,
  ): Promise<AdminRoleMutationOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const role = await findTenantRole(transaction, input.organizationId, input.roleId);

      assertMutableRole(role.key);

      const permissionRecords = await findPermissionsByKeys(transaction, input.permissionKeys);
      const beforePermissionKeys = await readRolePermissionKeys(transaction, role.id);

      await transaction.rolePermission.deleteMany({
        where: {
          roleId: role.id,
        },
      });

      for (const permission of permissionRecords) {
        await transaction.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }

      await writeAdminAuditAndOutbox(transaction, {
        ...input,
        action: "identity.role.permissions.updated",
        subjectType: "role",
        subjectId: role.id,
        aggregateType: "identity.role",
        aggregateId: role.id,
        before: {
          roleId: role.id,
          roleKey: role.key,
          permissionKeys: beforePermissionKeys,
        },
        after: {
          roleId: role.id,
          roleKey: role.key,
          permissionKeys: input.permissionKeys,
          sourceSystem: input.sourceSystem,
        },
        reason: "Governed tenant custom role permission update.",
      });

      return {
        organizationId: input.organizationId,
        roleId: role.id,
        role: mapRole(await findRoleForOutput(transaction, role.id)),
        idempotency: {
          key: input.idempotencyKey,
          replayed: arraysEqualIgnoringOrder(beforePermissionKeys, input.permissionKeys),
        },
        audit: {
          action: "identity.role.permissions.updated",
          subjectType: "role",
          subjectId: role.id,
        },
        outbox: {
          eventType: "identity.role.permissions.updated",
          aggregateType: "identity.role",
          aggregateId: role.id,
        },
      };
    });
  }

  async deleteRole(input: DeleteAdminRoleInput): Promise<AdminRoleDeleteOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const role = await transaction.role.findFirst({
        where: {
          id: input.roleId,
          organizationId: input.organizationId,
        },
        select: {
          id: true,
          key: true,
          _count: {
            select: {
              memberships: true,
            },
          },
        },
      });

      if (role === null) {
        throw new NotFoundException("admin.role_not_found");
      }

      assertMutableRole(role.key);

      if (role._count.memberships > 0) {
        throw new BadRequestException("admin.role_delete_blocked_memberships_exist");
      }

      await transaction.role.delete({
        where: {
          id: role.id,
        },
      });
      await writeAdminAuditAndOutbox(transaction, {
        ...input,
        action: "identity.role.deleted",
        subjectType: "role",
        subjectId: role.id,
        aggregateType: "identity.role",
        aggregateId: role.id,
        before: {
          roleId: role.id,
          roleKey: role.key,
        },
        after: {
          roleId: role.id,
          roleKey: role.key,
          sourceSystem: input.sourceSystem,
        },
        reason: "Governed tenant custom role deletion.",
      });

      return {
        organizationId: input.organizationId,
        roleId: role.id,
        roleKey: role.key,
        idempotency: {
          key: input.idempotencyKey,
          replayed: false,
        },
        audit: {
          action: "identity.role.deleted",
          subjectType: "role",
          subjectId: role.id,
        },
        outbox: {
          eventType: "identity.role.deleted",
          aggregateType: "identity.role",
          aggregateId: role.id,
        },
      };
    });
  }

  async revokeRole(input: RevokeAdminRoleInput): Promise<AdminRoleRevokeOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const membership = await findTenantMembership(
        transaction,
        input.organizationId,
        input.membershipId,
      );
      const role = await findTenantRole(transaction, input.organizationId, input.roleId);
      const existingAssignment = await transaction.membershipRole.findUnique({
        where: {
          membershipId_roleId: {
            membershipId: membership.id,
            roleId: role.id,
          },
        },
        select: {
          membershipId: true,
        },
      });

      if (existingAssignment !== null) {
        if (role.key === tenantAdminRoleKey) {
          await assertNotRemovingLastActiveTenantAdmin(
            transaction,
            input.organizationId,
            membership.id,
          );
        }

        await transaction.membershipRole.delete({
          where: {
            membershipId_roleId: {
              membershipId: membership.id,
              roleId: role.id,
            },
          },
        });
      }

      await writeAdminAuditAndOutbox(transaction, {
        ...input,
        action: "identity.role.revoked",
        subjectType: "membership",
        subjectId: membership.id,
        aggregateType: "identity.membership",
        aggregateId: membership.id,
        before: {
          membershipId: membership.id,
          roleId: role.id,
          roleKey: role.key,
        },
        after: {
          membershipId: membership.id,
          roleId: role.id,
          roleKey: role.key,
          sourceSystem: input.sourceSystem,
        },
        reason: "Governed tenant role revocation.",
      });

      return {
        organizationId: input.organizationId,
        membershipId: membership.id,
        roleId: role.id,
        revokedRole: {
          id: role.id,
          key: role.key,
          name: role.name,
        },
        user: mapUserMembership(await findMembershipForOutput(transaction, membership.id)),
        idempotency: {
          key: input.idempotencyKey,
          replayed: existingAssignment === null,
        },
        audit: {
          action: "identity.role.revoked",
          subjectType: "membership",
          subjectId: membership.id,
        },
        outbox: {
          eventType: "identity.role.revoked",
          aggregateType: "identity.membership",
          aggregateId: membership.id,
        },
      };
    });
  }

  async updateMembershipStatus(
    input: UpdateAdminMembershipStatusInput,
  ): Promise<AdminMembershipStatusUpdateOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const membership = await findTenantMembership(
        transaction,
        input.organizationId,
        input.membershipId,
      );

      if (membership.user.id === input.actorId && input.status !== "active") {
        throw new BadRequestException("admin.membership_cannot_suspend_or_remove_self");
      }

      if (input.status !== "active") {
        await assertNotRemovingLastActiveTenantAdmin(
          transaction,
          input.organizationId,
          membership.id,
        );
      }

      const updatedMembership = await transaction.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          status: input.status,
        },
        select: {
          id: true,
        },
      });

      if (input.status === "removed") {
        await transaction.membershipRole.deleteMany({
          where: {
            membershipId: membership.id,
          },
        });
      }

      await writeAdminAuditAndOutbox(transaction, {
        ...input,
        action: "identity.membership.status.updated",
        subjectType: "membership",
        subjectId: membership.id,
        aggregateType: "identity.membership",
        aggregateId: membership.id,
        before: {
          membershipId: membership.id,
          status: membership.status,
        },
        after: {
          membershipId: membership.id,
          status: input.status,
          reason: input.reason,
          sourceSystem: input.sourceSystem,
        },
        reason: input.reason,
      });

      return {
        organizationId: input.organizationId,
        membershipId: updatedMembership.id,
        status: input.status,
        user: mapUserMembership(await findMembershipForOutput(transaction, membership.id)),
        idempotency: {
          key: input.idempotencyKey,
          replayed: membership.status === input.status,
        },
        audit: {
          action: "identity.membership.status.updated",
          subjectType: "membership",
          subjectId: membership.id,
        },
        outbox: {
          eventType: "identity.membership.status.updated",
          aggregateType: "identity.membership",
          aggregateId: membership.id,
        },
      };
    });
  }

  async resendInvitation(
    input: ResendAdminInvitationInput,
  ): Promise<AdminInvitationLifecycleOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const membership = await findTenantMembership(
        transaction,
        input.organizationId,
        input.membershipId,
      );

      if (membership.status !== "invited") {
        throw new BadRequestException("admin.invitation_resend_requires_invited_membership");
      }

      const invitation = createAdminInvitationDelivery(
        await createPlatformInvitationToken(transaction, {
          membershipId: membership.id,
        }),
      );

      await writeAdminAuditAndOutbox(transaction, {
        ...input,
        action: "identity.invitation.resent",
        subjectType: "membership",
        subjectId: membership.id,
        aggregateType: "identity.membership",
        aggregateId: membership.id,
        after: {
          invitationDeliveryChannel: invitation.deliveryChannel,
          invitationExpiresAt: invitation.expiresAt,
          membershipId: membership.id,
          userId: membership.user.id,
          email: membership.user.email,
          sourceSystem: input.sourceSystem,
        },
        payload: {
          invitation,
          membershipId: membership.id,
          userId: membership.user.id,
          email: membership.user.email,
        },
        reason: "Governed tenant invitation resend.",
      });

      return {
        organizationId: input.organizationId,
        membershipId: membership.id,
        user: mapUserMembership(await findMembershipForOutput(transaction, membership.id)),
        invitation,
        idempotency: {
          key: input.idempotencyKey,
          replayed: false,
        },
        audit: {
          action: "identity.invitation.resent",
          subjectType: "membership",
          subjectId: membership.id,
        },
        outbox: {
          eventType: "identity.invitation.resent",
          aggregateType: "identity.membership",
          aggregateId: membership.id,
        },
      };
    });
  }

  async cancelInvitation(
    input: CancelAdminInvitationInput,
  ): Promise<AdminInvitationLifecycleOutput> {
    return this.database.$transaction(async (transaction) => {
      await assertOrganizationExists(transaction, input.organizationId);
      const membership = await findTenantMembership(
        transaction,
        input.organizationId,
        input.membershipId,
      );

      if (membership.status !== "invited") {
        throw new BadRequestException("admin.invitation_cancel_requires_invited_membership");
      }

      await transaction.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          status: "removed",
        },
      });
      await transaction.membershipRole.deleteMany({
        where: {
          membershipId: membership.id,
        },
      });
      await deletePlatformInvitationToken(transaction, membership.id);
      await writeAdminAuditAndOutbox(transaction, {
        ...input,
        action: "identity.invitation.cancelled",
        subjectType: "membership",
        subjectId: membership.id,
        aggregateType: "identity.membership",
        aggregateId: membership.id,
        before: {
          membershipId: membership.id,
          status: membership.status,
        },
        after: {
          membershipId: membership.id,
          status: "removed",
          reason: input.reason,
          sourceSystem: input.sourceSystem,
        },
        reason: input.reason,
      });

      return {
        organizationId: input.organizationId,
        membershipId: membership.id,
        user: mapUserMembership(await findMembershipForOutput(transaction, membership.id)),
        idempotency: {
          key: input.idempotencyKey,
          replayed: false,
        },
        audit: {
          action: "identity.invitation.cancelled",
          subjectType: "membership",
          subjectId: membership.id,
        },
        outbox: {
          eventType: "identity.invitation.cancelled",
          aggregateType: "identity.membership",
          aggregateId: membership.id,
        },
      };
    });
  }
}

type AdminQueryClient = Pick<
  SaptmPrismaClient,
  | "auditRecord"
  | "membership"
  | "membershipRole"
  | "organization"
  | "outboxEvent"
  | "permission"
  | "role"
  | "rolePermission"
  | "verification"
>;

async function resolveAdminTotals(
  database: SaptmPrismaClient,
  organizationId: string,
): Promise<AdminOverviewOutput["totals"]> {
  const [users, activeMemberships, invitedMemberships, roles, permissions] = await Promise.all([
    database.membership.count({
      where: {
        organizationId,
        status: {
          not: "removed",
        },
      },
    }),
    database.membership.count({
      where: {
        organizationId,
        status: "active",
      },
    }),
    database.membership.count({
      where: {
        organizationId,
        status: "invited",
      },
    }),
    database.role.count({
      where: {
        organizationId,
      },
    }),
    database.permission.count(),
  ]);

  return {
    users,
    activeMemberships,
    invitedMemberships,
    roles,
    permissions,
  };
}

async function assertOrganizationExists(
  database: AdminQueryClient,
  organizationId: string,
): Promise<void> {
  const organization = await database.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
    },
  });

  if (organization === null) {
    throw new NotFoundException("admin.organization_not_found");
  }
}

async function findRolesByKeys(
  database: AdminQueryClient,
  organizationId: string,
  roleKeys: readonly string[],
): Promise<{ id: string; key: string }[]> {
  if (roleKeys.length === 0) {
    return [];
  }

  return database.role.findMany({
    where: {
      organizationId,
      key: {
        in: [...new Set(roleKeys)],
      },
    },
    select: {
      id: true,
      key: true,
    },
  });
}

async function findPermissionsByKeys(
  database: AdminQueryClient,
  permissionKeys: readonly string[],
): Promise<{ id: string; key: string }[]> {
  const uniquePermissionKeys = [...new Set(permissionKeys)];
  const permissionRecords = await database.permission.findMany({
    where: {
      key: {
        in: uniquePermissionKeys,
      },
    },
    select: {
      id: true,
      key: true,
    },
  });
  const missingPermissionKeys = uniquePermissionKeys.filter(
    (permissionKey) => !permissionRecords.some((permission) => permission.key === permissionKey),
  );

  if (missingPermissionKeys.length > 0) {
    throw new BadRequestException(`admin.permission_missing:${missingPermissionKeys.join(",")}`);
  }

  return permissionRecords;
}

async function findTenantRole(
  database: AdminQueryClient,
  organizationId: string,
  roleId: string,
): Promise<{ id: string; key: string; name: string }> {
  const role = await database.role.findFirst({
    where: {
      id: roleId,
      organizationId,
    },
    select: {
      id: true,
      key: true,
      name: true,
    },
  });

  if (role === null) {
    throw new NotFoundException("admin.role_not_found");
  }

  return role;
}

async function findTenantMembership(
  database: AdminQueryClient,
  organizationId: string,
  membershipId: string,
): Promise<MembershipRecord> {
  const membership = await database.membership.findFirst({
    where: {
      id: membershipId,
      organizationId,
      status: {
        not: "removed",
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      roles: {
        orderBy: {
          role: {
            key: "asc",
          },
        },
        select: {
          role: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (membership === null) {
    throw new NotFoundException("admin.membership_not_found");
  }

  return membership;
}

async function findMembershipForOutput(
  database: AdminQueryClient,
  membershipId: string,
): Promise<MembershipRecord> {
  const membership = await database.membership.findUnique({
    where: {
      id: membershipId,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      roles: {
        orderBy: {
          role: {
            key: "asc",
          },
        },
        select: {
          role: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (membership === null) {
    throw new NotFoundException("admin.membership_not_found");
  }

  return membership;
}

async function findRoleForOutput(
  database: AdminQueryClient,
  roleId: string,
): Promise<RoleForOutputRecord> {
  const role = await database.role.findUnique({
    where: {
      id: roleId,
    },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      permissions: {
        orderBy: {
          permission: {
            key: "asc",
          },
        },
        select: {
          permission: {
            select: {
              key: true,
            },
          },
        },
      },
      _count: {
        select: {
          memberships: true,
          permissions: true,
        },
      },
    },
  });

  if (role === null) {
    throw new NotFoundException("admin.role_not_found");
  }

  return role;
}

async function readRolePermissionKeys(
  database: AdminQueryClient,
  roleId: string,
): Promise<string[]> {
  const records = await database.rolePermission.findMany({
    where: {
      roleId,
    },
    orderBy: {
      permission: {
        key: "asc",
      },
    },
    select: {
      permission: {
        select: {
          key: true,
        },
      },
    },
  });

  return records.map((record) => record.permission.key);
}

function assertCustomRoleKey(roleKey: string): void {
  if (protectedRoleKeys.has(roleKey)) {
    throw new BadRequestException("admin.role_key_reserved");
  }

  if (!roleKey.startsWith("tenant.custom.")) {
    throw new BadRequestException("admin.custom_role_key_must_start_with_tenant_custom");
  }
}

function assertMutableRole(roleKey: string): void {
  if (protectedRoleKeys.has(roleKey)) {
    throw new BadRequestException("admin.role_template_is_protected");
  }
}

async function assertNotRemovingLastActiveTenantAdmin(
  database: AdminQueryClient,
  organizationId: string,
  targetMembershipId: string,
): Promise<void> {
  const activeAdminMemberships = await database.membership.findMany({
    where: {
      organizationId,
      status: "active",
      roles: {
        some: {
          role: {
            key: tenantAdminRoleKey,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (
    activeAdminMemberships.length === 1 &&
    activeAdminMemberships.at(0)?.id === targetMembershipId
  ) {
    throw new BadRequestException("admin.last_active_tenant_admin_protected");
  }
}

function mapOrganization(organization: OrganizationRecord): AdminOverviewOutput["organization"] {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

function mapUserMembership(membership: MembershipRecord): AdminOverviewOutput["users"][number] {
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

function mapRole(role: RoleRecord): AdminOverviewOutput["roles"][number] {
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

function mapPermission(permission: PermissionRecord): AdminOverviewOutput["permissions"][number] {
  return {
    id: permission.id,
    key: permission.key as AdminOverviewOutput["permissions"][number]["key"],
    description: permission.description,
    roleCount: permission._count.roles,
  };
}

function createAdminInvitationDelivery(
  invitation: PlatformInvitationDelivery,
): PlatformInvitationDelivery {
  return {
    acceptUrl: invitation.acceptUrl,
    deliveryChannel: invitation.deliveryChannel,
    expiresAt: invitation.expiresAt,
  };
}

async function writeAdminAuditAndOutbox(
  database: AdminQueryClient,
  input: AdminAuditableInput & {
    action: string;
    subjectType: string;
    subjectId: string;
    aggregateType: string;
    aggregateId: string;
    before?: Record<string, unknown>;
    after: Record<string, unknown>;
    payload?: Record<string, unknown>;
    reason: string;
    sourceSystem: string;
    idempotencyKey: string;
  },
): Promise<void> {
  await database.auditRecord.create({
    data: {
      organizationId: input.organizationId,
      actorType: input.actorType,
      actorId: input.actorId,
      action: input.action,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      severity: "critical",
      ...(input.before === undefined ? {} : { before: input.before as never }),
      after: input.after as never,
      reason: input.reason,
      correlationId: input.correlationId,
      ...createAuditRequestMetadata(input),
    },
  });
  await database.outboxEvent.create({
    data: {
      organizationId: input.organizationId,
      eventType: input.action,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: {
        ...(input.payload ?? input.after),
        idempotencyKey: input.idempotencyKey,
        sourceSystem: input.sourceSystem,
      } as never,
    },
  });
}

function arraysEqualIgnoringOrder(first: readonly string[], second: readonly string[]): boolean {
  if (first.length !== second.length) {
    return false;
  }

  const firstSet = new Set(first);

  return second.every((value) => firstSet.has(value));
}

function createAuditRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
