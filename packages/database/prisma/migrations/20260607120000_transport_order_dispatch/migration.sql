CREATE TABLE "TransportOrderDispatch" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "dispatchReference" TEXT NOT NULL,
  "dispatchedByName" TEXT NOT NULL,
  "dispatchInstructions" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "idempotencyKey" TEXT NOT NULL,
  "dispatchedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportOrderDispatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportOrderDispatch_organizationId_dispatchReference_key"
  ON "TransportOrderDispatch"("organizationId", "dispatchReference");

CREATE UNIQUE INDEX "TransportOrderDispatch_organizationId_idempotencyKey_key"
  ON "TransportOrderDispatch"("organizationId", "idempotencyKey");

CREATE UNIQUE INDEX "TransportOrderDispatch_organizationId_orderId_key"
  ON "TransportOrderDispatch"("organizationId", "orderId");

CREATE INDEX "TransportOrderDispatch_organizationId_dispatchedAt_idx"
  ON "TransportOrderDispatch"("organizationId", "dispatchedAt");

ALTER TABLE "TransportOrderDispatch"
  ADD CONSTRAINT "TransportOrderDispatch_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransportOrderDispatch"
  ADD CONSTRAINT "TransportOrderDispatch_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "TransportOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
