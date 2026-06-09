-- Cargo departure lifecycle: starts governed movement after approved compliance evidence.
ALTER TABLE "Cargo"
  ADD COLUMN "departureIdempotencyKey" TEXT,
  ADD COLUMN "departureReference" TEXT,
  ADD COLUMN "departureLocationName" TEXT,
  ADD COLUMN "departureOperatorName" TEXT,
  ADD COLUMN "carrierReference" TEXT,
  ADD COLUMN "departedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Cargo_organizationId_departureIdempotencyKey_key"
  ON "Cargo"("organizationId", "departureIdempotencyKey");

CREATE INDEX "Cargo_organizationId_status_departedAt_idx"
  ON "Cargo"("organizationId", "status", "departedAt");
