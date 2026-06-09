ALTER TABLE "TransportOrder"
  ADD COLUMN "cancellationReference" TEXT,
  ADD COLUMN "cancelledByName" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelIdempotencyKey" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "TransportOrder_organizationId_cancelIdempotencyKey_key"
  ON "TransportOrder"("organizationId", "cancelIdempotencyKey");

CREATE UNIQUE INDEX "TransportOrder_organizationId_cancellationReference_key"
  ON "TransportOrder"("organizationId", "cancellationReference");
