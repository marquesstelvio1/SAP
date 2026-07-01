import type { PrismaTx } from "@saptm/database";

export const TEAMS_REPOSITORY = Symbol("TeamsRepository");

// ── Record types ──────────────────────────────────────────────

export type TeamRecord = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  organizationId: string;
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
  organizationId: string;
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

export type PrismaAuditRecordCreateInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  severity: string;
  before?: Record<string, unknown> | undefined;
  after?: Record<string, unknown> | undefined;
  reason: string;
  correlationId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

export type PrismaOutboxEventCreateInput = {
  organizationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
};

// ── Repository interface ──────────────────────────────────────

export interface TeamsRepository {
  // Team reads
  findTeamBySlug(organizationId: string, slug: string): Promise<{ id: string } | null>;
  findTeamById(organizationId: string, teamId: string): Promise<TeamRecord | null>;
  findTeamWithMembers(
    organizationId: string,
    teamId: string,
  ): Promise<TeamWithMembersRecord | null>;
  findTeams(organizationId: string, limit: number, offset: number): Promise<TeamRecord[]>;
  countTeams(organizationId: string): Promise<number>;

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

  // Audit & outbox
  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;
  createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void>;

  // Transaction helper
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}
