import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createPlatformInvitationToken, deletePlatformInvitationToken } from "@saptm/auth";
import type { DatabaseActorType, PrismaTx } from "@saptm/database";
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
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";
import { writeAdminAuditAndOutbox } from "./domain/admin.audit-trail.js";
import {
  arraysEqualIgnoringOrder,
  assertCustomRoleKey,
  assertMutableRole,
  assertNotRemovingLastActiveTenantAdmin,
} from "./domain/admin.business-rules.js";
import { tenantAdminRoleKey } from "./domain/admin.constants.js";
import {
  createAdminInvitationDelivery,
  mapOrganization,
  mapPermission,
  mapRole,
  mapUserMembership,
} from "./domain/admin.dto.js";
import { ADMIN_REPOSITORY, type AdminRepository } from "./domain/admin.repository.js";

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

@Injectable()
export class AdminService {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: AdminRepository,
    readonly _adminEventBus: OutboxEventBusAdapter,
  ) {}

  async getOverview(input: GetAdminOverviewInput): Promise<AdminOverviewOutput> {
    const limit = input.limit ?? 25;
    const offset = input.offset ?? 0;
    const generatedAt = input.generatedAt ?? new Date();

    const organization = await this.adminRepository.findOrganization(input.organizationId);

    if (organization === null) {
      throw new NotFoundException("admin.organization_not_found");
    }

    const [memberships, roles, permissions, totals, totalCount] = await Promise.all([
      this.adminRepository.findMemberships(input.organizationId, limit, offset),
      this.adminRepository.findRoles(input.organizationId),
      this.adminRepository.findPermissions(),
      resolveAdminTotals(this.adminRepository, input.organizationId),
      this.adminRepository.countMembershipsNotRemoved(input.organizationId),
    ]);

    return {
      generatedAt: generatedAt.toISOString(),
      organization: mapOrganization(organization),
      totals,
      users: memberships.map(mapUserMembership),
      roles: roles.map(mapRole),
      permissions: permissions.map(mapPermission),
      pagination: {
        totalCount,
        limit,
        offset,
      },
      securityModel: {
        authProvider: "better-auth",
        authorizationModel: "tenant-scoped-rbac",
        requiredPermissions: ["tenant.manage", "identity.user.invite", "identity.role.assign"],
        enforcedBy: "orpc-metadata-rpc-context",
      },
    };
  }

  async inviteUser(input: InviteAdminUserInput): Promise<AdminUserInviteOutput> {
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const roles = await this.adminRepository.findRolesByKeys(
        tx,
        input.organizationId,
        input.roleKeys,
      );
      const missingRoleKeys = input.roleKeys.filter(
        (roleKey) => !roles.some((role) => role.key === roleKey),
      );

      if (missingRoleKeys.length > 0) {
        throw new BadRequestException(`admin.role_missing:${missingRoleKeys.join(",")}`);
      }

      const existingUser = await this.adminRepository.findUserByEmail(tx, input.email);
      const user = await this.adminRepository.upsertUser(tx, input.email, input.name);
      const existingMembership =
        existingUser === null
          ? null
          : await this.adminRepository.findMembershipByUserAndOrg(
              tx,
              input.organizationId,
              user.id,
            );
      const membership = await this.adminRepository.upsertMembership(
        tx,
        input.organizationId,
        user.id,
      );

      for (const role of roles) {
        await this.adminRepository.upsertMembershipRole(tx, membership.id, role.id);
      }

      const invitation = createAdminInvitationDelivery(
        await createPlatformInvitationToken(tx, {
          membershipId: membership.id,
        }),
      );

      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "identity.user.invited",
        subjectType: "user",
        subjectId: user.id,
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
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
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
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
      });

      const reloadedMembership = await this.adminRepository.findMembershipForOutput(
        tx,
        membership.id,
      );

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
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const membership = await this.adminRepository.findTenantMembership(
        tx,
        input.organizationId,
        input.membershipId,
      );
      const role = await this.adminRepository.findTenantRole(
        tx,
        input.organizationId,
        input.roleId,
      );
      const existingAssignment = await this.adminRepository.findExistingAssignment(
        tx,
        membership.id,
        role.id,
      );

      await this.adminRepository.upsertMembershipRole(tx, membership.id, role.id);
      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "identity.role.assigned",
        subjectType: "membership",
        subjectId: membership.id,
        aggregateType: "identity.membership",
        aggregateId: membership.id,
        after: {
          membershipId: membership.id,
          roleId: role.id,
          roleKey: role.key,
          sourceSystem: input.sourceSystem,
        },
        reason: "Governed tenant role assignment.",
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        payload: {
          membershipId: membership.id,
          roleId: role.id,
          roleKey: role.key,
          idempotencyKey: input.idempotencyKey,
          sourceSystem: input.sourceSystem,
        },
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
      });

      const reloadedMembership = await this.adminRepository.findMembershipForOutput(
        tx,
        membership.id,
      );

      return {
        organizationId: input.organizationId,
        membershipId: membership.id,
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
          subjectId: membership.id,
        },
        outbox: {
          eventType: "identity.role.assigned",
          aggregateType: "identity.membership",
          aggregateId: membership.id,
        },
      };
    });
  }

  async createRole(input: CreateAdminRoleInput): Promise<AdminRoleMutationOutput> {
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      assertCustomRoleKey(input.key);
      const permissionRecords = await this.adminRepository.findPermissionsByKeys(
        tx,
        input.permissionKeys,
      );
      const existingRole = await this.adminRepository.findRoleByKey(
        tx,
        input.organizationId,
        input.key,
      );
      const role =
        existingRole ??
        (await this.adminRepository.createRole(
          tx,
          input.organizationId,
          input.key,
          input.name,
          input.description ?? null,
        ));

      if (existingRole === null) {
        for (const permission of permissionRecords) {
          await this.adminRepository.upsertRolePermission(tx, role.id, permission.id);
        }
      }

      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
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
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        organizationId: input.organizationId,
        roleId: role.id,
        role: mapRole(await this.adminRepository.findRoleForOutput(tx, role.id)),
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
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const role = await this.adminRepository.findTenantRole(
        tx,
        input.organizationId,
        input.roleId,
      );

      assertMutableRole(role.key);

      const permissionRecords = await this.adminRepository.findPermissionsByKeys(
        tx,
        input.permissionKeys,
      );
      const beforePermissionKeys = await this.adminRepository.readRolePermissionKeys(tx, role.id);

      await this.adminRepository.deleteRolePermissions(tx, role.id);

      for (const permission of permissionRecords) {
        await this.adminRepository.createRolePermission(tx, role.id, permission.id);
      }

      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
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
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        organizationId: input.organizationId,
        roleId: role.id,
        role: mapRole(await this.adminRepository.findRoleForOutput(tx, role.id)),
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
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const role = await this.adminRepository.findRoleForDelete(
        tx,
        input.organizationId,
        input.roleId,
      );

      if (role === null) {
        throw new NotFoundException("admin.role_not_found");
      }

      assertMutableRole(role.key);

      if (role._count.memberships > 0) {
        throw new BadRequestException("admin.role_delete_blocked_memberships_exist");
      }

      await this.adminRepository.deleteRole(tx, role.id);
      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
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
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
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
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const membership = await this.adminRepository.findTenantMembership(
        tx,
        input.organizationId,
        input.membershipId,
      );
      const role = await this.adminRepository.findTenantRole(
        tx,
        input.organizationId,
        input.roleId,
      );
      const existingAssignment = await this.adminRepository.findExistingAssignment(
        tx,
        membership.id,
        role.id,
      );

      if (existingAssignment !== null) {
        if (role.key === tenantAdminRoleKey) {
          await assertNotRemovingLastActiveTenantAdmin(
            async () => this.adminRepository.findActiveAdminMemberships(tx, input.organizationId),
            membership.id,
          );
        }

        await this.adminRepository.deleteMembershipRoleByMembershipAndRole(
          tx,
          membership.id,
          role.id,
        );
      }

      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
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
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
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
        user: mapUserMembership(
          await this.adminRepository.findMembershipForOutput(tx, membership.id),
        ),
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
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const membership = await this.adminRepository.findTenantMembership(
        tx,
        input.organizationId,
        input.membershipId,
      );

      if (membership.user.id === input.actorId && input.status !== "active") {
        throw new BadRequestException("admin.membership_cannot_suspend_or_remove_self");
      }

      if (input.status !== "active") {
        await assertNotRemovingLastActiveTenantAdmin(
          async () => this.adminRepository.findActiveAdminMemberships(tx, input.organizationId),
          membership.id,
        );
      }

      const updatedMembership = await this.adminRepository.updateMembershipStatus(
        tx,
        membership.id,
        input.status,
      );

      if (input.status === "removed") {
        await this.adminRepository.deleteMembershipRoleByMembership(tx, membership.id);
      }

      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
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
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        organizationId: input.organizationId,
        membershipId: updatedMembership.id,
        status: input.status,
        user: mapUserMembership(
          await this.adminRepository.findMembershipForOutput(tx, membership.id),
        ),
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
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const membership = await this.adminRepository.findTenantMembership(
        tx,
        input.organizationId,
        input.membershipId,
      );

      if (membership.status !== "invited") {
        throw new BadRequestException("admin.invitation_resend_requires_invited_membership");
      }

      const invitation = createAdminInvitationDelivery(
        await createPlatformInvitationToken(tx, {
          membershipId: membership.id,
        }),
      );

      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
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
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        organizationId: input.organizationId,
        membershipId: membership.id,
        user: mapUserMembership(
          await this.adminRepository.findMembershipForOutput(tx, membership.id),
        ),
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
    return this.adminRepository.transaction(async (tx: PrismaTx) => {
      await this.adminRepository.assertOrganizationExists(tx, input.organizationId);
      const membership = await this.adminRepository.findTenantMembership(
        tx,
        input.organizationId,
        input.membershipId,
      );

      if (membership.status !== "invited") {
        throw new BadRequestException("admin.invitation_cancel_requires_invited_membership");
      }

      await this.adminRepository.updateMembershipStatus(tx, membership.id, "removed");
      await this.adminRepository.deleteMembershipRoleByMembership(tx, membership.id);
      await deletePlatformInvitationToken(tx, membership.id);
      await writeAdminAuditAndOutbox(this.adminRepository, tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
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
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sourceSystem: input.sourceSystem,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        organizationId: input.organizationId,
        membershipId: membership.id,
        user: mapUserMembership(
          await this.adminRepository.findMembershipForOutput(tx, membership.id),
        ),
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

async function resolveAdminTotals(
  repository: AdminRepository,
  organizationId: string,
): Promise<AdminOverviewOutput["totals"]> {
  const [users, activeMemberships, invitedMemberships, roles, permissions] = await Promise.all([
    repository.countMembershipsNotRemoved(organizationId),
    repository.countActiveMemberships(organizationId),
    repository.countInvitedMemberships(organizationId),
    repository.countRoles(organizationId),
    repository.countPermissions(),
  ]);

  return {
    users,
    activeMemberships,
    invitedMemberships,
    roles,
    permissions,
  };
}
