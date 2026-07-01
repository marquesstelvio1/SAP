import { Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  NotificationInboxInput,
  NotificationInboxOutput,
  NotificationMarkReadInput,
  NotificationMarkReadOutput,
} from "@saptm/rpc";

import {
  createRequestMetadata,
  mapNotification,
  toIsoStringOrNull,
} from "./domain/notifications.dto.js";
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepository,
} from "./domain/notifications.repository.js";

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
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepository,
    @Optional()
    private readonly database?: SaptmPrismaClient,
  ) {}

  private getDatabase(): SaptmPrismaClient {
    return this.database ?? getPrismaClient();
  }

  async readInbox(input: ReadNotificationInboxInput): Promise<NotificationInboxOutput> {
    const generatedAt = input.generatedAt ?? new Date();
    const limit = input.limit ?? 25;
    const where = createNotificationWhere(input);

    const [notifications, totalCount, unreadCount, readCount, archivedCount] = await Promise.all([
      this.notificationsRepository.searchNotifications(where, limit),
      this.notificationsRepository.countNotifications(input.organizationId),
      this.notificationsRepository.countByStatus(input.organizationId, "unread"),
      this.notificationsRepository.countByStatus(input.organizationId, "read"),
      this.notificationsRepository.countByStatus(input.organizationId, "archived"),
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
      notifications: notifications.map(mapNotification),
    };
  }

  async markRead(input: MarkNotificationReadInput): Promise<NotificationMarkReadOutput> {
    const readAt = input.readAt ?? new Date();
    const existingNotification = await this.notificationsRepository.findNotificationById(
      input.organizationId,
      input.notificationId,
    );

    if (existingNotification === null) {
      throw new NotFoundException("notification.not_found");
    }

    const notification = await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      const updatedNotification =
        existingNotification.status === "unread"
          ? await this.notificationsRepository.updateNotificationReadStatus(
              tx,
              existingNotification.id,
              readAt,
            )
          : existingNotification;

      await this.notificationsRepository.createAuditRecord(tx, {
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
      });

      return updatedNotification;
    });

    return {
      organizationId: input.organizationId,
      notification: mapNotification(notification),
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "notification.marked_read",
        subjectType: "notification",
        subjectId: notification.id,
      },
      outbox: {
        eventType: "notification.marked_read",
        aggregateType: "notification",
        aggregateId: notification.id,
      },
    };
  }
}

function createNotificationWhere(input: ReadNotificationInboxInput): {
  organizationId: string;
  status?: string | undefined;
} {
  return {
    organizationId: input.organizationId,
    ...(input.status === undefined ? {} : { status: input.status }),
  };
}
