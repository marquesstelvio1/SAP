-- Cargo delivery exception lifecycle: handles damaged or non-sound delivery attempts before final handover.
CREATE TYPE "CargoDeliveryExceptionType" AS ENUM (
  'damage',
  'shortage',
  'temperature_excursion',
  'documentation_mismatch',
  'security_seal_breach',
  'other'
);

CREATE TYPE "CargoDeliveryExceptionStatus" AS ENUM ('open', 'resolved');

CREATE TYPE "CargoDeliveryExceptionResolutionCode" AS ENUM (
  'inspection_passed',
  'claim_accepted',
  'waiver_approved',
  'recovered',
  'other'
);

CREATE TABLE "CargoDeliveryException" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "trackingShipmentId" TEXT,
  "exceptionType" "CargoDeliveryExceptionType" NOT NULL,
  "deliveryConditionStatus" "CargoConditionStatus" NOT NULL,
  "status" "CargoDeliveryExceptionStatus" NOT NULL DEFAULT 'open',
  "reportedByName" TEXT NOT NULL,
  "exceptionSummary" TEXT NOT NULL,
  "evidenceReference" TEXT NOT NULL,
  "claimReference" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "resolverName" TEXT,
  "resolutionCode" "CargoDeliveryExceptionResolutionCode",
  "resolutionReference" TEXT,
  "resolutionSummary" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "resolveIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CargoDeliveryException_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CargoDeliveryException_organizationId_recordIdempotencyKey_key"
  ON "CargoDeliveryException"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "CargoDeliveryException_organizationId_resolveIdempotencyKey_key"
  ON "CargoDeliveryException"("organizationId", "resolveIdempotencyKey");

CREATE INDEX "CargoDeliveryException_organizationId_cargoId_status_idx"
  ON "CargoDeliveryException"("organizationId", "cargoId", "status");

CREATE INDEX "CargoDeliveryException_organizationId_exceptionType_status_idx"
  ON "CargoDeliveryException"("organizationId", "exceptionType", "status");

CREATE INDEX "CargoDeliveryException_organizationId_occurredAt_idx"
  ON "CargoDeliveryException"("organizationId", "occurredAt");

ALTER TABLE "CargoDeliveryException"
  ADD CONSTRAINT "CargoDeliveryException_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CargoDeliveryException"
  ADD CONSTRAINT "CargoDeliveryException_cargoId_fkey"
  FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
