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
  REDIS_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  SAPTM_INVITATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(48),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  OTEL_SERVICE_NAME: z.string().default("saptm"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "critical"]).default("info"),
});

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
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
  return serverEnvSchema.parse(source);
}

export function parseClientEnv(source: EnvSource): ClientEnv {
  return clientEnvSchema.parse(source);
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv(getRuntimeEnv());
}

export function getClientEnv(): ClientEnv {
  return parseClientEnv(getRuntimeEnv());
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
