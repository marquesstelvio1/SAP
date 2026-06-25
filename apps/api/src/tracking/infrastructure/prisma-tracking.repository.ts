import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";
import type { TrackingRepository } from "../domain/tracking.repository.js";

@Injectable()
export class PrismaTrackingRepository implements TrackingRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async findShipmentById(organizationId: string, id: string) {
    return this.database.trackingShipment.findFirst({
      where: { id, organizationId },
      select: { id: true, referenceCode: true, status: true, transportMode: true },
    });
  }

  async findShipmentWithEvents(organizationId: string, id: string, eventLimit: number) {
    return this.database.trackingShipment.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { events: true } },
        events: {
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
          take: eventLimit,
          select: {
            id: true,
            eventType: true,
            occurredAt: true,
            locationName: true,
            notes: true,
            payload: true,
            sourceSystem: true,
            correlationId: true,
            idempotencyKey: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findEventByIdempotencyKey(organizationId: string, idempotencyKey: string) {
    return this.database.trackingEvent.findFirst({
      where: { organizationId, idempotencyKey },
      include: {
        shipment: {
          select: { id: true, referenceCode: true, status: true },
        },
      },
    });
  }

  async countShipmentsByStatus(organizationId: string) {
    const groups = await this.database.trackingShipment.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    });
    return groups as Array<{ status: string; _count: { _all: number } }>;
  }

  async countShipmentsByModeAndStatus(organizationId: string) {
    const groups = await this.database.trackingShipment.groupBy({
      by: ["transportMode", "status"],
      where: { organizationId },
      _count: { _all: true },
    });
    return groups as Array<{ transportMode: string; status: string; _count: { _all: number } }>;
  }

  async countEventsByType(organizationId: string, windowStart: Date, windowEnd: Date) {
    const groups = await this.database.trackingEvent.groupBy({
      by: ["eventType"],
      where: {
        organizationId,
        occurredAt: { gte: windowStart, lte: windowEnd },
      },
      _count: { _all: true },
      _max: { occurredAt: true },
    });
    return groups as Array<{
      eventType: string;
      _count: { _all: number };
      _max: { occurredAt: Date | null };
    }>;
  }

  async findWorkflowEvents(organizationId: string, windowStart: Date, windowEnd: Date) {
    return this.database.trackingEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ["customs_hold", "delayed", "exception", "released"] },
        occurredAt: { gte: windowStart, lte: windowEnd },
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 1000,
      select: { payload: true },
    });
  }

  async findRecentShipments(organizationId: string, limit: number, offset: number) {
    return this.database.trackingShipment.findMany({
      where: { organizationId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
      include: {
        events: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { eventType: true, occurredAt: true, locationName: true },
        },
      },
    });
  }

  async countActiveShipments(organizationId: string, statusFilter: { notIn: readonly string[] }) {
    return this.database.trackingShipment.count({
      where: { organizationId, status: statusFilter as never },
    });
  }

  async countHighPriorityActiveShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
  ) {
    return this.database.trackingShipment.count({
      where: {
        organizationId,
        status: statusFilter as never,
        priority: { lte: 2 },
      },
    });
  }

  async countOverdueShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
    now: Date,
  ) {
    return this.database.trackingShipment.count({
      where: {
        organizationId,
        status: statusFilter as never,
        estimatedArrivalAt: { lt: now },
      },
    });
  }

  async countDueShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
    start: Date,
    end: Date,
  ) {
    return this.database.trackingShipment.count({
      where: {
        organizationId,
        status: statusFilter as never,
        estimatedArrivalAt: { gte: start, lte: end },
      },
    });
  }

  async countUnscheduledShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
  ) {
    return this.database.trackingShipment.count({
      where: {
        organizationId,
        status: statusFilter as never,
        estimatedArrivalAt: null,
      },
    });
  }

  async findActiveShipments(organizationId: string) {
    return this.database.trackingShipment.findMany({
      where: {
        organizationId,
        status: { notIn: ["completed", "cancelled"] as never },
      },
      orderBy: [{ priority: "asc" }, { estimatedArrivalAt: "asc" }, { updatedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        referenceCode: true,
        cargoDescription: true,
        transportMode: true,
        status: true,
        priority: true,
        estimatedArrivalAt: true,
        updatedAt: true,
      },
    });
  }

  async countShipments(organizationId: string) {
    return this.database.trackingShipment.count({ where: { organizationId } });
  }

  async createEvent(tx: PrismaTx, data: Record<string, unknown>) {
    const event = await tx.trackingEvent.create({
      data: data as never,
      include: {
        shipment: {
          select: { id: true, referenceCode: true, status: true },
        },
      },
    });
    return event as {
      id: string;
      eventType: string;
      occurredAt: Date;
      locationName: string | null;
      notes: string | null;
      payload: unknown;
      sourceSystem: string;
      correlationId: string;
      idempotencyKey: string | null;
      shipment: { id: string; referenceCode: string; status: string };
    };
  }

  async updateShipmentStatus(
    tx: PrismaTx,
    id: string,
    data: { status: string; actualArrivalAt?: Date },
  ) {
    return tx.trackingShipment.update({
      where: { id },
      data: data as never,
      select: { id: true, referenceCode: true, status: true },
    });
  }
}
