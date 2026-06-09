import assert from "node:assert/strict";
import { test } from "node:test";

import { ForbiddenException } from "@nestjs/common";
import { createRouterClient } from "@orpc/server";
import { evaluateAuthorization } from "@saptm/auth";

import { createAdminRpcRouter } from "../dist/admin/admin-rpc.router.js";

test("admin overview RPC authorizes request and delegates by organization", async () => {
  const calls = [];
  const router = createAdminRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["identity.role.assign"],
            correlationId: "corr_admin_overview",
            traceContext: {
              correlationId: "corr_admin_overview",
              requestId: "req_admin_overview",
              operationName: "admin.identity.overview.read",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    adminService: {
      async getOverview(input) {
        return {
          generatedAt: "2026-06-05T00:00:00.000Z",
          organization: {
            id: input.organizationId,
            name: "Rail Port Tenant",
            slug: "rail-port",
            status: "active",
            createdAt: "2026-06-05T00:00:00.000Z",
            updatedAt: "2026-06-05T00:00:00.000Z",
          },
          totals: {
            users: 0,
            activeMemberships: 0,
            invitedMemberships: 0,
            roles: 0,
            permissions: 0,
          },
          users: [],
          roles: [],
          permissions: [],
          securityModel: {
            authProvider: "better-auth",
            authorizationModel: "tenant-scoped-rbac",
            requiredPermissions: ["tenant.manage", "identity.user.invite", "identity.role.assign"],
            enforcedBy: "orpc-metadata-rpc-context",
          },
        };
      },
      async inviteUser() {
        throw new Error("inviteUser should not be called by overview test");
      },
      async assignRole() {
        throw new Error("assignRole should not be called by overview test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_admin_overview",
        },
      },
    },
  });

  const overview = await client.admin.overview({ limit: 5 });

  assert.equal(overview.organization.id, "org_port_rail");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "admin.identity.overview.read");
});

test("admin invite RPC authorizes mutation and delegates auditable input", async () => {
  const invited = [];
  const router = createAdminRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["identity.user.invite"],
            correlationId: "corr_admin_invite",
            traceContext: {
              correlationId: "corr_admin_invite",
              requestId: "req_admin_invite",
              operationName: "admin.user.invite",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    adminService: {
      async getOverview() {
        throw new Error("getOverview should not be called by invite test");
      },
      async assignRole() {
        throw new Error("assignRole should not be called by invite test");
      },
      async inviteUser(input) {
        invited.push(input);

        return {
          organizationId: input.organizationId,
          userId: "user_invited",
          membershipId: "membership_invited",
          user: {
            id: "user_invited",
            name: input.name,
            email: input.email,
            emailVerified: false,
            createdAt: "2026-06-05T00:00:00.000Z",
            updatedAt: "2026-06-05T00:00:00.000Z",
            membership: {
              id: "membership_invited",
              status: "invited",
              createdAt: "2026-06-05T00:00:00.000Z",
              updatedAt: "2026-06-05T00:00:00.000Z",
              roles: [
                {
                  id: "role_viewer",
                  key: input.roleKeys[0],
                  name: "Operations Viewer",
                },
              ],
            },
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "identity.user.invited",
            subjectType: "user",
            subjectId: "user_invited",
          },
          outbox: {
            eventType: "identity.user.invited",
            aggregateType: "identity.user",
            aggregateId: "user_invited",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.admin.inviteUser({
    email: "operator@saptm.local",
    name: "Port Rail Operator",
    roleKeys: ["tenant.operations_viewer"],
    idempotencyKey: "admin_invite_001",
  });

  assert.equal(result.audit.action, "identity.user.invited");
  assert.equal(invited.length, 1);
  assert.equal(invited[0].organizationId, "org_port_rail");
  assert.equal(invited[0].actorId, "user_admin");
  assert.equal(invited[0].ipAddress, "127.0.0.1");
});

test("admin role assignment RPC authorizes mutation and delegates tenant input", async () => {
  const assigned = [];
  const router = createAdminRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["identity.role.assign"],
            correlationId: "corr_admin_assign",
            traceContext: {
              correlationId: "corr_admin_assign",
              requestId: "req_admin_assign",
              operationName: "admin.role.assign",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    adminService: {
      async getOverview() {
        throw new Error("getOverview should not be called by role assignment test");
      },
      async inviteUser() {
        throw new Error("inviteUser should not be called by role assignment test");
      },
      async assignRole(input) {
        assigned.push(input);

        return {
          organizationId: input.organizationId,
          membershipId: input.membershipId,
          roleId: input.roleId,
          user: {
            id: "user_invited",
            name: "Port Rail Operator",
            email: "operator@saptm.local",
            emailVerified: false,
            createdAt: "2026-06-05T00:00:00.000Z",
            updatedAt: "2026-06-05T00:00:00.000Z",
            membership: {
              id: input.membershipId,
              status: "invited",
              createdAt: "2026-06-05T00:00:00.000Z",
              updatedAt: "2026-06-05T00:00:00.000Z",
              roles: [
                {
                  id: input.roleId,
                  key: "tenant.operations_viewer",
                  name: "Operations Viewer",
                },
              ],
            },
          },
          assignedRole: {
            id: input.roleId,
            key: "tenant.operations_viewer",
            name: "Operations Viewer",
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
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
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_admin_assign",
        },
      },
    },
  });

  const result = await client.admin.assignRole({
    membershipId: "membership_invited",
    roleId: "role_viewer",
    idempotencyKey: "admin_assign_001",
  });

  assert.equal(result.audit.action, "identity.role.assigned");
  assert.equal(assigned.length, 1);
  assert.equal(assigned[0].organizationId, "org_port_rail");
  assert.equal(assigned[0].actorId, "user_admin");
});

test("admin custom role RPC authorizes protected role management", async () => {
  const created = [];
  const router = createAdminRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage", "identity.role.assign"],
            correlationId: "corr_admin_role_create",
            traceContext: {
              correlationId: "corr_admin_role_create",
              requestId: "req_admin_role_create",
              operationName: "admin.role.create",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    adminService: {
      async createRole(input) {
        created.push(input);

        return {
          organizationId: input.organizationId,
          roleId: "role_custom_yard",
          role: {
            id: "role_custom_yard",
            key: input.key,
            name: input.name,
            description: input.description,
            protected: false,
            permissionCount: input.permissionKeys.length,
            membershipCount: 0,
            permissions: input.permissionKeys,
            createdAt: "2026-06-05T00:00:00.000Z",
            updatedAt: "2026-06-05T00:00:00.000Z",
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "identity.role.created",
            subjectType: "role",
            subjectId: "role_custom_yard",
          },
          outbox: {
            eventType: "identity.role.created",
            aggregateType: "identity.role",
            aggregateId: "role_custom_yard",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.admin.createRole({
    key: "tenant.custom.yard_supervisor",
    name: "Yard Supervisor",
    description: "Custom yard role for terminal supervisors.",
    permissionKeys: ["cargo.read", "tracking.shipment.read"],
    idempotencyKey: "admin_role_create_001",
  });

  assert.equal(result.role.protected, false);
  assert.equal(created.length, 1);
  assert.equal(created[0].organizationId, "org_port_rail");
  assert.equal(created[0].actorId, "user_admin");
  assert.equal(created[0].ipAddress, "127.0.0.1");
});

test("admin membership lifecycle RPC authorizes status governance", async () => {
  const statusUpdates = [];
  const router = createAdminRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["identity.user.invite", "identity.role.assign"],
            correlationId: "corr_admin_member_status",
            traceContext: {
              correlationId: "corr_admin_member_status",
              requestId: "req_admin_member_status",
              operationName: "admin.membership.status.update",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    adminService: {
      async updateMembershipStatus(input) {
        statusUpdates.push(input);

        return {
          organizationId: input.organizationId,
          membershipId: input.membershipId,
          status: input.status,
          user: {
            id: "user_operator",
            name: "Port Rail Operator",
            email: "operator@saptm.local",
            emailVerified: true,
            createdAt: "2026-06-05T00:00:00.000Z",
            updatedAt: "2026-06-05T00:00:00.000Z",
            membership: {
              id: input.membershipId,
              status: input.status,
              createdAt: "2026-06-05T00:00:00.000Z",
              updatedAt: "2026-06-05T00:00:00.000Z",
              roles: [],
            },
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "identity.membership.status.updated",
            subjectType: "membership",
            subjectId: input.membershipId,
          },
          outbox: {
            eventType: "identity.membership.status.updated",
            aggregateType: "identity.membership",
            aggregateId: input.membershipId,
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
        },
      },
    },
  });

  const result = await client.admin.updateMembershipStatus({
    membershipId: "membership_operator",
    status: "suspended",
    reason: "Temporary operational access hold.",
    idempotencyKey: "admin_member_status_001",
  });

  assert.equal(result.status, "suspended");
  assert.equal(statusUpdates.length, 1);
  assert.equal(statusUpdates[0].organizationId, "org_port_rail");
  assert.equal(statusUpdates[0].userAgent, "node-test");
});

test("admin RPC denies cargo-only user from inviteUser via authorization policy", async () => {
  const requirement = {
    actorTypes: ["user"],
    permissions: ["identity.user.invite"],
    permissionMode: "all",
    organizationRequired: true,
  };

  const cargoOnly = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_cargo_only",
      permissions: ["cargo.read", "cargo.register"],
    },
    requirement,
  );

  assert.equal(cargoOnly.allowed, false);
  assert.ok(cargoOnly.missingPermissions.includes("identity.user.invite"));

  const cargoRegisterOnly = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_cargo_register",
      permissions: ["cargo.register"],
    },
    requirement,
  );

  assert.equal(cargoRegisterOnly.allowed, false);
  assert.ok(cargoRegisterOnly.missingPermissions.includes("identity.user.invite"));
});

test("admin RPC denies cargo-only user from assignRole via authorization policy", async () => {
  const requirement = {
    actorTypes: ["user"],
    permissions: ["identity.role.assign"],
    permissionMode: "all",
    organizationRequired: true,
  };

  const cargoOnly = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_cargo_only",
      permissions: ["cargo.read", "cargo.register"],
    },
    requirement,
  );

  assert.equal(cargoOnly.allowed, false);
  assert.ok(cargoOnly.missingPermissions.includes("identity.role.assign"));
});

test("admin RPC denies user with single permission for admin.role.create requiring both tenant.manage and identity.role.assign", async () => {
  const requirement = {
    actorTypes: ["user"],
    permissions: ["tenant.manage", "identity.role.assign"],
    permissionMode: "all",
    organizationRequired: true,
  };

  const onlyTenantManage = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_tenant_mgr",
      permissions: ["tenant.manage"],
    },
    requirement,
  );

  assert.equal(onlyTenantManage.allowed, false);
  assert.ok(onlyTenantManage.missingPermissions.includes("identity.role.assign"));

  const onlyRoleAssign = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_role_assign",
      permissions: ["identity.role.assign"],
    },
    requirement,
  );

  assert.equal(onlyRoleAssign.allowed, false);
  assert.ok(onlyRoleAssign.missingPermissions.includes("tenant.manage"));
});

test("admin RPC denies suspended member via authorization policy", async () => {
  const requirement = {
    actorTypes: ["user"],
    permissions: ["cargo.read"],
    organizationRequired: true,
  };

  const suspendedNoOrg = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_suspended",
      permissions: [],
    },
    requirement,
  );

  assert.equal(suspendedNoOrg.allowed, false);
  assert.ok(suspendedNoOrg.failedAttributes.includes("organization"));
  assert.ok(suspendedNoOrg.missingPermissions.includes("cargo.read"));
});

test("admin RPC denies suspended member at router level via missing organization", async () => {
  const router = createAdminRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_suspended",
            userId: "user_suspended",
            permissions: [],
            correlationId: "corr_suspended_member",
          },
        };
      },
    },
    adminService: {
      async getOverview() {
        throw new Error("getOverview should not be called by suspended member");
      },
      async inviteUser() {
        throw new Error("inviteUser should not be called by suspended member");
      },
      async assignRole() {
        throw new Error("assignRole should not be called by suspended member");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  await assert.rejects(() => client.admin.overview({ limit: 5 }), ForbiddenException);
});
