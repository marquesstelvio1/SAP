import type { PrismaTx } from "@saptm/database";

export const ORGANIZATIONS_REPOSITORY = Symbol("OrganizationsRepository");

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateOrganizationStatusInput = {
  status: "active" | "suspended" | "archived";
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

export interface OrganizationsRepository {
  findById(organizationId: string): Promise<OrganizationRecord | null>;
  countMembers(organizationId: string): Promise<number>;
  updateStatus(
    organizationId: string,
    input: UpdateOrganizationStatusInput,
  ): Promise<OrganizationRecord>;
  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;
  createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void>;
}
