import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import type {
  MembershipRecord,
  OrganizationRecord,
  PermissionRecord,
  RoleForOutputRecord,
  RoleRecord,
} from "../domain/admin.dto.js";
import type {
  AdminRepository,
  PrismaAuditRecordCreateInput,
  PrismaOutboxEventCreateInput,
} from "../domain/admin.repository.js";

const membershipSelect = {
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
    orderBy: { role: { key: "asc" as const } },
    select: {
      role: {
        select: { id: true, key: true, name: true },
      },
    },
  },
} as const;

const roleSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    orderBy: { permission: { key: "asc" as const } },
    select: { permission: { select: { key: true } } },
  },
  _count: { select: { memberships: true, permissions: true } },
} as const;

@Injectable()
export class PrismaAdminRepository implements AdminRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  // Overview (read-only, no tx)

  async findOrganization(organizationId: string): Promise<OrganizationRecord | null> {
    const record = await this.database.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, status: true, createdAt: true, updatedAt: true },
    });

    return record as unknown as OrganizationRecord | null;
  }

  async countMembershipsNotRemoved(organizationId: string): Promise<number> {
    return this.database.membership.count({
      where: { organizationId, status: { not: "removed" } },
    });
  }

  async countActiveMemberships(organizationId: string): Promise<number> {
    return this.database.membership.count({
      where: { organizationId, status: "active" },
    });
  }

  async countInvitedMemberships(organizationId: string): Promise<number> {
    return this.database.membership.count({
      where: { organizationId, status: "invited" },
    });
  }

  async countRoles(organizationId: string): Promise<number> {
    return this.database.role.count({ where: { organizationId } });
  }

  async countPermissions(): Promise<number> {
    return this.database.permission.count();
  }

  async findMemberships(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<MembershipRecord[]> {
    const records = await this.database.membership.findMany({
      where: { organizationId, status: { not: "removed" } },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: membershipSelect,
    });

    return records as unknown as MembershipRecord[];
  }

  async findRoles(organizationId: string): Promise<RoleRecord[]> {
    const records = await this.database.role.findMany({
      where: { organizationId },
      orderBy: { key: "asc" },
      select: roleSelect,
    });

    return records as unknown as RoleRecord[];
  }

  async findPermissions(): Promise<PermissionRecord[]> {
    const records = await this.database.permission.findMany({
      orderBy: { key: "asc" },
      select: {
        id: true,
        key: true,
        description: true,
        _count: { select: { roles: true } },
      },
    });

    return records as unknown as PermissionRecord[];
  }

  // Assertions (with tx)

  async assertOrganizationExists(tx: PrismaTx, organizationId: string): Promise<void> {
    const organization = await tx.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (organization === null) {
      throw new NotFoundException("admin.organization_not_found");
    }
  }

  // Read methods (with tx)

  async findRolesByKeys(
    tx: PrismaTx,
    organizationId: string,
    roleKeys: readonly string[],
  ): Promise<{ id: string; key: string }[]> {
    if (roleKeys.length === 0) {
      return [];
    }

    return tx.role.findMany({
      where: { organizationId, key: { in: [...new Set(roleKeys)] } },
      select: { id: true, key: true },
    });
  }

  async findPermissionsByKeys(
    tx: PrismaTx,
    permissionKeys: readonly string[],
  ): Promise<{ id: string; key: string }[]> {
    const uniqueKeys = [...new Set(permissionKeys)];
    const records = await tx.permission.findMany({
      where: { key: { in: uniqueKeys } },
      select: { id: true, key: true },
    });
    const missingKeys = uniqueKeys.filter(
      (pk) => !records.some((r: { id: string; key: string }) => r.key === pk),
    );

    if (missingKeys.length > 0) {
      throw new BadRequestException(`admin.permission_missing:${missingKeys.join(",")}`);
    }

    return records;
  }

  async findUserByEmail(tx: PrismaTx, email: string): Promise<{ id: string } | null> {
    return tx.user.findUnique({ where: { email }, select: { id: true } });
  }

  async findMembershipByUserAndOrg(
    tx: PrismaTx,
    organizationId: string,
    userId: string,
  ): Promise<{ id: string } | null> {
    return tx.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true },
    });
  }

  async findTenantRole(
    tx: PrismaTx,
    organizationId: string,
    roleId: string,
  ): Promise<{ id: string; key: string; name: string }> {
    const role = await tx.role.findFirst({
      where: { id: roleId, organizationId },
      select: { id: true, key: true, name: true },
    });

    if (role === null) {
      throw new NotFoundException("admin.role_not_found");
    }

    return role;
  }

  async findTenantMembership(
    tx: PrismaTx,
    organizationId: string,
    membershipId: string,
  ): Promise<MembershipRecord> {
    const membership = await tx.membership.findFirst({
      where: { id: membershipId, organizationId, status: { not: "removed" } },
      select: membershipSelect,
    });

    if (membership === null) {
      throw new NotFoundException("admin.membership_not_found");
    }

    return membership as unknown as MembershipRecord;
  }

  async findMembershipForOutput(tx: PrismaTx, membershipId: string): Promise<MembershipRecord> {
    const membership = await tx.membership.findUnique({
      where: { id: membershipId },
      select: membershipSelect,
    });

    if (membership === null) {
      throw new NotFoundException("admin.membership_not_found");
    }

    return membership as unknown as MembershipRecord;
  }

  async findRoleForOutput(tx: PrismaTx, roleId: string): Promise<RoleForOutputRecord> {
    const role = await tx.role.findUnique({
      where: { id: roleId },
      select: roleSelect,
    });

    if (role === null) {
      throw new NotFoundException("admin.role_not_found");
    }

    return role as unknown as RoleForOutputRecord;
  }

  async readRolePermissionKeys(tx: PrismaTx, roleId: string): Promise<string[]> {
    const records = await tx.rolePermission.findMany({
      where: { roleId },
      orderBy: { permission: { key: "asc" } },
      select: { permission: { select: { key: true } } },
    });

    return records.map((r: { permission: { key: string } }) => r.permission.key);
  }

  async findExistingAssignment(
    tx: PrismaTx,
    membershipId: string,
    roleId: string,
  ): Promise<{ membershipId: string } | null> {
    return tx.membershipRole.findUnique({
      where: { membershipId_roleId: { membershipId, roleId } },
      select: { membershipId: true },
    });
  }

  async findRoleForDelete(
    tx: PrismaTx,
    organizationId: string,
    roleId: string,
  ): Promise<{ id: string; key: string; _count: { memberships: number } } | null> {
    const role = await tx.role.findFirst({
      where: { id: roleId, organizationId },
      select: { id: true, key: true, _count: { select: { memberships: true } } },
    });

    return role as unknown as { id: string; key: string; _count: { memberships: number } } | null;
  }

  async findActiveAdminMemberships(
    tx: PrismaTx,
    organizationId: string,
  ): Promise<{ id: string }[]> {
    return tx.membership.findMany({
      where: {
        organizationId,
        status: "active",
        roles: {
          some: {
            role: { key: "tenant.admin" },
          },
        },
      },
      select: { id: true },
    });
  }

  async findRoleById(
    tx: PrismaTx,
    organizationId: string,
    roleId: string,
  ): Promise<{ id: string; key: string; name: string } | null> {
    return tx.role.findFirst({
      where: { id: roleId, organizationId },
      select: { id: true, key: true, name: true },
    });
  }

  async findRoleByKey(
    tx: PrismaTx,
    organizationId: string,
    key: string,
  ): Promise<{ id: string } | null> {
    return tx.role.findUnique({
      where: { organizationId_key: { organizationId, key } },
      select: { id: true },
    });
  }

  // Write methods (with tx)

  async upsertUser(
    tx: PrismaTx,
    email: string,
    name: string,
  ): Promise<{ id: string; email: string }> {
    return tx.user.upsert({
      where: { email },
      update: { name },
      create: {
        id: `admin_user_${crypto.randomUUID()}`,
        email,
        emailVerified: false,
        name,
      },
      select: { id: true, email: true },
    });
  }

  async upsertMembership(
    tx: PrismaTx,
    organizationId: string,
    userId: string,
  ): Promise<{ id: string }> {
    return tx.membership.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      update: { status: "invited" },
      create: { organizationId, userId, status: "invited" },
      select: { id: true },
    });
  }

  async upsertMembershipRole(tx: PrismaTx, membershipId: string, roleId: string): Promise<void> {
    await tx.membershipRole.upsert({
      where: { membershipId_roleId: { membershipId, roleId } },
      update: {},
      create: { membershipId, roleId },
    });
  }

  async createRole(
    tx: PrismaTx,
    organizationId: string,
    key: string,
    name: string,
    description: string | null,
  ): Promise<{ id: string }> {
    return tx.role.create({
      data: { organizationId, key, name, description },
      select: { id: true },
    });
  }

  async upsertRolePermission(tx: PrismaTx, roleId: string, permissionId: string): Promise<void> {
    await tx.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  }

  async deleteRole(tx: PrismaTx, roleId: string): Promise<void> {
    await tx.role.update({
      where: { id: roleId },
      data: { deletedAt: new Date() },
    });
  }

  async deleteMembershipRoleByMembershipAndRole(
    tx: PrismaTx,
    membershipId: string,
    roleId: string,
  ): Promise<void> {
    await tx.membershipRole.delete({
      where: { membershipId_roleId: { membershipId, roleId } },
    });
  }

  async deleteMembershipRoleByMembership(tx: PrismaTx, membershipId: string): Promise<void> {
    await tx.membershipRole.deleteMany({ where: { membershipId } });
  }

  async updateMembershipStatus(
    tx: PrismaTx,
    membershipId: string,
    status: string,
  ): Promise<{ id: string }> {
    return tx.membership.update({
      where: { id: membershipId },
      data: { status } as never,
      select: { id: true },
    });
  }

  async deleteRolePermissions(tx: PrismaTx, roleId: string): Promise<void> {
    await tx.rolePermission.deleteMany({ where: { roleId } });
  }

  async createRolePermission(tx: PrismaTx, roleId: string, permissionId: string): Promise<void> {
    await tx.rolePermission.create({ data: { roleId, permissionId } });
  }

  async createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void> {
    await tx.auditRecord.create({ data: input as never });
  }

  async createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void> {
    await tx.outboxEvent.create({ data: input as never });
  }
}
