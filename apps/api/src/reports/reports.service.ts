import { Inject, Injectable, Optional } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type { ReportExportDomain, ReportExportFormat, ReportExportOutput } from "@saptm/rpc";

import { REPORTS_REPOSITORY, type ReportsRepository } from "./domain/reports.repository.js";

export type ExportOperationalReportInput = {
  organizationId: string;
  domain: ReportExportDomain;
  format: ReportExportFormat;
  limit: number;
  actorId: string;
  actorType: DatabaseActorType;
  correlationId: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

type ReportRow = {
  primaryId: string;
  reference: string;
  status: string;
};

@Injectable()
export class ReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: ReportsRepository,
    @Optional()
    private readonly database?: SaptmPrismaClient,
  ) {}

  private getDatabase(): SaptmPrismaClient {
    return this.database ?? getPrismaClient();
  }

  async exportOperationalReport(input: ExportOperationalReportInput): Promise<ReportExportOutput> {
    const generatedAt = new Date();
    const domainConfig = this.getDomainConfig(input.domain);
    const records = await domainConfig.query(input.organizationId, input.limit);
    const sections: ReportExportOutput["sections"] = [
      { name: domainConfig.sectionName, rowCount: records.length },
    ];
    const csvRows = records.map((record) =>
      [domainConfig.sectionName, record.primaryId, record.reference, record.status].join(","),
    );
    const content = ["section,primaryId,reference,status", ...csvRows].join("\n");
    const subjectId = `report_${input.domain}_${generatedAt.getTime()}`;

    await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      await this.reportsRepository.createAuditRecord(tx, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "report.exported",
        subjectType: "report.export",
        subjectId,
        severity: "medium",
        after: { domain: input.domain } as Record<string, unknown>,
        correlationId: input.correlationId,
        ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
        ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
      });

      await this.reportsRepository.createOutboxEvent(tx, {
        organizationId: input.organizationId,
        eventType: "report.exported",
        aggregateType: "report.export",
        aggregateId: subjectId,
        payload: { domain: input.domain, rowCount: records.length },
      });
    });

    return {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      domain: input.domain,
      format: "csv",
      filename: `saptm-report-${input.domain}-${generatedAt.toISOString().replace(/[:.]/g, "")}.csv`,
      contentType: "text/csv; charset=utf-8",
      rowCount: records.length,
      sections,
      content,
      audit: {
        action: "report.exported",
        subjectType: "report.export",
        subjectId,
      },
      outbox: {
        eventType: "report.exported",
        aggregateType: "report.export",
        aggregateId: subjectId,
      },
    };
  }

  private getDomainConfig(domain: ReportExportDomain): {
    sectionName: string;
    query: (organizationId: string, limit: number) => Promise<ReportRow[]>;
  } {
    switch (domain) {
      case "cargo":
        return {
          sectionName: "cargo",
          query: async (organizationId, limit) => {
            const rows = await this.reportsRepository.findCargoRows(organizationId, limit);
            return rows.map((row) => ({
              primaryId: row.id,
              reference: row.reference,
              status: row.status,
            }));
          },
        };
      case "tracking":
        return {
          sectionName: "shipments",
          query: async (organizationId, limit) => {
            const rows = await this.reportsRepository.findTrackingShipmentRows(
              organizationId,
              limit,
            );
            return rows.map((row) => ({
              primaryId: row.id,
              reference: row.reference,
              status: row.status,
            }));
          },
        };
      case "capacity":
        return {
          sectionName: "slots",
          query: async (organizationId, limit) => {
            const rows = await this.reportsRepository.findCapacitySlotRows(organizationId, limit);
            return rows.map((row) => ({
              primaryId: row.id,
              reference: row.reference,
              status: row.status,
            }));
          },
        };
      case "planning":
        return {
          sectionName: "orders",
          query: async (organizationId, limit) => {
            const rows = await this.reportsRepository.findTransportOrderRows(organizationId, limit);
            return rows.map((row) => ({
              primaryId: row.id,
              reference: row.reference,
              status: row.status,
            }));
          },
        };
      case "tariff":
        return {
          sectionName: "rate_cards",
          query: async (organizationId, limit) => {
            const rows = await this.reportsRepository.findTariffRateCardRows(organizationId, limit);
            return rows.map((row) => ({
              primaryId: row.id,
              reference: row.reference,
              status: row.status,
            }));
          },
        };
    }
  }
}
