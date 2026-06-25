import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
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
};

export type UpdateTeamServiceInput = UpdateTeamInput & {
  organizationId: string;
};

export type DeleteTeamServiceInput = DeleteTeamInput & {
  organizationId: string;
};

export type ListTeamsServiceInput = ListTeamsInput & {
  organizationId: string;
};

export type GetTeamServiceInput = GetTeamInput & {
  organizationId: string;
};

export type AddTeamMemberServiceInput = AddTeamMemberInput & {
  organizationId: string;
};

export type RemoveTeamMemberServiceInput = RemoveTeamMemberInput & {
  organizationId: string;
};

export type UpdateTeamMemberRoleServiceInput = UpdateTeamMemberRoleInput & {
  organizationId: string;
};

@Injectable()
export class TeamsService {
  constructor(
    @Inject(TEAMS_REPOSITORY)
    private readonly teamsRepo: TeamsRepository,
  ) {}

  async createTeam(input: CreateTeamServiceInput): Promise<CreateTeamOutput> {
    const existing = await this.teamsRepo.findTeamBySlug(input.organizationId, input.slug);

    if (existing !== null) {
      throw new BadRequestException("teams.slug_already_exists");
    }

    const team = await this.teamsRepo.createTeam({
      name: input.name,
      description: input.description ?? null,
      slug: input.slug,
      orgId: input.organizationId,
    });

    return {
      teamId: team.id,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        slug: team.slug,
        orgId: team.orgId,
        memberCount: team._count.members,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      },
      idempotency: { key: input.idempotencyKey, replayed: false },
    };
  }

  async updateTeam(input: UpdateTeamServiceInput): Promise<UpdateTeamOutput> {
    const team = await this.teamsRepo.findTeamById(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    const updated = await this.teamsRepo.updateTeam(input.teamId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
    });

    return {
      teamId: updated.id,
      team: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        slug: updated.slug,
        orgId: updated.orgId,
        memberCount: updated._count.members,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      idempotency: { key: input.idempotencyKey, replayed: false },
    };
  }

  async deleteTeam(input: DeleteTeamServiceInput): Promise<DeleteTeamOutput> {
    const team = await this.teamsRepo.findTeamById(input.organizationId, input.teamId);

    if (team === null) {
      throw new NotFoundException("teams.team_not_found");
    }

    await this.teamsRepo.deleteTeam(input.teamId);

    return {
      teamId: input.teamId,
      idempotency: { key: input.idempotencyKey, replayed: false },
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
        orgId: team.orgId,
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
        orgId: team.orgId,
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

    const member = await this.teamsRepo.createTeamMember({
      teamId: input.teamId,
      userId: input.userId,
      role: input.role,
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

    await this.teamsRepo.deleteTeamMember(member.id);

    return {
      teamId: input.teamId,
      userId: input.userId,
      idempotency: { key: input.idempotencyKey, replayed: false },
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

    const updated = await this.teamsRepo.updateTeamMember(member.id, input.role);

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
    };
  }
}
