import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

export type SaptmPrismaClient = PrismaClient;
export type PrismaTx = PrismaClient;

function getRuntimeEnv() {
  return process.env as Record<string, string | undefined>;
}

export function createPrismaClient() {
  const env = getRuntimeEnv();
  const connectionString = env.DATABASE_URL ?? "";

  const adapter = new PrismaPg({ connectionString });

  const baseClient = new PrismaClient({
    adapter,
    log: env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

  return baseClient;
}

export function getPrismaClient() {
  const globalStore = globalThis as PrismaGlobal;

  if (!globalStore.__saptmPrismaClient) {
    globalStore.__saptmPrismaClient = createPrismaClient();
  }

  return globalStore.__saptmPrismaClient;
}

type PrismaGlobal = typeof globalThis & {
  __saptmPrismaClient?: PrismaClient;
};
