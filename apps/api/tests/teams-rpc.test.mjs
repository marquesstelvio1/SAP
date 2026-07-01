import assert from "node:assert/strict";
import { test } from "node:test";

import { ForbiddenException } from "@nestjs/common";
import { createRouterClient } from "@orpc/server";

import { createTeamsRpcRouter } from "../dist/teams/teams-rpc.router.js";

test("teams create RPC authorizes mutation and delegates to service", async () => {
  const calls = [];
  const router = createTeamsRpcRouter({
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
            permissions: ["tenant.manage"],
            correlationId: "corr_team_create",
            traceContext: {
              correlationId: "corr_team_create",
              requestId: "req_team_create",
              operationName: "team.create",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    teamsService: {
      async createTeam(input) {
        return {
          teamId: "team_001",
          team: {
            id: "team_001",
            name: input.name,
            description: input.description ?? null,
            slug: input.slug,
            organizationId: input.organizationId,
            memberCount: 0,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "team.created", subjectType: "team", subjectId: "team_001" },
          outbox: { eventType: "team.created", aggregateType: "team", aggregateId: "team_001" },
        };
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by create test");
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by create test");
      },
      async listTeams() {
        throw new Error("listTeams should not be called by create test");
      },
      async getTeam() {
        throw new Error("getTeam should not be called by create test");
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by create test");
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by create test");
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by create test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_team_create",
        },
      },
    },
  });

  const result = await client.teams.create({
    name: "Operations Team",
    slug: "operations-team",
    idempotencyKey: "team_create_001",
  });

  assert.equal(result.teamId, "team_001");
  assert.equal(result.team.name, "Operations Team");
  assert.equal(result.audit.action, "team.created");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "team.create");
});

test("teams update RPC authorizes mutation and delegates to service", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_team_update",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by update test");
      },
      async updateTeam(input) {
        return {
          teamId: input.teamId,
          team: {
            id: input.teamId,
            name: input.name ?? "Operations Team",
            description: null,
            slug: "operations-team",
            organizationId: input.organizationId,
            memberCount: 3,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-02T00:00:00.000Z",
          },
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "team.updated", subjectType: "team", subjectId: input.teamId },
          outbox: { eventType: "team.updated", aggregateType: "team", aggregateId: input.teamId },
        };
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by update test");
      },
      async listTeams() {
        throw new Error("listTeams should not be called by update test");
      },
      async getTeam() {
        throw new Error("getTeam should not be called by update test");
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by update test");
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by update test");
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by update test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.teams.update({
    teamId: "team_001",
    name: "Operations Team Updated",
    idempotencyKey: "team_update_001",
  });

  assert.equal(result.team.name, "Operations Team Updated");
  assert.equal(result.audit.action, "team.updated");
});

test("teams list RPC returns paginated teams", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_team_list",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by list test");
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by list test");
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by list test");
      },
      async listTeams(input) {
        return {
          teams: [
            {
              id: "team_001",
              name: "Operations Team",
              description: null,
              slug: "operations-team",
              organizationId: input.organizationId,
              memberCount: 5,
              createdAt: "2026-06-01T00:00:00.000Z",
              updatedAt: "2026-06-01T00:00:00.000Z",
            },
          ],
          pagination: {
            totalCount: 1,
            limit: input.limit,
            offset: input.offset,
          },
        };
      },
      async getTeam() {
        throw new Error("getTeam should not be called by list test");
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by list test");
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by list test");
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by list test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.teams.list({ limit: 10 });

  assert.equal(result.teams.length, 1);
  assert.equal(result.teams[0].name, "Operations Team");
  assert.equal(result.pagination.totalCount, 1);
});

test("teams get RPC returns team detail with members", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_team_get",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by get test");
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by get test");
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by get test");
      },
      async listTeams() {
        throw new Error("listTeams should not be called by get test");
      },
      async getTeam(input) {
        return {
          team: {
            id: input.teamId,
            name: "Operations Team",
            description: "Detailed description",
            slug: "operations-team",
            organizationId: input.organizationId,
            memberCount: 2,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
            members: [
              { id: "mem_001", userId: "user_001", name: "John", email: "john@saptm.local", role: "admin" },
              { id: "mem_002", userId: "user_002", name: "Jane", email: "jane@saptm.local", role: "member" },
            ],
          },
        };
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by get test");
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by get test");
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by get test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.teams.get({ teamId: "team_001" });

  assert.equal(result.team.members.length, 2);
  assert.equal(result.team.members[0].role, "admin");
});

test("teams add member RPC authorizes mutation", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_team_add_member",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by addMember test");
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by addMember test");
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by addMember test");
      },
      async listTeams() {
        throw new Error("listTeams should not be called by addMember test");
      },
      async getTeam() {
        throw new Error("getTeam should not be called by addMember test");
      },
      async addTeamMember(input) {
        return {
          teamId: input.teamId,
          member: { id: "mem_003", userId: input.userId, name: "New Member", email: "new@saptm.local", role: input.role ?? "member" },
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "team.member.added", subjectType: "team_member", subjectId: "mem_003" },
          outbox: { eventType: "team.member.added", aggregateType: "team", aggregateId: input.teamId },
        };
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by addMember test");
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by addMember test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.teams.addMember({
    teamId: "team_001",
    userId: "user_003",
    role: "member",
    idempotencyKey: "team_add_member_001",
  });

  assert.equal(result.member.role, "member");
  assert.equal(result.audit.action, "team.member.added");
});

test("teams remove member RPC authorizes mutation", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_team_remove_member",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by removeMember test");
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by removeMember test");
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by removeMember test");
      },
      async listTeams() {
        throw new Error("listTeams should not be called by removeMember test");
      },
      async getTeam() {
        throw new Error("getTeam should not be called by removeMember test");
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by removeMember test");
      },
      async removeTeamMember(input) {
        return {
          teamId: input.teamId,
          userId: input.userId,
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "team.member.removed", subjectType: "team_member", subjectId: input.userId },
          outbox: { eventType: "team.member.removed", aggregateType: "team", aggregateId: input.teamId },
        };
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by removeMember test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.teams.removeMember({
    teamId: "team_001",
    userId: "user_003",
    idempotencyKey: "team_remove_member_001",
  });

  assert.equal(result.userId, "user_003");
  assert.equal(result.audit.action, "team.member.removed");
});

test("teams update member role RPC authorizes mutation", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_team_update_role",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by updateRole test");
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by updateRole test");
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by updateRole test");
      },
      async listTeams() {
        throw new Error("listTeams should not be called by updateRole test");
      },
      async getTeam() {
        throw new Error("getTeam should not be called by updateRole test");
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by updateRole test");
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by updateRole test");
      },
      async updateTeamMemberRole(input) {
        return {
          teamId: input.teamId,
          member: { id: "mem_001", userId: input.userId, name: "John", email: "john@saptm.local", role: input.role },
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "team.member.role.updated", subjectType: "team_member", subjectId: "mem_001" },
          outbox: { eventType: "team.member.role.updated", aggregateType: "team", aggregateId: input.teamId },
        };
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.teams.updateMemberRole({
    teamId: "team_001",
    userId: "user_001",
    role: "admin",
    idempotencyKey: "team_update_role_001",
  });

  assert.equal(result.member.role, "admin");
  assert.equal(result.audit.action, "team.member.role.updated");
});

test("teams delete RPC authorizes mutation", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_team_delete",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by delete test");
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by delete test");
      },
      async deleteTeam(input) {
        return {
          teamId: input.teamId,
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "team.deleted", subjectType: "team", subjectId: input.teamId },
          outbox: { eventType: "team.deleted", aggregateType: "team", aggregateId: input.teamId },
        };
      },
      async listTeams() {
        throw new Error("listTeams should not be called by delete test");
      },
      async getTeam() {
        throw new Error("getTeam should not be called by delete test");
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by delete test");
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by delete test");
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by delete test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.teams.delete({
    teamId: "team_001",
    idempotencyKey: "team_delete_001",
  });

  assert.equal(result.audit.action, "team.deleted");
});

test("teams RPC denies request without organization", async () => {
  const router = createTeamsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_no_org",
            userId: "user_no_org",
            permissions: [],
            correlationId: "corr_no_org",
          },
        };
      },
    },
    teamsService: {
      async createTeam() {
        throw new Error("createTeam should not be called by no-org test");
      },
      async updateTeam() {
        throw new Error("updateTeam should not be called by no-org test");
      },
      async deleteTeam() {
        throw new Error("deleteTeam should not be called by no-org test");
      },
      async listTeams() {
        throw new Error("listTeams should not be called by no-org test");
      },
      async getTeam() {
        throw new Error("getTeam should not be called by no-org test");
      },
      async addTeamMember() {
        throw new Error("addTeamMember should not be called by no-org test");
      },
      async removeTeamMember() {
        throw new Error("removeTeamMember should not be called by no-org test");
      },
      async updateTeamMemberRole() {
        throw new Error("updateTeamMemberRole should not be called by no-org test");
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

  await assert.rejects(() => client.teams.list({ limit: 10 }), ForbiddenException);
});
