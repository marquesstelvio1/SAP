import type {
  IntegrationCarrierTmsMovementInput,
  IntegrationCustomsErpStatusInput,
  IntegrationPortTosMovementInput,
  IntegrationRailTmsMovementInput,
  IntegrationTelematicsGpsPositionInput,
  IntegrationWarehouseWmsActivityInput,
  integrationCarrierTmsMovementTypes,
  integrationCustomsErpStatusTypes,
  integrationPortTosMovementTypes,
  integrationRailTmsMovementTypes,
  integrationTelematicsGpsPositionTypes,
  integrationWarehouseWmsActivityTypes,
  trackingEventTypes,
  trackingShipmentStatuses,
} from "@saptm/rpc";

export type TrackingEventType = (typeof trackingEventTypes)[number];
export type TrackingShipmentStatus = (typeof trackingShipmentStatuses)[number];

export type IntegrationPortTosMovementType = (typeof integrationPortTosMovementTypes)[number];
export type IntegrationRailTmsMovementType = (typeof integrationRailTmsMovementTypes)[number];
export type IntegrationCarrierTmsMovementType = (typeof integrationCarrierTmsMovementTypes)[number];
export type IntegrationTelematicsGpsPositionType =
  (typeof integrationTelematicsGpsPositionTypes)[number];
export type IntegrationCustomsErpStatusType = (typeof integrationCustomsErpStatusTypes)[number];
export type IntegrationWarehouseWmsActivityType =
  (typeof integrationWarehouseWmsActivityTypes)[number];

export function mapPortTosMovementToTrackingEventType(
  movementType: IntegrationPortTosMovementType,
): TrackingEventType {
  if (movementType === "departed") {
    return "departed";
  }

  if (movementType === "arrived") {
    return "arrived";
  }

  if (movementType === "delayed") {
    return "delayed";
  }

  if (movementType === "customs_hold") {
    return "customs_hold";
  }

  if (movementType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

export function mapRailTmsMovementToTrackingEventType(
  movementType: IntegrationRailTmsMovementType,
): TrackingEventType {
  if (movementType === "train_departed" || movementType === "yard_departure") {
    return "departed";
  }

  if (movementType === "train_arrived") {
    return "arrived";
  }

  if (movementType === "delay_reported") {
    return "delayed";
  }

  if (movementType === "infrastructure_hold") {
    return "exception";
  }

  if (movementType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

export function mapCarrierTmsMovementToTrackingEventType(
  movementType: IntegrationCarrierTmsMovementType,
): TrackingEventType {
  if (movementType === "pickup_completed" || movementType === "linehaul_departed") {
    return "departed";
  }

  if (movementType === "delivery_arrived" || movementType === "delivery_completed") {
    return "arrived";
  }

  if (movementType === "delay_reported") {
    return "delayed";
  }

  if (movementType === "exception_reported") {
    return "exception";
  }

  if (movementType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

export function mapTelematicsGpsPositionToTrackingEventType(
  positionType: IntegrationTelematicsGpsPositionType,
): TrackingEventType {
  if (positionType === "geofence_departure") {
    return "departed";
  }

  if (positionType === "geofence_arrival") {
    return "arrived";
  }

  if (positionType === "eta_delay") {
    return "delayed";
  }

  if (
    positionType === "route_deviation" ||
    positionType === "sensor_alert" ||
    positionType === "telemetry_lost"
  ) {
    return "exception";
  }

  return "location_updated";
}

export function mapCustomsErpStatusToTrackingEventType(
  statusType: IntegrationCustomsErpStatusType,
): TrackingEventType {
  if (statusType === "customs_hold" || statusType === "inspection_required") {
    return "customs_hold";
  }

  if (statusType === "customs_cleared" || statusType === "release_authorized") {
    return "released";
  }

  if (statusType === "clearance_rejected") {
    return "exception";
  }

  return "location_updated";
}

export function mapWarehouseWmsActivityToTrackingEventType(
  activityType: IntegrationWarehouseWmsActivityType,
): TrackingEventType {
  if (activityType === "received_at_warehouse") {
    return "arrived";
  }

  if (activityType === "loaded_for_dispatch" || activityType === "yard_check_out") {
    return "departed";
  }

  if (activityType === "inventory_exception" || activityType === "damage_reported") {
    return "exception";
  }

  if (activityType === "handover_completed") {
    return "handover_completed";
  }

  return "location_updated";
}

export function resolveShipmentStatusAfterAdapterEvent(
  eventType: TrackingEventType,
  currentStatus: TrackingShipmentStatus,
): TrackingShipmentStatus {
  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return currentStatus;
  }

  if (eventType === "departed" || eventType === "released") {
    return "in_transit";
  }

  if (eventType === "arrived") {
    return "arrived";
  }

  if (eventType === "delayed") {
    return "delayed";
  }

  if (eventType === "exception" || eventType === "customs_hold") {
    return "exception";
  }

  return currentStatus;
}

type AdapterPayload = Record<string, string | number | boolean | null>;

export function createPortTosAdapterPayload(input: {
  input: IntegrationPortTosMovementInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): AdapterPayload {
  return {
    ...(input.input.payload ?? {}),
    movementType: input.input.movementType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
  };
}

export function createRailTmsAdapterPayload(input: {
  input: IntegrationRailTmsMovementInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): AdapterPayload {
  return {
    ...(input.input.payload ?? {}),
    movementType: input.input.movementType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
    ...(input.input.trainNumber === undefined ? {} : { trainNumber: input.input.trainNumber }),
    ...(input.input.railCorridor === undefined ? {} : { railCorridor: input.input.railCorridor }),
    ...(input.input.wagonCount === undefined ? {} : { wagonCount: input.input.wagonCount }),
  };
}

export function createCarrierTmsAdapterPayload(input: {
  input: IntegrationCarrierTmsMovementInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): AdapterPayload {
  return {
    ...(input.input.payload ?? {}),
    movementType: input.input.movementType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
    ...(input.input.carrierCode === undefined ? {} : { carrierCode: input.input.carrierCode }),
    ...(input.input.vehiclePlate === undefined ? {} : { vehiclePlate: input.input.vehiclePlate }),
    ...(input.input.driverReference === undefined
      ? {}
      : { driverReference: input.input.driverReference }),
    ...(input.input.routeCode === undefined ? {} : { routeCode: input.input.routeCode }),
  };
}

export function createTelematicsGpsAdapterPayload(input: {
  input: IntegrationTelematicsGpsPositionInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): AdapterPayload {
  return {
    ...(input.input.payload ?? {}),
    positionType: input.input.positionType,
    shipmentReference: input.input.shipmentReference,
    latitude: input.input.latitude,
    longitude: input.input.longitude,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.deviceId === undefined ? {} : { deviceId: input.input.deviceId }),
    ...(input.input.assetReference === undefined
      ? {}
      : { assetReference: input.input.assetReference }),
    ...(input.input.geofenceName === undefined ? {} : { geofenceName: input.input.geofenceName }),
    ...(input.input.speedKph === undefined ? {} : { speedKph: input.input.speedKph }),
    ...(input.input.headingDegrees === undefined
      ? {}
      : { headingDegrees: input.input.headingDegrees }),
    ...(input.input.routeCode === undefined ? {} : { routeCode: input.input.routeCode }),
  };
}

export function createCustomsErpAdapterPayload(input: {
  input: IntegrationCustomsErpStatusInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): AdapterPayload {
  return {
    ...(input.input.payload ?? {}),
    statusType: input.input.statusType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.customsReference === undefined
      ? {}
      : { customsReference: input.input.customsReference }),
    ...(input.input.documentReference === undefined
      ? {}
      : { documentReference: input.input.documentReference }),
    ...(input.input.declarationNumber === undefined
      ? {}
      : { declarationNumber: input.input.declarationNumber }),
    ...(input.input.brokerReference === undefined
      ? {}
      : { brokerReference: input.input.brokerReference }),
    ...(input.input.authorityCode === undefined
      ? {}
      : { authorityCode: input.input.authorityCode }),
  };
}

export function createWarehouseWmsAdapterPayload(input: {
  input: IntegrationWarehouseWmsActivityInput;
  trackingEventType: TrackingEventType;
  previousStatus: TrackingShipmentStatus;
  currentStatus: TrackingShipmentStatus;
}): AdapterPayload {
  return {
    ...(input.input.payload ?? {}),
    activityType: input.input.activityType,
    shipmentReference: input.input.shipmentReference,
    trackingEventType: input.trackingEventType,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    ...(input.input.locationName === undefined ? {} : { locationName: input.input.locationName }),
    ...(input.input.warehouseCode === undefined
      ? {}
      : { warehouseCode: input.input.warehouseCode }),
    ...(input.input.zoneCode === undefined ? {} : { zoneCode: input.input.zoneCode }),
    ...(input.input.dockDoor === undefined ? {} : { dockDoor: input.input.dockDoor }),
    ...(input.input.containerReference === undefined
      ? {}
      : { containerReference: input.input.containerReference }),
    ...(input.input.handlingUnitReference === undefined
      ? {}
      : { handlingUnitReference: input.input.handlingUnitReference }),
    ...(input.input.operatorReference === undefined
      ? {}
      : { operatorReference: input.input.operatorReference }),
    ...(input.input.palletCount === undefined ? {} : { palletCount: input.input.palletCount }),
  };
}
