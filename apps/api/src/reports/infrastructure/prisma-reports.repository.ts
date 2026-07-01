import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import type { ReportRowRaw } from "../domain/reports.dto.js";
import type {
  PrismaAuditRecordCreateInput,
  PrismaOutboxEventCreateInput,
  ReportsRepository,
} from "../domain/reports.repository.js";

@Injectable()
export class PrismaReportsRepository implements ReportsRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async findCargoRows(organizationId: string, limit: number): Promise<ReportRowRaw[]> {
    const rows = await this.database.cargo.findMany({
      where: { organizationId },
      take: limit,
      select: { id: true, cargoReference: true, status: true },
    });

    return rows.map((row: { id: string; cargoReference: string; status: string }) => ({
      id: row.id,
      reference: row.cargoReference,
      status: row.status,
    }));
  }

  async findTrackingShipmentRows(organizationId: string, limit: number): Promise<ReportRowRaw[]> {
    const rows = await this.database.trackingShipment.findMany({
      where: { organizationId },
      take: limit,
      select: { id: true, referenceCode: true, status: true },
    });

    return rows.map((row: { id: string; referenceCode: string; status: string }) => ({
      id: row.id,
      reference: row.referenceCode,
      status: row.status,
    }));
  }

  async findCapacitySlotRows(organizationId: string, limit: number): Promise<ReportRowRaw[]> {
    const rows = await this.database.capacitySlot.findMany({
      where: { organizationId },
      take: limit,
      select: { id: true, slotReference: true, status: true },
    });

    return rows.map((row: { id: string; slotReference: string; status: string }) => ({
      id: row.id,
      reference: row.slotReference,
      status: row.status,
    }));
  }

  async findTransportOrderRows(organizationId: string, limit: number): Promise<ReportRowRaw[]> {
    const rows = await this.database.transportOrder.findMany({
      where: { organizationId },
      take: limit,
      select: { id: true, orderReference: true, status: true },
    });

    return rows.map((row: { id: string; orderReference: string; status: string }) => ({
      id: row.id,
      reference: row.orderReference,
      status: row.status,
    }));
  }

  async findTariffRateCardRows(organizationId: string, limit: number): Promise<ReportRowRaw[]> {
    const rows = await this.database.tariffRateCard.findMany({
      where: { organizationId },
      take: limit,
      select: { id: true, rateCardCode: true, status: true },
    });

    return rows.map((row: { id: string; rateCardCode: string; status: string }) => ({
      id: row.id,
      reference: row.rateCardCode,
      status: row.status,
    }));
  }

  async createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void> {
    await tx.auditRecord.create({ data: input as never });
  }

  async createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void> {
    await tx.outboxEvent.create({ data: input as never });
  }
}
