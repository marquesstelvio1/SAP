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

function readRuntimeEnvironment(): FoundationRpcHealthOutput["environment"] {
  const nodeEnv = (globalThis as RuntimeGlobal).process?.env?.NODE_ENV;

  if (nodeEnv === "production" || nodeEnv === "test") {
    return nodeEnv;
  }

  return "development";
}
