import type { PrismaTx } from "@saptm/database";

import type { ReportRowRaw } from "./reports.dto.js";

export const REPORTS_REPOSITORY = Symbol("ReportsRepository");

export type PrismaAuditRecordCreateInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  severity: string;
  after?: Record<string, unknown> | undefined;
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

export interface ReportsRepository {
  findCargoRows(organizationId: string, limit: number): Promise<ReportRowRaw[]>;
  findTrackingShipmentRows(organizationId: string, limit: number): Promise<ReportRowRaw[]>;
  findCapacitySlotRows(organizationId: string, limit: number): Promise<ReportRowRaw[]>;
  findTransportOrderRows(organizationId: string, limit: number): Promise<ReportRowRaw[]>;
  findTariffRateCardRows(organizationId: string, limit: number): Promise<ReportRowRaw[]>;

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;
  createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void>;
}
