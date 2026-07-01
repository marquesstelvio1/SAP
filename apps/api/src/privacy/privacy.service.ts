import { Injectable, Optional } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type { PrivacyExportInput, PrivacyExportOutput } from "@saptm/rpc";

@Injectable()
export class PrivacyService {
  constructor(
    @Optional()
    private readonly database?: SaptmPrismaClient,
  ) {}

  private getDatabase(): SaptmPrismaClient {
    return this.database ?? getPrismaClient();
  }

  async exportUserData(userId: string, input: PrivacyExportInput): Promise<PrivacyExportOutput> {
    const user = await this.getDatabase().user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            providerId: true,
            accountId: true,
            createdAt: true,
          },
        },
        memberships: {
          include: {
            membershipRoles: {
              include: {
                role: {
                  select: { key: true },
                },
              },
            },
            organization: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const result: PrivacyExportOutput = {
      exportedAt: new Date().toISOString(),
      account: {
        userId: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      associatedAccounts: (
        user.accounts as Array<{ providerId: string; accountId: string; createdAt: Date }>
      ).map((acc) => ({
        providerId: acc.providerId,
        accountId: acc.accountId,
        createdAt: acc.createdAt.toISOString(),
      })),
      memberships: (
        user.memberships as Array<{
          organizationId: string;
          organization: { name: string };
          status: string;
          membershipRoles: Array<{ role: { key: string } }>;
          createdAt: Date;
        }>
      ).map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        status: m.status,
        roles: m.membershipRoles.map((mr: { role: { key: string } }) => mr.role.key),
        createdAt: m.createdAt.toISOString(),
      })),
    };

    if (input.includeAuditLogs) {
      const auditRecords = await this.getDatabase().auditRecord.findMany({
        where: {
          OR: [{ actorId: userId }, { actorType: "user", actorId: userId }],
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          id: true,
          action: true,
          subjectType: true,
          subjectId: true,
          severity: true,
          createdAt: true,
        },
      });

      result.auditRecords = (
        auditRecords as Array<{
          id: string;
          action: string;
          subjectType: string;
          subjectId: string | null;
          severity: string;
          createdAt: Date;
        }>
      ).map((r) => ({
        id: r.id,
        action: r.action,
        subjectType: r.subjectType,
        subjectId: r.subjectId ?? undefined,
        severity: r.severity,
        createdAt: r.createdAt.toISOString(),
      }));
    }

    if (input.includeSessions) {
      const sessions = await this.getDatabase().session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
        },
      });

      result.sessions = (
        sessions as Array<{
          id: string;
          createdAt: Date;
          expiresAt: Date;
          ipAddress: string | null;
          userAgent: string | null;
        }>
      ).map((s) => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        ipAddress: s.ipAddress ?? undefined,
        userAgent: s.userAgent ?? undefined,
      }));
    }

    return result;
  }

  async scheduleAccountDeletion(
    userId: string,
    input: { actorType: DatabaseActorType; actorId: string; correlationId: string },
  ): Promise<{ scheduledAt: string; message: string }> {
    const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      await tx.auditRecord.create({
        data: {
          organizationId: undefined,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "account.deletion_scheduled",
          subjectType: "user",
          subjectId: userId,
          severity: "high",
          after: { scheduledAt: scheduledAt.toISOString() },
          reason: "User requested account deletion. 30-day grace period started.",
          correlationId: input.correlationId,
        } as never,
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: undefined,
          eventType: "account.deletion_scheduled",
          aggregateType: "user",
          aggregateId: userId,
          payload: { userId, scheduledAt: scheduledAt.toISOString() },
        } as never,
      });
    });

    return {
      scheduledAt: scheduledAt.toISOString(),
      message:
        "O pedido de eliminacao da sua conta foi registado. A sua conta sera eliminada em 30 dias. Pode cancelar esta operacao durante este periodo.",
    };
  }
}
