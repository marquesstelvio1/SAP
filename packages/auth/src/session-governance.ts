import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";

export type UserSessionSecuritySummary = {
  activeSessions: number;
  currentSessionId: string;
  otherSessions: number;
};

export type RevokeOtherUserSessionsInput = {
  currentSessionId: string;
  organizationId?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RevokeOtherUserSessionsOutput = {
  revokedSessions: number;
  audit: {
    action: "auth.sessions.revoked";
    subjectType: "user";
    subjectId: string;
  };
  outbox?: {
    eventType: "auth.sessions.revoked";
    aggregateType: "auth.user";
    aggregateId: string;
  };
};

type SessionGovernanceDatabaseClient = Pick<
  SaptmPrismaClient,
  "$transaction" | "auditRecord" | "outboxEvent" | "session"
>;

export async function getUserSessionSecuritySummaryFromEnv(input: {
  currentSessionId: string;
  userId: string;
}): Promise<UserSessionSecuritySummary> {
  const database = getPrismaClient();
  const activeSessions = await database.session.count({
    where: {
      expiresAt: {
        gt: new Date(),
      },
      userId: input.userId,
    },
  });

  return {
    activeSessions,
    currentSessionId: input.currentSessionId,
    otherSessions: Math.max(activeSessions - 1, 0),
  };
}

export async function revokeOtherUserSessionsFromEnv(
  input: RevokeOtherUserSessionsInput,
): Promise<RevokeOtherUserSessionsOutput> {
  return revokeOtherUserSessions(getPrismaClient(), input);
}

export async function revokeOtherUserSessions(
  database: SessionGovernanceDatabaseClient,
  input: RevokeOtherUserSessionsInput,
): Promise<RevokeOtherUserSessionsOutput> {
  return database.$transaction(async (transaction) => {
    const deleteResult = await transaction.session.deleteMany({
      where: {
        id: {
          not: input.currentSessionId,
        },
        userId: input.userId,
      },
    });

    await transaction.auditRecord.create({
      data: {
        ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
        actorType: "user",
        actorId: input.userId,
        action: "auth.sessions.revoked",
        subjectType: "user",
        subjectId: input.userId,
        severity: "critical",
        after: {
          currentSessionId: input.currentSessionId,
          revokedSessions: deleteResult.count,
        } as never,
        reason: "User revoked all other active sessions.",
        correlationId: `session_revoke_${input.currentSessionId}`,
        ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
        ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
      },
    });

    if (input.organizationId !== undefined) {
      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "auth.sessions.revoked",
          aggregateType: "auth.user",
          aggregateId: input.userId,
          payload: {
            currentSessionId: input.currentSessionId,
            revokedSessions: deleteResult.count,
            userId: input.userId,
          },
        },
      });
    }

    return {
      revokedSessions: deleteResult.count,
      audit: {
        action: "auth.sessions.revoked",
        subjectType: "user",
        subjectId: input.userId,
      },
      ...(input.organizationId === undefined
        ? {}
        : {
            outbox: {
              eventType: "auth.sessions.revoked",
              aggregateType: "auth.user",
              aggregateId: input.userId,
            },
          }),
    };
  });
}
