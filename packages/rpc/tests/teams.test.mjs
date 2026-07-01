import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createTeamInputSchema,
  createTeamMetadata,
  createTeamOutputSchema,
  updateTeamInputSchema,
  updateTeamMetadata,
  updateTeamOutputSchema,
  deleteTeamInputSchema,
  deleteTeamMetadata,
  deleteTeamOutputSchema,
  listTeamsInputSchema,
  listTeamsMetadata,
  listTeamsOutputSchema,
  getTeamInputSchema,
  getTeamMetadata,
  getTeamOutputSchema,
  addTeamMemberInputSchema,
  addTeamMemberMetadata,
  addTeamMemberOutputSchema,
  removeTeamMemberInputSchema,
  removeTeamMemberMetadata,
  removeTeamMemberOutputSchema,
  updateTeamMemberRoleInputSchema,
  updateTeamMemberRoleMetadata,
  updateTeamMemberRoleOutputSchema,
  teamSummarySchema,
  teamDetailSchema,
  teamMemberSchema,
  teamRoles,
} from "../dist/index.js";

test("create team metadata requires sensitive idempotent mutation", () => {
  assert.equal(createTeamMetadata.name, "team.create");
  assert.equal(createTeamMetadata.kind, "mutation");
  assert.equal(createTeamMetadata.auth, "session");
  assert.equal(createTeamMetadata.organizationRequired, true);
  assert.deepEqual(createTeamMetadata.permissions, ["tenant.manage"]);
  assert.equal(createTeamMetadata.audit, "sensitive");
  assert.equal(createTeamMetadata.idempotency, "required");
  assert.equal(createTeamMetadata.observability.criticality, "medium");
});

test("create team input schema validates team creation", () => {
  assert.throws(() =>
    createTeamInputSchema.parse({
      name: "A",
      slug: "team-slug",
      idempotencyKey: "idem_team_create_001",
    }),
  );

  assert.throws(() =>
    createTeamInputSchema.parse({
      name: "Operations Team",
      slug: "-invalid-slug",
      idempotencyKey: "idem_team_create_001",
    }),
  );

  const input = createTeamInputSchema.parse({
    name: "Operations Team",
    description: "Equipa de operacoes portuarias",
    slug: "operations-team",
    idempotencyKey: "idem_team_create_001",
  });

  assert.equal(input.name, "Operations Team");
  assert.equal(input.slug, "operations-team");
  assert.equal(input.description, "Equipa de operacoes portuarias");
  assert.equal(input.sourceSystem, "saptm");
});

test("create team output validates idempotency and audit contract", () => {
  const output = createTeamOutputSchema.parse({
    teamId: "team_001",
    team: {
      id: "team_001",
      name: "Operations Team",
      description: "Equipa de operacoes portuarias",
      slug: "operations-team",
      organizationId: "org_rail_port",
      memberCount: 0,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
    idempotency: { key: "idem_team_create_001", replayed: false },
    audit: { action: "team.created", subjectType: "team", subjectId: "team_001" },
    outbox: { eventType: "team.created", aggregateType: "team", aggregateId: "team_001" },
  });

  assert.equal(output.teamId, "team_001");
  assert.equal(output.team.name, "Operations Team");
  assert.equal(output.audit.action, "team.created");
});

test("update team metadata requires sensitive idempotent mutation", () => {
  assert.equal(updateTeamMetadata.name, "team.update");
  assert.equal(updateTeamMetadata.kind, "mutation");
  assert.equal(updateTeamMetadata.auth, "session");
  assert.equal(updateTeamMetadata.organizationRequired, true);
  assert.deepEqual(updateTeamMetadata.permissions, ["tenant.manage"]);
  assert.equal(updateTeamMetadata.audit, "sensitive");
  assert.equal(updateTeamMetadata.idempotency, "required");
});

test("update team input schema validates team update", () => {
  const input = updateTeamInputSchema.parse({
    teamId: "team_001",
    name: "Operations Team Updated",
    idempotencyKey: "idem_team_update_001",
  });

  assert.equal(input.teamId, "team_001");
  assert.equal(input.name, "Operations Team Updated");

  // description is optional
  assert.equal(input.description, undefined);
});

test("update team output schema", () => {
  const output = updateTeamOutputSchema.parse({
    teamId: "team_001",
    team: {
      id: "team_001",
      name: "Operations Team Updated",
      description: null,
      slug: "operations-team",
      organizationId: "org_rail_port",
      memberCount: 3,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    },
    idempotency: { key: "idem_team_update_001", replayed: false },
    audit: { action: "team.updated", subjectType: "team", subjectId: "team_001" },
    outbox: { eventType: "team.updated", aggregateType: "team", aggregateId: "team_001" },
  });

  assert.equal(output.team.memberCount, 3);
});

test("delete team metadata requires sensitive idempotent mutation", () => {
  assert.equal(deleteTeamMetadata.name, "team.delete");
  assert.equal(deleteTeamMetadata.kind, "mutation");
  assert.equal(deleteTeamMetadata.auth, "session");
  assert.equal(deleteTeamMetadata.idempotency, "required");
  assert.equal(deleteTeamMetadata.audit, "sensitive");
});

test("delete team input schema validates", () => {
  const input = deleteTeamInputSchema.parse({
    teamId: "team_001",
    idempotencyKey: "idem_team_delete_001",
  });

  assert.equal(input.teamId, "team_001");
  assert.equal(input.sourceSystem, "saptm");
});

test("delete team output schema", () => {
  const output = deleteTeamOutputSchema.parse({
    teamId: "team_001",
    idempotency: { key: "idem_team_delete_001", replayed: false },
    audit: { action: "team.deleted", subjectType: "team", subjectId: "team_001" },
    outbox: { eventType: "team.deleted", aggregateType: "team", aggregateId: "team_001" },
  });

  assert.equal(output.audit.action, "team.deleted");
});

test("list teams metadata requires session query", () => {
  assert.equal(listTeamsMetadata.name, "team.list");
  assert.equal(listTeamsMetadata.kind, "query");
  assert.equal(listTeamsMetadata.auth, "session");
  assert.equal(listTeamsMetadata.organizationRequired, true);
  assert.equal(listTeamsMetadata.audit, "standard");
  assert.equal(listTeamsMetadata.idempotency, "none");
});

test("list teams input schema defaults to paginated result", () => {
  const defaultInput = listTeamsInputSchema.parse(undefined);

  assert.equal(defaultInput.limit, 25);
  assert.equal(defaultInput.offset, 0);

  const customInput = listTeamsInputSchema.parse({ limit: 10 });

  assert.equal(customInput.limit, 10);
  assert.equal(customInput.offset, 0);
});

test("list teams output schema validates paginated response", () => {
  const output = listTeamsOutputSchema.parse({
    teams: [
      {
        id: "team_001",
        name: "Operations Team",
        description: "Equipa de operacoes",
        slug: "operations-team",
        organizationId: "org_rail_port",
        memberCount: 5,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    ],
    pagination: {
      totalCount: 1,
      limit: 25,
      offset: 0,
    },
  });

  assert.equal(output.teams.length, 1);
  assert.equal(output.pagination.totalCount, 1);
});

test("get team metadata requires session query", () => {
  assert.equal(getTeamMetadata.name, "team.get");
  assert.equal(getTeamMetadata.kind, "query");
  assert.equal(getTeamMetadata.audit, "standard");
  assert.equal(getTeamMetadata.idempotency, "none");
});

test("get team input schema validates", () => {
  const input = getTeamInputSchema.parse({ teamId: "team_001" });
  assert.equal(input.teamId, "team_001");
});

test("get team output schema validates team detail with members", () => {
  const output = getTeamOutputSchema.parse({
    team: {
      id: "team_001",
      name: "Operations Team",
      description: "Detailed description",
      slug: "operations-team",
      organizationId: "org_rail_port",
      memberCount: 2,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      members: [
        { id: "mem_001", userId: "user_001", name: "John", email: "john@saptm.local", role: "admin" },
        { id: "mem_002", userId: "user_002", name: "Jane", email: "jane@saptm.local", role: "member" },
      ],
    },
  });

  assert.equal(output.team.members.length, 2);
  assert.equal(output.team.members[0].role, "admin");
});

test("team member schema validates member data", () => {
  const member = teamMemberSchema.parse({
    id: "mem_001",
    userId: "user_001",
    name: "John Doe",
    email: "john@saptm.local",
    role: "viewer",
  });

  assert.equal(member.role, "viewer");
});

test("team summary schema validates summary structure", () => {
  const summary = teamSummarySchema.parse({
    id: "team_001",
    name: "Operations",
    description: "Description text",
    slug: "operations",
    organizationId: "org_rail_port",
    memberCount: 3,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(summary.memberCount, 3);
});

test("team detail schema extends summary with members", () => {
  const detail = teamDetailSchema.parse({
    id: "team_001",
    name: "Operations",
    description: null,
    slug: "operations",
    organizationId: "org_rail_port",
    memberCount: 1,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    members: [
      { id: "mem_001", userId: "user_001", name: "Admin", email: "admin@saptm.local", role: "admin" },
    ],
  });

  assert.equal(detail.members[0].role, "admin");
});

test("add team member metadata requires sensitive idempotent mutation", () => {
  assert.equal(addTeamMemberMetadata.name, "team.member.add");
  assert.equal(addTeamMemberMetadata.kind, "mutation");
  assert.equal(addTeamMemberMetadata.auth, "session");
  assert.equal(addTeamMemberMetadata.organizationRequired, true);
  assert.equal(addTeamMemberMetadata.audit, "sensitive");
  assert.equal(addTeamMemberMetadata.idempotency, "required");
});

test("add team member input schema validates", () => {
  const input = addTeamMemberInputSchema.parse({
    teamId: "team_001",
    userId: "user_003",
    role: "member",
    idempotencyKey: "idem_team_add_member_001",
  });

  assert.equal(input.teamId, "team_001");
  assert.equal(input.role, "member");
  assert.equal(input.sourceSystem, "saptm");
});

test("add team member output validates idempotency contract", () => {
  const output = addTeamMemberOutputSchema.parse({
    teamId: "team_001",
    member: { id: "mem_003", userId: "user_003", name: "New Member", email: "new@saptm.local", role: "member" },
    idempotency: { key: "idem_team_add_member_001", replayed: false },
    audit: { action: "team.member.added", subjectType: "team_member", subjectId: "mem_003" },
    outbox: { eventType: "team.member.added", aggregateType: "team", aggregateId: "team_001" },
  });

  assert.equal(output.member.role, "member");
  assert.equal(output.audit.action, "team.member.added");
});

test("remove team member metadata requires sensitive idempotent mutation", () => {
  assert.equal(removeTeamMemberMetadata.name, "team.member.remove");
  assert.equal(removeTeamMemberMetadata.kind, "mutation");
  assert.equal(removeTeamMemberMetadata.audit, "sensitive");
  assert.equal(removeTeamMemberMetadata.idempotency, "required");
});

test("remove team member input schema validates", () => {
  const input = removeTeamMemberInputSchema.parse({
    teamId: "team_001",
    userId: "user_003",
    idempotencyKey: "idem_team_remove_member_001",
  });

  assert.equal(input.teamId, "team_001");
  assert.equal(input.userId, "user_003");
});

test("remove team member output schema", () => {
  const output = removeTeamMemberOutputSchema.parse({
    teamId: "team_001",
    userId: "user_003",
    idempotency: { key: "idem_team_remove_member_001", replayed: false },
    audit: { action: "team.member.removed", subjectType: "team_member", subjectId: "user_003" },
    outbox: { eventType: "team.member.removed", aggregateType: "team", aggregateId: "team_001" },
  });

  assert.equal(output.userId, "user_003");
});

test("update team member role metadata", () => {
  assert.equal(updateTeamMemberRoleMetadata.name, "team.member.role.update");
  assert.equal(updateTeamMemberRoleMetadata.kind, "mutation");
  assert.equal(updateTeamMemberRoleMetadata.audit, "sensitive");
  assert.equal(updateTeamMemberRoleMetadata.idempotency, "required");
});

test("update team member role input schema validates", () => {
  const input = updateTeamMemberRoleInputSchema.parse({
    teamId: "team_001",
    userId: "user_001",
    role: "admin",
    idempotencyKey: "idem_team_update_role_001",
  });

  assert.equal(input.role, "admin");
  assert.equal(input.sourceSystem, "saptm");
});

test("update team member role output schema", () => {
  const output = updateTeamMemberRoleOutputSchema.parse({
    teamId: "team_001",
    member: { id: "mem_001", userId: "user_001", name: "John", email: "john@saptm.local", role: "admin" },
    idempotency: { key: "idem_team_update_role_001", replayed: false },
    audit: { action: "team.member.role.updated", subjectType: "team_member", subjectId: "mem_001" },
    outbox: { eventType: "team.member.role.updated", aggregateType: "team", aggregateId: "team_001" },
  });

  assert.equal(output.member.role, "admin");
});

test("team roles are correctly defined", () => {
  assert.deepEqual(teamRoles, ["admin", "member", "viewer"]);
});
