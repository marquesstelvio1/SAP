CREATE TYPE "CapacityAdvisoryRecommendationType" AS ENUM (
  'slot_saturation',
  'expiring_slot',
  'unused_capacity',
  'reservation_imbalance',
  'cancellation_review'
);

CREATE TYPE "CapacityAdvisoryDecisionStatus" AS ENUM ('approved', 'rejected');

CREATE TABLE "CapacityAdvisoryDecision" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "recommendationId" TEXT NOT NULL,
  "recommendationType" "CapacityAdvisoryRecommendationType" NOT NULL,
  "decisionStatus" "CapacityAdvisoryDecisionStatus" NOT NULL,
  "decidedByName" TEXT NOT NULL,
  "decisionReason" TEXT NOT NULL,
  "approvalReference" TEXT,
  "requiredPermission" TEXT NOT NULL,
  "slotId" TEXT,
  "reservationId" TEXT,
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "decisionIdempotencyKey" TEXT,
  "decidedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CapacityAdvisoryDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CapacityAdvisoryDecision_organizationId_decisionIdempotencyKey_key"
  ON "CapacityAdvisoryDecision"("organizationId", "decisionIdempotencyKey");

CREATE UNIQUE INDEX "CapacityAdvisoryDecision_organizationId_recommendationId_key"
  ON "CapacityAdvisoryDecision"("organizationId", "recommendationId");

CREATE INDEX "CapacityAdvisoryDecision_organizationId_decisionStatus_decidedAt_idx"
  ON "CapacityAdvisoryDecision"("organizationId", "decisionStatus", "decidedAt");

CREATE INDEX "CapacityAdvisoryDecision_organizationId_recommendationType_decidedAt_idx"
  ON "CapacityAdvisoryDecision"("organizationId", "recommendationType", "decidedAt");

CREATE INDEX "CapacityAdvisoryDecision_organizationId_slotId_decidedAt_idx"
  ON "CapacityAdvisoryDecision"("organizationId", "slotId", "decidedAt");

CREATE INDEX "CapacityAdvisoryDecision_organizationId_reservationId_decidedAt_idx"
  ON "CapacityAdvisoryDecision"("organizationId", "reservationId", "decidedAt");

ALTER TABLE "CapacityAdvisoryDecision"
  ADD CONSTRAINT "CapacityAdvisoryDecision_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacityAdvisoryDecision"
  ADD CONSTRAINT "CapacityAdvisoryDecision_slotId_fkey"
  FOREIGN KEY ("slotId") REFERENCES "CapacitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CapacityAdvisoryDecision"
  ADD CONSTRAINT "CapacityAdvisoryDecision_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "CapacitySlotReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
