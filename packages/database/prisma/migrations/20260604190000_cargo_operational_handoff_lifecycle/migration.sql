CREATE TYPE "CargoOperationalHandoffType" AS ENUM (
  'rail_to_port',
  'port_to_rail',
  'terminal_to_carrier',
  'carrier_to_terminal',
  'yard_transfer',
  'customs_to_operations',
  'other'
);

CREATE TABLE "CargoOperationalHandoff" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "trackingShipmentId" TEXT,
  "handoffType" "CargoOperationalHandoffType" NOT NULL,
  "fromCustodyOwnerName" TEXT NOT NULL,
  "toCustodyOwnerName" TEXT NOT NULL,
  "handoffLocationName" TEXT NOT NULL,
  "operatorName" TEXT NOT NULL,
  "handoffReference" TEXT NOT NULL,
  "sealReference" TEXT,
  "conditionStatus" "CargoConditionStatus" NOT NULL DEFAULT 'sound',
  "handoffNotes" TEXT,
  "handoffAt" TIMESTAMP(3) NOT NULL,
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CargoOperationalHandoff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CargoOperationalHandoff_organizationId_recordIdempotencyKey_key"
  ON "CargoOperationalHandoff"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "CargoOperationalHandoff_organizationId_handoffReference_key"
  ON "CargoOperationalHandoff"("organizationId", "handoffReference");

CREATE INDEX "CargoOperationalHandoff_organizationId_cargoId_handoffAt_idx"
  ON "CargoOperationalHandoff"("organizationId", "cargoId", "handoffAt");

CREATE INDEX "CargoOperationalHandoff_organizationId_handoffType_handoffAt_idx"
  ON "CargoOperationalHandoff"("organizationId", "handoffType", "handoffAt");

ALTER TABLE "CargoOperationalHandoff"
  ADD CONSTRAINT "CargoOperationalHandoff_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CargoOperationalHandoff"
  ADD CONSTRAINT "CargoOperationalHandoff_cargoId_fkey"
  FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
