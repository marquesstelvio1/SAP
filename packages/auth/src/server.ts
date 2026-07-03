import { getServerEnv, getTrustedOrigins, type ServerEnv } from "@saptm/config";
import { databaseProvider, getPrismaClient } from "@saptm/database";
import { sendPasswordResetEmail, sendVerificationEmail } from "@saptm/email";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins/two-factor";

export {
  getUserOrganizations,
  type ResolvedUserAuthorization,
  resolveDefaultUserAuthorization,
  resolveOrganizationAuthorization,
  verifyUserOrganizationAccess,
} from "./user-authorization.js";

export type PrismaAuthClient = Parameters<typeof prismaAdapter>[0];

export type CreateSaptmAuthOptions = {
  database: PrismaAuthClient;
  env: ServerEnv;
};

export function createSaptmAuthOptions({ database, env }: CreateSaptmAuthOptions) {
  return {
    appName: "SAPTM",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: getTrustedOrigins(env),
    onAPIError: {
      throw: false,
    },
    database: prismaAdapter(database, {
      provider: databaseProvider,
      transaction: true,
    }),
    rateLimit: {
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": {
          window: 10,
          max: 3,
        },
      },
    },
    account: {
      encryptOAuthTokens: true,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail({
          to: user.email,
          userName: user.name,
          resetUrl: url,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail({
          to: user.email,
          userName: user.name,
          verificationUrl: url,
        });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60,
      },
    },
    plugins: [
      twoFactor({
        issuer: "SAPTM",
      }),
    ],
  } satisfies Parameters<typeof betterAuth>[0];
}

export function createSaptmAuth(options: CreateSaptmAuthOptions) {
  return betterAuth(createSaptmAuthOptions(options));
}

export type SaptmAuth = ReturnType<typeof createSaptmAuth>;

export function createSaptmAuthFromEnv() {
  return createSaptmAuth({
    database: getPrismaClient(),
    env: getServerEnv(),
  });
}
