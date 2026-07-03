"use server";

import { revokeOtherUserSessionsFromEnv } from "@saptm/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type { SessionRevocationFormState } from "./form-state";

export async function revokeOtherSessionsAction(
  _previousState: SessionRevocationFormState,
  _formData: FormData,
): Promise<SessionRevocationFormState> {
  const platformSession = await requirePlatformSession("/app/security");
  const requestHeaders = await headers();

  try {
    const result = await revokeOtherUserSessionsFromEnv({
      currentSessionId: platformSession.sessionId,
      userId: platformSession.viewer.id,
      ...(platformSession.viewer.organizationId === undefined
        ? {}
        : { organizationId: platformSession.viewer.organizationId }),
      ...createRequestMetadata(requestHeaders),
    });

    revalidatePath("/app/security");

    return {
      status: "success",
      message: "Outras sessoes revogadas com audit trail e outbox.",
      revokedSessions: result.revokedSessions,
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possivel revogar outras sessoes neste momento.",
    };
  }
}

function createRequestMetadata(headersList: Headers): { ipAddress?: string; userAgent?: string } {
  const ipAddress = readForwardedIp(headersList);
  const userAgent = headersList.get("user-agent") ?? undefined;

  return {
    ...(ipAddress === undefined ? {} : { ipAddress }),
    ...(userAgent === undefined ? {} : { userAgent }),
  };
}

function readForwardedIp(headersList: Headers): string | undefined {
  return (
    headersList.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
    headersList.get("x-real-ip") ??
    undefined
  );
}
