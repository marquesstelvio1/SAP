import type { PrismaClient } from "../../generated/prisma/client";

export type PrismaTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export type TransactionCallback<T> = (tx: PrismaTransaction) => Promise<T>;

const RETRYABLE_CODES = new Set([
  "40001",
  "40P01",
  "55P03",
  "40003",
  "08006",
  "08003",
  "08001",
  "08004",
  "08007",
  "08000",
  "53000",
  "53100",
  "53200",
  "53300",
  "53400",
  "57014",
  "59P06",
  "57P01",
  "57P02",
  "57P03",
  "58030",
  "40002",
  "25P02",
  "2D000",
  "3F000",
  "0A000",
  "XX000",
]);

const DEFAULT_OPTIONS = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string" && RETRYABLE_CODES.has(code)) {
      return true;
    }
  }

  if (error instanceof Error && error.message?.includes("deadlock")) {
    return true;
  }

  return false;
}

function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = baseDelayMs * 2 ** attempt;
  const jitter = Math.random() * baseDelayMs;
  return Math.min(delay + jitter, maxDelayMs);
}

export async function withTransactionRetry<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options?: Partial<typeof DEFAULT_OPTIONS>,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = calculateBackoff(attempt - 1, opts.baseDelayMs, opts.maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      return await prisma.$transaction(callback);
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}
