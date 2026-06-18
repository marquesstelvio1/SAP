-- Cargo release governance: idempotent release, audit correlation, and readiness state.
ALTER TABLE "Cargo"
  ADD COLUMN "releaseIdempotencyKey" TEXT,
  ADD COLUMN "releaseReference" TEXT,
  ADD COLUMN "releaseReason" TEXT,
  ADD COLUMN "releasedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Cargo_organizationId_releaseIdempotencyKey_key"
  ON "Cargo"("organizationId", "releaseIdempotencyKey");

CREATE INDEX "Cargo_organizationId_status_releasedAt_idx"
  ON "Cargo"("organizationId", "status", "releasedAt");
