-- Cargo-to-tracking linkage: one released cargo can create one governed tracking shipment.
ALTER TABLE "Cargo"
  ADD COLUMN "transportPlanIdempotencyKey" TEXT,
  ADD COLUMN "transportPlanningReference" TEXT,
  ADD COLUMN "transportOwnerTeam" TEXT,
  ADD COLUMN "trackingShipmentId" TEXT,
  ADD COLUMN "transportPlannedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Cargo_organizationId_transportPlanIdempotencyKey_key"
  ON "Cargo"("organizationId", "transportPlanIdempotencyKey");

CREATE UNIQUE INDEX "Cargo_trackingShipmentId_key"
  ON "Cargo"("trackingShipmentId");

CREATE INDEX "Cargo_organizationId_trackingShipmentId_idx"
  ON "Cargo"("organizationId", "trackingShipmentId");

ALTER TABLE "Cargo"
  ADD CONSTRAINT "Cargo_trackingShipmentId_fkey"
  FOREIGN KEY ("trackingShipmentId")
  REFERENCES "TrackingShipment"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
