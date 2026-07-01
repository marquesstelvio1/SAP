import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  AddTeamMemberInput,
  AddTeamMemberOutput,
  CreateTeamInput,
  CreateTeamOutput,
  DeleteTeamInput,
  DeleteTeamOutput,
  GetTeamInput,
  GetTeamOutput,
  ListTeamsInput,
  ListTeamsOutput,
  RemoveTeamMemberInput,
  RemoveTeamMemberOutput,
  UpdateTeamInput,
  UpdateTeamMemberRoleInput,
  UpdateTeamMemberRoleOutput,
  UpdateTeamOutput,
} from "@saptm/rpc";

import { TEAMS_REPOSITORY, type TeamsRepository } from "./domain/teams.repository.js";

export type CreateTeamServiceInput = CreateTeamInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type UpdateTeamServiceInput = UpdateTeamInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type DeleteTeamServiceInput = DeleteTeamInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type ListTeamsServiceInput = ListTeamsInput & {
  organizationId: string;
};

export type GetTeamServiceInput = GetTeamInput & {
  organizationId: string;
};

export type AddTeamMemberServiceInput = AddTeamMemberInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type RemoveTeamMemberServiceInput = RemoveTeamMemberInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

export type UpdateTeamMemberRoleServiceInput = UpdateTeamMemberRoleInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

@Injectable()
export class TeamsService {
  constructor(
    @Inject(TEAMS_REPOSITORY)
    private readonly teamsRepo: TeamsRepository,
    @Optional()
    private readonly database?: SaptmPrismaClient,
  ) {}

  private getDatabase(): SaptmPrismaClient {
    return this.database ?? getPrismaClient();
  }

  async createTeam(input: CreateTeamServiceInput): Promise<CreateTeamOutput> {
    const existing = await this.teamsRepo.findTeamBySlug(input.organizationId, input.slug);

    if (existing !== null) {
      throw new BadRequestException("teams.slug_already_exists");
    }

    const team = await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      const result = await this.teamsRepo.createTeam({
        name: input.name,
        description: input.description ?? null,
        slug: input.slug,
        organizationId: input.organizationId,
      });

      await this.teamsRepo.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "team.created",
        subjectType: "team",
        subjectId: result.id,
        severity: "medium",
        after: { id: result.id, name: result.name, slug: result.slug },
        reason: `Team "${result.name}" created.`,
        correlationId: input.correlationId,
      });

      await this.teamsRepo.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "team.created",
        aggregateType: "team",
        aggregateId: result.id,
        payload: { teamId: result.id, name: result.name, slug: result.slug },
      });

      return result;
    });

    return {
      teamId: team.id,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        slug: team.slug,
        organizationId: team.organizationId,
        memberCount: team._count.members,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      },
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "team.created",
        subjectType: "team",
        subjectId: team.id,
      },
      outbox: {
        eventType: "team.created",
        aggregateType: "team",
        aggregateId: team.id,
      },
    };
  }

  async updateTeam(input: UpdateTeamServiceInput): Promise<UpdateTeamOutput> {
    const team = await this.teamsRepo.findTeamById(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    const before = { name: team.name, description: team.description };

    const updated = await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      const result = await this.teamsRepo.updateTeam(input.teamId, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      });

      const after = { name: result.name, description: result.description };

      await this.teamsRepo.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "team.updated",
        subjectType: "team",
        subjectId: result.id,
        severity: "medium",
        before,
        after,
        reason: `Team "${result.name}" updated.`,
        correlationId: input.correlationId,
      });

      await this.teamsRepo.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "team.updated",
        aggregateType: "team",
        aggregateId: result.id,
        payload: { teamId: result.id },
      });

      return result;
    });

    return {
      teamId: updated.id,
      team: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        slug: updated.slug,
        organizationId: updated.organizationId,
        memberCount: updated._count.members,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "team.updated",
        subjectType: "team",
        subjectId: updated.id,
      },
      outbox: {
        eventType: "team.updated",
        aggregateType: "team",
        aggregateId: updated.id,
      },
    };
  }

  async deleteTeam(input: DeleteTeamServiceInput): Promise<DeleteTeamOutput> {
    const team = await this.teamsRepo.findTeamById(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      await this.teamsRepo.deleteTeam(input.teamId);

      await this.teamsRepo.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "team.deleted",
        subjectType: "team",
        subjectId: input.teamId,
        severity: "medium",
        before: { name: team.name, slug: team.slug },
        reason: `Team "${team.name}" deleted.`,
        correlationId: input.correlationId,
      });

      await this.teamsRepo.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "team.deleted",
        aggregateType: "team",
        aggregateId: input.teamId,
        payload: { teamId: input.teamId },
      });
    });

    return {
      teamId: input.teamId,
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "team.deleted",
        subjectType: "team",
        subjectId: input.teamId,
      },
      outbox: {
        eventType: "team.deleted",
        aggregateType: "team",
        aggregateId: input.teamId,
      },
    };
  }

  async listTeams(input: ListTeamsServiceInput): Promise<ListTeamsOutput> {
    const limit = input.limit ?? 25;
    const offset = input.offset ?? 0;

    const [teams, totalCount] = await Promise.all([
      this.teamsRepo.findTeams(input.organizationId, limit, offset),
      this.teamsRepo.countTeams(input.organizationId),
    ]);

    return {
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        slug: team.slug,
        organizationId: team.organizationId,
        memberCount: team._count.members,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      })),
      pagination: { totalCount, limit, offset },
    };
  }

  async getTeam(input: GetTeamServiceInput): Promise<GetTeamOutput> {
    const team = await this.teamsRepo.findTeamWithMembers(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    return {
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        slug: team.slug,
        organizationId: team.organizationId,
        memberCount: team._count.members,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
        members: team.members.map((member) => ({
          id: member.id,
          userId: member.userId,
          name: member.user.name,
          email: member.user.email,
          role: member.role as "admin" | "member" | "viewer",
        })),
      },
    };
  }

  async addTeamMember(input: AddTeamMemberServiceInput): Promise<AddTeamMemberOutput> {
    const team = await this.teamsRepo.findTeamById(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    const user = await this.teamsRepo.findUserById(input.userId);

    if (user === null) {
      throw new NotFoundException("teams.user_not_found");
    }

    const existing = await this.teamsRepo.findTeamMember(input.teamId, input.userId);

    if (existing !== null) {
      throw new BadRequestException("teams.member_already_exists");
    }

    const member = await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      const result = await this.teamsRepo.createTeamMember({
        teamId: input.teamId,
        userId: input.userId,
        role: input.role,
      });

      await this.teamsRepo.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "team.member_added",
        subjectType: "team",
        subjectId: input.teamId,
        severity: "medium",
        after: { userId: result.userId, role: result.role },
        reason: `User "${result.user.name}" added to team "${team.name}".`,
        correlationId: input.correlationId,
      });

      await this.teamsRepo.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "team.member_added",
        aggregateType: "team",
        aggregateId: input.teamId,
        payload: { teamId: input.teamId, userId: input.userId, role: input.role },
      });

      return result;
    });

    return {
      teamId: input.teamId,
      member: {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role as "admin" | "member" | "viewer",
      },
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "team.member_added",
        subjectType: "team",
        subjectId: input.teamId,
      },
      outbox: {
        eventType: "team.member_added",
        aggregateType: "team",
        aggregateId: input.teamId,
      },
    };
  }

  async removeTeamMember(input: RemoveTeamMemberServiceInput): Promise<RemoveTeamMemberOutput> {
    const team = await this.teamsRepo.findTeamById(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    const member = await this.teamsRepo.findTeamMember(input.teamId, input.userId);

    if (member === null) {
      throw new NotFoundException("teams.member_not_found");
    }

    await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      await this.teamsRepo.deleteTeamMember(member.id);

      await this.teamsRepo.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "team.member_removed",
        subjectType: "team",
        subjectId: input.teamId,
        severity: "medium",
        before: { userId: member.userId, role: member.role },
        reason: `User removed from team "${team.name}".`,
        correlationId: input.correlationId,
      });

      await this.teamsRepo.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "team.member_removed",
        aggregateType: "team",
        aggregateId: input.teamId,
        payload: { teamId: input.teamId, userId: input.userId },
      });
    });

    return {
      teamId: input.teamId,
      userId: input.userId,
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "team.member_removed",
        subjectType: "team",
        subjectId: input.teamId,
      },
      outbox: {
        eventType: "team.member_removed",
        aggregateType: "team",
        aggregateId: input.teamId,
      },
    };
  }

  async updateTeamMemberRole(
    input: UpdateTeamMemberRoleServiceInput,
  ): Promise<UpdateTeamMemberRoleOutput> {
    const team = await this.teamsRepo.findTeamById(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    const member = await this.teamsRepo.findTeamMemberWithUser(input.teamId, input.userId);

    if (member === null) {
      throw new NotFoundException("teams.member_not_found");
    }

    const beforeRole = member.role;

    const updated = await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      const result = await this.teamsRepo.updateTeamMember(member.id, input.role);

      await this.teamsRepo.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "team.member_role_updated",
        subjectType: "team",
        subjectId: input.teamId,
        severity: "medium",
        before: { userId: member.userId, role: beforeRole },
        after: { userId: result.userId, role: result.role },
        reason: `Role of user "${result.user.name}" changed from "${beforeRole}" to "${result.role}".`,
        correlationId: input.correlationId,
      });

      await this.teamsRepo.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "team.member_role_updated",
        aggregateType: "team",
        aggregateId: input.teamId,
        payload: { teamId: input.teamId, userId: input.userId, role: input.role },
      });

      return result;
    });

    return {
      teamId: input.teamId,
      member: {
        id: updated.id,
        userId: updated.userId,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role as "admin" | "member" | "viewer",
      },
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "team.member_role_updated",
        subjectType: "team",
        subjectId: input.teamId,
      },
      outbox: {
        eventType: "team.member_role_updated",
        aggregateType: "team",
        aggregateId: input.teamId,
      },
    };
  }
}
