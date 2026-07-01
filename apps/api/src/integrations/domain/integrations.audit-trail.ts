import type { AuditJsonValue } from "@saptm/database";
import type { TrackingEventType, TrackingShipmentStatus } from "./integrations.business-rules.js";
import type { ServiceAccountRecord } from "./integrations.dto.js";

export function createServiceAccountAuditAfter(input: {
  serviceAccount: ServiceAccountRecord;
  apiKeyPrefix: string;
  scopes: string[];
  sourceSystem: string;
}): AuditJsonValue {
  return {
    serviceAccountId: input.serviceAccount.id,
    name: input.serviceAccount.name,
    scopes: input.scopes,
    apiKeyPrefix: input.apiKeyPrefix,
    sourceSystem: input.sourceSystem,
  };
}

export function createIntegrationEventAuditAfter(input: {
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  eventType: string;
}): AuditJsonValue {
  return {
    serviceAccountId: input.serviceAccountId,
    sourceSystem: input.sourceSystem,
    externalId: input.externalId,
    eventType: input.eventType,
  };
}

export function createAdapterAuditBefore(input: {
  status: TrackingShipmentStatus;
}): AuditJsonValue {
  return {
    status: input.status,
  };
}

export function createPortTosAdapterAuditAfter(input: {
  integrationEventId: string;
  trackingEventId: string;
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  shipmentReference: string;
  movementType: string;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
}): AuditJsonValue {
  return {
    integrationEventId: input.integrationEventId,
    trackingEventId: input.trackingEventId,
    serviceAccountId: input.serviceAccountId,
    sourceSystem: input.sourceSystem,
    externalId: input.externalId,
    shipmentReference: input.shipmentReference,
    movementType: input.movementType,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
  };
}

export function createRailTmsAdapterAuditAfter(input: {
  integrationEventId: string;
  trackingEventId: string;
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  shipmentReference: string;
  movementType: string;
  trainNumber: string | null;
  railCorridor: string | null;
  wagonCount: number | null;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
}): AuditJsonValue {
  return {
    integrationEventId: input.integrationEventId,
    trackingEventId: input.trackingEventId,
    serviceAccountId: input.serviceAccountId,
    sourceSystem: input.sourceSystem,
    externalId: input.externalId,
    shipmentReference: input.shipmentReference,
    movementType: input.movementType,
    trainNumber: input.trainNumber,
    railCorridor: input.railCorridor,
    wagonCount: input.wagonCount,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
  };
}

export function createCarrierTmsAdapterAuditAfter(input: {
  integrationEventId: string;
  trackingEventId: string;
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  shipmentReference: string;
  movementType: string;
  carrierCode: string | null;
  vehiclePlate: string | null;
  driverReference: string | null;
  routeCode: string | null;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
}): AuditJsonValue {
  return {
    integrationEventId: input.integrationEventId,
    trackingEventId: input.trackingEventId,
    serviceAccountId: input.serviceAccountId,
    sourceSystem: input.sourceSystem,
    externalId: input.externalId,
    shipmentReference: input.shipmentReference,
    movementType: input.movementType,
    carrierCode: input.carrierCode,
    vehiclePlate: input.vehiclePlate,
    driverReference: input.driverReference,
    routeCode: input.routeCode,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
  };
}

export function createTelematicsGpsAdapterAuditAfter(input: {
  integrationEventId: string;
  trackingEventId: string;
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  shipmentReference: string;
  positionType: string;
  latitude: number;
  longitude: number;
  deviceId: string | null;
  assetReference: string | null;
  geofenceName: string | null;
  speedKph: number | null;
  headingDegrees: number | null;
  routeCode: string | null;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
}): AuditJsonValue {
  return {
    integrationEventId: input.integrationEventId,
    trackingEventId: input.trackingEventId,
    serviceAccountId: input.serviceAccountId,
    sourceSystem: input.sourceSystem,
    externalId: input.externalId,
    shipmentReference: input.shipmentReference,
    positionType: input.positionType,
    latitude: input.latitude,
    longitude: input.longitude,
    deviceId: input.deviceId,
    assetReference: input.assetReference,
    geofenceName: input.geofenceName,
    speedKph: input.speedKph,
    headingDegrees: input.headingDegrees,
    routeCode: input.routeCode,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
  };
}

export function createCustomsErpAdapterAuditAfter(input: {
  integrationEventId: string;
  trackingEventId: string;
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  shipmentReference: string;
  statusType: string;
  customsReference: string | null;
  documentReference: string | null;
  declarationNumber: string | null;
  brokerReference: string | null;
  authorityCode: string | null;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
}): AuditJsonValue {
  return {
    integrationEventId: input.integrationEventId,
    trackingEventId: input.trackingEventId,
    serviceAccountId: input.serviceAccountId,
    sourceSystem: input.sourceSystem,
    externalId: input.externalId,
    shipmentReference: input.shipmentReference,
    statusType: input.statusType,
    customsReference: input.customsReference,
    documentReference: input.documentReference,
    declarationNumber: input.declarationNumber,
    brokerReference: input.brokerReference,
    authorityCode: input.authorityCode,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
  };
}

export function createWarehouseWmsAdapterAuditAfter(input: {
  integrationEventId: string;
  trackingEventId: string;
  serviceAccountId: string;
  sourceSystem: string;
  externalId: string;
  shipmentReference: string;
  activityType: string;
  warehouseCode: string | null;
  zoneCode: string | null;
  dockDoor: string | null;
  containerReference: string | null;
  handlingUnitReference: string | null;
  operatorReference: string | null;
  palletCount: number | null;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
  idempotencyKey: string;
}): AuditJsonValue {
  return {
    integrationEventId: input.integrationEventId,
    trackingEventId: input.trackingEventId,
    serviceAccountId: input.serviceAccountId,
    sourceSystem: input.sourceSystem,
    externalId: input.externalId,
    shipmentReference: input.shipmentReference,
    activityType: input.activityType,
    warehouseCode: input.warehouseCode,
    zoneCode: input.zoneCode,
    dockDoor: input.dockDoor,
    containerReference: input.containerReference,
    handlingUnitReference: input.handlingUnitReference,
    operatorReference: input.operatorReference,
    palletCount: input.palletCount,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    idempotencyKey: input.idempotencyKey,
  };
}
