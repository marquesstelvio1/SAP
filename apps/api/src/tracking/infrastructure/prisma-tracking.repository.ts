import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";
import type { TrackingRepository } from "../domain/tracking.repository.js";

@Injectable()
export class PrismaTrackingRepository implements TrackingRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async findShipmentById(
    organizationId: string,
    id: string,
  ): Promise<{
    id: string;
    referenceCode: string;
    status: string;
    transportMode: string;
  } | null> {
    return this.database.trackingShipment.findFirst({
      where: { id, organizationId },
      select: { id: true, referenceCode: true, status: true, transportMode: true },
    }) as unknown as Promise<{
      id: string;
      referenceCode: string;
      status: string;
      transportMode: string;
    } | null>;
  }

  async findShipmentWithEvents(organizationId: string, id: string, eventLimit: number) {
    return this.database.trackingShipment.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { events: true } },
        team: {
          select: { id: true, name: true },
        },
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

  async findRecentShipments(
    organizationId: string,
    limit: number,
    offset: number,
    teamId?: string,
  ) {
    const where: Record<string, unknown> = { organizationId };

    if (teamId !== undefined) {
      where.teamId = teamId;
    }

    return this.database.trackingShipment.findMany({
      where: where as never,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
      include: {
        events: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { eventType: true, occurredAt: true, locationName: true },
        },
        team: {
          select: { id: true, name: true },
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

  async findActiveShipments(organizationId: string): Promise<
    Array<{
      id: string;
      referenceCode: string;
      cargoDescription: string;
      transportMode: string;
      status: string;
      priority: number;
      estimatedArrivalAt: Date | null;
      updatedAt: Date;
    }>
  > {
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
    }) as unknown as Promise<
      Array<{
        id: string;
        referenceCode: string;
        cargoDescription: string;
        transportMode: string;
        status: string;
        priority: number;
        estimatedArrivalAt: Date | null;
        updatedAt: Date;
      }>
    >;
  }

  async countShipments(organizationId: string) {
    return this.database.trackingShipment.count({ where: { organizationId } });
  }

  async countExceptionEvents(organizationId: string) {
    const groups = await this.database.trackingEvent.groupBy({
      by: ["eventType"],
      where: {
        organizationId,
        eventType: { in: ["exception", "customs_hold", "delayed"] },
      },
      _count: { _all: true },
    });
    return groups as Array<{ eventType: string; _count: { _all: number } }>;
  }

  async findRecentExceptionEvents(organizationId: string, limit: number, offset: number) {
    return this.database.trackingEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ["exception", "customs_hold", "delayed"] },
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
      select: {
        id: true,
        eventType: true,
        occurredAt: true,
        locationName: true,
        payload: true,
        shipment: {
          select: {
            id: true,
            referenceCode: true,
            transportMode: true,
          },
        },
      },
    }) as Promise<
      Array<{
        id: string;
        eventType: string;
        occurredAt: Date;
        locationName: string | null;
        payload: unknown;
        shipment: {
          id: string;
          referenceCode: string;
          transportMode: string;
        };
      }>
    >;
  }

  async createShipment(
    tx: PrismaTx,
    data: {
      organizationId: string;
      referenceCode: string;
      externalReference: string | null;
      cargoDescription: string;
      originName: string;
      destinationName: string;
      transportMode: string;
      status: string;
      priority: number;
      plannedDepartureAt: Date;
      estimatedArrivalAt: Date;
    },
  ) {
    return tx.trackingShipment.create({
      data,
      select: {
        id: true,
        organizationId: true,
        referenceCode: true,
        status: true,
        transportMode: true,
        plannedDepartureAt: true,
        estimatedArrivalAt: true,
        actualArrivalAt: true,
      },
    });
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

  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.database.$transaction(fn);
  }
}
