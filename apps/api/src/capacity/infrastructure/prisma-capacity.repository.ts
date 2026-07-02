import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";
import type {
  CapacityAdvisoryDecisionRecord,
  CapacityCargoRecord,
  CapacityReservationStatus,
  CapacityResourceRecord,
  CapacitySlotReservationRecord,
  CapacitySlotReservationWithSlotCargo,
  CapacitySlotStatus,
  CapacitySlotStatusGroup,
  CapacitySlotWithResource,
} from "../domain/capacity.business-rules.js";
import type {
  CapacityAdvisoryDecisionCreateInput,
  CapacityRepository,
  CapacityResourceCreateInput,
  CapacitySlotCreateInput,
  CapacitySlotReservationCreateInput,
  CapacitySlotWithResourceSummary,
} from "../domain/capacity.repository.js";

const capacityReservationInclude = {
  cargo: {
    select: {
      id: true,
      organizationId: true,
      cargoReference: true,
      cargoDescription: true,
      status: true,
      custodyOwnerName: true,
    },
  },
  slot: {
    include: {
      resource: true,
    },
  },
} as const;

@Injectable()
export class PrismaCapacityRepository implements CapacityRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async countResources(organizationId: string): Promise<number> {
    return this.database.capacityResource.count({
      where: { organizationId },
    });
  }

  async groupSlotStatuses(organizationId: string): Promise<CapacitySlotStatusGroup[]> {
    const groups = await this.database.capacitySlot.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    });
    return groups as CapacitySlotStatusGroup[];
  }

  async countActiveReservations(organizationId: string): Promise<number> {
    return this.database.capacitySlotReservation.count({
      where: { organizationId, status: "reserved" },
    });
  }

  async findUpcomingSlots(organizationId: string, limit: number) {
    return this.database.capacitySlot.findMany({
      where: { organizationId },
      include: { resource: true },
      orderBy: [{ windowStartAt: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  async findRecentReservations(organizationId: string, limit: number) {
    return this.database.capacitySlotReservation.findMany({
      where: { organizationId },
      include: capacityReservationInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    }) as Promise<CapacitySlotReservationWithSlotCargo[]>;
  }

  async findOpenSlots(organizationId: string, limit: number) {
    return this.database.capacitySlot.findMany({
      where: { organizationId, status: "open" },
      include: { resource: true },
      orderBy: [{ windowEndAt: "asc" }, { reservedUnits: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });
  }

  async findRecentReservationsForAdvisory(organizationId: string, limit: number) {
    return this.database.capacitySlotReservation.findMany({
      where: { organizationId },
      include: capacityReservationInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    }) as Promise<CapacitySlotReservationWithSlotCargo[]>;
  }

  async findAdvisoryDecisionsInWindow(
    organizationId: string,
    windowStart: Date,
    windowEnd: Date,
    limit: number,
  ): Promise<CapacityAdvisoryDecisionRecord[]> {
    return this.database.capacityAdvisoryDecision.findMany({
      where: {
        organizationId,
        decidedAt: { gte: windowStart, lte: windowEnd },
      },
      orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
      take: Math.min(limit, 1_000),
    }) as Promise<CapacityAdvisoryDecisionRecord[]>;
  }

  // Resource lookups

  async findResourceByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacityResourceRecord | null> {
    return this.database.capacityResource.findFirst({
      where: { organizationId, recordIdempotencyKey: idempotencyKey },
    });
  }

  async findResourceByCode(
    organizationId: string,
    resourceCode: string,
  ): Promise<CapacityResourceRecord | null> {
    return this.database.capacityResource.findFirst({
      where: { organizationId, resourceCode },
    });
  }

  async findResourceById(
    organizationId: string,
    resourceId: string,
  ): Promise<CapacityResourceRecord | null> {
    return this.database.capacityResource.findFirst({
      where: { id: resourceId, organizationId },
    });
  }

  // Slot lookups

  async findSlotByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotWithResource | null> {
    return this.database.capacitySlot.findFirst({
      where: { organizationId, recordIdempotencyKey: idempotencyKey },
      include: { resource: true },
    });
  }

  async findSlotByReference(
    organizationId: string,
    slotReference: string,
  ): Promise<CapacitySlotWithResource | null> {
    return this.database.capacitySlot.findFirst({
      where: { organizationId, slotReference },
      include: { resource: true },
    });
  }

  async findSlotById(
    organizationId: string,
    slotId: string,
  ): Promise<CapacitySlotWithResource | null> {
    return this.database.capacitySlot.findFirst({
      where: { id: slotId, organizationId },
      include: { resource: true },
    });
  }

  // Reservation lookups

  async findReservationByReserveIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: { organizationId, reserveIdempotencyKey: idempotencyKey },
      include: capacityReservationInclude,
    }) as Promise<CapacitySlotReservationWithSlotCargo | null>;
  }

  async findReservationByCancelIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: { organizationId, cancelIdempotencyKey: idempotencyKey },
      include: capacityReservationInclude,
    }) as Promise<CapacitySlotReservationWithSlotCargo | null>;
  }

  async findReservationById(
    organizationId: string,
    reservationId: string,
  ): Promise<CapacitySlotReservationWithSlotCargo | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: { id: reservationId, organizationId },
      include: capacityReservationInclude,
    }) as Promise<CapacitySlotReservationWithSlotCargo | null>;
  }

  async findReservationByReference(
    organizationId: string,
    reservationReference: string,
  ): Promise<CapacitySlotReservationRecord | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: { organizationId, reservationReference },
    });
  }

  async findReservationByCargoSlotPurpose(
    organizationId: string,
    cargoId: string,
    slotId: string,
    reservationPurpose: string,
  ): Promise<CapacitySlotReservationRecord | null> {
    return this.database.capacitySlotReservation.findFirst({
      where: { organizationId, cargoId, slotId, reservationPurpose },
    });
  }

  // Cargo lookup

  async findCargoById(
    organizationId: string,
    cargoId: string,
  ): Promise<CapacityCargoRecord | null> {
    return this.database.cargo.findFirst({
      where: { id: cargoId, organizationId },
      select: {
        id: true,
        organizationId: true,
        cargoReference: true,
        cargoDescription: true,
        status: true,
        custodyOwnerName: true,
      },
    }) as Promise<CapacityCargoRecord | null>;
  }

  // Advisory decision lookups

  async findAdvisoryDecisionByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<CapacityAdvisoryDecisionRecord | null> {
    return this.database.capacityAdvisoryDecision.findFirst({
      where: { organizationId, decisionIdempotencyKey: idempotencyKey },
    });
  }

  async findAdvisoryDecisionByRecommendationId(
    organizationId: string,
    recommendationId: string,
  ): Promise<CapacityAdvisoryDecisionRecord | null> {
    return this.database.capacityAdvisoryDecision.findFirst({
      where: { organizationId, recommendationId },
    });
  }

  // Transactional writes

  async createResource(
    tx: PrismaTx,
    data: CapacityResourceCreateInput,
  ): Promise<CapacityResourceRecord> {
    return tx.capacityResource.create({ data }) as Promise<CapacityResourceRecord>;
  }

  async createSlot(
    tx: PrismaTx,
    data: CapacitySlotCreateInput,
  ): Promise<CapacitySlotWithResourceSummary> {
    return tx.capacitySlot.create({
      data,
      include: { resource: true },
    }) as Promise<CapacitySlotWithResourceSummary>;
  }

  async updateSlotReservedUnitsIncrement(
    tx: PrismaTx,
    slotId: string,
    organizationId: string,
    status: CapacitySlotStatus,
    maxReservedUnits: number,
    increment: number,
  ): Promise<{ count: number }> {
    return tx.capacitySlot.updateMany({
      where: {
        id: slotId,
        organizationId,
        status,
        reservedUnits: { lte: maxReservedUnits },
      },
      data: { reservedUnits: { increment } },
    }) as Promise<{ count: number }>;
  }

  async createReservation(
    tx: PrismaTx,
    data: CapacitySlotReservationCreateInput,
  ): Promise<CapacitySlotReservationWithSlotCargo> {
    const result = await tx.capacitySlotReservation.create({
      data,
      include: capacityReservationInclude,
    });
    return result as CapacitySlotReservationWithSlotCargo;
  }

  async updateReservationCancel(
    tx: PrismaTx,
    reservationId: string,
    organizationId: string,
    currentStatus: CapacityReservationStatus,
    data: {
      status: CapacityReservationStatus;
      cancellationReference: string;
      cancelledByName: string;
      cancellationReason: string;
      cancelledAt: Date;
      cancelIdempotencyKey: string;
    },
  ): Promise<{ count: number }> {
    return tx.capacitySlotReservation.updateMany({
      where: { id: reservationId, organizationId, status: currentStatus },
      data,
    }) as Promise<{ count: number }>;
  }

  async updateSlotReservedUnitsDecrement(
    tx: PrismaTx,
    slotId: string,
    decrement: number,
  ): Promise<void> {
    await tx.capacitySlot.update({
      where: { id: slotId },
      data: { reservedUnits: { decrement } },
    });
  }

  async findReservationByIdAfterUpdate(
    tx: PrismaTx,
    reservationId: string,
    organizationId: string,
  ): Promise<CapacitySlotReservationWithSlotCargo> {
    return tx.capacitySlotReservation.findFirstOrThrow({
      where: { id: reservationId, organizationId },
      include: capacityReservationInclude,
    }) as Promise<CapacitySlotReservationWithSlotCargo>;
  }

  async createAdvisoryDecision(
    tx: PrismaTx,
    data: CapacityAdvisoryDecisionCreateInput,
  ): Promise<CapacityAdvisoryDecisionRecord> {
    const raw = await tx.capacityAdvisoryDecision.create({ data: data as never });
    return raw as unknown as CapacityAdvisoryDecisionRecord;
  }

  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.database.$transaction(fn);
  }
}
