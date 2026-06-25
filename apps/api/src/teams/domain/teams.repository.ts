import type { PrismaTx } from "@saptm/database";

export const TEAMS_REPOSITORY = Symbol("TeamsRepository");

// ── Record types ──────────────────────────────────────────────

export type TeamRecord = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  orgId: string;
  _count: { members: number };
  createdAt: Date;
  updatedAt: Date;
};

export type TeamWithMembersRecord = TeamRecord & {
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: { id: string; name: string; email: string };
  }>;
};

export type TeamMemberRecord = {
  id: string;
  userId: string;
  teamId: string;
  role: string;
};

export type TeamMemberWithUserRecord = TeamMemberRecord & {
  user: { id: string; name: string; email: string };
};

// ── Input types ───────────────────────────────────────────────

export type CreateTeamData = {
  name: string;
  description: string | null;
  slug: string;
  orgId: string;
};

export type UpdateTeamData = {
  name?: string;
  description?: string | null;
};

export type CreateTeamMemberData = {
  teamId: string;
  userId: string;
  role: string;
};

// ── Repository interface ──────────────────────────────────────

export interface TeamsRepository {
  // Team reads
  findTeamBySlug(orgId: string, slug: string): Promise<{ id: string } | null>;
  findTeamById(orgId: string, teamId: string): Promise<TeamRecord | null>;
  findTeamWithMembers(orgId: string, teamId: string): Promise<TeamWithMembersRecord | null>;
  findTeams(orgId: string, limit: number, offset: number): Promise<TeamRecord[]>;
  countTeams(orgId: string): Promise<number>;

  // User reads
  findUserById(userId: string): Promise<{ id: string } | null>;

  // TeamMember reads
  findTeamMember(teamId: string, userId: string): Promise<TeamMemberRecord | null>;
  findTeamMemberWithUser(teamId: string, userId: string): Promise<TeamMemberWithUserRecord | null>;

  // Team writes
  createTeam(data: CreateTeamData): Promise<TeamRecord>;
  updateTeam(teamId: string, data: UpdateTeamData): Promise<TeamRecord>;
  deleteTeam(teamId: string): Promise<void>;

  // TeamMember writes
  createTeamMember(data: CreateTeamMemberData): Promise<TeamMemberWithUserRecord>;
  updateTeamMember(memberId: string, role: string): Promise<TeamMemberWithUserRecord>;
  deleteTeamMember(memberId: string): Promise<void>;

  // Transaction helper
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}
