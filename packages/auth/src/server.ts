import { getServerEnv, getTrustedOrigins, type ServerEnv } from "@saptm/config";
import { databaseProvider, getPrismaClient } from "@saptm/database";
import type { Auth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";

export type PrismaAuthClient = Parameters<typeof prismaAdapter>[0];
export type SaptmAuth = Auth<BetterAuthOptions>;

export type CreateSaptmAuthOptions = {
  database: PrismaAuthClient;
  env: ServerEnv;
};

export function createSaptmAuthOptions({
  database,
  env,
}: CreateSaptmAuthOptions): BetterAuthOptions {
  return {
    appName: "SAPTM",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: getTrustedOrigins(env),
    database: prismaAdapter(database, {
      provider: databaseProvider,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60,
      },
    },
  };
}

export function createSaptmAuth(options: CreateSaptmAuthOptions): SaptmAuth {
  return betterAuth(createSaptmAuthOptions(options));
}

export function createSaptmAuthFromEnv(): SaptmAuth {
  return createSaptmAuth({
    database: getPrismaClient(),
    env: getServerEnv(),
  });
}
