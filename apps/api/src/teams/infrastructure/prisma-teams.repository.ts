import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import type {
  CreateTeamData,
  CreateTeamMemberData,
  TeamMemberRecord,
  TeamMemberWithUserRecord,
  TeamRecord,
  TeamsRepository,
  TeamWithMembersRecord,
  UpdateTeamData,
} from "../domain/teams.repository.js";

const teamIncludeCount = {
  _count: { select: { members: true } },
} as const;

const teamMemberIncludeUser = {
  user: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class PrismaTeamsRepository implements TeamsRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  // ── Team reads ──────────────────────────────────────────────

  async findTeamBySlug(orgId: string, slug: string): Promise<{ id: string } | null> {
    return this.database.team.findUnique({
      where: { orgId_slug: { orgId, slug } },
      select: { id: true },
    });
  }

  async findTeamById(orgId: string, teamId: string): Promise<TeamRecord | null> {
    const record = await this.database.team.findFirst({
      where: { id: teamId, orgId },
      include: teamIncludeCount,
    });

    return record as unknown as TeamRecord | null;
  }

  async findTeamWithMembers(orgId: string, teamId: string): Promise<TeamWithMembersRecord | null> {
    const record = await this.database.team.findFirst({
      where: { id: teamId, orgId },
      include: {
        _count: { select: { members: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return record as unknown as TeamWithMembersRecord | null;
  }

  async findTeams(orgId: string, limit: number, offset: number): Promise<TeamRecord[]> {
    const records = await this.database.team.findMany({
      where: { orgId },
      include: teamIncludeCount,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return records as unknown as TeamRecord[];
  }

  async countTeams(orgId: string): Promise<number> {
    return this.database.team.count({ where: { orgId } });
  }

  // ── User reads ──────────────────────────────────────────────

  async findUserById(userId: string): Promise<{ id: string } | null> {
    return this.database.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  }

  // ── TeamMember reads ────────────────────────────────────────

  async findTeamMember(teamId: string, userId: string): Promise<TeamMemberRecord | null> {
    const record = await this.database.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    return record as unknown as TeamMemberRecord | null;
  }

  async findTeamMemberWithUser(
    teamId: string,
    userId: string,
  ): Promise<TeamMemberWithUserRecord | null> {
    const record = await this.database.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: teamMemberIncludeUser,
    });

    return record as unknown as TeamMemberWithUserRecord | null;
  }

  // ── Team writes ─────────────────────────────────────────────

  async createTeam(data: CreateTeamData): Promise<TeamRecord> {
    const record = await this.database.team.create({
      data,
      include: teamIncludeCount,
    });

    return record as unknown as TeamRecord;
  }

  async updateTeam(teamId: string, data: UpdateTeamData): Promise<TeamRecord> {
    const record = await this.database.team.update({
      where: { id: teamId },
      data,
      include: teamIncludeCount,
    });

    return record as unknown as TeamRecord;
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.database.team.delete({ where: { id: teamId } });
  }

  // ── TeamMember writes ───────────────────────────────────────

  async createTeamMember(data: CreateTeamMemberData): Promise<TeamMemberWithUserRecord> {
    const record = await this.database.teamMember.create({
      data,
      include: teamMemberIncludeUser,
    });

    return record as unknown as TeamMemberWithUserRecord;
  }

  async updateTeamMember(memberId: string, role: string): Promise<TeamMemberWithUserRecord> {
    const record = await this.database.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: teamMemberIncludeUser,
    });

    return record as unknown as TeamMemberWithUserRecord;
  }

  async deleteTeamMember(memberId: string): Promise<void> {
    await this.database.teamMember.delete({ where: { id: memberId } });
  }

  // ── Transaction helper ──────────────────────────────────────

  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.database.$transaction(fn);
  }
}
