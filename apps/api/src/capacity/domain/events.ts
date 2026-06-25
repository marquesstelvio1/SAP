import type { DomainEvent } from "@saptm/database";
import type { CapacitySlot } from "./capacity-types.js";

export type { DomainEvent } from "@saptm/database";

export function createCapacitySlotScheduledEvent(
  slot: CapacitySlot,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: slot.tenantId,
    eventType: "capacity.slot.scheduled",
    aggregateType: "capacity",
    aggregateId: slot.id,
    payload: {
      slotId: slot.id,
      origin: slot.origin,
      destination: slot.destination,
      transportMode: slot.transportMode,
      availableWeight: slot.availableWeight,
      availableVolume: slot.availableVolume,
      totalWeight: slot.totalWeight,
      totalVolume: slot.totalVolume,
      departureDate: slot.departureDate.toISOString(),
      arrivalDate: slot.arrivalDate.toISOString(),
      status: slot.status,
      correlationId,
    },
  };
}

export function createCapacitySlotInTransitEvent(
  slot: CapacitySlot,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: slot.tenantId,
    eventType: "capacity.slot.in_transit",
    aggregateType: "capacity",
    aggregateId: slot.id,
    payload: {
      slotId: slot.id,
      status: slot.status,
      correlationId,
    },
  };
}

export function createCapacitySlotCompletedEvent(
  slot: CapacitySlot,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: slot.tenantId,
    eventType: "capacity.slot.completed",
    aggregateType: "capacity",
    aggregateId: slot.id,
    payload: {
      slotId: slot.id,
      status: slot.status,
      correlationId,
    },
  };
}

export function createCapacitySlotCancelledEvent(
  slot: CapacitySlot,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: slot.tenantId,
    eventType: "capacity.slot.cancelled",
    aggregateType: "capacity",
    aggregateId: slot.id,
    payload: {
      slotId: slot.id,
      status: slot.status,
      correlationId,
    },
  };
}
