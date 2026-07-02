export const databaseActorTypes = [
  "anonymous",
  "user",
  "service_account",
  "integration",
  "platform",
  "ai_agent",
] as const;
export const auditSeverities = ["low", "medium", "high", "critical"] as const;

export type DatabaseActorType = (typeof databaseActorTypes)[number];
export type AuditSeverity = (typeof auditSeverities)[number];
export type AuditJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue };
