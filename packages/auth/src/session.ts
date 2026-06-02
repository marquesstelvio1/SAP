import type { TraceContext } from "@saptm/observability";

import { type AuthContext, createAuthContext } from "./context.js";
import type { PlatformPermission } from "./permissions.js";

export type BetterAuthSessionUser = {
  id: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
};

export type BetterAuthSessionRecord = {
  id: string;
  userId: string;
  createdAt?: Date | string;
  expiresAt?: Date | string;
};

export type BetterAuthSessionResult = {
  session: BetterAuthSessionRecord;
  user: BetterAuthSessionUser;
} | null;

export type GetBetterAuthSessionInput = {
  headers: Headers;
  query?: {
    disableCookieCache?: boolean;
    disableRefresh?: boolean;
  };
};

export type GetBetterAuthSession = (
  input: GetBetterAuthSessionInput,
) => Promise<BetterAuthSessionResult>;

export type ResolveAuthContextFromSessionInput = {
  getSession: GetBetterAuthSession;
  headers: Headers;
  traceContext: Pick<TraceContext, "correlationId" | "requestId">;
  organizationId?: string;
  permissions?: readonly PlatformPermission[];
  disableCookieCache?: boolean;
  disableRefresh?: boolean;
};

export async function resolveAuthContextFromBetterAuthSession(
  input: ResolveAuthContextFromSessionInput,
): Promise<AuthContext | undefined> {
  const sessionResult = await input.getSession({
    headers: input.headers,
    query: {
      disableCookieCache: input.disableCookieCache ?? true,
      disableRefresh: input.disableRefresh ?? true,
    },
  });

  if (sessionResult === null) {
    return undefined;
  }

  const authenticatedAt = normalizeDate(sessionResult.session.createdAt);
  const expiresAt = normalizeDate(sessionResult.session.expiresAt);

  return createAuthContext({
    actorId: sessionResult.user.id,
    actorType: "user",
    traceContext: input.traceContext,
    sessionId: sessionResult.session.id,
    userId: sessionResult.user.id,
    ...(input.permissions === undefined ? {} : { permissions: input.permissions }),
    ...(authenticatedAt === undefined ? {} : { authenticatedAt }),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
  });
}

function normalizeDate(value: Date | string | undefined): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value instanceof Date ? value : new Date(value);
}
