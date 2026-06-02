import type {
  ActorType as TelemetryActorType,
  AuditRecord as TelemetryAuditRecord,
  TraceContext,
} from "@saptm/observability";

export const databaseActorTypes = [
  "anonymous",
  "user",
  "service_account",
  "integration",
  "platform",
  "ai_agent",
] as const;
export const auditSeverities = ["low", "medium", "high", "critical"] as const;
export const prismaMutationOperations = [
  "create",
  "update",
  "upsert",
  "delete",
  "deleteMany",
  "updateMany",
] as const;

export type DatabaseActorType = (typeof databaseActorTypes)[number];
export type AuditSeverity = (typeof auditSeverities)[number];
export type PrismaMutationOperation = (typeof prismaMutationOperations)[number];
export type AuditJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue };

export type PersistableAuditRecord = {
  organizationId?: string;
  actorType: DatabaseActorType;
  actorId?: string;
  action: string;
  subjectType: string;
  subjectId?: string;
  severity: AuditSeverity;
  before?: AuditJsonValue;
  after?: AuditJsonValue;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId: string;
  createdAt?: Date;
};

export type CreateAuditRecordInput = {
  organizationId?: string;
  actorType: DatabaseActorType;
  actorId?: string;
  action: string;
  subjectType: string;
  subjectId?: string;
  severity?: AuditSeverity;
  before?: AuditJsonValue;
  after?: AuditJsonValue;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId: string;
  createdAt?: Date;
};

export type CreateAuditRecordFromTelemetryInput = {
  record: TelemetryAuditRecord;
  severity?: AuditSeverity;
  subjectType?: string;
  subjectId?: string;
  before?: AuditJsonValue;
  after?: AuditJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export type PrismaMutationAuditInput = {
  traceContext: TraceContext;
  model: string;
  operation: PrismaMutationOperation;
  recordId?: string;
  action?: string;
  severity?: AuditSeverity;
  before?: AuditJsonValue;
  after?: AuditJsonValue;
  reason?: string;
};

export type AuditRecordCreateDelegate = {
  create: (args: { data: PersistableAuditRecord }) => Promise<unknown>;
};

export type AuditTrailClient = {
  auditRecord: AuditRecordCreateDelegate;
};

export type AuditTrailWriter = {
  write: (input: CreateAuditRecordInput) => Promise<unknown>;
  recordMutation: (input: PrismaMutationAuditInput) => Promise<unknown>;
};

export function telemetryActorTypeToDatabaseActorType(
  actorType: TelemetryActorType | undefined,
): DatabaseActorType {
  if (actorType === "user") {
    return "user";
  }

  if (actorType === "service") {
    return "service_account";
  }

  if (actorType === "integration") {
    return "integration";
  }

  if (actorType === "ai-agent") {
    return "ai_agent";
  }

  if (actorType === "system") {
    return "platform";
  }

  return "anonymous";
}

export function createPersistableAuditRecord(
  input: CreateAuditRecordInput,
): PersistableAuditRecord {
  return {
    actorType: input.actorType,
    action: input.action,
    subjectType: input.subjectType,
    severity: input.severity ?? "medium",
    correlationId: input.correlationId,
    ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId }),
    ...(input.before === undefined ? {} : { before: input.before }),
    ...(input.after === undefined ? {} : { after: input.after }),
    ...(input.reason === undefined ? {} : { reason: input.reason }),
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
    ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
  };
}

export function createAuditRecordFromTelemetry(
  input: CreateAuditRecordFromTelemetryInput,
): PersistableAuditRecord {
  const { record } = input;
  const subjectId = input.subjectId ?? record.resourceId;

  return createPersistableAuditRecord({
    actorType: telemetryActorTypeToDatabaseActorType(record.context.actorType),
    action: record.action,
    subjectType: input.subjectType ?? record.resourceType,
    severity: input.severity ?? "medium",
    correlationId: record.context.correlationId,
    createdAt: new Date(record.timestamp),
    ...(record.context.tenantId === undefined ? {} : { organizationId: record.context.tenantId }),
    ...(record.context.actorId === undefined ? {} : { actorId: record.context.actorId }),
    ...(subjectId === undefined ? {} : { subjectId }),
    ...(input.before === undefined ? {} : { before: input.before }),
    ...(input.after === undefined ? {} : { after: input.after }),
    ...(record.reason === undefined ? {} : { reason: record.reason }),
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  });
}

export function createPrismaMutationAuditRecord(
  input: PrismaMutationAuditInput,
): PersistableAuditRecord {
  return createPersistableAuditRecord({
    actorType: telemetryActorTypeToDatabaseActorType(input.traceContext.actorType),
    action: input.action ?? `db.${input.model}.${input.operation}`,
    subjectType: input.model,
    severity: input.severity ?? "medium",
    correlationId: input.traceContext.correlationId,
    ...(input.traceContext.tenantId === undefined
      ? {}
      : { organizationId: input.traceContext.tenantId }),
    ...(input.traceContext.actorId === undefined ? {} : { actorId: input.traceContext.actorId }),
    ...(input.recordId === undefined ? {} : { subjectId: input.recordId }),
    ...(input.before === undefined ? {} : { before: input.before }),
    ...(input.after === undefined ? {} : { after: input.after }),
    ...(input.reason === undefined ? {} : { reason: input.reason }),
  });
}

export function isPrismaMutationOperation(operation: string): operation is PrismaMutationOperation {
  return prismaMutationOperations.includes(operation as PrismaMutationOperation);
}

export function createAuditTrailWriter(client: AuditTrailClient): AuditTrailWriter {
  return {
    write: (input) =>
      client.auditRecord.create({
        data: createPersistableAuditRecord(input),
      }),
    recordMutation: (input) =>
      client.auditRecord.create({
        data: createPrismaMutationAuditRecord(input),
      }),
  };
}
