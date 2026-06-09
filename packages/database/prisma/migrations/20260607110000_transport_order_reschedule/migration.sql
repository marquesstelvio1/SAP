CREATE TABLE "TransportOrderScheduleRevision" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "revisionReference" TEXT NOT NULL,
  "previousMode" "TransportOrderMode" NOT NULL,
  "newMode" "TransportOrderMode" NOT NULL,
  "previousCarrierName" TEXT NOT NULL,
  "newCarrierName" TEXT NOT NULL,
  "previousRouteSummary" TEXT NOT NULL,
  "newRouteSummary" TEXT NOT NULL,
  "previousOriginName" TEXT NOT NULL,
  "newOriginName" TEXT NOT NULL,
  "previousDestinationName" TEXT NOT NULL,
  "newDestinationName" TEXT NOT NULL,
  "previousPlannedDepartureAt" TIMESTAMP(3) NOT NULL,
  "newPlannedDepartureAt" TIMESTAMP(3) NOT NULL,
  "previousPlannedArrivalAt" TIMESTAMP(3) NOT NULL,
  "newPlannedArrivalAt" TIMESTAMP(3) NOT NULL,
  "rescheduledByName" TEXT NOT NULL,
  "rescheduleReason" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "idempotencyKey" TEXT NOT NULL,
  "rescheduledAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportOrderScheduleRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportOrderScheduleRevision_organizationId_revisionReference_key"
  ON "TransportOrderScheduleRevision"("organizationId", "revisionReference");

CREATE UNIQUE INDEX "TransportOrderScheduleRevision_organizationId_idempotencyKey_key"
  ON "TransportOrderScheduleRevision"("organizationId", "idempotencyKey");

CREATE INDEX "TransportOrderScheduleRevision_organizationId_orderId_rescheduledAt_idx"
  ON "TransportOrderScheduleRevision"("organizationId", "orderId", "rescheduledAt");

ALTER TABLE "TransportOrderScheduleRevision"
  ADD CONSTRAINT "TransportOrderScheduleRevision_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransportOrderScheduleRevision"
  ADD CONSTRAINT "TransportOrderScheduleRevision_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "TransportOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
