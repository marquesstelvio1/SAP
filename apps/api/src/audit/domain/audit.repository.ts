import type { PrismaTx } from "@saptm/database";

import type { AuditRecordRaw } from "./audit.dto.js";

export const AUDIT_REPOSITORY = Symbol("AuditRepository");

export type AuditWhereInput = {
  organizationId: string;
  action?: { contains: string; mode: "insensitive" } | undefined;
  actorId?: { contains: string; mode: "insensitive" } | undefined;
  actorType?: string | undefined;
  correlationId?: { contains: string; mode: "insensitive" } | undefined;
  severity?: string | undefined;
  subjectId?: { contains: string; mode: "insensitive" } | undefined;
  subjectType?: { contains: string; mode: "insensitive" } | undefined;
  createdAt?: { gte?: Date; lte?: Date } | undefined;
};

export type PrismaAuditRecordCreateInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  severity: string;
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

export interface AuditRepository {
  searchRecords(where: AuditWhereInput, limit: number): Promise<AuditRecordRaw[]>;

  countRecords(where: AuditWhereInput): Promise<number>;

  countBySeverity(where: AuditWhereInput, severity: string): Promise<number>;

  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;

  createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void>;

  // Transaction support
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}
