import type { NotificationInboxOutput } from "@saptm/rpc";

export type NotificationRecord = {
  id: string;
  organizationId: string;
  sourceOutboxEventId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  readAt: Date | null;
  archivedAt: Date | null;
};

export function mapNotification(
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
    severity: notification.severity as NotificationInboxOutput["notifications"][number]["severity"],
    status: notification.status as NotificationInboxOutput["notifications"][number]["status"],
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
    readAt: toIsoStringOrNull(notification.readAt),
    archivedAt: toIsoStringOrNull(notification.archivedAt),
  };
}

export function toIsoStringOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

export function createRequestMetadata(input: {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}): {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}
