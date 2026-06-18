-- CreateEnum
CREATE TYPE "CargoStatus" AS ENUM ('registered', 'ready_for_transport', 'in_transport', 'held', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "CargoType" AS ENUM ('container', 'bulk', 'break_bulk', 'liquid_bulk', 'refrigerated', 'hazardous', 'vehicle', 'other');

-- CreateEnum
CREATE TYPE "CargoCustomsStatus" AS ENUM ('not_required', 'pending', 'cleared', 'held');

-- CreateEnum
CREATE TYPE "CargoConditionStatus" AS ENUM ('sound', 'damaged', 'requires_inspection');

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cargoReference" TEXT NOT NULL,
    "externalReference" TEXT,
    "cargoDescription" TEXT NOT NULL,
    "cargoType" "CargoType" NOT NULL,
    "status" "CargoStatus" NOT NULL DEFAULT 'registered',
    "customsStatus" "CargoCustomsStatus" NOT NULL DEFAULT 'pending',
    "customsReference" TEXT,
    "conditionStatus" "CargoConditionStatus" NOT NULL DEFAULT 'sound',
    "grossWeightKg" DECIMAL(12,3) NOT NULL,
    "packageCount" INTEGER NOT NULL,
    "volumeM3" DECIMAL(12,3),
    "hazardous" BOOLEAN NOT NULL DEFAULT false,
    "unNumber" TEXT,
    "hazardClass" TEXT,
    "requiresInspection" BOOLEAN NOT NULL DEFAULT false,
    "shipperName" TEXT NOT NULL,
    "consigneeName" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "custodyOwnerName" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "expectedReadyAt" TIMESTAMP(3),
    "sourceSystem" TEXT NOT NULL DEFAULT 'saptm',
    "registrationIdempotencyKey" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_organizationId_cargoReference_key" ON "Cargo"("organizationId", "cargoReference");

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_organizationId_registrationIdempotencyKey_key" ON "Cargo"("organizationId", "registrationIdempotencyKey");

-- CreateIndex
CREATE INDEX "Cargo_organizationId_status_expectedReadyAt_idx" ON "Cargo"("organizationId", "status", "expectedReadyAt");

-- CreateIndex
CREATE INDEX "Cargo_organizationId_cargoType_status_idx" ON "Cargo"("organizationId", "cargoType", "status");

-- CreateIndex
CREATE INDEX "Cargo_organizationId_customsStatus_conditionStatus_idx" ON "Cargo"("organizationId", "customsStatus", "conditionStatus");

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
