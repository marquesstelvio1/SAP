import { Injectable, NotFoundException } from "@nestjs/common";
import { type DatabaseActorType, getPrismaClient, type SaptmPrismaClient } from "@saptm/database";
import type {
  NotificationInboxInput,
  NotificationInboxOutput,
  NotificationMarkReadInput,
  NotificationMarkReadOutput,
} from "@saptm/rpc";

export type ReadNotificationInboxInput = NotificationInboxInput & {
  organizationId: string;
  generatedAt?: Date;
};

export type MarkNotificationReadInput = NotificationMarkReadInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  readAt?: Date;
  ipAddress?: string;
  userAgent?: string;
};

type NotificationFindManyArgs = NonNullable<
  Parameters<SaptmPrismaClient["notification"]["findMany"]>[0]
>;
type NotificationWhereInput = NonNullable<NotificationFindManyArgs["where"]>;

type NotificationRecord = {
  id: string;
  organizationId: string;
  sourceOutboxEventId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "unread" | "read" | "archived";
  createdAt: Date;
  updatedAt: Date;
  readAt: Date | null;
  archivedAt: Date | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly database: SaptmPrismaClient = getPrismaClient()) {}

  async readInbox(input: ReadNotificationInboxInput): Promise<NotificationInboxOutput> {
    const generatedAt = input.generatedAt ?? new Date();
    const limit = input.limit ?? 25;
    const where = createNotificationWhere(input);

    const [notifications, totalCount, unreadCount, readCount, archivedCount] = await Promise.all([
      this.database.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
        take: limit,
      }),
      this.database.notification.count({
        where: {
          organizationId: input.organizationId,
        },
      }),
      this.database.notification.count({
        where: {
          organizationId: input.organizationId,
          status: "unread",
        },
      }),
      this.database.notification.count({
        where: {
          organizationId: input.organizationId,
          status: "read",
        },
      }),
      this.database.notification.count({
        where: {
          organizationId: input.organizationId,
          status: "archived",
        },
      }),
    ]);

    return {
      generatedAt: generatedAt.toISOString(),
      organizationId: input.organizationId,
      filters: {
        limit,
        ...(input.status === undefined ? {} : { status: input.status }),
      },
      totals: {
        notifications: totalCount,
        unread: unreadCount,
        read: readCount,
        archived: archivedCount,
      },
      notifications: notifications.map((notification) =>
        mapNotification(notification as NotificationRecord),
      ),
    };
  }

  async markRead(input: MarkNotificationReadInput): Promise<NotificationMarkReadOutput> {
    const readAt = input.readAt ?? new Date();
    const existingNotification = (await this.database.notification.findFirst({
      where: {
        id: input.notificationId,
        organizationId: input.organizationId,
      },
    })) as NotificationRecord | null;

    if (existingNotification === null) {
      throw new NotFoundException("notification.not_found");
    }

    const notification = await this.database.$transaction(async (transaction) => {
      const updatedNotification =
        existingNotification.status === "unread"
          ? await transaction.notification.update({
              where: {
                id: existingNotification.id,
              },
              data: {
                status: "read",
                readAt,
              },
            })
          : existingNotification;

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "notification.marked_read",
          subjectType: "notification",
          subjectId: existingNotification.id,
          severity: "low",
          before: {
            status: existingNotification.status,
            readAt: toIsoStringOrNull(existingNotification.readAt),
          },
          after: {
            status: updatedNotification.status,
            readAt: toIsoStringOrNull(updatedNotification.readAt),
          },
          reason: "Operational notification acknowledged by authorized user.",
          correlationId: input.correlationId,
          ...createRequestMetadata(input),
        },
      });

      return updatedNotification as NotificationRecord;
    });

    return {
      organizationId: input.organizationId,
      notification: mapNotification(notification),
      audit: {
        action: "notification.marked_read",
        subjectType: "notification",
        subjectId: notification.id,
      },
    };
  }
}

function createNotificationWhere(input: ReadNotificationInboxInput): NotificationWhereInput {
  return {
    organizationId: input.organizationId,
    ...(input.status === undefined ? {} : { status: input.status }),
  };
}

function mapNotification(
  notification: NotificationRecord,
): NotificationInboxOutput["notifications"][number] {
  return {
    id: notification.id,
    organizationId: notification.organizationId,
    sourceOutboxEventId: notification.sourceOutboxEventId,
    eventType: notification.eventType,
    aggregateType: notification.aggregateType,
    aggregateId: notification.aggregateId,
    title: notification.title,
    message: notification.message,
    severity: notification.severity,
    status: notification.status,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
    readAt: toIsoStringOrNull(notification.readAt),
    archivedAt: toIsoStringOrNull(notification.archivedAt),
  };
}

function toIsoStringOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

function createRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
