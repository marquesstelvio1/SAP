import type { PrismaTx } from "@saptm/database";

import type { NotificationRecord } from "./notifications.dto.js";

export const NOTIFICATIONS_REPOSITORY = Symbol("NotificationsRepository");

export type NotificationsWhereInput = {
  organizationId: string;
  status?: string | undefined;
};

export type PrismaAuditRecordCreateInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  severity: string;
  before?: Record<string, unknown> | undefined;
  after?: Record<string, unknown> | undefined;
  reason: string;
  correlationId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

export interface NotificationsRepository {
  searchNotifications(where: NotificationsWhereInput, limit: number): Promise<NotificationRecord[]>;

  countNotifications(organizationId: string): Promise<number>;

  countByStatus(organizationId: string, status: string): Promise<number>;

  findNotificationById(
    organizationId: string,
    notificationId: string,
  ): Promise<NotificationRecord | null>;

  updateNotificationReadStatus(
    tx: PrismaTx,
    notificationId: string,
    readAt: Date,
  ): Promise<NotificationRecord>;

  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;
}
