import { z } from "zod";

const commaSeparatedUrlsSchema = z
  .string()
  .optional()
  .transform(
    (value) =>
      value
        ?.split(",")
        .map((entry) => entry.trim())
        .filter(Boolean) ?? [],
  )
  .pipe(z.array(z.string().url()));

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_CORS_ORIGINS: commaSeparatedUrlsSchema,
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  SAPTM_INVITATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(48),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  OTEL_SERVICE_NAME: z.string().default("saptm"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "critical"]).default("info"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@saptm.pt"),
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_FREE: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
});

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type EnvSource = Record<string, string | undefined>;
type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: EnvSource;
  };
};

export function parseServerEnv(source: EnvSource): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === "invalid_type" && i.input === undefined)
      .map((i) => i.path.join("."));
    if (missing.length > 0) {
      throw new Error(
        [
          `Missing environment variables: ${missing.join(", ")}`,
          "Check that your .env file (at the repository root) has these values set.",
          missing.includes("DATABASE_URL") &&
            "→ DATABASE_URL: postgresql://postgres:postgres@localhost:25432/saptm",
          missing.includes("BETTER_AUTH_SECRET") &&
            "→ BETTER_AUTH_SECRET: generate with: openssl rand -hex 32",
          missing.includes("BETTER_AUTH_URL") && "→ BETTER_AUTH_URL: http://localhost:3000",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    throw result.error;
  }
  return result.data;
}

export function parseClientEnv(source: EnvSource): ClientEnv {
  return clientEnvSchema.parse(source);
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv(getRuntimeEnv());
}

export function getClientEnv(): ClientEnv {
  return parseClientEnv({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
}

export function getTrustedOrigins(
  env: Pick<ServerEnv, "API_CORS_ORIGINS" | "BETTER_AUTH_URL" | "NEXT_PUBLIC_APP_URL">,
) {
  return Array.from(
    new Set([env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL, ...env.API_CORS_ORIGINS]),
  );
}

function getRuntimeEnv(): EnvSource {
  return (globalThis as RuntimeGlobal).process?.env ?? {};
}
