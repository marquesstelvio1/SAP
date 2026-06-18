ALTER TABLE "TrackingEvent" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "TrackingEvent_organizationId_idempotencyKey_key" ON "TrackingEvent"("organizationId", "idempotencyKey");
