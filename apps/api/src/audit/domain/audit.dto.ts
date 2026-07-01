import type { AuditSearchOutput } from "@saptm/rpc";

export type AuditRecordRaw = {
  id: string;
  organizationId: string | null;
  actorType: string;
  actorId: string | null;
  action: string;
  subjectType: string;
  subjectId: string | null;
  severity: string;
  before: unknown | null;
  after: unknown | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string;
  createdAt: Date;
};

export function mapAuditRecord(record: AuditRecordRaw): AuditSearchOutput["records"][number] {
  return {
    id: record.id,
    organizationId: record.organizationId,
    actorType: record.actorType as AuditSearchOutput["records"][number]["actorType"],
    actorId: record.actorId,
    action: record.action,
    subjectType: record.subjectType,
    subjectId: record.subjectId,
    severity: record.severity as AuditSearchOutput["records"][number]["severity"],
    before: record.before,
    after: record.after,
    reason: record.reason,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    correlationId: record.correlationId,
    createdAt: record.createdAt.toISOString(),
  };
}

export function formatCsv(records: readonly AuditSearchOutput["records"][number][]): string {
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

export function formatFilenameTimestamp(date: Date): string {
  return date
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function createAuditRequestMetadata(input: {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}): {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
