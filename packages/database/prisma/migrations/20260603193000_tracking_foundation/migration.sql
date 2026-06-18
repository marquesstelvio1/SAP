-- CreateEnum
CREATE TYPE "TrackingShipmentStatus" AS ENUM ('planned', 'in_transit', 'delayed', 'exception', 'arrived', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TrackingTransportMode" AS ENUM ('rail', 'port', 'road', 'multimodal');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('created', 'departed', 'arrived', 'delayed', 'exception', 'location_updated', 'handover_completed', 'customs_hold', 'released');

-- CreateTable
CREATE TABLE "TrackingShipment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "externalReference" TEXT,
    "cargoDescription" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "transportMode" "TrackingTransportMode" NOT NULL,
    "status" "TrackingShipmentStatus" NOT NULL DEFAULT 'planned',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "plannedDepartureAt" TIMESTAMP(3),
    "estimatedArrivalAt" TIMESTAMP(3),
    "actualArrivalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "eventType" "TrackingEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT,
    "notes" TEXT,
    "payload" JSONB,
    "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingShipment_organizationId_referenceCode_key" ON "TrackingShipment"("organizationId", "referenceCode");

-- CreateIndex
CREATE INDEX "TrackingShipment_organizationId_status_estimatedArrivalAt_idx" ON "TrackingShipment"("organizationId", "status", "estimatedArrivalAt");

-- CreateIndex
CREATE INDEX "TrackingShipment_organizationId_transportMode_status_idx" ON "TrackingShipment"("organizationId", "transportMode", "status");

-- CreateIndex
CREATE INDEX "TrackingEvent_organizationId_eventType_occurredAt_idx" ON "TrackingEvent"("organizationId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "TrackingEvent_shipmentId_occurredAt_idx" ON "TrackingEvent"("shipmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "TrackingEvent_correlationId_idx" ON "TrackingEvent"("correlationId");

-- AddForeignKey
ALTER TABLE "TrackingShipment" ADD CONSTRAINT "TrackingShipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "TrackingShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
