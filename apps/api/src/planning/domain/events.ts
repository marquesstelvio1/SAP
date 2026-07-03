import type { DomainEvent } from "@saptm/database";
import { CURRENT_EVENT_VERSION } from "@saptm/database";
import type { PlanningAllocation, PlanningSession } from "./planning-types.js";

export type { DomainEvent } from "@saptm/database";

export function createPlanningSessionCreatedEvent(
  session: PlanningSession,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: session.tenantId,
    eventType: "planning.session.created",
    aggregateType: "planning",
    aggregateId: session.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      sessionId: session.id,
      name: session.name,
      status: session.status,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate.toISOString(),
      createdBy: session.createdBy,
      correlationId,
    },
  };
}

export function createPlanningSessionActivatedEvent(
  session: PlanningSession,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: session.tenantId,
    eventType: "planning.session.activated",
    aggregateType: "planning",
    aggregateId: session.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      sessionId: session.id,
      status: session.status,
      correlationId,
    },
  };
}

export function createPlanningSessionLockedEvent(
  session: PlanningSession,
  correlationId: string,
): DomainEvent {
  return {
    organizationId: session.tenantId,
    eventType: "planning.session.locked",
    aggregateType: "planning",
    aggregateId: session.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      sessionId: session.id,
      status: session.status,
      correlationId,
    },
  };
}

export function createPlanningAllocationProposedEvent(
  allocation: PlanningAllocation,
  organizationId: string,
  correlationId: string,
): DomainEvent {
  return {
    organizationId,
    eventType: "planning.allocation.proposed",
    aggregateType: "planning",
    aggregateId: allocation.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      allocationId: allocation.id,
      sessionId: allocation.sessionId,
      cargoId: allocation.cargoId,
      capacitySlotId: allocation.capacitySlotId,
      priority: allocation.priority,
      correlationId,
    },
  };
}

export function createPlanningAllocationConfirmedEvent(
  allocation: PlanningAllocation,
  organizationId: string,
  correlationId: string,
): DomainEvent {
  return {
    organizationId,
    eventType: "planning.allocation.confirmed",
    aggregateType: "planning",
    aggregateId: allocation.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      allocationId: allocation.id,
      sessionId: allocation.sessionId,
      status: allocation.status,
      correlationId,
    },
  };
}

export function createPlanningAllocationCancelledEvent(
  allocation: PlanningAllocation,
  organizationId: string,
  correlationId: string,
): DomainEvent {
  return {
    organizationId,
    eventType: "planning.allocation.cancelled",
    aggregateType: "planning",
    aggregateId: allocation.id,
    eventVersion: CURRENT_EVENT_VERSION,
    payload: {
      allocationId: allocation.id,
      sessionId: allocation.sessionId,
      status: allocation.status,
      correlationId,
    },
  };
}
