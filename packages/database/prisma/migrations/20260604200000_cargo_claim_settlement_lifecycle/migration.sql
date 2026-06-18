CREATE TYPE "CargoClaimSettlementType" AS ENUM (
  'carrier_liability',
  'insurance_recovery',
  'customer_credit',
  'supplier_recovery',
  'write_off',
  'other'
);

CREATE TYPE "CargoClaimSettlementStatus" AS ENUM ('settled');

CREATE TABLE "CargoClaimSettlement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "deliveryExceptionId" TEXT NOT NULL,
  "claimReference" TEXT NOT NULL,
  "settlementReference" TEXT NOT NULL,
  "settlementType" "CargoClaimSettlementType" NOT NULL,
  "settlementStatus" "CargoClaimSettlementStatus" NOT NULL DEFAULT 'settled',
  "currencyCode" TEXT NOT NULL,
  "settlementAmount" DECIMAL(14,2) NOT NULL,
  "settledByName" TEXT NOT NULL,
  "counterpartyName" TEXT NOT NULL,
  "settlementSummary" TEXT NOT NULL,
  "settledAt" TIMESTAMP(3) NOT NULL,
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CargoClaimSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CargoClaimSettlement_organizationId_recordIdempotencyKey_key"
  ON "CargoClaimSettlement"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "CargoClaimSettlement_organizationId_settlementReference_key"
  ON "CargoClaimSettlement"("organizationId", "settlementReference");

CREATE UNIQUE INDEX "CargoClaimSettlement_organizationId_deliveryExceptionId_key"
  ON "CargoClaimSettlement"("organizationId", "deliveryExceptionId");

CREATE UNIQUE INDEX "CargoClaimSettlement_deliveryExceptionId_key"
  ON "CargoClaimSettlement"("deliveryExceptionId");

CREATE INDEX "CargoClaimSettlement_organizationId_cargoId_settledAt_idx"
  ON "CargoClaimSettlement"("organizationId", "cargoId", "settledAt");

CREATE INDEX "CargoClaimSettlement_organizationId_settlementType_settledAt_idx"
  ON "CargoClaimSettlement"("organizationId", "settlementType", "settledAt");

ALTER TABLE "CargoClaimSettlement"
  ADD CONSTRAINT "CargoClaimSettlement_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CargoClaimSettlement"
  ADD CONSTRAINT "CargoClaimSettlement_cargoId_fkey"
  FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CargoClaimSettlement"
  ADD CONSTRAINT "CargoClaimSettlement_deliveryExceptionId_fkey"
  FOREIGN KEY ("deliveryExceptionId") REFERENCES "CargoDeliveryException"("id") ON DELETE CASCADE ON UPDATE CASCADE;
