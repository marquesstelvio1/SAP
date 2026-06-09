CREATE TYPE "TariffRateCardStatus" AS ENUM ('draft', 'active', 'retired');

CREATE TYPE "TariffChargeType" AS ENUM (
  'freight',
  'handling',
  'storage',
  'demurrage',
  'surcharge',
  'discount',
  'customs',
  'insurance',
  'other'
);

CREATE TYPE "TariffCalculationBasis" AS ENUM (
  'flat',
  'per_unit',
  'per_weight_kg',
  'per_volume_m3',
  'per_distance_km',
  'percentage'
);

CREATE TYPE "TariffQuoteStatus" AS ENUM ('calculated', 'approved', 'rejected', 'expired');

CREATE TABLE "TariffRateCard" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "rateCardCode" TEXT NOT NULL,
  "rateCardName" TEXT NOT NULL,
  "status" "TariffRateCardStatus" NOT NULL DEFAULT 'active',
  "currencyCode" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3),
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TariffRateCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TariffRateRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "rateCardId" TEXT NOT NULL,
  "ruleCode" TEXT NOT NULL,
  "chargeName" TEXT NOT NULL,
  "chargeType" "TariffChargeType" NOT NULL,
  "calculationBasis" "TariffCalculationBasis" NOT NULL,
  "unitRate" DECIMAL(14, 4),
  "flatAmount" DECIMAL(14, 2),
  "percentageRate" DECIMAL(8, 4),
  "minimumCharge" DECIMAL(14, 2),
  "originName" TEXT,
  "destinationName" TEXT,
  "cargoType" "CargoType",
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3),
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TariffRateRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TariffQuote" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "rateCardId" TEXT NOT NULL,
  "quoteReference" TEXT NOT NULL,
  "status" "TariffQuoteStatus" NOT NULL DEFAULT 'calculated',
  "currencyCode" TEXT NOT NULL,
  "quotedAmount" DECIMAL(14, 2) NOT NULL,
  "calculationPayload" JSONB NOT NULL,
  "calculatedByName" TEXT NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL,
  "approvedByName" TEXT,
  "approvalReference" TEXT,
  "approvalNotes" TEXT,
  "approvedAt" TIMESTAMP(3),
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "calculateIdempotencyKey" TEXT,
  "approveIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TariffQuote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TariffRateCard_organizationId_recordIdempotencyKey_key"
  ON "TariffRateCard"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "TariffRateCard_organizationId_rateCardCode_key"
  ON "TariffRateCard"("organizationId", "rateCardCode");

CREATE INDEX "TariffRateCard_organizationId_status_currencyCode_idx"
  ON "TariffRateCard"("organizationId", "status", "currencyCode");

CREATE INDEX "TariffRateCard_organizationId_validFrom_validUntil_idx"
  ON "TariffRateCard"("organizationId", "validFrom", "validUntil");

CREATE UNIQUE INDEX "TariffRateRule_organizationId_recordIdempotencyKey_key"
  ON "TariffRateRule"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "TariffRateRule_organizationId_rateCardId_ruleCode_key"
  ON "TariffRateRule"("organizationId", "rateCardId", "ruleCode");

CREATE INDEX "TariffRateRule_organizationId_rateCardId_chargeType_idx"
  ON "TariffRateRule"("organizationId", "rateCardId", "chargeType");

CREATE INDEX "TariffRateRule_organizationId_cargoType_chargeType_idx"
  ON "TariffRateRule"("organizationId", "cargoType", "chargeType");

CREATE INDEX "TariffRateRule_organizationId_effectiveFrom_effectiveUntil_idx"
  ON "TariffRateRule"("organizationId", "effectiveFrom", "effectiveUntil");

CREATE UNIQUE INDEX "TariffQuote_organizationId_calculateIdempotencyKey_key"
  ON "TariffQuote"("organizationId", "calculateIdempotencyKey");

CREATE UNIQUE INDEX "TariffQuote_organizationId_approveIdempotencyKey_key"
  ON "TariffQuote"("organizationId", "approveIdempotencyKey");

CREATE UNIQUE INDEX "TariffQuote_organizationId_quoteReference_key"
  ON "TariffQuote"("organizationId", "quoteReference");

CREATE INDEX "TariffQuote_organizationId_cargoId_status_idx"
  ON "TariffQuote"("organizationId", "cargoId", "status");

CREATE INDEX "TariffQuote_organizationId_rateCardId_status_idx"
  ON "TariffQuote"("organizationId", "rateCardId", "status");

CREATE INDEX "TariffQuote_organizationId_status_calculatedAt_idx"
  ON "TariffQuote"("organizationId", "status", "calculatedAt");

ALTER TABLE "TariffRateCard"
  ADD CONSTRAINT "TariffRateCard_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TariffRateRule"
  ADD CONSTRAINT "TariffRateRule_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TariffRateRule"
  ADD CONSTRAINT "TariffRateRule_rateCardId_fkey"
  FOREIGN KEY ("rateCardId") REFERENCES "TariffRateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TariffQuote"
  ADD CONSTRAINT "TariffQuote_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TariffQuote"
  ADD CONSTRAINT "TariffQuote_cargoId_fkey"
  FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TariffQuote"
  ADD CONSTRAINT "TariffQuote_rateCardId_fkey"
  FOREIGN KEY ("rateCardId") REFERENCES "TariffRateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
