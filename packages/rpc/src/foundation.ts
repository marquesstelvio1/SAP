import { z } from "zod";

import { createRpcOperationMetadata } from "./metadata.js";

const runtimeEnvironmentSchema = z.enum(["development", "test", "production"]);

export const foundationRpcHealthOutputSchema = z.object({
  serviceName: z.literal("@saptm/rpc"),
  status: z.literal("ok"),
  checkedAt: z.string().datetime(),
  environment: runtimeEnvironmentSchema,
  contract: z.object({
    name: z.literal("system.health"),
    version: z.literal(1),
    transport: z.literal("orpc"),
  }),
});

export type FoundationRpcHealthOutput = z.infer<typeof foundationRpcHealthOutputSchema>;

type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: {
      NODE_ENV?: string;
    };
  };
};

export const foundationRpcHealthMetadata = createRpcOperationMetadata({
  name: "system.health",
  version: 1,
  kind: "query",
  auth: "public",
  audit: "none",
  criticality: "low",
  signals: ["log", "metric", "span"],
});

export function createFoundationRpcHealthReport(checkedAt = new Date()): FoundationRpcHealthOutput {
  return {
    serviceName: "@saptm/rpc",
    status: "ok",
    checkedAt: checkedAt.toISOString(),
    environment: readRuntimeEnvironment(),
    contract: {
      name: "system.health",
      version: 1,
      transport: "orpc",
    },
  };
}

export const sharedIdempotencyKeySchema = z.string().trim().min(12).max(128);

export const sharedIdempotencyResultSchema = z.object({
  key: z.string(),
  replayed: z.boolean(),
});

export const sharedAuditSchema = z.object({
  action: z.string(),
  subjectType: z.string(),
  subjectId: z.string(),
});

export const sharedOutboxSchema = z.object({
  eventType: z.string(),
  aggregateType: z.string(),
  aggregateId: z.string(),
});

export const sharedAuditOutboxSchema = z.object({
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

export const sharedMutationOutputSchema = z.object({
  idempotency: sharedIdempotencyResultSchema,
  audit: sharedAuditSchema,
  outbox: sharedOutboxSchema,
});

function readRuntimeEnvironment(): FoundationRpcHealthOutput["environment"] {
  const nodeEnv = (globalThis as RuntimeGlobal).process?.env?.NODE_ENV;

  if (nodeEnv === "production" || nodeEnv === "test") {
    return nodeEnv;
  }

  return "development";
}
