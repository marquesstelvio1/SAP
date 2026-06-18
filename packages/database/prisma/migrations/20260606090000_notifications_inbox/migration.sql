CREATE TYPE "NotificationStatus" AS ENUM ('unread', 'read', 'archived');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceOutboxEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'medium',
    "status" "NotificationStatus" NOT NULL DEFAULT 'unread',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_sourceOutboxEventId_key" ON "Notification"("sourceOutboxEventId");
CREATE INDEX "Notification_organizationId_status_createdAt_idx" ON "Notification"("organizationId", "status", "createdAt");
CREATE INDEX "Notification_organizationId_eventType_createdAt_idx" ON "Notification"("organizationId", "eventType", "createdAt");
CREATE INDEX "Notification_aggregateType_aggregateId_idx" ON "Notification"("aggregateType", "aggregateId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sourceOutboxEventId_fkey" FOREIGN KEY ("sourceOutboxEventId") REFERENCES "OutboxEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
