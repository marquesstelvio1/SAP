import { filterPlatformPermissions, type PlatformPermission } from "@saptm/auth";
import type { DatabaseActorType } from "@saptm/database";
import type {
  IntegrationCarrierTmsMovementInput,
  IntegrationCarrierTmsMovementOutput,
  IntegrationCustomsErpStatusInput,
  IntegrationCustomsErpStatusOutput,
  IntegrationEventRecordInput,
  IntegrationOverviewInput,
  IntegrationOverviewOutput,
  IntegrationPortTosMovementInput,
  IntegrationPortTosMovementOutput,
  IntegrationRailTmsMovementInput,
  IntegrationRailTmsMovementOutput,
  IntegrationServiceAccountCreateInput,
  IntegrationTelematicsGpsPositionInput,
  IntegrationTelematicsGpsPositionOutput,
  IntegrationWarehouseWmsActivityInput,
  IntegrationWarehouseWmsActivityOutput,
} from "@saptm/rpc";
import { trackingShipmentStatuses } from "@saptm/rpc";

import type { TrackingEventType, TrackingShipmentStatus } from "./integrations.business-rules.js";

export type GetIntegrationOverviewInput = IntegrationOverviewInput & {
  organizationId: string;
  generatedAt?: Date;
};

export type CreateIntegrationServiceAccountInput = IntegrationServiceAccountCreateInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RecordIntegrationEventInput = IntegrationEventRecordInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  receivedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessPortTosMovementInput = IntegrationPortTosMovementInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessRailTmsMovementInput = IntegrationRailTmsMovementInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessCarrierTmsMovementInput = IntegrationCarrierTmsMovementInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessTelematicsGpsPositionInput = IntegrationTelematicsGpsPositionInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessCustomsErpStatusInput = IntegrationCustomsErpStatusInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProcessWarehouseWmsActivityInput = IntegrationWarehouseWmsActivityInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

// Local record types

export type ServiceAccountRecord = {
  id: string;
  organizationId: string;
  name: string;
  scopes: string[];
  active: boolean;
  createdByActorId: string | null;
  provisionIdempotencyKey: string | null;
  lastRotatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  apiKeys: ApiKeyRecord[];
};

export type ApiKeyRecord = {
  id: string;
  prefix: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export type IntegrationEventRecord = {
  id: string;
  organizationId: string;
  serviceAccountId: string | null;
  sourceSystem: string;
  externalId: string;
  eventType: string;
  payload: Record<string, string | number | boolean | null>;
  receivedAt: Date;
  processedAt: Date | null;
};

export type AdapterTrackingEventRecord = {
  id: string;
  shipmentId: string;
  eventType: TrackingEventType;
  occurredAt: Date;
  sourceSystem: string;
  payload: unknown;
  shipment: {
    id: string;
    referenceCode: string;
    status: TrackingShipmentStatus;
  };
};

// Utility functions

export function toIsoStringOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

export function createRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}

export function createEventIdempotencyKey(
  input: Pick<IntegrationEventRecordInput, "externalId" | "sourceSystem">,
): string {
  return `${input.sourceSystem}:${input.externalId}`;
}

export function createPortTosTrackingIdempotencyKey(
  input: Pick<IntegrationPortTosMovementInput, "externalId" | "sourceSystem">,
): string {
  return `port-tos:${input.sourceSystem}:${input.externalId}`;
}

export function createRailTmsTrackingIdempotencyKey(
  input: Pick<IntegrationRailTmsMovementInput, "externalId" | "sourceSystem">,
): string {
  return `rail-tms:${input.sourceSystem}:${input.externalId}`;
}

export function createCarrierTmsTrackingIdempotencyKey(
  input: Pick<IntegrationCarrierTmsMovementInput, "externalId" | "sourceSystem">,
): string {
  return `carrier-tms:${input.sourceSystem}:${input.externalId}`;
}

export function createTelematicsGpsTrackingIdempotencyKey(
  input: Pick<IntegrationTelematicsGpsPositionInput, "externalId" | "sourceSystem">,
): string {
  return `telematics-gps:${input.sourceSystem}:${input.externalId}`;
}

export function createCustomsErpTrackingIdempotencyKey(
  input: Pick<IntegrationCustomsErpStatusInput, "externalId" | "sourceSystem">,
): string {
  return `customs-erp:${input.sourceSystem}:${input.externalId}`;
}

export function createWarehouseWmsTrackingIdempotencyKey(
  input: Pick<IntegrationWarehouseWmsActivityInput, "externalId" | "sourceSystem">,
): string {
  return `warehouse-wms:${input.sourceSystem}:${input.externalId}`;
}

// Mapping helpers for output

export function mapServiceAccount(
  serviceAccount: ServiceAccountRecord,
): IntegrationOverviewOutput["serviceAccounts"][number] {
  return {
    id: serviceAccount.id,
    name: serviceAccount.name,
    scopes: filterPlatformPermissions(serviceAccount.scopes) as PlatformPermission[],
    active: serviceAccount.active,
    createdByActorId: serviceAccount.createdByActorId,
    lastRotatedAt: toIsoStringOrNull(serviceAccount.lastRotatedAt),
    createdAt: serviceAccount.createdAt.toISOString(),
    updatedAt: serviceAccount.updatedAt.toISOString(),
    apiKeys: serviceAccount.apiKeys.map(mapApiKey),
  };
}

export function mapApiKey(
  apiKey: ApiKeyRecord,
): IntegrationOverviewOutput["serviceAccounts"][number]["apiKeys"][number] {
  return {
    id: apiKey.id,
    prefix: apiKey.prefix,
    expiresAt: toIsoStringOrNull(apiKey.expiresAt),
    lastUsedAt: toIsoStringOrNull(apiKey.lastUsedAt),
    revokedAt: toIsoStringOrNull(apiKey.revokedAt),
    createdAt: apiKey.createdAt.toISOString(),
  };
}

export function mapIntegrationEvent(
  event: IntegrationEventRecord,
): IntegrationOverviewOutput["recentEvents"][number] {
  return {
    id: event.id,
    serviceAccountId: event.serviceAccountId,
    sourceSystem: event.sourceSystem,
    externalId: event.externalId,
    eventType: event.eventType,
    payload: event.payload,
    receivedAt: event.receivedAt.toISOString(),
    processedAt: toIsoStringOrNull(event.processedAt),
  };
}

// Adapter status pair

export function readAdapterStatusPair(event: AdapterTrackingEventRecord): {
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
} {
  if (
    typeof event.payload === "object" &&
    event.payload !== null &&
    !Array.isArray(event.payload)
  ) {
    const payload = event.payload as Record<string, unknown>;
    const previousStatus =
      typeof payload.previousStatus === "string" && isTrackingShipmentStatus(payload.previousStatus)
        ? payload.previousStatus
        : event.shipment.status;
    const currentStatus =
      typeof payload.currentStatus === "string" && isTrackingShipmentStatus(payload.currentStatus)
        ? payload.currentStatus
        : event.shipment.status;

    return {
      previousStatus,
      currentStatus,
    };
  }

  return {
    previousStatus: event.shipment.status,
    currentStatus: event.shipment.status,
  };
}

function isTrackingShipmentStatus(value: string): value is TrackingShipmentStatus {
  return (trackingShipmentStatuses as readonly string[]).includes(value);
}

// Output builders

export function createPortTosMovementOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationPortTosMovementOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "port-tos",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.port_tos.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.port_tos.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

export function createRailTmsMovementOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationRailTmsMovementOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "rail-tms",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.rail_tms.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.rail_tms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

export function createCarrierTmsMovementOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationCarrierTmsMovementOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "carrier-tms",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.carrier_tms.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.carrier_tms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

export function createTelematicsGpsPositionOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationTelematicsGpsPositionOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "telematics-gps",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.telematics_gps.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.telematics_gps.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

export function createCustomsErpStatusOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationCustomsErpStatusOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "customs-erp",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.customs_erp.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.customs_erp.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}

export function createWarehouseWmsActivityOutput(input: {
  organizationId: string;
  integrationEvent: IntegrationEventRecord;
  trackingEvent: AdapterTrackingEventRecord;
  replayed: boolean;
}): IntegrationWarehouseWmsActivityOutput {
  const statusPair = readAdapterStatusPair(input.trackingEvent);

  return {
    organizationId: input.organizationId,
    adapter: {
      name: "warehouse-wms",
      mode: "local-synchronous",
    },
    integrationEvent: mapIntegrationEvent(input.integrationEvent),
    trackingEvent: {
      id: input.trackingEvent.id,
      shipmentId: input.trackingEvent.shipmentId,
      referenceCode: input.trackingEvent.shipment.referenceCode,
      eventType: input.trackingEvent.eventType,
      previousStatus: statusPair.previousStatus,
      currentStatus: statusPair.currentStatus,
      occurredAt: input.trackingEvent.occurredAt.toISOString(),
      sourceSystem: input.trackingEvent.sourceSystem,
    },
    idempotency: {
      key: createEventIdempotencyKey(input.integrationEvent),
      replayed: input.replayed,
    },
    audit: {
      action: "integration.adapter.warehouse_wms.processed",
      subjectType: "tracking.shipment",
      subjectId: input.trackingEvent.shipmentId,
    },
    outbox: {
      eventType: "integration.adapter.warehouse_wms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: input.trackingEvent.shipmentId,
    },
  };
}
