import type { PrismaTx } from "@saptm/database";

export const TRACKING_REPOSITORY = Symbol("TrackingRepository");

export interface TrackingRepository {
  // Read operations
  findShipmentById(
    organizationId: string,
    id: string,
  ): Promise<{
    id: string;
    referenceCode: string;
    status: string;
    transportMode: string;
  } | null>;

  findShipmentWithEvents(
    organizationId: string,
    id: string,
    eventLimit: number,
  ): Promise<{
    id: string;
    referenceCode: string;
    externalReference: string | null;
    cargoDescription: string;
    originName: string;
    destinationName: string;
    transportMode: string;
    status: string;
    priority: number;
    plannedDepartureAt: Date | null;
    estimatedArrivalAt: Date | null;
    actualArrivalAt: Date | null;
    teamId: string | null;
    team: { id: string; name: string } | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { events: number };
    events: Array<{
      id: string;
      eventType: string;
      occurredAt: Date;
      locationName: string | null;
      notes: string | null;
      payload: unknown;
      sourceSystem: string;
      correlationId: string;
      idempotencyKey: string | null;
      createdAt: Date;
    }>;
  } | null>;

  findEventByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<{
    id: string;
    eventType: string;
    occurredAt: Date;
    locationName: string | null;
    notes: string | null;
    payload: unknown;
    sourceSystem: string;
    correlationId: string;
    idempotencyKey: string | null;
    shipment: {
      id: string;
      referenceCode: string;
      status: string;
    };
  } | null>;

  countShipmentsByStatus(organizationId: string): Promise<
    Array<{
      status: string;
      _count: { _all: number };
    }>
  >;

  countShipmentsByModeAndStatus(organizationId: string): Promise<
    Array<{
      transportMode: string;
      status: string;
      _count: { _all: number };
    }>
  >;

  countEventsByType(
    organizationId: string,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<
    Array<{
      eventType: string;
      _count: { _all: number };
      _max: { occurredAt: Date | null };
    }>
  >;

  findWorkflowEvents(
    organizationId: string,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<Array<{ payload: unknown }>>;

  findRecentShipments(
    organizationId: string,
    limit: number,
    offset: number,
    teamId?: string,
  ): Promise<
    Array<{
      id: string;
      referenceCode: string;
      externalReference: string | null;
      cargoDescription: string;
      originName: string;
      destinationName: string;
      transportMode: string;
      status: string;
      priority: number;
      teamId: string | null;
      team: { id: string; name: string } | null;
      estimatedArrivalAt: Date | null;
      updatedAt: Date;
      createdAt: Date;
      events: Array<{
        eventType: string;
        occurredAt: Date;
        locationName: string | null;
      }>;
    }>
  >;

  countActiveShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
  ): Promise<number>;
  countOverdueShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
    now: Date,
  ): Promise<number>;
  countDueShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
    start: Date,
    end: Date,
  ): Promise<number>;
  countUnscheduledShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
  ): Promise<number>;

  countHighPriorityActiveShipments(
    organizationId: string,
    statusFilter: { notIn: readonly string[] },
  ): Promise<number>;

  findActiveShipments(organizationId: string): Promise<
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

  countShipments(organizationId: string): Promise<number>;

  countExceptionEvents(organizationId: string): Promise<
    Array<{
      eventType: string;
      _count: { _all: number };
    }>
  >;

  findRecentExceptionEvents(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<
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

  // Write operations
  createShipment(
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
  ): Promise<{
    id: string;
    organizationId: string;
    referenceCode: string;
    status: string;
    transportMode: string;
    plannedDepartureAt: Date;
    estimatedArrivalAt: Date;
    actualArrivalAt: Date | null;
  }>;

  createEvent(
    tx: PrismaTx,
    data: Record<string, unknown>,
  ): Promise<{
    id: string;
    eventType: string;
    occurredAt: Date;
    locationName: string | null;
    notes: string | null;
    payload: unknown;
    sourceSystem: string;
    correlationId: string;
    idempotencyKey: string | null;
    shipment: {
      id: string;
      referenceCode: string;
      status: string;
    };
  }>;

  updateShipmentStatus(
    tx: PrismaTx,
    id: string,
    data: { status: string; actualArrivalAt?: Date },
  ): Promise<{
    id: string;
    referenceCode: string;
    status: string;
  }>;

  // Transaction support
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}
