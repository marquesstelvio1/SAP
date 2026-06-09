-- Cargo compliance evidence: tenant-scoped document references with idempotent record/review lifecycle.
CREATE TYPE "CargoComplianceEvidenceType" AS ENUM (
  'bill_of_lading',
  'customs_declaration',
  'inspection_certificate',
  'hazardous_goods_declaration',
  'packing_list',
  'insurance_certificate',
  'release_authorization',
  'other'
);

CREATE TYPE "CargoComplianceEvidenceStatus" AS ENUM (
  'pending_review',
  'approved',
  'rejected'
);

CREATE TABLE "CargoComplianceEvidence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "evidenceType" "CargoComplianceEvidenceType" NOT NULL,
  "documentReference" TEXT NOT NULL,
  "documentTitle" TEXT NOT NULL,
  "documentUri" TEXT,
  "issuerName" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "status" "CargoComplianceEvidenceStatus" NOT NULL DEFAULT 'pending_review',
  "reviewerName" TEXT,
  "reviewReference" TEXT,
  "reviewSummary" TEXT,
  "rejectionReason" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "verifyIdempotencyKey" TEXT,
  "recordedByActorId" TEXT NOT NULL,
  "reviewedByActorId" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CargoComplianceEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CargoComplianceEvidence_organizationId_recordIdempotencyKey_key"
  ON "CargoComplianceEvidence"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "CargoComplianceEvidence_organizationId_verifyIdempotencyKey_key"
  ON "CargoComplianceEvidence"("organizationId", "verifyIdempotencyKey");

CREATE UNIQUE INDEX "CargoComplianceEvidence_organizationId_cargoId_evidenceType_documentReference_key"
  ON "CargoComplianceEvidence"("organizationId", "cargoId", "evidenceType", "documentReference");

CREATE INDEX "CargoComplianceEvidence_organizationId_cargoId_status_idx"
  ON "CargoComplianceEvidence"("organizationId", "cargoId", "status");

CREATE INDEX "CargoComplianceEvidence_organizationId_evidenceType_status_idx"
  ON "CargoComplianceEvidence"("organizationId", "evidenceType", "status");

CREATE INDEX "CargoComplianceEvidence_organizationId_expiresAt_idx"
  ON "CargoComplianceEvidence"("organizationId", "expiresAt");

ALTER TABLE "CargoComplianceEvidence"
  ADD CONSTRAINT "CargoComplianceEvidence_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "Organization"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "CargoComplianceEvidence"
  ADD CONSTRAINT "CargoComplianceEvidence_cargoId_fkey"
  FOREIGN KEY ("cargoId")
  REFERENCES "Cargo"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
