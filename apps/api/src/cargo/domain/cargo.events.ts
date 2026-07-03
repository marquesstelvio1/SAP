import type { DomainEvent } from "@saptm/database";
import { CURRENT_EVENT_VERSION } from "@saptm/database";
import type { CargoEntity, TrackingShipmentEntity } from "./cargo.entity.js";

export type { DomainEvent } from "@saptm/database";

export function createCargoRegisteredEvent(
  cargo: CargoEntity,
  movementBlocked: boolean,
  appliedRules: string[],
  idempotencyKey: string,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: cargo.organizationId,
    eventType: "cargo.registered",
    aggregateType: "cargo",
    aggregateId: cargo.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference.value,
      cargoType: cargo.cargoType,
      status: cargo.status,
      customsStatus: cargo.customsStatus,
      conditionStatus: cargo.conditionStatus,
      hazardous: cargo.hazardous,
      requiresInspection: cargo.requiresInspection,
      movementBlocked,
      appliedRules,
      idempotencyKey,
      correlationId,
    },
  };
}

export function createCargoReleasedEvent(
  cargo: CargoEntity,
  appliedRules: string[],
  idempotencyKey: string,
  correlationId: string,
  sourceSystem: string,
): DomainEvent {
  return {
    organizationId: cargo.organizationId,
    eventType: "cargo.released",
    aggregateType: "cargo",
    aggregateId: cargo.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference.value,
      status: cargo.status,
      customsStatus: cargo.customsStatus,
      conditionStatus: cargo.conditionStatus,
      releaseReference: cargo.releaseReference,
      releasedAt: cargo.releasedAt?.toISOString() ?? null,
      appliedRules,
      idempotencyKey,
      correlationId,
      sourceSystem,
    },
  };
}

export function createCargoTransportPlannedEvent(
  cargo: CargoEntity,
  shipment: TrackingShipmentEntity,
  appliedRules: string[],
  idempotencyKey: string,
  correlationId: string,
  sourceSystem: string,
): DomainEvent {
  return {
    organizationId: cargo.organizationId,
    eventType: "cargo.transport_planned",
    aggregateType: "cargo",
    aggregateId: cargo.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference.value,
      shipmentId: shipment.id,
      shipmentReferenceCode: shipment.referenceCode,
      transportMode: shipment.transportMode,
      plannedDepartureAt: shipment.plannedDepartureAt?.toISOString() ?? null,
      estimatedArrivalAt: shipment.estimatedArrivalAt?.toISOString() ?? null,
      operationsOwnerTeam: cargo.transportOwnerTeam,
      planningReference: cargo.transportPlanningReference,
      appliedRules,
      idempotencyKey,
      correlationId,
      sourceSystem,
    },
  };
}

export function createCargoTransportDepartedEvent(
  cargo: CargoEntity,
  shipment: TrackingShipmentEntity,
  eventId: string,
  previousShipmentStatus: string,
  appliedRules: string[],
  idempotencyKey: string,
  correlationId: string,
  sourceSystem: string,
): DomainEvent {
  return {
    organizationId: cargo.organizationId,
    eventType: "cargo.transport_departed",
    aggregateType: "cargo",
    aggregateId: cargo.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference.value,
      shipmentId: shipment.id,
      shipmentReferenceCode: shipment.referenceCode,
      eventId,
      departedAt: cargo.departedAt?.toISOString() ?? null,
      departureLocationName: cargo.departureLocationName,
      operatorName: cargo.departureOperatorName,
      previousShipmentStatus,
      currentShipmentStatus: shipment.status,
      appliedRules,
      idempotencyKey,
      correlationId,
      sourceSystem,
    },
  };
}

export function createCargoTransportArrivedEvent(
  cargo: CargoEntity,
  shipment: TrackingShipmentEntity,
  eventId: string,
  previousShipmentStatus: string,
  appliedRules: string[],
  idempotencyKey: string,
  correlationId: string,
  sourceSystem: string,
): DomainEvent {
  return {
    organizationId: cargo.organizationId,
    eventType: "cargo.transport_arrived",
    aggregateType: "cargo",
    aggregateId: cargo.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference.value,
      shipmentId: shipment.id,
      shipmentReferenceCode: shipment.referenceCode,
      eventId,
      arrivedAt: cargo.arrivedAt?.toISOString() ?? null,
      arrivalLocationName: cargo.arrivalLocationName,
      operatorName: cargo.arrivalOperatorName,
      previousShipmentStatus,
      currentShipmentStatus: shipment.status,
      appliedRules,
      idempotencyKey,
      correlationId,
      sourceSystem,
    },
  };
}

export function createCargoDeliveryCompletedEvent(
  cargo: CargoEntity,
  shipment: TrackingShipmentEntity,
  eventId: string,
  previousShipmentStatus: string,
  appliedRules: string[],
  idempotencyKey: string,
  correlationId: string,
  sourceSystem: string,
): DomainEvent {
  return {
    organizationId: cargo.organizationId,
    eventType: "cargo.delivery_completed",
    aggregateType: "cargo",
    aggregateId: cargo.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      cargoId: cargo.id,
      cargoReference: cargo.cargoReference.value,
      shipmentId: shipment.id,
      shipmentReferenceCode: shipment.referenceCode,
      eventId,
      deliveredAt: cargo.deliveredAt?.toISOString() ?? null,
      deliveryReference: cargo.deliveryReference,
      receivedByName: cargo.receivedByName,
      previousShipmentStatus,
      currentShipmentStatus: shipment.status,
      appliedRules,
      idempotencyKey,
      correlationId,
      sourceSystem,
    },
  };
}

export function createCargoDeliveryExceptionRecordedEvent(
  cargoId: string,
  cargoReference: string,
  shipmentId: string,
  shipmentReferenceCode: string,
  exceptionId: string,
  eventId: string,
  exceptionType: string,
  deliveryConditionStatus: string,
  previousShipmentStatus: string,
  currentShipmentStatus: string,
  organizationId: string,
  appliedRules: string[],
  idempotencyKey: string,
  correlationId: string,
): DomainEvent {
  return {
    organizationId,
    eventType: "cargo.delivery_exception.recorded",
    aggregateType: "cargo",
    aggregateId: cargoId,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      cargoId,
      cargoReference,
      exceptionId,
      shipmentId,
      shipmentReferenceCode,
      eventId,
      exceptionType,
      deliveryConditionStatus,
      previousShipmentStatus,
      currentShipmentStatus,
      appliedRules,
      idempotencyKey,
      correlationId,
    },
  };
}
