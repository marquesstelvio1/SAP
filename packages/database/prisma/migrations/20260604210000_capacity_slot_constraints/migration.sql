CREATE TYPE "CapacityResourceType" AS ENUM (
  'terminal',
  'gate',
  'berth',
  'rail_track',
  'yard',
  'carrier_slot'
);

CREATE TYPE "CapacitySlotStatus" AS ENUM ('open', 'blocked', 'closed');

CREATE TYPE "CapacityReservationPurpose" AS ENUM (
  'handoff',
  'departure',
  'arrival',
  'delivery',
  'storage',
  'other'
);

CREATE TYPE "CapacityReservationStatus" AS ENUM ('reserved', 'cancelled');

CREATE TABLE "CapacityResource" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "resourceCode" TEXT NOT NULL,
  "resourceName" TEXT NOT NULL,
  "resourceType" "CapacityResourceType" NOT NULL,
  "locationName" TEXT NOT NULL,
  "maxConcurrentBookings" INTEGER NOT NULL,
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CapacityResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CapacitySlot" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "slotReference" TEXT NOT NULL,
  "windowStartAt" TIMESTAMP(3) NOT NULL,
  "windowEndAt" TIMESTAMP(3) NOT NULL,
  "capacityUnits" INTEGER NOT NULL,
  "reservedUnits" INTEGER NOT NULL DEFAULT 0,
  "status" "CapacitySlotStatus" NOT NULL DEFAULT 'open',
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "recordIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CapacitySlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CapacitySlotReservation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "reservationReference" TEXT NOT NULL,
  "reservationPurpose" "CapacityReservationPurpose" NOT NULL,
  "status" "CapacityReservationStatus" NOT NULL DEFAULT 'reserved',
  "reservedUnits" INTEGER NOT NULL,
  "reservedByName" TEXT NOT NULL,
  "reservedAt" TIMESTAMP(3) NOT NULL,
  "cancellationReference" TEXT,
  "cancelledByName" TEXT,
  "cancellationReason" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "reserveIdempotencyKey" TEXT,
  "cancelIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CapacitySlotReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CapacityResource_organizationId_recordIdempotencyKey_key"
  ON "CapacityResource"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "CapacityResource_organizationId_resourceCode_key"
  ON "CapacityResource"("organizationId", "resourceCode");

CREATE INDEX "CapacityResource_organizationId_resourceType_locationName_idx"
  ON "CapacityResource"("organizationId", "resourceType", "locationName");

CREATE UNIQUE INDEX "CapacitySlot_organizationId_recordIdempotencyKey_key"
  ON "CapacitySlot"("organizationId", "recordIdempotencyKey");

CREATE UNIQUE INDEX "CapacitySlot_organizationId_slotReference_key"
  ON "CapacitySlot"("organizationId", "slotReference");

CREATE INDEX "CapacitySlot_organizationId_resourceId_windowStartAt_idx"
  ON "CapacitySlot"("organizationId", "resourceId", "windowStartAt");

CREATE INDEX "CapacitySlot_organizationId_status_windowStartAt_idx"
  ON "CapacitySlot"("organizationId", "status", "windowStartAt");

CREATE UNIQUE INDEX "CapacitySlotReservation_organizationId_reserveIdempotencyKey_key"
  ON "CapacitySlotReservation"("organizationId", "reserveIdempotencyKey");

CREATE UNIQUE INDEX "CapacitySlotReservation_organizationId_cancelIdempotencyKey_key"
  ON "CapacitySlotReservation"("organizationId", "cancelIdempotencyKey");

CREATE UNIQUE INDEX "CapacitySlotReservation_organizationId_reservationReference_key"
  ON "CapacitySlotReservation"("organizationId", "reservationReference");

CREATE UNIQUE INDEX "CapacitySlotReservation_organizationId_cargoId_slotId_reservationPurpose_key"
  ON "CapacitySlotReservation"("organizationId", "cargoId", "slotId", "reservationPurpose");

CREATE INDEX "CapacitySlotReservation_organizationId_cargoId_status_idx"
  ON "CapacitySlotReservation"("organizationId", "cargoId", "status");

CREATE INDEX "CapacitySlotReservation_organizationId_slotId_status_idx"
  ON "CapacitySlotReservation"("organizationId", "slotId", "status");

CREATE INDEX "CapacitySlotReservation_organizationId_status_reservedAt_idx"
  ON "CapacitySlotReservation"("organizationId", "status", "reservedAt");

ALTER TABLE "CapacityResource"
  ADD CONSTRAINT "CapacityResource_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacitySlot"
  ADD CONSTRAINT "CapacitySlot_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacitySlot"
  ADD CONSTRAINT "CapacitySlot_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "CapacityResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacitySlotReservation"
  ADD CONSTRAINT "CapacitySlotReservation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacitySlotReservation"
  ADD CONSTRAINT "CapacitySlotReservation_cargoId_fkey"
  FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CapacitySlotReservation"
  ADD CONSTRAINT "CapacitySlotReservation_slotId_fkey"
  FOREIGN KEY ("slotId") REFERENCES "CapacitySlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
