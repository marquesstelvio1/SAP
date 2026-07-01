import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import type { NotificationRecord } from "../domain/notifications.dto.js";
import type {
  NotificationsRepository,
  NotificationsWhereInput,
  PrismaAuditRecordCreateInput,
} from "../domain/notifications.repository.js";

@Injectable()
export class PrismaNotificationsRepository implements NotificationsRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async searchNotifications(
    where: NotificationsWhereInput,
    limit: number,
  ): Promise<NotificationRecord[]> {
    const records = await this.database.notification.findMany({
      where: where as never,
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });

    return records as unknown as NotificationRecord[];
  }

  async countNotifications(organizationId: string): Promise<number> {
    return this.database.notification.count({ where: { organizationId } });
  }

  async countByStatus(organizationId: string, status: string): Promise<number> {
    return this.database.notification.count({ where: { organizationId, status } as never });
  }

  async findNotificationById(
    organizationId: string,
    notificationId: string,
  ): Promise<NotificationRecord | null> {
    const record = await this.database.notification.findFirst({
      where: { id: notificationId, organizationId },
    });

    return record as unknown as NotificationRecord | null;
  }

  async updateNotificationReadStatus(
    tx: PrismaTx,
    notificationId: string,
    readAt: Date,
  ): Promise<NotificationRecord> {
    const record = await tx.notification.update({
      where: { id: notificationId },
      data: { status: "read", readAt },
    });

    return record as unknown as NotificationRecord;
  }

  async createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void> {
    await tx.auditRecord.create({ data: input as never });
  }
}
