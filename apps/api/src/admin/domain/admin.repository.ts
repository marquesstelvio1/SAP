import type { PrismaTx } from "@saptm/database";

import type {
  MembershipRecord,
  OrganizationRecord,
  PermissionRecord,
  RoleForOutputRecord,
  RoleRecord,
} from "./admin.dto.js";

export const ADMIN_REPOSITORY = Symbol("AdminRepository");

// Prisma input types

export type PrismaAuditRecordCreateInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  severity: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type PrismaOutboxEventCreateInput = {
  organizationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
};

export interface AdminRepository {
  // Overview (read-only, no tx)
  findOrganization(organizationId: string): Promise<OrganizationRecord | null>;
  countMembershipsNotRemoved(organizationId: string): Promise<number>;
  countActiveMemberships(organizationId: string): Promise<number>;
  countInvitedMemberships(organizationId: string): Promise<number>;
  countRoles(organizationId: string): Promise<number>;
  countPermissions(): Promise<number>;
  findMemberships(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<MembershipRecord[]>;
  findRoles(organizationId: string): Promise<RoleRecord[]>;
  findPermissions(): Promise<PermissionRecord[]>;

  // Assertions (with tx)
  assertOrganizationExists(tx: PrismaTx, organizationId: string): Promise<void>;

  // Read methods (with tx)
  findRolesByKeys(
    tx: PrismaTx,
    organizationId: string,
    roleKeys: readonly string[],
  ): Promise<{ id: string; key: string }[]>;
  findPermissionsByKeys(
    tx: PrismaTx,
    permissionKeys: readonly string[],
  ): Promise<{ id: string; key: string }[]>;
  findUserByEmail(tx: PrismaTx, email: string): Promise<{ id: string } | null>;
  findMembershipByUserAndOrg(
    tx: PrismaTx,
    organizationId: string,
    userId: string,
  ): Promise<{ id: string } | null>;
  findTenantRole(
    tx: PrismaTx,
    organizationId: string,
    roleId: string,
  ): Promise<{ id: string; key: string; name: string }>;
  findTenantMembership(
    tx: PrismaTx,
    organizationId: string,
    membershipId: string,
  ): Promise<MembershipRecord>;
  findMembershipForOutput(tx: PrismaTx, membershipId: string): Promise<MembershipRecord>;
  findRoleForOutput(tx: PrismaTx, roleId: string): Promise<RoleForOutputRecord>;
  readRolePermissionKeys(tx: PrismaTx, roleId: string): Promise<string[]>;
  findExistingAssignment(
    tx: PrismaTx,
    membershipId: string,
    roleId: string,
  ): Promise<{ membershipId: string } | null>;
  findRoleForDelete(
    tx: PrismaTx,
    organizationId: string,
    roleId: string,
  ): Promise<{ id: string; key: string; _count: { memberships: number } } | null>;
  findActiveAdminMemberships(tx: PrismaTx, organizationId: string): Promise<{ id: string }[]>;
  findRoleById(
    tx: PrismaTx,
    organizationId: string,
    roleId: string,
  ): Promise<{ id: string; key: string; name: string } | null>;
  findRoleByKey(tx: PrismaTx, organizationId: string, key: string): Promise<{ id: string } | null>;

  // Write methods (with tx)
  upsertUser(tx: PrismaTx, email: string, name: string): Promise<{ id: string; email: string }>;
  upsertMembership(tx: PrismaTx, organizationId: string, userId: string): Promise<{ id: string }>;
  upsertMembershipRole(tx: PrismaTx, membershipId: string, roleId: string): Promise<void>;
  createRole(
    tx: PrismaTx,
    organizationId: string,
    key: string,
    name: string,
    description: string | null,
  ): Promise<{ id: string }>;
  upsertRolePermission(tx: PrismaTx, roleId: string, permissionId: string): Promise<void>;
  deleteRole(tx: PrismaTx, roleId: string): Promise<void>;
  deleteMembershipRoleByMembershipAndRole(
    tx: PrismaTx,
    membershipId: string,
    roleId: string,
  ): Promise<void>;
  deleteMembershipRoleByMembership(tx: PrismaTx, membershipId: string): Promise<void>;
  updateMembershipStatus(
    tx: PrismaTx,
    membershipId: string,
    status: string,
  ): Promise<{ id: string }>;
  deleteRolePermissions(tx: PrismaTx, roleId: string): Promise<void>;
  createRolePermission(tx: PrismaTx, roleId: string, permissionId: string): Promise<void>;

  // Audit + outbox writes
  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;
  createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void>;

  // Transaction support
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}
