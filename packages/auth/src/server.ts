import { getServerEnv, getTrustedOrigins, type ServerEnv } from "@saptm/config";
import { databaseProvider, getPrismaClient } from "@saptm/database";
import { sendPasswordResetEmail, sendVerificationEmail } from "@saptm/email";
import type { Auth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { twoFactor } from "better-auth/plugins/two-factor";

export {
  getUserOrganizations,
  type ResolvedUserAuthorization,
  resolveDefaultUserAuthorization,
  type UserAuthorizationClient,
  type UserOrganization,
  uniquePlatformPermissions,
  verifyUserOrganizationAccess,
} from "./user-authorization.js";

export type PrismaAuthClient = Parameters<typeof prismaAdapter>[0];
export type SaptmAuth = Auth<BetterAuthOptions>;

export type CreateSaptmAuthOptions = {
  database: PrismaAuthClient;
  env: ServerEnv;
};

const ACCOUNT_LOCKOUT_THRESHOLD = 5;
const ACCOUNT_LOCKOUT_DURATION_MS = 15 * 60 * 1000;

async function checkAccountLockout(
  ctx: { context: { adapter?: unknown; request?: Request } },
  _path: string,
): Promise<boolean> {
  try {
    const body = ctx.context.request
      ? await ctx.context.request
          .clone()
          .json()
          .catch(() => ({}))
      : {};
    const email = (body as { email?: string }).email;
    if (!email) return false;

    const sessionResult = await (
      ctx.context.adapter as {
        findOne?: (
          model: { modelName: string },
          filter: { filter: Array<{ field: string; operator: string; value: string }> },
        ) => Promise<{ lockedUntil: string | null } | null>;
      }
    )?.findOne?.(
      { modelName: "user" },
      { filter: [{ field: "email", operator: "eq", value: email }] },
    );

    if (sessionResult?.lockedUntil) {
      const lockedUntil = new Date(sessionResult.lockedUntil);
      if (lockedUntil > new Date()) {
        return true;
      }
    }
  } catch {
    /* sw */
  }
  return false;
}

async function recordLoginAttempt(
  ctx: {
    context: {
      adapter?: unknown;
      request?: Request;
      returned?: { session?: unknown; user?: { id?: string } } | null;
    };
  },
  _path: string,
): Promise<void> {
  try {
    const isSuccess = !!ctx.context.returned?.session;
    const request = ctx.context.request;
    if (!request) return;

    const body = (await request
      .clone()
      .json()
      .catch(() => ({}))) as { email?: string };
    const email = body.email;
    if (!email) return;

    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email,
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
        success: isSuccess,
      },
    });

    if (!isSuccess) {
      const recentFailures = await prisma.loginAttempt.count({
        where: {
          userId: user.id,
          success: false,
          createdAt: { gte: new Date(Date.now() - ACCOUNT_LOCKOUT_DURATION_MS) },
        },
      });

      if (recentFailures >= ACCOUNT_LOCKOUT_THRESHOLD) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION_MS) },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lockedUntil: null },
      });
    }
  } catch {
    /* sw - audit logging failure should not block auth flow */
  }
}

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
    onAPIError: {
      throw: true,
      onError: (error) => {
        console.error("[SAPTM:AUTH] error:", String(error));
      },
    },
    database: prismaAdapter(database, {
      provider: databaseProvider,
      transaction: true,
    }),
    account: {
      encryptOAuthTokens: true,
      storeStateStrategy: "cookie",
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
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
        totpOptions: {
          digits: 6,
          period: 30,
        },
        backupCodeOptions: {
          amount: 10,
          length: 10,
          storeBackupCodes: "encrypted",
        },
        twoFactorCookieMaxAge: 60 * 10,
        trustDeviceMaxAge: 60 * 60 * 24 * 30,
      }),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-in/email") {
          const isLocked = await checkAccountLockout(ctx as never, ctx.path);
          if (isLocked) {
            throw new Error(
              "Conta temporariamente bloqueada devido a multiplas tentativas de login falhadas. Tente novamente mais tarde.",
            );
          }
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-in/email") {
          await recordLoginAttempt(ctx as never, ctx.path);
        }
      }),
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
