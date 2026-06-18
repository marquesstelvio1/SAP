import assert from "node:assert/strict";
import { test } from "node:test";

import {
  integrationCarrierTmsMovementInputSchema,
  integrationCarrierTmsMovementMetadata,
  integrationCarrierTmsMovementOutputSchema,
  integrationCustomsErpStatusInputSchema,
  integrationCustomsErpStatusMetadata,
  integrationCustomsErpStatusOutputSchema,
  integrationEventRecordInputSchema,
  integrationEventRecordMetadata,
  integrationEventRecordOutputSchema,
  integrationOverviewInputSchema,
  integrationOverviewMetadata,
  integrationOverviewOutputSchema,
  integrationPortTosMovementInputSchema,
  integrationPortTosMovementMetadata,
  integrationPortTosMovementOutputSchema,
  integrationRailTmsMovementInputSchema,
  integrationRailTmsMovementMetadata,
  integrationRailTmsMovementOutputSchema,
  integrationServiceAccountCreateInputSchema,
  integrationServiceAccountCreateMetadata,
  integrationServiceAccountCreateOutputSchema,
  integrationTelematicsGpsPositionInputSchema,
  integrationTelematicsGpsPositionMetadata,
  integrationTelematicsGpsPositionOutputSchema,
  integrationWarehouseWmsActivityInputSchema,
  integrationWarehouseWmsActivityMetadata,
  integrationWarehouseWmsActivityOutputSchema,
} from "../dist/index.js";

test("integration overview metadata accepts integration administrators", () => {
  assert.equal(integrationOverviewMetadata.name, "integration.gateway.overview.read");
  assert.equal(integrationOverviewMetadata.kind, "query");
  assert.equal(integrationOverviewMetadata.auth, "session");
  assert.equal(integrationOverviewMetadata.permissionMode, "any");
  assert.deepEqual(integrationOverviewMetadata.permissions, [
    "integration.api_key.manage",
    "integration.event.ingest",
  ]);
  assert.equal(integrationOverviewMetadata.organizationRequired, true);
  assert.equal(integrationOverviewMetadata.audit, "sensitive");
});

test("integration overview schema validates tenant-scoped gateway state", () => {
  assert.deepEqual(integrationOverviewInputSchema.parse(undefined), { limit: 25 });

  const parsed = integrationOverviewOutputSchema.parse({
    generatedAt: "2026-06-06T00:00:00.000Z",
    totals: {
      serviceAccounts: 1,
      activeServiceAccounts: 1,
      activeApiKeys: 1,
      integrationEvents: 1,
      processedEvents: 0,
    },
    serviceAccounts: [
      {
        id: "svc_rail",
        name: "Rail TOS Bridge",
        scopes: ["integration.event.ingest"],
        active: true,
        createdByActorId: "user_admin",
        lastRotatedAt: "2026-06-06T00:00:00.000Z",
        createdAt: "2026-06-06T00:00:00.000Z",
        updatedAt: "2026-06-06T00:00:00.000Z",
        apiKeys: [
          {
            id: "key_rail",
            prefix: "saptm_live",
            expiresAt: null,
            lastUsedAt: null,
            revokedAt: null,
            createdAt: "2026-06-06T00:00:00.000Z",
          },
        ],
      },
    ],
    recentEvents: [
      {
        id: "evt_rail",
        serviceAccountId: "svc_rail",
        sourceSystem: "rail-tos",
        externalId: "EXT-001",
        eventType: "tracking.location_updated",
        payload: {
          location: "Terminal A",
          delayed: false,
        },
        receivedAt: "2026-06-06T00:00:00.000Z",
        processedAt: null,
      },
    ],
    securityModel: {
      authorizationModel: "tenant-scoped-rbac-service-accounts",
      requiredPermissions: ["integration.api_key.manage", "integration.event.ingest"],
      idempotencyModel: "organization-sourceSystem-externalId",
      secretStorage: "sha256-hash-only",
    },
  });

  assert.equal(parsed.serviceAccounts[0].scopes[0], "integration.event.ingest");
});

test("integration service account creation contract protects plaintext keys", () => {
  assert.equal(integrationServiceAccountCreateMetadata.name, "integration.service_account.create");
  assert.equal(integrationServiceAccountCreateMetadata.kind, "mutation");
  assert.deepEqual(integrationServiceAccountCreateMetadata.permissions, [
    "integration.api_key.manage",
  ]);
  assert.equal(integrationServiceAccountCreateMetadata.idempotency, "required");
  assert.equal(integrationServiceAccountCreateMetadata.audit, "critical");

  const input = integrationServiceAccountCreateInputSchema.parse({
    name: "Port EDI Bridge",
    scopes: ["integration.event.ingest", "tracking.event.record"],
    idempotencyKey: "integration_service_account_001",
  });

  assert.equal(input.sourceSystem, "saptm");

  const output = integrationServiceAccountCreateOutputSchema.parse({
    organizationId: "org_rail_port",
    serviceAccount: {
      id: "svc_port",
      name: "Port EDI Bridge",
      scopes: ["integration.event.ingest"],
      active: true,
      createdByActorId: "user_admin",
      lastRotatedAt: "2026-06-06T00:00:00.000Z",
      createdAt: "2026-06-06T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z",
      apiKeys: [],
    },
    apiKey: {
      prefix: "saptm_live",
      plaintext: "saptm_live_secret",
    },
    idempotency: {
      key: "integration_service_account_001",
      replayed: false,
    },
    audit: {
      action: "integration.api_key.created",
      subjectType: "service_account",
      subjectId: "svc_port",
    },
    outbox: {
      eventType: "integration.api_key.created",
      aggregateType: "integration.service_account",
      aggregateId: "svc_port",
    },
  });

  assert.equal(output.apiKey.plaintext, "saptm_live_secret");
});

test("integration event record contract requires idempotent external identity", () => {
  assert.equal(integrationEventRecordMetadata.name, "integration.event.record");
  assert.equal(integrationEventRecordMetadata.kind, "mutation");
  assert.deepEqual(integrationEventRecordMetadata.permissions, ["integration.event.ingest"]);
  assert.equal(integrationEventRecordMetadata.idempotency, "required");

  const input = integrationEventRecordInputSchema.parse({
    serviceAccountId: "svc_port",
    sourceSystem: "port-tos",
    externalId: "MOVE-001",
    eventType: "cargo.arrived",
    payload: {
      berth: "B2",
      containers: 12,
      delayed: false,
    },
  });

  assert.equal(input.externalId, "MOVE-001");

  const output = integrationEventRecordOutputSchema.parse({
    organizationId: "org_rail_port",
    event: {
      id: "evt_port",
      serviceAccountId: "svc_port",
      sourceSystem: "port-tos",
      externalId: "MOVE-001",
      eventType: "cargo.arrived",
      payload: {
        berth: "B2",
        containers: 12,
      },
      receivedAt: "2026-06-06T00:00:00.000Z",
      processedAt: null,
    },
    idempotency: {
      key: "port-tos:MOVE-001",
      replayed: false,
    },
    audit: {
      action: "integration.event.received",
      subjectType: "integration_event",
      subjectId: "evt_port",
    },
    outbox: {
      eventType: "integration.event.received",
      aggregateType: "integration.event",
      aggregateId: "evt_port",
    },
  });

  assert.equal(output.idempotency.key, "port-tos:MOVE-001");
});

test("port TOS adapter contract maps external movement into tracking", () => {
  assert.equal(
    integrationPortTosMovementMetadata.name,
    "integration.adapter.port_tos.movement.process",
  );
  assert.equal(integrationPortTosMovementMetadata.kind, "mutation");
  assert.deepEqual(integrationPortTosMovementMetadata.permissions, [
    "integration.event.ingest",
    "tracking.event.record",
  ]);
  assert.equal(integrationPortTosMovementMetadata.permissionMode, "all");
  assert.equal(integrationPortTosMovementMetadata.idempotency, "required");

  const input = integrationPortTosMovementInputSchema.parse({
    serviceAccountId: "svc_port",
    externalId: "TOS-MOVE-001",
    shipmentReference: "TRK-LOCAL-PORT-002",
    movementType: "gate_in",
    occurredAt: "2026-06-06T10:00:00.000Z",
    locationName: "Terminal B2",
    payload: {
      berth: "B2",
      containers: 12,
    },
  });

  assert.equal(input.sourceSystem, "port-tos");

  const output = integrationPortTosMovementOutputSchema.parse({
    organizationId: "org_rail_port",
    adapter: {
      name: "port-tos",
      mode: "local-synchronous",
    },
    integrationEvent: {
      id: "evt_port",
      serviceAccountId: "svc_port",
      sourceSystem: "port-tos",
      externalId: "TOS-MOVE-001",
      eventType: "port_tos.movement",
      payload: {
        movementType: "gate_in",
        shipmentReference: "TRK-LOCAL-PORT-002",
      },
      receivedAt: "2026-06-06T10:00:00.000Z",
      processedAt: "2026-06-06T10:00:00.000Z",
    },
    trackingEvent: {
      id: "trk_evt_port",
      shipmentId: "trk_port",
      referenceCode: "TRK-LOCAL-PORT-002",
      eventType: "location_updated",
      previousStatus: "in_transit",
      currentStatus: "in_transit",
      occurredAt: "2026-06-06T10:00:00.000Z",
      sourceSystem: "port-tos",
    },
    idempotency: {
      key: "port-tos:TOS-MOVE-001",
      replayed: false,
    },
    audit: {
      action: "integration.adapter.port_tos.processed",
      subjectType: "tracking.shipment",
      subjectId: "trk_port",
    },
    outbox: {
      eventType: "integration.adapter.port_tos.processed",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_port",
    },
  });

  assert.equal(output.trackingEvent.eventType, "location_updated");
});

test("rail TMS adapter contract maps rail movement into tracking", () => {
  assert.equal(
    integrationRailTmsMovementMetadata.name,
    "integration.adapter.rail_tms.movement.process",
  );
  assert.equal(integrationRailTmsMovementMetadata.kind, "mutation");
  assert.deepEqual(integrationRailTmsMovementMetadata.permissions, [
    "integration.event.ingest",
    "tracking.event.record",
  ]);
  assert.equal(integrationRailTmsMovementMetadata.permissionMode, "all");
  assert.equal(integrationRailTmsMovementMetadata.idempotency, "required");

  const input = integrationRailTmsMovementInputSchema.parse({
    serviceAccountId: "svc_rail",
    externalId: "RAIL-MOVE-001",
    shipmentReference: "TRK-LOCAL-RAIL-001",
    movementType: "train_departed",
    occurredAt: "2026-06-06T10:00:00.000Z",
    locationName: "Luanda Yard",
    trainNumber: "TRN-409",
    railCorridor: "Luanda-Malanje",
    wagonCount: 18,
    payload: {
      locomotive: "LOCO-77",
    },
  });

  assert.equal(input.sourceSystem, "rail-tms");
  assert.equal(input.wagonCount, 18);

  const output = integrationRailTmsMovementOutputSchema.parse({
    organizationId: "org_rail_port",
    adapter: {
      name: "rail-tms",
      mode: "local-synchronous",
    },
    integrationEvent: {
      id: "evt_rail",
      serviceAccountId: "svc_rail",
      sourceSystem: "rail-tms",
      externalId: "RAIL-MOVE-001",
      eventType: "rail_tms.movement",
      payload: {
        movementType: "train_departed",
        shipmentReference: "TRK-LOCAL-RAIL-001",
      },
      receivedAt: "2026-06-06T10:00:00.000Z",
      processedAt: "2026-06-06T10:00:00.000Z",
    },
    trackingEvent: {
      id: "trk_evt_rail",
      shipmentId: "trk_rail",
      referenceCode: "TRK-LOCAL-RAIL-001",
      eventType: "departed",
      previousStatus: "in_transit",
      currentStatus: "in_transit",
      occurredAt: "2026-06-06T10:00:00.000Z",
      sourceSystem: "rail-tms",
    },
    idempotency: {
      key: "rail-tms:RAIL-MOVE-001",
      replayed: false,
    },
    audit: {
      action: "integration.adapter.rail_tms.processed",
      subjectType: "tracking.shipment",
      subjectId: "trk_rail",
    },
    outbox: {
      eventType: "integration.adapter.rail_tms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_rail",
    },
  });

  assert.equal(output.trackingEvent.eventType, "departed");
});

test("carrier TMS adapter contract maps road movement into tracking", () => {
  assert.equal(
    integrationCarrierTmsMovementMetadata.name,
    "integration.adapter.carrier_tms.movement.process",
  );
  assert.equal(integrationCarrierTmsMovementMetadata.kind, "mutation");
  assert.deepEqual(integrationCarrierTmsMovementMetadata.permissions, [
    "integration.event.ingest",
    "tracking.event.record",
  ]);
  assert.equal(integrationCarrierTmsMovementMetadata.permissionMode, "all");
  assert.equal(integrationCarrierTmsMovementMetadata.idempotency, "required");

  const input = integrationCarrierTmsMovementInputSchema.parse({
    serviceAccountId: "svc_carrier",
    externalId: "CARRIER-MOVE-001",
    shipmentReference: "TRK-LOCAL-ROAD-001",
    movementType: "linehaul_departed",
    occurredAt: "2026-06-06T10:00:00.000Z",
    locationName: "Luanda Hub",
    carrierCode: "CARR-AO",
    vehiclePlate: "LD-409-AA",
    driverReference: "DRV-77",
    routeCode: "LAD-MSJ-01",
    payload: {
      trailer: "TRL-204",
    },
  });

  assert.equal(input.sourceSystem, "carrier-tms");
  assert.equal(input.vehiclePlate, "LD-409-AA");

  const output = integrationCarrierTmsMovementOutputSchema.parse({
    organizationId: "org_rail_port",
    adapter: {
      name: "carrier-tms",
      mode: "local-synchronous",
    },
    integrationEvent: {
      id: "evt_carrier",
      serviceAccountId: "svc_carrier",
      sourceSystem: "carrier-tms",
      externalId: "CARRIER-MOVE-001",
      eventType: "carrier_tms.movement",
      payload: {
        movementType: "linehaul_departed",
        shipmentReference: "TRK-LOCAL-ROAD-001",
      },
      receivedAt: "2026-06-06T10:00:00.000Z",
      processedAt: "2026-06-06T10:00:00.000Z",
    },
    trackingEvent: {
      id: "trk_evt_carrier",
      shipmentId: "trk_road",
      referenceCode: "TRK-LOCAL-ROAD-001",
      eventType: "departed",
      previousStatus: "in_transit",
      currentStatus: "in_transit",
      occurredAt: "2026-06-06T10:00:00.000Z",
      sourceSystem: "carrier-tms",
    },
    idempotency: {
      key: "carrier-tms:CARRIER-MOVE-001",
      replayed: false,
    },
    audit: {
      action: "integration.adapter.carrier_tms.processed",
      subjectType: "tracking.shipment",
      subjectId: "trk_road",
    },
    outbox: {
      eventType: "integration.adapter.carrier_tms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_road",
    },
  });

  assert.equal(output.trackingEvent.eventType, "departed");
});

test("telematics GPS adapter contract maps position data into tracking", () => {
  assert.equal(
    integrationTelematicsGpsPositionMetadata.name,
    "integration.adapter.telematics_gps.position.process",
  );
  assert.equal(integrationTelematicsGpsPositionMetadata.kind, "mutation");
  assert.deepEqual(integrationTelematicsGpsPositionMetadata.permissions, [
    "integration.event.ingest",
    "tracking.event.record",
  ]);
  assert.equal(integrationTelematicsGpsPositionMetadata.permissionMode, "all");
  assert.equal(integrationTelematicsGpsPositionMetadata.idempotency, "required");

  const input = integrationTelematicsGpsPositionInputSchema.parse({
    serviceAccountId: "svc_gps",
    externalId: "GPS-POS-001",
    shipmentReference: "TRK-LOCAL-RAIL-001",
    positionType: "position_reported",
    occurredAt: "2026-06-06T10:00:00.000Z",
    latitude: -8.838333,
    longitude: 13.234444,
    deviceId: "GPS-409",
    assetReference: "LOCO-77",
    geofenceName: "Luanda Corridor",
    speedKph: 42.5,
    headingDegrees: 93,
    routeCode: "LAD-MSJ-01",
    payload: {
      ignitionOn: true,
    },
  });

  assert.equal(input.sourceSystem, "telematics-gps");
  assert.equal(input.latitude, -8.838333);

  const output = integrationTelematicsGpsPositionOutputSchema.parse({
    organizationId: "org_rail_port",
    adapter: {
      name: "telematics-gps",
      mode: "local-synchronous",
    },
    integrationEvent: {
      id: "evt_gps",
      serviceAccountId: "svc_gps",
      sourceSystem: "telematics-gps",
      externalId: "GPS-POS-001",
      eventType: "telematics_gps.position",
      payload: {
        positionType: "position_reported",
        shipmentReference: "TRK-LOCAL-RAIL-001",
        latitude: -8.838333,
        longitude: 13.234444,
      },
      receivedAt: "2026-06-06T10:00:00.000Z",
      processedAt: "2026-06-06T10:00:00.000Z",
    },
    trackingEvent: {
      id: "trk_evt_gps",
      shipmentId: "trk_rail",
      referenceCode: "TRK-LOCAL-RAIL-001",
      eventType: "location_updated",
      previousStatus: "in_transit",
      currentStatus: "in_transit",
      occurredAt: "2026-06-06T10:00:00.000Z",
      sourceSystem: "telematics-gps",
    },
    idempotency: {
      key: "telematics-gps:GPS-POS-001",
      replayed: false,
    },
    audit: {
      action: "integration.adapter.telematics_gps.processed",
      subjectType: "tracking.shipment",
      subjectId: "trk_rail",
    },
    outbox: {
      eventType: "integration.adapter.telematics_gps.processed",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_rail",
    },
  });

  assert.equal(output.trackingEvent.eventType, "location_updated");
});

test("customs ERP adapter contract maps clearance status into tracking", () => {
  assert.equal(
    integrationCustomsErpStatusMetadata.name,
    "integration.adapter.customs_erp.status.process",
  );
  assert.equal(integrationCustomsErpStatusMetadata.kind, "mutation");
  assert.deepEqual(integrationCustomsErpStatusMetadata.permissions, [
    "integration.event.ingest",
    "tracking.event.record",
  ]);
  assert.equal(integrationCustomsErpStatusMetadata.permissionMode, "all");
  assert.equal(integrationCustomsErpStatusMetadata.idempotency, "required");

  const input = integrationCustomsErpStatusInputSchema.parse({
    serviceAccountId: "svc_customs",
    externalId: "CUSTOMS-STATUS-001",
    shipmentReference: "TRK-LOCAL-PORT-002",
    statusType: "customs_cleared",
    occurredAt: "2026-06-06T10:00:00.000Z",
    customsReference: "CUS-AO-409",
    documentReference: "DOC-409",
    declarationNumber: "DECL-2026-409",
    brokerReference: "BRK-77",
    authorityCode: "AGT-AO",
    payload: {
      channel: "green",
    },
  });

  assert.equal(input.sourceSystem, "customs-erp");
  assert.equal(input.statusType, "customs_cleared");

  const output = integrationCustomsErpStatusOutputSchema.parse({
    organizationId: "org_rail_port",
    adapter: {
      name: "customs-erp",
      mode: "local-synchronous",
    },
    integrationEvent: {
      id: "evt_customs",
      serviceAccountId: "svc_customs",
      sourceSystem: "customs-erp",
      externalId: "CUSTOMS-STATUS-001",
      eventType: "customs_erp.status",
      payload: {
        statusType: "customs_cleared",
        shipmentReference: "TRK-LOCAL-PORT-002",
      },
      receivedAt: "2026-06-06T10:00:00.000Z",
      processedAt: "2026-06-06T10:00:00.000Z",
    },
    trackingEvent: {
      id: "trk_evt_customs",
      shipmentId: "trk_port",
      referenceCode: "TRK-LOCAL-PORT-002",
      eventType: "released",
      previousStatus: "exception",
      currentStatus: "in_transit",
      occurredAt: "2026-06-06T10:00:00.000Z",
      sourceSystem: "customs-erp",
    },
    idempotency: {
      key: "customs-erp:CUSTOMS-STATUS-001",
      replayed: false,
    },
    audit: {
      action: "integration.adapter.customs_erp.processed",
      subjectType: "tracking.shipment",
      subjectId: "trk_port",
    },
    outbox: {
      eventType: "integration.adapter.customs_erp.processed",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_port",
    },
  });

  assert.equal(output.trackingEvent.eventType, "released");
});

test("warehouse WMS adapter contract maps yard activity into tracking", () => {
  assert.equal(
    integrationWarehouseWmsActivityMetadata.name,
    "integration.adapter.warehouse_wms.activity.process",
  );
  assert.equal(integrationWarehouseWmsActivityMetadata.kind, "mutation");
  assert.deepEqual(integrationWarehouseWmsActivityMetadata.permissions, [
    "integration.event.ingest",
    "tracking.event.record",
  ]);
  assert.equal(integrationWarehouseWmsActivityMetadata.permissionMode, "all");
  assert.equal(integrationWarehouseWmsActivityMetadata.idempotency, "required");

  const input = integrationWarehouseWmsActivityInputSchema.parse({
    serviceAccountId: "svc_wms",
    externalId: "WMS-ACT-001",
    shipmentReference: "TRK-LOCAL-MULTI-003",
    activityType: "loaded_for_dispatch",
    occurredAt: "2026-06-06T10:00:00.000Z",
    locationName: "Viana Warehouse",
    warehouseCode: "WH-VIA",
    zoneCode: "Z-7",
    dockDoor: "D-12",
    containerReference: "CONT-409",
    handlingUnitReference: "HU-409",
    operatorReference: "OP-77",
    palletCount: 24,
    payload: {
      scannerConfirmed: true,
    },
  });

  assert.equal(input.sourceSystem, "warehouse-wms");
  assert.equal(input.palletCount, 24);

  const output = integrationWarehouseWmsActivityOutputSchema.parse({
    organizationId: "org_rail_port",
    adapter: {
      name: "warehouse-wms",
      mode: "local-synchronous",
    },
    integrationEvent: {
      id: "evt_wms",
      serviceAccountId: "svc_wms",
      sourceSystem: "warehouse-wms",
      externalId: "WMS-ACT-001",
      eventType: "warehouse_wms.activity",
      payload: {
        activityType: "loaded_for_dispatch",
        shipmentReference: "TRK-LOCAL-MULTI-003",
      },
      receivedAt: "2026-06-06T10:00:00.000Z",
      processedAt: "2026-06-06T10:00:00.000Z",
    },
    trackingEvent: {
      id: "trk_evt_wms",
      shipmentId: "trk_multi",
      referenceCode: "TRK-LOCAL-MULTI-003",
      eventType: "departed",
      previousStatus: "arrived",
      currentStatus: "in_transit",
      occurredAt: "2026-06-06T10:00:00.000Z",
      sourceSystem: "warehouse-wms",
    },
    idempotency: {
      key: "warehouse-wms:WMS-ACT-001",
      replayed: false,
    },
    audit: {
      action: "integration.adapter.warehouse_wms.processed",
      subjectType: "tracking.shipment",
      subjectId: "trk_multi",
    },
    outbox: {
      eventType: "integration.adapter.warehouse_wms.processed",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_multi",
    },
  });

  assert.equal(output.trackingEvent.eventType, "departed");
});
