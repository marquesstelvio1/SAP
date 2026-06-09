CREATE TYPE "TransportOrderStatus" AS ENUM ('confirmed', 'cancelled');

CREATE TYPE "TransportOrderMode" AS ENUM (
  'rail',
  'road',
  'sea',
  'barge',
  'multimodal'
);

CREATE TABLE "TransportOrder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "trackingShipmentId" TEXT,
  "capacityReservationId" TEXT,
  "orderReference" TEXT NOT NULL,
  "status" "TransportOrderStatus" NOT NULL DEFAULT 'confirmed',
  "mode" "TransportOrderMode" NOT NULL,
  "carrierName" TEXT NOT NULL,
  "routeSummary" TEXT NOT NULL,
  "originName" TEXT NOT NULL,
  "destinationName" TEXT NOT NULL,
  "plannedDepartureAt" TIMESTAMP(3) NOT NULL,
  "plannedArrivalAt" TIMESTAMP(3) NOT NULL,
  "responsiblePlannerName" TEXT NOT NULL,
  "confirmationReference" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
  "confirmIdempotencyKey" TEXT,
  "confirmedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportOrder_organizationId_confirmIdempotencyKey_key"
  ON "TransportOrder"("organizationId", "confirmIdempotencyKey");

CREATE UNIQUE INDEX "TransportOrder_organizationId_orderReference_key"
  ON "TransportOrder"("organizationId", "orderReference");

CREATE UNIQUE INDEX "TransportOrder_organizationId_cargoId_key"
  ON "TransportOrder"("organizationId", "cargoId");

CREATE INDEX "TransportOrder_organizationId_status_plannedDepartureAt_idx"
  ON "TransportOrder"("organizationId", "status", "plannedDepartureAt");

CREATE INDEX "TransportOrder_organizationId_mode_plannedDepartureAt_idx"
  ON "TransportOrder"("organizationId", "mode", "plannedDepartureAt");

CREATE INDEX "TransportOrder_organizationId_trackingShipmentId_idx"
  ON "TransportOrder"("organizationId", "trackingShipmentId");

CREATE INDEX "TransportOrder_organizationId_capacityReservationId_idx"
  ON "TransportOrder"("organizationId", "capacityReservationId");

ALTER TABLE "TransportOrder"
  ADD CONSTRAINT "TransportOrder_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransportOrder"
  ADD CONSTRAINT "TransportOrder_cargoId_fkey"
  FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransportOrder"
  ADD CONSTRAINT "TransportOrder_trackingShipmentId_fkey"
  FOREIGN KEY ("trackingShipmentId") REFERENCES "TrackingShipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TransportOrder"
  ADD CONSTRAINT "TransportOrder_capacityReservationId_fkey"
  FOREIGN KEY ("capacityReservationId") REFERENCES "CapacitySlotReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
