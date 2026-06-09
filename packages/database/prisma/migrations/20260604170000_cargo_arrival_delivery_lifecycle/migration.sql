-- Cargo arrival and delivery lifecycle: closes governed movement with tracking milestones.
ALTER TABLE "Cargo"
  ADD COLUMN "arrivalIdempotencyKey" TEXT,
  ADD COLUMN "deliveryIdempotencyKey" TEXT,
  ADD COLUMN "arrivalReference" TEXT,
  ADD COLUMN "arrivalLocationName" TEXT,
  ADD COLUMN "arrivalOperatorName" TEXT,
  ADD COLUMN "deliveryReference" TEXT,
  ADD COLUMN "receivedByName" TEXT,
  ADD COLUMN "deliveryNotes" TEXT,
  ADD COLUMN "arrivedAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Cargo_organizationId_arrivalIdempotencyKey_key"
  ON "Cargo"("organizationId", "arrivalIdempotencyKey");

CREATE UNIQUE INDEX "Cargo_organizationId_deliveryIdempotencyKey_key"
  ON "Cargo"("organizationId", "deliveryIdempotencyKey");

CREATE INDEX "Cargo_organizationId_status_arrivedAt_idx"
  ON "Cargo"("organizationId", "status", "arrivedAt");

CREATE INDEX "Cargo_organizationId_status_deliveredAt_idx"
  ON "Cargo"("organizationId", "status", "deliveredAt");
