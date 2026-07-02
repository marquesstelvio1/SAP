import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseActorType, PrismaTx } from "@saptm/database";
import {
  type AuditExportInput,
  type AuditExportOutput,
  type AuditSearchInput,
  type AuditSearchOutput,
  auditSeverities,
} from "@saptm/rpc";

import { writeExportAuditAndOutbox } from "./domain/audit.audit-trail.js";
import {
  createAuditRequestMetadata,
  formatCsv,
  formatFilenameTimestamp,
  mapAuditRecord,
} from "./domain/audit.dto.js";
import {
  AUDIT_REPOSITORY,
  type AuditRepository,
  type AuditWhereInput,
} from "./domain/audit.repository.js";

export type SearchAuditRecordsInput = AuditSearchInput & {
  organizationId: string;
  generatedAt?: Date;
};

export type ExportAuditRecordsInput = AuditExportInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  requestCorrelationId: string;
  generatedAt?: Date;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: AuditRepository,
  ) {}

  async searchRecords(input: SearchAuditRecordsInput): Promise<AuditSearchOutput> {
    const limit = input.limit ?? 25;
    const generatedAt = input.generatedAt ?? new Date();
    const where = createAuditWhere(input);

    const [records, recordCount, severityCounts] = await Promise.all([
      this.auditRepository.searchRecords(where, limit),
      this.auditRepository.countRecords(where),
      Promise.all(
        auditSeverities.map((severity) => this.auditRepository.countBySeverity(where, severity)),
      ),
    ]);
    const [lowCount, mediumCount, highCount, criticalCount] = severityCounts;

    return {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      filters: createAuditFilters(input, limit),
      totals: {
        records: recordCount,
        low: lowCount ?? 0,
        medium: mediumCount ?? 0,
        high: highCount ?? 0,
        critical: criticalCount ?? 0,
      },
      records: records.map(mapAuditRecord),
    };
  }

  async exportRecords(input: ExportAuditRecordsInput): Promise<AuditExportOutput> {
    const generatedAt = input.generatedAt ?? new Date();
    const limit = input.limit ?? 100;
    const searchResult = await this.searchRecords({
      ...createAuditSearchInput(input, limit),
      organizationId: input.organizationId,
      generatedAt,
    });
    const exportId = `audit_export_${crypto.randomUUID()}`;
    const content = formatCsv(searchResult.records);
    const filters = createAuditFilters(input, limit);

    await this.auditRepository.transaction(async (tx: PrismaTx) => {
      await writeExportAuditAndOutbox(
        this.auditRepository,
        tx,
        {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          correlationId: input.requestCorrelationId,
          subjectId: exportId,
          after: {
            exportId,
            filters,
            format: input.format,
            rowCount: searchResult.records.length,
          },
          ...createAuditRequestMetadata(input),
        },
        {
          organizationId: input.organizationId,
          aggregateId: exportId,
          payload: {
            exportId,
            filters,
            format: input.format,
            rowCount: searchResult.records.length,
            sourceSystem: "saptm",
          },
        },
      );
    });

    return {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      format: "csv",
      filename: `saptm-audit-${formatFilenameTimestamp(generatedAt)}.csv`,
      contentType: "text/csv; charset=utf-8",
      rowCount: searchResult.records.length,
      content,
      audit: {
        action: "audit.records.exported",
        subjectType: "audit.export",
        subjectId: exportId,
      },
      outbox: {
        eventType: "audit.records.exported",
        aggregateType: "audit.export",
        aggregateId: exportId,
      },
    };
  }
}

function createAuditWhere(input: SearchAuditRecordsInput): AuditWhereInput {
  const where: AuditWhereInput = {
    organizationId: input.organizationId,
  };

  if (input.action !== undefined) {
    where.action = {
      contains: input.action,
      mode: "insensitive",
    };
  }

  if (input.actorId !== undefined) {
    where.actorId = {
      contains: input.actorId,
      mode: "insensitive",
    };
  }

  if (input.actorType !== undefined) {
    where.actorType = input.actorType;
  }

  if (input.correlationId !== undefined) {
    where.correlationId = {
      contains: input.correlationId,
      mode: "insensitive",
    };
  }

  if (input.severity !== undefined) {
    where.severity = input.severity;
  }

  if (input.subjectId !== undefined) {
    where.subjectId = {
      contains: input.subjectId,
      mode: "insensitive",
    };
  }

  if (input.subjectType !== undefined) {
    where.subjectType = {
      contains: input.subjectType,
      mode: "insensitive",
    };
  }

  if (input.createdFrom !== undefined || input.createdTo !== undefined) {
    where.createdAt = {
      ...(input.createdFrom === undefined ? {} : { gte: new Date(input.createdFrom) }),
      ...(input.createdTo === undefined ? {} : { lte: new Date(input.createdTo) }),
    };
  }

  return where;
}

function createAuditFilters(
  input: AuditSearchInput | AuditExportInput,
  limit: number,
): AuditSearchOutput["filters"] {
  return {
    limit,
    ...(input.action === undefined ? {} : { action: input.action }),
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    ...(input.actorType === undefined ? {} : { actorType: input.actorType }),
    ...(input.correlationId === undefined ? {} : { correlationId: input.correlationId }),
    ...(input.createdFrom === undefined ? {} : { createdFrom: input.createdFrom }),
    ...(input.createdTo === undefined ? {} : { createdTo: input.createdTo }),
    ...(input.severity === undefined ? {} : { severity: input.severity }),
    ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId }),
    ...(input.subjectType === undefined ? {} : { subjectType: input.subjectType }),
  };
}

function createAuditSearchInput(input: AuditExportInput, limit: number): AuditSearchInput {
  return {
    ...(input.action === undefined ? {} : { action: input.action }),
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    ...(input.actorType === undefined ? {} : { actorType: input.actorType }),
    ...(input.correlationId === undefined ? {} : { correlationId: input.correlationId }),
    ...(input.createdFrom === undefined ? {} : { createdFrom: input.createdFrom }),
    ...(input.createdTo === undefined ? {} : { createdTo: input.createdTo }),
    limit,
    ...(input.severity === undefined ? {} : { severity: input.severity }),
    ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId }),
    ...(input.subjectType === undefined ? {} : { subjectType: input.subjectType }),
  };
}
