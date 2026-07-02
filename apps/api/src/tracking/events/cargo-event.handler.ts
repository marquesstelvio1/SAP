import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Inject, Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx } from "@saptm/database";
import type { Subscription } from "rxjs";
import type { EventBusService } from "../../event-bus/event-bus.service.js";
// biome-ignore lint/style/useImportType: NestJS DI needs runtime class reference
import { OutboxEventBusAdapter } from "../../event-bus/outbox-event-bus.adapter.js";
import type {
  TrackingEventType,
  TrackingShipmentStatus,
} from "../domain/tracking.business-rules.js";
import { resolveShipmentStatusAfterEvent } from "../domain/tracking.business-rules.js";
import { TRACKING_REPOSITORY, type TrackingRepository } from "../domain/tracking.repository.js";

type CargoTransportPlannedPayload = {
  cargoId: string;
  cargoReference: string;
  shipmentId: string;
  shipmentReferenceCode: string;
  transportMode: string;
  plannedDepartureAt: string | null;
  estimatedArrivalAt: string | null;
  operationsOwnerTeam: string | null;
  planningReference: string | null;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
  sourceSystem: string;
};

type CargoTransportDepartedPayload = {
  cargoId: string;
  cargoReference: string;
  trackingShipmentId: string;
  shipmentReferenceCode: string;
  transportMode: string;
  eventType: string;
  departedAt: string;
  locationName: string | null;
  notes: string | null;
  operatorName: string;
  documentReference: string | null;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
  sourceSystem: string;
};

type CargoTransportArrivedPayload = {
  cargoId: string;
  cargoReference: string;
  trackingShipmentId: string;
  shipmentReferenceCode: string;
  transportMode: string;
  eventType: string;
  arrivedAt: string;
  locationName: string | null;
  notes: string | null;
  documentReference: string | null;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
  sourceSystem: string;
};

type CargoDeliveryCompletedPayload = {
  cargoId: string;
  cargoReference: string;
  trackingShipmentId: string;
  shipmentReferenceCode: string;
  completedAt: string;
  locationName: string | null;
  notes: string | null;
  deliveryDocumentReference: string;
  consigneeName: string;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
  sourceSystem: string;
};

type CargoDeliveryExceptionRecordedPayload = {
  cargoId: string;
  cargoReference: string;
  trackingShipmentId: string;
  shipmentReferenceCode: string;
  eventType: string;
  exceptionType: string;
  severity: string;
  occurredAt: string;
  summary: string;
  locationName: string | null;
  notes: string | null;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
  sourceSystem: string;
};

type CargoDeliveryExceptionResolvedPayload = {
  cargoId: string;
  cargoReference: string;
  trackingShipmentId: string;
  shipmentReferenceCode: string;
  eventType: string;
  occurredAt: string;
  resolutionCode: string;
  resolutionNotes: string;
  locationName: string | null;
  nextStatus: string;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
  sourceSystem: string;
};

type CargoOperationalHandoffRecordedPayload = {
  cargoId: string;
  cargoReference: string;
  trackingShipmentId: string;
  shipmentReferenceCode: string;
  eventType: string;
  handoffType: string;
  occurredAt: string;
  fromOperator: string;
  toOperator: string;
  locationName: string | null;
  notes: string | null;
  documentReference: string | null;
  appliedRules: string[];
  idempotencyKey: string;
  correlationId: string;
  sourceSystem: string;
};

@Injectable()
export class CargoTrackingEventHandler implements OnModuleInit, OnModuleDestroy {
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(TRACKING_REPOSITORY) private readonly trackingRepo: TrackingRepository,
    private readonly eventBus: EventBusService,
    private readonly eventBusOutbox: OutboxEventBusAdapter,
  ) {}

  onModuleInit(): void {
    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: CargoTransportPlannedPayload;
      }>("cargo.transport_planned", async (event) => {
        await this.handleTransportPlanned(event.organizationId, event.payload);
      }),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: CargoTransportDepartedPayload;
      }>("cargo.transport_departed", async (event) => {
        await this.handleTransportDeparted(event.organizationId, event.payload);
      }),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: CargoTransportArrivedPayload;
      }>("cargo.transport_arrived", async (event) => {
        await this.handleTransportArrived(event.organizationId, event.payload);
      }),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: CargoDeliveryCompletedPayload;
      }>("cargo.delivery_completed", async (event) => {
        await this.handleDeliveryCompleted(event.organizationId, event.payload);
      }),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: CargoDeliveryExceptionRecordedPayload;
      }>("cargo.delivery_exception.recorded", async (event) => {
        await this.handleDeliveryExceptionRecorded(event.organizationId, event.payload);
      }),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: CargoDeliveryExceptionResolvedPayload;
      }>("cargo.delivery_exception.resolved", async (event) => {
        await this.handleDeliveryExceptionResolved(event.organizationId, event.payload);
      }),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: CargoOperationalHandoffRecordedPayload;
      }>("cargo.operational_handoff.recorded", async (event) => {
        await this.handleOperationalHandoffRecorded(event.organizationId, event.payload);
      }),
    );

    this.subscriptions.push(
      this.eventBus.subscribe<{
        organizationId: string;
        payload: {
          cargoId: string;
          cargoReference: string;
          idempotencyKey: string;
          correlationId: string;
          sourceSystem: string;
          [key: string]: unknown;
        };
      }>("cargo.registered", async (_event) => {
        // No-op: tracking is created when transport is planned.
      }),
    );
  }

  onModuleDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  private async handleTransportPlanned(
    organizationId: string,
    payload: CargoTransportPlannedPayload,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx: PrismaTx) => {
      const existing = await this.trackingRepo.findShipmentById(organizationId, payload.shipmentId);

      if (existing !== null) {
        // Shipment already created (replay/retry)
        return existing;
      }

      const shipment = await this.trackingRepo.createShipment(tx, {
        organizationId,
        referenceCode: payload.shipmentReferenceCode,
        externalReference: null,
        cargoDescription: payload.cargoReference,
        originName: "",
        destinationName: "",
        transportMode: payload.transportMode,
        status: "planned",
        priority: 0,
        plannedDepartureAt:
          payload.plannedDepartureAt !== null ? new Date(payload.plannedDepartureAt) : new Date(),
        estimatedArrivalAt:
          payload.estimatedArrivalAt !== null ? new Date(payload.estimatedArrivalAt) : new Date(),
      });

      await this.trackingRepo.createEvent(tx, {
        organizationId,
        shipmentId: shipment.id,
        eventType: "created",
        occurredAt: new Date(),
        sourceSystem: payload.sourceSystem,
        correlationId: payload.correlationId,
        idempotencyKey: `cargo_plan_${payload.idempotencyKey}`,
        payload: {
          cargoId: payload.cargoId,
          cargoReference: payload.cargoReference,
          plannedDepartureAt: payload.plannedDepartureAt,
          estimatedArrivalAt: payload.estimatedArrivalAt,
        },
      });

      await this.eventBusOutbox.publish(tx, {
        organizationId,
        eventType: "tracking.shipment.created",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        eventVersion: 1,
        payload: {
          shipmentId: shipment.id,
          referenceCode: payload.shipmentReferenceCode,
          transportMode: payload.transportMode,
          status: "planned",
          cargoId: payload.cargoId,
          correlationId: payload.correlationId,
        },
      });

      return shipment;
    });
  }

  private async handleTransportDeparted(
    organizationId: string,
    payload: CargoTransportDepartedPayload,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx: PrismaTx) => {
      const shipment = await this.trackingRepo.findShipmentById(
        organizationId,
        payload.trackingShipmentId,
      );

      if (shipment === null) {
        return; // Shipment should exist; skip if not (eventual consistency edge case)
      }

      const eventType: TrackingEventType = payload.eventType as TrackingEventType;
      const currentStatus = shipment.status as TrackingShipmentStatus;
      const nextStatus = resolveShipmentStatusAfterEvent(eventType, currentStatus);

      const event = await this.trackingRepo.createEvent(tx, {
        organizationId,
        shipmentId: shipment.id,
        eventType: "departed",
        occurredAt: new Date(payload.departedAt),
        sourceSystem: payload.sourceSystem,
        correlationId: payload.correlationId,
        idempotencyKey: `cargo_depart_${payload.idempotencyKey}`,
        locationName: payload.locationName ?? null,
        notes: payload.notes ?? null,
        payload: {
          operatorName: payload.operatorName,
          documentReference: payload.documentReference ?? null,
          transportMode: payload.transportMode,
          cargoId: payload.cargoId,
        },
      });

      if (nextStatus !== currentStatus) {
        await this.trackingRepo.updateShipmentStatus(tx, shipment.id, {
          status: nextStatus,
        });
      }

      await this.eventBusOutbox.publish(tx, {
        organizationId,
        eventType: "tracking.event.recorded",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        eventVersion: 1,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: payload.shipmentReferenceCode,
          eventType: "departed",
          occurredAt: payload.departedAt,
          previousStatus: currentStatus,
          currentStatus: nextStatus,
          correlationId: payload.correlationId,
        },
      });
    });
  }

  private async handleTransportArrived(
    organizationId: string,
    payload: CargoTransportArrivedPayload,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx: PrismaTx) => {
      const shipment = await this.trackingRepo.findShipmentById(
        organizationId,
        payload.trackingShipmentId,
      );

      if (shipment === null) {
        return;
      }

      const currentStatus = shipment.status as TrackingShipmentStatus;
      const nextStatus = resolveShipmentStatusAfterEvent(
        "arrived" as TrackingEventType,
        currentStatus,
      );

      const event = await this.trackingRepo.createEvent(tx, {
        organizationId,
        shipmentId: shipment.id,
        eventType: "arrived",
        occurredAt: new Date(payload.arrivedAt),
        sourceSystem: payload.sourceSystem,
        correlationId: payload.correlationId,
        idempotencyKey: `cargo_arrive_${payload.idempotencyKey}`,
        locationName: payload.locationName ?? null,
        notes: payload.notes ?? null,
        payload: {
          documentReference: payload.documentReference ?? null,
          transportMode: payload.transportMode,
          cargoId: payload.cargoId,
        },
      });

      if (nextStatus !== currentStatus) {
        await this.trackingRepo.updateShipmentStatus(tx, shipment.id, {
          status: nextStatus,
          actualArrivalAt: new Date(payload.arrivedAt),
        });
      }

      await this.eventBusOutbox.publish(tx, {
        organizationId,
        eventType: "tracking.event.recorded",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        eventVersion: 1,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: payload.shipmentReferenceCode,
          eventType: "arrived",
          occurredAt: payload.arrivedAt,
          previousStatus: currentStatus,
          currentStatus: nextStatus,
          correlationId: payload.correlationId,
        },
      });
    });
  }

  private async handleDeliveryCompleted(
    organizationId: string,
    payload: CargoDeliveryCompletedPayload,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx: PrismaTx) => {
      const shipment = await this.trackingRepo.findShipmentById(
        organizationId,
        payload.trackingShipmentId,
      );

      if (shipment === null) {
        return;
      }

      const currentStatus = shipment.status as TrackingShipmentStatus;
      const nextStatus = resolveShipmentStatusAfterEvent("completed" as never, currentStatus);

      const event = await this.trackingRepo.createEvent(tx, {
        organizationId,
        shipmentId: shipment.id,
        eventType: "completed",
        occurredAt: new Date(payload.completedAt),
        sourceSystem: payload.sourceSystem,
        correlationId: payload.correlationId,
        idempotencyKey: `cargo_delivery_${payload.idempotencyKey}`,
        locationName: payload.locationName ?? null,
        notes: payload.notes ?? null,
        payload: {
          deliveryDocumentReference: payload.deliveryDocumentReference,
          consigneeName: payload.consigneeName,
          cargoId: payload.cargoId,
        },
      });

      if (nextStatus !== currentStatus) {
        await this.trackingRepo.updateShipmentStatus(tx, shipment.id, {
          status: nextStatus,
          actualArrivalAt: new Date(payload.completedAt),
        });
      }

      await this.eventBusOutbox.publish(tx, {
        organizationId,
        eventType: "tracking.event.recorded",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        eventVersion: 1,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: payload.shipmentReferenceCode,
          eventType: "completed",
          occurredAt: payload.completedAt,
          previousStatus: currentStatus,
          currentStatus: nextStatus,
          correlationId: payload.correlationId,
        },
      });
    });
  }

  private async handleDeliveryExceptionRecorded(
    organizationId: string,
    payload: CargoDeliveryExceptionRecordedPayload,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx: PrismaTx) => {
      const shipment = await this.trackingRepo.findShipmentById(
        organizationId,
        payload.trackingShipmentId,
      );

      if (shipment === null) {
        return;
      }

      const eventType: TrackingEventType = payload.eventType as TrackingEventType;
      const currentStatus = shipment.status as TrackingShipmentStatus;
      const nextStatus = resolveShipmentStatusAfterEvent(eventType, currentStatus);

      const event = await this.trackingRepo.createEvent(tx, {
        organizationId,
        shipmentId: shipment.id,
        eventType,
        occurredAt: new Date(payload.occurredAt),
        sourceSystem: payload.sourceSystem,
        correlationId: payload.correlationId,
        idempotencyKey: `cargo_exception_record_${payload.idempotencyKey}`,
        locationName: payload.locationName ?? null,
        notes: payload.notes ?? null,
        payload: {
          exceptionType: payload.exceptionType,
          severity: payload.severity,
          summary: payload.summary,
          cargoId: payload.cargoId,
        },
      });

      if (nextStatus !== currentStatus) {
        await this.trackingRepo.updateShipmentStatus(tx, shipment.id, {
          status: nextStatus,
        });
      }

      await this.eventBusOutbox.publish(tx, {
        organizationId,
        eventType: "tracking.event.recorded",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        eventVersion: 1,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: payload.shipmentReferenceCode,
          eventType,
          occurredAt: payload.occurredAt,
          previousStatus: currentStatus,
          currentStatus: nextStatus,
          correlationId: payload.correlationId,
        },
      });
    });
  }

  private async handleDeliveryExceptionResolved(
    organizationId: string,
    payload: CargoDeliveryExceptionResolvedPayload,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx: PrismaTx) => {
      const shipment = await this.trackingRepo.findShipmentById(
        organizationId,
        payload.trackingShipmentId,
      );

      if (shipment === null) {
        return;
      }

      const currentStatus = shipment.status as TrackingShipmentStatus;
      const resolvedEventType: TrackingEventType = payload.eventType as TrackingEventType;
      const nextStatus =
        (payload.nextStatus as TrackingShipmentStatus) ??
        resolveShipmentStatusAfterEvent(resolvedEventType, currentStatus);

      const event = await this.trackingRepo.createEvent(tx, {
        organizationId,
        shipmentId: shipment.id,
        eventType: resolvedEventType,
        occurredAt: new Date(payload.occurredAt),
        sourceSystem: payload.sourceSystem,
        correlationId: payload.correlationId,
        idempotencyKey: `cargo_exception_resolve_${payload.idempotencyKey}`,
        locationName: payload.locationName ?? null,
        payload: {
          resolutionCode: payload.resolutionCode,
          resolutionNotes: payload.resolutionNotes,
          nextStatus,
          cargoId: payload.cargoId,
        },
      });

      if (nextStatus !== currentStatus) {
        await this.trackingRepo.updateShipmentStatus(tx, shipment.id, {
          status: nextStatus,
        });
      }

      await this.eventBusOutbox.publish(tx, {
        organizationId,
        eventType: "tracking.event.recorded",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        eventVersion: 1,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: payload.shipmentReferenceCode,
          eventType: resolvedEventType,
          occurredAt: payload.occurredAt,
          previousStatus: currentStatus,
          currentStatus: nextStatus,
          correlationId: payload.correlationId,
        },
      });
    });
  }

  private async handleOperationalHandoffRecorded(
    organizationId: string,
    payload: CargoOperationalHandoffRecordedPayload,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx: PrismaTx) => {
      const shipment = await this.trackingRepo.findShipmentById(
        organizationId,
        payload.trackingShipmentId,
      );

      if (shipment === null) {
        return;
      }

      const eventType: TrackingEventType = "released" as TrackingEventType;
      const currentStatus = shipment.status as TrackingShipmentStatus;

      const event = await this.trackingRepo.createEvent(tx, {
        organizationId,
        shipmentId: shipment.id,
        eventType,
        occurredAt: new Date(payload.occurredAt),
        sourceSystem: payload.sourceSystem,
        correlationId: payload.correlationId,
        idempotencyKey: `cargo_handoff_${payload.idempotencyKey}`,
        locationName: payload.locationName ?? null,
        notes: payload.notes ?? null,
        payload: {
          handoffType: payload.handoffType,
          fromOperator: payload.fromOperator,
          toOperator: payload.toOperator,
          documentReference: payload.documentReference ?? null,
          cargoId: payload.cargoId,
        },
      });

      await this.eventBusOutbox.publish(tx, {
        organizationId,
        eventType: "tracking.event.recorded",
        aggregateType: "tracking.shipment",
        aggregateId: shipment.id,
        eventVersion: 1,
        payload: {
          eventId: event.id,
          shipmentId: shipment.id,
          referenceCode: payload.shipmentReferenceCode,
          eventType,
          occurredAt: payload.occurredAt,
          previousStatus: currentStatus,
          currentStatus,
          correlationId: payload.correlationId,
        },
      });
    });
  }
}
