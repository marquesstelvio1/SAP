import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import type { AuditRecordRaw } from "../domain/audit.dto.js";
import type {
  AuditRepository,
  AuditWhereInput,
  PrismaAuditRecordCreateInput,
  PrismaOutboxEventCreateInput,
} from "../domain/audit.repository.js";

@Injectable()
export class PrismaAuditRepository implements AuditRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async searchRecords(where: AuditWhereInput, limit: number): Promise<AuditRecordRaw[]> {
    const records = await this.database.auditRecord.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return records as unknown as AuditRecordRaw[];
  }

  async countRecords(where: AuditWhereInput): Promise<number> {
    return this.database.auditRecord.count({ where: where as never });
  }

  async countBySeverity(where: AuditWhereInput, severity: string): Promise<number> {
    return this.database.auditRecord.count({
      where: { ...where, severity } as never,
    });
  }

  async createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void> {
    await tx.auditRecord.create({ data: input as never });
  }

  async createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void> {
    await tx.outboxEvent.create({ data: input as never });
  }

  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.database.$transaction(fn);
  }
}
