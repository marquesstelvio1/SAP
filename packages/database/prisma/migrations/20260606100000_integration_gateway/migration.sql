ALTER TABLE "ServiceAccount"
ADD COLUMN "createdByActorId" TEXT,
ADD COLUMN "lastRotatedAt" TIMESTAMP(3),
ADD COLUMN "provisionIdempotencyKey" TEXT;

ALTER TABLE "IntegrationEvent"
ADD COLUMN "serviceAccountId" TEXT;

DROP INDEX "IntegrationEvent_sourceSystem_externalId_key";

CREATE UNIQUE INDEX "ServiceAccount_organizationId_name_key" ON "ServiceAccount"("organizationId", "name");

CREATE UNIQUE INDEX "ServiceAccount_organizationId_provisionIdempotencyKey_key" ON "ServiceAccount"("organizationId", "provisionIdempotencyKey");

CREATE UNIQUE INDEX "IntegrationEvent_organizationId_sourceSystem_externalId_key" ON "IntegrationEvent"("organizationId", "sourceSystem", "externalId");

CREATE INDEX "IntegrationEvent_serviceAccountId_receivedAt_idx" ON "IntegrationEvent"("serviceAccountId", "receivedAt");

ALTER TABLE "IntegrationEvent"
ADD CONSTRAINT "IntegrationEvent_serviceAccountId_fkey"
FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
