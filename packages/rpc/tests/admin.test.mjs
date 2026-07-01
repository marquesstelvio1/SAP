import assert from "node:assert/strict";
import { test } from "node:test";

import {
  adminInvitationCancelInputSchema,
  adminInvitationCancelMetadata,
  adminInvitationDeliverySchema,
  adminInvitationLifecycleOutputSchema,
  adminInvitationResendInputSchema,
  adminInvitationResendMetadata,
  adminMembershipStatusUpdateInputSchema,
  adminMembershipStatusUpdateMetadata,
  adminMembershipStatusUpdateOutputSchema,
  adminOverviewInputSchema,
  adminOverviewMetadata,
  adminOverviewOutputSchema,
  adminRoleAssignInputSchema,
  adminRoleAssignMetadata,
  adminRoleAssignOutputSchema,
  adminRoleCreateInputSchema,
  adminRoleCreateMetadata,
  adminRoleDeleteInputSchema,
  adminRoleDeleteMetadata,
  adminRoleDeleteOutputSchema,
  adminRoleMutationOutputSchema,
  adminRolePermissionsUpdateInputSchema,
  adminRolePermissionsUpdateMetadata,
  adminRoleRevokeInputSchema,
  adminRoleRevokeMetadata,
  adminRoleRevokeOutputSchema,
  adminUserInviteInputSchema,
  adminUserInviteMetadata,
  adminUserInviteOutputSchema,
} from "../dist/index.js";

test("admin overview metadata accepts any tenant identity admin permission", () => {
  assert.equal(adminOverviewMetadata.name, "admin.identity.overview.read");
  assert.equal(adminOverviewMetadata.kind, "query");
  assert.equal(adminOverviewMetadata.auth, "session");
  assert.equal(adminOverviewMetadata.permissionMode, "any");
  assert.equal(adminOverviewMetadata.organizationRequired, true);
  assert.deepEqual(adminOverviewMetadata.permissions, [
    "tenant.manage",
    "identity.user.invite",
    "identity.role.assign",
  ]);
  assert.equal(adminOverviewMetadata.audit, "sensitive");
  assert.equal(adminOverviewMetadata.observability.criticality, "high");
});

test("admin overview schema validates tenant identity governance snapshot", () => {
  assert.deepEqual(adminOverviewInputSchema.parse(undefined), { limit: 25, offset: 0 });

  const parsed = adminOverviewOutputSchema.parse({
    generatedAt: "2026-06-05T00:00:00.000Z",
    organization: {
      id: "org_rail_port",
      name: "Rail Port Tenant",
      slug: "rail-port",
      status: "active",
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
    },
    totals: {
      users: 1,
      activeMemberships: 1,
      invitedMemberships: 0,
      roles: 1,
      permissions: 2,
    },
    users: [
      {
        id: "user_001",
        name: "Tenant Admin",
        email: "admin@saptm.local",
        emailVerified: true,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        membership: {
          id: "membership_001",
          status: "active",
          createdAt: "2026-06-05T00:00:00.000Z",
          updatedAt: "2026-06-05T00:00:00.000Z",
          roles: [{ id: "role_admin", key: "tenant.admin", name: "Tenant Administrator" }],
        },
      },
    ],
    roles: [
      {
        id: "role_admin",
        key: "tenant.admin",
        name: "Tenant Administrator",
        description: "Full access",
        protected: true,
        permissionCount: 2,
        membershipCount: 1,
        permissions: ["tenant.manage", "identity.role.assign"],
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
      },
    ],
    permissions: [
      {
        id: "permission_role_assign",
        key: "identity.role.assign",
        description: "Assign roles",
        roleCount: 1,
      },
    ],
    pagination: {
      totalCount: 1,
      limit: 25,
      offset: 0,
    },
    securityModel: {
      authProvider: "better-auth",
      authorizationModel: "tenant-scoped-rbac",
      requiredPermissions: ["tenant.manage", "identity.user.invite", "identity.role.assign"],
      enforcedBy: "orpc-metadata-rpc-context",
    },
  });

  assert.equal(parsed.organization.slug, "rail-port");
});

test("admin custom role contracts require protected tenant governance", () => {
  assert.equal(adminRoleCreateMetadata.name, "admin.role.create");
  assert.deepEqual(adminRoleCreateMetadata.permissions, ["tenant.manage", "identity.role.assign"]);
  assert.equal(adminRoleCreateMetadata.permissionMode, "all");
  assert.equal(adminRoleCreateMetadata.idempotency, "required");

  assert.equal(adminRolePermissionsUpdateMetadata.name, "admin.role.permissions.update");
  assert.equal(adminRoleDeleteMetadata.name, "admin.role.delete");

  const createdInput = adminRoleCreateInputSchema.parse({
    key: "tenant.custom.yard_supervisor",
    name: "Yard Supervisor",
    description: "Custom yard role for terminal supervisors.",
    permissionKeys: ["cargo.read", "tracking.shipment.read"],
    idempotencyKey: "admin_role_create_001",
  });

  assert.equal(createdInput.sourceSystem, "saptm");
  assert.throws(() =>
    adminRoleCreateInputSchema.parse({
      key: "Tenant Bad",
      name: "Invalid",
      permissionKeys: ["cargo.read"],
      idempotencyKey: "admin_role_create_002",
    }),
  );

  const updatedInput = adminRolePermissionsUpdateInputSchema.parse({
    roleId: "role_custom",
    permissionKeys: ["cargo.read", "capacity.read"],
    idempotencyKey: "admin_role_update_001",
  });

  assert.equal(updatedInput.permissionKeys.length, 2);

  const output = adminRoleMutationOutputSchema.parse({
    organizationId: "org_rail_port",
    roleId: "role_custom",
    role: {
      id: "role_custom",
      key: "tenant.custom.yard_supervisor",
      name: "Yard Supervisor",
      description: "Custom yard role for terminal supervisors.",
      protected: false,
      permissionCount: 2,
      membershipCount: 0,
      permissions: ["cargo.read", "tracking.shipment.read"],
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
    },
    idempotency: {
      key: "admin_role_create_001",
      replayed: false,
    },
    audit: {
      action: "identity.role.created",
      subjectType: "role",
      subjectId: "role_custom",
    },
    outbox: {
      eventType: "identity.role.created",
      aggregateType: "identity.role",
      aggregateId: "role_custom",
    },
  });

  assert.equal(output.role.protected, false);
});

test("admin role revoke and delete contracts validate auditable outputs", () => {
  assert.equal(adminRoleRevokeMetadata.name, "admin.role.revoke");
  assert.deepEqual(adminRoleRevokeMetadata.permissions, ["identity.role.assign"]);

  const revokeInput = adminRoleRevokeInputSchema.parse({
    membershipId: "membership_001",
    roleId: "role_ops",
    idempotencyKey: "admin_revoke_001",
  });

  assert.equal(revokeInput.sourceSystem, "saptm");

  const revokeOutput = adminRoleRevokeOutputSchema.parse({
    organizationId: "org_rail_port",
    membershipId: "membership_001",
    roleId: "role_ops",
    revokedRole: {
      id: "role_ops",
      key: "tenant.operations_viewer",
      name: "Operations Viewer",
    },
    user: {
      id: "user_001",
      name: "Port Rail Operator",
      email: "operator@saptm.local",
      emailVerified: false,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      membership: {
        id: "membership_001",
        status: "active",
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        roles: [],
      },
    },
    idempotency: {
      key: "admin_revoke_001",
      replayed: false,
    },
    audit: {
      action: "identity.role.revoked",
      subjectType: "membership",
      subjectId: "membership_001",
    },
    outbox: {
      eventType: "identity.role.revoked",
      aggregateType: "identity.membership",
      aggregateId: "membership_001",
    },
  });

  assert.equal(revokeOutput.revokedRole.key, "tenant.operations_viewer");

  assert.equal(adminRoleDeleteMetadata.name, "admin.role.delete");
  const deleteInput = adminRoleDeleteInputSchema.parse({
    roleId: "role_custom",
    idempotencyKey: "admin_role_delete_001",
  });
  const deleteOutput = adminRoleDeleteOutputSchema.parse({
    organizationId: "org_rail_port",
    roleId: deleteInput.roleId,
    roleKey: "tenant.custom.yard_supervisor",
    idempotency: {
      key: deleteInput.idempotencyKey,
      replayed: false,
    },
    audit: {
      action: "identity.role.deleted",
      subjectType: "role",
      subjectId: deleteInput.roleId,
    },
    outbox: {
      eventType: "identity.role.deleted",
      aggregateType: "identity.role",
      aggregateId: deleteInput.roleId,
    },
  });

  assert.equal(deleteOutput.roleKey, "tenant.custom.yard_supervisor");
});

test("admin membership and invitation lifecycle contracts are governed", () => {
  assert.equal(adminMembershipStatusUpdateMetadata.name, "admin.membership.status.update");
  assert.deepEqual(adminMembershipStatusUpdateMetadata.permissions, [
    "identity.user.invite",
    "identity.role.assign",
  ]);
  assert.equal(adminMembershipStatusUpdateMetadata.permissionMode, "all");

  const statusInput = adminMembershipStatusUpdateInputSchema.parse({
    membershipId: "membership_001",
    status: "suspended",
    reason: "Operational access hold.",
    idempotencyKey: "admin_member_status_001",
  });

  assert.equal(statusInput.sourceSystem, "saptm");

  const statusOutput = adminMembershipStatusUpdateOutputSchema.parse({
    organizationId: "org_rail_port",
    membershipId: "membership_001",
    status: "suspended",
    user: {
      id: "user_001",
      name: "Port Rail Operator",
      email: "operator@saptm.local",
      emailVerified: false,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      membership: {
        id: "membership_001",
        status: "suspended",
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        roles: [],
      },
    },
    idempotency: {
      key: statusInput.idempotencyKey,
      replayed: false,
    },
    audit: {
      action: "identity.membership.status.updated",
      subjectType: "membership",
      subjectId: "membership_001",
    },
    outbox: {
      eventType: "identity.membership.status.updated",
      aggregateType: "identity.membership",
      aggregateId: "membership_001",
    },
  });

  assert.equal(statusOutput.status, "suspended");

  assert.equal(adminInvitationResendMetadata.name, "admin.invitation.resend");
  assert.equal(adminInvitationCancelMetadata.name, "admin.invitation.cancel");

  const resendInput = adminInvitationResendInputSchema.parse({
    membershipId: "membership_invited",
    idempotencyKey: "admin_invite_resend_001",
  });
  const cancelInput = adminInvitationCancelInputSchema.parse({
    membershipId: "membership_invited",
    reason: "Invite sent to wrong team.",
    idempotencyKey: "admin_invite_cancel_001",
  });
  const invitationOutput = adminInvitationLifecycleOutputSchema.parse({
    organizationId: "org_rail_port",
    membershipId: resendInput.membershipId,
    user: {
      id: "user_invited",
      name: "Invited User",
      email: "invited@saptm.local",
      emailVerified: false,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      membership: {
        id: cancelInput.membershipId,
        status: "invited",
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        roles: [],
      },
    },
    idempotency: {
      key: resendInput.idempotencyKey,
      replayed: false,
    },
    audit: {
      action: "identity.invitation.resent",
      subjectType: "membership",
      subjectId: resendInput.membershipId,
    },
    outbox: {
      eventType: "identity.invitation.resent",
      aggregateType: "identity.membership",
      aggregateId: resendInput.membershipId,
    },
  });

  assert.equal(invitationOutput.user.email, "invited@saptm.local");
});

test("admin user invite contract requires idempotent identity command", () => {
  assert.equal(adminUserInviteMetadata.name, "admin.user.invite");
  assert.equal(adminUserInviteMetadata.kind, "mutation");
  assert.deepEqual(adminUserInviteMetadata.permissions, ["identity.user.invite"]);
  assert.equal(adminUserInviteMetadata.audit, "critical");
  assert.equal(adminUserInviteMetadata.idempotency, "required");

  const input = adminUserInviteInputSchema.parse({
    email: "OPERATOR@SAPTM.LOCAL",
    name: "Port Rail Operator",
    roleKeys: ["tenant.operations_viewer"],
    idempotencyKey: "admin_invite_001",
  });

  assert.equal(input.email, "operator@saptm.local");
  assert.equal(input.sourceSystem, "saptm");
});

test("admin role assignment contract validates audit and outbox output", () => {
  assert.equal(adminRoleAssignMetadata.name, "admin.role.assign");
  assert.equal(adminRoleAssignMetadata.kind, "mutation");
  assert.deepEqual(adminRoleAssignMetadata.permissions, ["identity.role.assign"]);
  assert.equal(adminRoleAssignMetadata.audit, "critical");
  assert.equal(adminRoleAssignMetadata.idempotency, "required");

  const input = adminRoleAssignInputSchema.parse({
    membershipId: "membership_001",
    roleId: "role_ops",
    idempotencyKey: "admin_assign_001",
  });

  assert.equal(input.sourceSystem, "saptm");

  const output = adminRoleAssignOutputSchema.parse({
    organizationId: "org_rail_port",
    membershipId: "membership_001",
    roleId: "role_ops",
    user: {
      id: "user_001",
      name: "Port Rail Operator",
      email: "operator@saptm.local",
      emailVerified: false,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      membership: {
        id: "membership_001",
        status: "invited",
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        roles: [{ id: "role_ops", key: "tenant.operations_viewer", name: "Operations Viewer" }],
      },
    },
    assignedRole: {
      id: "role_ops",
      key: "tenant.operations_viewer",
      name: "Operations Viewer",
    },
    idempotency: {
      key: "admin_assign_001",
      replayed: false,
    },
    audit: {
      action: "identity.role.assigned",
      subjectType: "membership",
      subjectId: "membership_001",
    },
    outbox: {
      eventType: "identity.role.assigned",
      aggregateType: "identity.membership",
      aggregateId: "membership_001",
    },
  });

  assert.equal(output.assignedRole.key, "tenant.operations_viewer");
});

test("admin user invite output validates auditable invitation result", () => {
  const invitation = adminInvitationDeliverySchema.parse({
    acceptUrl: "http://localhost:3000/accept-invitation?token=membership_002.opaque",
    deliveryChannel: "outbox_email",
    expiresAt: "2026-06-07T00:00:00.000Z",
  });

  const output = adminUserInviteOutputSchema.parse({
    organizationId: "org_rail_port",
    userId: "user_002",
    membershipId: "membership_002",
    invitation,
    user: {
      id: "user_002",
      name: "Port Rail Operator",
      email: "operator@saptm.local",
      emailVerified: false,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      membership: {
        id: "membership_002",
        status: "invited",
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        roles: [{ id: "role_ops", key: "tenant.operations_viewer", name: "Operations Viewer" }],
      },
    },
    idempotency: {
      key: "admin_invite_001",
      replayed: false,
    },
    audit: {
      action: "identity.user.invited",
      subjectType: "user",
      subjectId: "user_002",
    },
    outbox: {
      eventType: "identity.user.invited",
      aggregateType: "identity.user",
      aggregateId: "user_002",
    },
  });

  assert.equal(output.user.membership.status, "invited");
  assert.equal(output.invitation?.deliveryChannel, "outbox_email");
});
