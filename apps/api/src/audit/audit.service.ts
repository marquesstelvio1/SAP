import { Injectable } from "@nestjs/common";
import { type DatabaseActorType, getPrismaClient, type SaptmPrismaClient } from "@saptm/database";
import {
  type AuditExportInput,
  type AuditExportOutput,
  type AuditSearchInput,
  type AuditSearchOutput,
  auditSeverities,
} from "@saptm/rpc";

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
  ipAddress?: string;
  userAgent?: string;
};

type AuditRecordFindManyArgs = NonNullable<
  Parameters<SaptmPrismaClient["auditRecord"]["findMany"]>[0]
>;
type AuditRecordWhereInput = NonNullable<AuditRecordFindManyArgs["where"]>;
type AuditRecordOrderByInput = AuditRecordFindManyArgs["orderBy"];

type AuditRecord = {
  id: string;
  organizationId: string | null;
  actorType: "anonymous" | "user" | "service_account" | "integration" | "platform" | "ai_agent";
  actorId: string | null;
  action: string;
  subjectType: string;
  subjectId: string | null;
  severity: "low" | "medium" | "high" | "critical";
  before: unknown | null;
  after: unknown | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string;
  createdAt: Date;
};

@Injectable()
export class AuditService {
  constructor(private readonly database: SaptmPrismaClient = getPrismaClient()) {}

  async searchRecords(input: SearchAuditRecordsInput): Promise<AuditSearchOutput> {
    const limit = input.limit ?? 25;
    const generatedAt = input.generatedAt ?? new Date();
    const where = createAuditWhere(input);
    const orderBy: AuditRecordOrderByInput = {
      createdAt: "desc",
    };

    const [records, recordCount, severityCounts] = await Promise.all([
      this.database.auditRecord.findMany({
        where,
        orderBy,
        take: limit,
      }),
      this.database.auditRecord.count({ where }),
      Promise.all(
        auditSeverities.map((severity) =>
          this.database.auditRecord.count({
            where: {
              ...where,
              severity,
            },
          }),
        ),
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
      records: records.map((record) => mapAuditRecord(record as AuditRecord)),
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

    await this.database.$transaction([
      this.database.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "audit.records.exported",
          subjectType: "audit.export",
          subjectId: exportId,
          severity: "high",
          after: {
            exportId,
            filters,
            format: input.format,
            rowCount: searchResult.records.length,
          },
          reason: "Governed audit export.",
          correlationId: input.requestCorrelationId,
          ...createAuditRequestMetadata(input),
        },
      }),
      this.database.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "audit.records.exported",
          aggregateType: "audit.export",
          aggregateId: exportId,
          payload: {
            exportId,
            filters,
            format: input.format,
            rowCount: searchResult.records.length,
            sourceSystem: "saptm",
          },
        },
      }),
    ]);

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

function createAuditWhere(input: SearchAuditRecordsInput): AuditRecordWhereInput {
  const where: AuditRecordWhereInput = {
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

function mapAuditRecord(record: AuditRecord): AuditSearchOutput["records"][number] {
  return {
    id: record.id,
    organizationId: record.organizationId,
    actorType: record.actorType,
    actorId: record.actorId,
    action: record.action,
    subjectType: record.subjectType,
    subjectId: record.subjectId,
    severity: record.severity,
    before: record.before,
    after: record.after,
    reason: record.reason,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    correlationId: record.correlationId,
    createdAt: record.createdAt.toISOString(),
  };
}

function formatCsv(records: readonly AuditSearchOutput["records"][number][]): string {
  const headers = [
    "createdAt",
    "severity",
    "actorType",
    "actorId",
    "action",
    "subjectType",
    "subjectId",
    "correlationId",
    "reason",
    "before",
    "after",
  ];
  const rows = records.map((record) =>
    [
      record.createdAt,
      record.severity,
      record.actorType,
      record.actorId ?? "",
      record.action,
      record.subjectType,
      record.subjectId ?? "",
      record.correlationId,
      record.reason ?? "",
      stringifyJson(record.before),
      stringifyJson(record.after),
    ]
      .map(escapeCsvValue)
      .join(","),
  );

  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value);
}

function escapeCsvValue(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function formatFilenameTimestamp(date: Date): string {
  return date
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function createAuditRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
