import { createHash, randomBytes, randomUUID } from "node:crypto";

import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";
import { hashPassword } from "better-auth/crypto";

const invitationIdentifierPrefix = "saptm.invitation:";
const defaultInvitationTtlHours = 48;
const credentialProviderId = "credential";

export type InvitationDeliveryChannel = "outbox_email";

export type PlatformInvitationDelivery = {
  acceptUrl: string;
  deliveryChannel: InvitationDeliveryChannel;
  expiresAt: string;
};

export type CreatePlatformInvitationTokenInput = {
  appUrl?: string;
  expiresAt?: Date;
  membershipId: string;
  ttlHours?: number;
};

export type CreatePlatformInvitationTokenOutput = PlatformInvitationDelivery & {
  token: string;
  tokenHash: string;
};

export type AcceptPlatformInvitationInput = {
  name?: string;
  password: string;
  token: string;
  acceptedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type AcceptPlatformInvitationOutput = {
  organizationId: string;
  membershipId: string;
  userId: string;
  email: string;
  acceptedAt: string;
  audit: {
    action: "identity.invitation.accepted";
    subjectType: "membership";
    subjectId: string;
  };
  outbox: {
    eventType: "identity.invitation.accepted";
    aggregateType: "identity.membership";
    aggregateId: string;
  };
};

type InvitationTokenDatabaseClient = Pick<SaptmPrismaClient, "verification">;
type InvitationAcceptanceDatabaseClient = Pick<
  SaptmPrismaClient,
  | "$transaction"
  | "account"
  | "auditRecord"
  | "membership"
  | "outboxEvent"
  | "user"
  | "verification"
>;

export async function createPlatformInvitationToken(
  database: InvitationTokenDatabaseClient,
  input: CreatePlatformInvitationTokenInput,
): Promise<CreatePlatformInvitationTokenOutput> {
  const expiresAt =
    input.expiresAt ??
    new Date(Date.now() + readInvitationTtlHours(input.ttlHours) * 60 * 60 * 1000);
  const token = createOpaqueInvitationToken(input.membershipId);
  const tokenHash = createInvitationTokenHash(token);
  const acceptUrl = createInvitationAcceptUrl(token, input.appUrl);

  await database.verification.upsert({
    where: {
      id: createInvitationVerificationId(input.membershipId),
    },
    update: {
      expiresAt,
      identifier: createInvitationIdentifier(input.membershipId),
      value: tokenHash,
    },
    create: {
      id: createInvitationVerificationId(input.membershipId),
      expiresAt,
      identifier: createInvitationIdentifier(input.membershipId),
      value: tokenHash,
    },
  });

  return {
    acceptUrl,
    deliveryChannel: "outbox_email",
    expiresAt: expiresAt.toISOString(),
    token,
    tokenHash,
  };
}

export async function acceptPlatformInvitation(
  database: InvitationAcceptanceDatabaseClient,
  input: AcceptPlatformInvitationInput,
): Promise<AcceptPlatformInvitationOutput> {
  assertInvitationPasswordPolicy(input.password);

  const acceptedAt = input.acceptedAt ?? new Date();
  const tokenHash = createInvitationTokenHash(input.token);

  return database.$transaction(async (transaction) => {
    const verification = await transaction.verification.findFirst({
      where: {
        identifier: {
          startsWith: invitationIdentifierPrefix,
        },
        value: tokenHash,
      },
      select: {
        id: true,
        identifier: true,
        expiresAt: true,
      },
    });

    if (verification === null) {
      throw new Error("invitation.invalid_or_expired");
    }

    if (verification.expiresAt.getTime() < acceptedAt.getTime()) {
      await transaction.verification.delete({
        where: {
          id: verification.id,
        },
      });
      throw new Error("invitation.invalid_or_expired");
    }

    const membershipId = parseMembershipIdFromInvitationIdentifier(verification.identifier);
    const membership = await transaction.membership.findUnique({
      where: {
        id: membershipId,
      },
      select: {
        id: true,
        organizationId: true,
        status: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (membership === null || membership.status !== "invited") {
      await transaction.verification.delete({
        where: {
          id: verification.id,
        },
      });
      throw new Error("invitation.invalid_or_expired");
    }

    const passwordHash = await hashPassword(input.password);
    const credentialAccount = await transaction.account.findFirst({
      where: {
        providerId: credentialProviderId,
        userId: membership.user.id,
      },
      select: {
        id: true,
      },
    });

    await transaction.user.update({
      where: {
        id: membership.user.id,
      },
      data: {
        emailVerified: true,
        name: input.name?.trim() || membership.user.name,
      },
    });

    if (credentialAccount === null) {
      await transaction.account.create({
        data: {
          id: `invitation_credential_${randomUUID()}`,
          accountId: membership.user.id,
          providerId: credentialProviderId,
          userId: membership.user.id,
          password: passwordHash,
        },
      });
    } else {
      await transaction.account.update({
        where: {
          id: credentialAccount.id,
        },
        data: {
          accountId: membership.user.id,
          password: passwordHash,
        },
      });
    }

    await transaction.membership.update({
      where: {
        id: membership.id,
      },
      data: {
        status: "active",
      },
    });
    await transaction.verification.delete({
      where: {
        id: verification.id,
      },
    });
    await transaction.auditRecord.create({
      data: {
        organizationId: membership.organizationId,
        actorType: "user",
        actorId: membership.user.id,
        action: "identity.invitation.accepted",
        subjectType: "membership",
        subjectId: membership.id,
        severity: "critical",
        before: {
          status: membership.status,
        },
        after: {
          email: membership.user.email,
          status: "active",
        },
        reason: "User accepted governed tenant invitation.",
        correlationId: `invitation_accept_${membership.id}`,
        ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
        ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
      },
    });
    await transaction.outboxEvent.create({
      data: {
        organizationId: membership.organizationId,
        eventType: "identity.invitation.accepted",
        aggregateType: "identity.membership",
        aggregateId: membership.id,
        payload: {
          email: membership.user.email,
          membershipId: membership.id,
          userId: membership.user.id,
        },
      },
    });

    return {
      organizationId: membership.organizationId,
      membershipId: membership.id,
      userId: membership.user.id,
      email: membership.user.email,
      acceptedAt: acceptedAt.toISOString(),
      audit: {
        action: "identity.invitation.accepted",
        subjectType: "membership",
        subjectId: membership.id,
      },
      outbox: {
        eventType: "identity.invitation.accepted",
        aggregateType: "identity.membership",
        aggregateId: membership.id,
      },
    };
  });
}

export async function acceptPlatformInvitationFromEnv(
  input: AcceptPlatformInvitationInput,
): Promise<AcceptPlatformInvitationOutput> {
  return acceptPlatformInvitation(getPrismaClient(), input);
}

export async function deletePlatformInvitationToken(
  database: InvitationTokenDatabaseClient,
  membershipId: string,
): Promise<void> {
  await database.verification.deleteMany({
    where: {
      id: createInvitationVerificationId(membershipId),
      identifier: createInvitationIdentifier(membershipId),
    },
  });
}

export function createInvitationAcceptUrl(token: string, appUrl = readDefaultAppUrl()): string {
  const url = new URL("/accept-invitation", appUrl);
  url.searchParams.set("token", token);

  return url.toString();
}

export function createInvitationTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function assertInvitationPasswordPolicy(password: string): void {
  if (password.length < 12 || password.length > 128) {
    throw new Error("invitation.password_must_be_12_to_128_chars");
  }
}

function createOpaqueInvitationToken(membershipId: string): string {
  return `${membershipId}.${randomBytes(32).toString("base64url")}`;
}

function createInvitationVerificationId(membershipId: string): string {
  return `${invitationIdentifierPrefix}${membershipId}`;
}

function createInvitationIdentifier(membershipId: string): string {
  return `${invitationIdentifierPrefix}${membershipId}`;
}

function parseMembershipIdFromInvitationIdentifier(identifier: string): string {
  if (!identifier.startsWith(invitationIdentifierPrefix)) {
    throw new Error("invitation.invalid_identifier");
  }

  const membershipId = identifier.slice(invitationIdentifierPrefix.length);

  if (membershipId.length === 0) {
    throw new Error("invitation.invalid_identifier");
  }

  return membershipId;
}

function readInvitationTtlHours(override?: number): number {
  if (override !== undefined) {
    return override;
  }

  const rawValue = readRuntimeEnv().SAPTM_INVITATION_TOKEN_TTL_HOURS;
  const parsed = Number.parseInt(rawValue ?? "", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultInvitationTtlHours;
}

function readDefaultAppUrl(): string {
  const env = readRuntimeEnv();

  return env.NEXT_PUBLIC_APP_URL ?? env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function readRuntimeEnv(): Record<string, string | undefined> {
  return (
    (
      globalThis as typeof globalThis & {
        process?: {
          env?: Record<string, string | undefined>;
        };
      }
    ).process?.env ?? {}
  );
}
