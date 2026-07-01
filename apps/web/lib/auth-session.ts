import type { BetterAuthSessionResult, PlatformPermission } from "@saptm/auth";
import {
  createSaptmAuthFromEnv,
  resolveDefaultUserAuthorization,
  verifyUserOrganizationAccess,
} from "@saptm/auth/server";
import type { Route } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export type PlatformViewer = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  organizationId?: string;
  permissions: readonly PlatformPermission[];
};

export type PlatformSession = {
  sessionId: string;
  expiresAt?: string;
  viewer: PlatformViewer;
};

export const getCurrentPlatformSession = cache(async (): Promise<PlatformSession | undefined> => {
  const sessionResult = await readBetterAuthSession();

  if (sessionResult === null) {
    return undefined;
  }

  const authorization = await resolveDefaultUserAuthorization(sessionResult.user.id);
  const activeOrgId = await resolveActiveOrganizationId(
    sessionResult.user.id,
    authorization.organizationId,
  );

  return {
    sessionId: sessionResult.session.id,
    ...(sessionResult.session.expiresAt === undefined
      ? {}
      : { expiresAt: normalizeDateString(sessionResult.session.expiresAt) }),
    viewer: {
      id: sessionResult.user.id,
      name: sessionResult.user.name ?? sessionResult.user.email ?? "Utilizador SAPTM",
      email: sessionResult.user.email ?? "sem-email@saptm.local",
      emailVerified: sessionResult.user.emailVerified ?? false,
      twoFactorEnabled: readBooleanProperty(sessionResult.user, "twoFactorEnabled"),
      permissions: authorization.permissions,
      ...(activeOrgId === undefined ? {} : { organizationId: activeOrgId }),
    },
  };
});

export async function requirePlatformSession(nextPath = "/app"): Promise<PlatformSession> {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession === undefined) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}` as Route);
  }

  return platformSession;
}

async function readBetterAuthSession(): Promise<BetterAuthSessionResult> {
  const auth = createSaptmAuthFromEnv();

  return auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
      disableRefresh: true,
    },
  });
}

async function resolveActiveOrganizationId(
  userId: string,
  defaultOrganizationId: string | undefined,
): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("saptm_active_org")?.value;

  if (cookieOrgId !== undefined) {
    const hasAccess = await verifyUserOrganizationAccess(userId, cookieOrgId);

    if (hasAccess) {
      return cookieOrgId;
    }
  }

  return defaultOrganizationId;
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function readBooleanProperty(value: unknown, key: string): boolean {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return false;
  }

  return (value as Record<string, unknown>)[key] === true;
}
