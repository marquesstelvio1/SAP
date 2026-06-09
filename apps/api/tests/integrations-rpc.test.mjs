import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createIntegrationsRpcRouter } from "../dist/integrations/integrations-rpc.router.js";

test("integrations overview RPC authorizes and delegates organization scope", async () => {
  const calls = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.api_key.manage"],
            correlationId: "corr_integrations_overview",
            traceContext: {
              correlationId: "corr_integrations_overview",
              requestId: "req_integrations_overview",
              operationName: "integration.gateway.overview.read",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview(_input) {
        return {
          generatedAt: "2026-06-06T00:00:00.000Z",
          totals: {
            serviceAccounts: 0,
            activeServiceAccounts: 0,
            activeApiKeys: 0,
            integrationEvents: 0,
            processedEvents: 0,
          },
          serviceAccounts: [],
          recentEvents: [],
          securityModel: {
            authorizationModel: "tenant-scoped-rbac-service-accounts",
            requiredPermissions: ["integration.api_key.manage", "integration.event.ingest"],
            idempotencyModel: "organization-sourceSystem-externalId",
            secretStorage: "sha256-hash-only",
          },
        };
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by overview test");
      },
      async processPortTosMovement() {
        throw new Error("processPortTosMovement should not be called by overview test");
      },
      async processRailTmsMovement() {
        throw new Error("processRailTmsMovement should not be called by overview test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by overview test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_integrations_overview",
        },
      },
    },
  });

  const overview = await client.integrations.overview({ limit: 5 });

  assert.equal(overview.securityModel.secretStorage, "sha256-hash-only");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "integration.gateway.overview.read");
});

test("integrations service account RPC delegates auditable input", async () => {
  const created = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.api_key.manage"],
            correlationId: "corr_integrations_create",
            traceContext: {
              correlationId: "corr_integrations_create",
              requestId: "req_integrations_create",
              operationName: "integration.service_account.create",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by create test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by create test");
      },
      async processPortTosMovement() {
        throw new Error("processPortTosMovement should not be called by create test");
      },
      async processRailTmsMovement() {
        throw new Error("processRailTmsMovement should not be called by create test");
      },
      async createServiceAccount(input) {
        created.push(input);

        return {
          organizationId: input.organizationId,
          serviceAccount: {
            id: "svc_e2e",
            name: input.name,
            scopes: input.scopes,
            active: true,
            createdByActorId: input.actorId,
            lastRotatedAt: "2026-06-06T00:00:00.000Z",
            createdAt: "2026-06-06T00:00:00.000Z",
            updatedAt: "2026-06-06T00:00:00.000Z",
            apiKeys: [],
          },
          apiKey: {
            prefix: "saptm_sk_local",
            plaintext: "saptm_sk_local_secret",
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "integration.api_key.created",
            subjectType: "service_account",
            subjectId: "svc_e2e",
          },
          outbox: {
            eventType: "integration.api_key.created",
            aggregateType: "integration.service_account",
            aggregateId: "svc_e2e",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.integrations.createServiceAccount({
    name: "Port TOS Bridge",
    scopes: ["integration.event.ingest"],
    idempotencyKey: "integration_create_001",
  });

  assert.equal(result.audit.action, "integration.api_key.created");
  assert.equal(created.length, 1);
  assert.equal(created[0].organizationId, "org_port_rail");
  assert.equal(created[0].actorId, "user_admin");
  assert.equal(created[0].ipAddress, "127.0.0.1");
});

test("integrations event RPC delegates idempotent external event", async () => {
  const recorded = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.event.ingest"],
            correlationId: "corr_integrations_event",
            traceContext: {
              correlationId: "corr_integrations_event",
              requestId: "req_integrations_event",
              operationName: "integration.event.record",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by event test");
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by event test");
      },
      async processPortTosMovement() {
        throw new Error("processPortTosMovement should not be called by event test");
      },
      async processRailTmsMovement() {
        throw new Error("processRailTmsMovement should not be called by event test");
      },
      async recordEvent(input) {
        recorded.push(input);

        return {
          organizationId: input.organizationId,
          event: {
            id: "evt_e2e",
            serviceAccountId: input.serviceAccountId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: input.eventType,
            payload: input.payload,
            receivedAt: "2026-06-06T00:00:00.000Z",
            processedAt: null,
          },
          idempotency: {
            key: `${input.sourceSystem}:${input.externalId}`,
            replayed: false,
          },
          audit: {
            action: "integration.event.received",
            subjectType: "integration_event",
            subjectId: "evt_e2e",
          },
          outbox: {
            eventType: "integration.event.received",
            aggregateType: "integration.event",
            aggregateId: "evt_e2e",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_integrations_event",
        },
      },
    },
  });

  const result = await client.integrations.recordEvent({
    serviceAccountId: "svc_e2e",
    sourceSystem: "port-tos",
    externalId: "MOVE-001",
    eventType: "tracking.location_updated",
    payload: {
      location: "Terminal A",
    },
  });

  assert.equal(result.idempotency.key, "port-tos:MOVE-001");
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].organizationId, "org_port_rail");
});

test("integrations Port TOS adapter RPC delegates governed movement input", async () => {
  const processed = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.event.ingest", "tracking.event.record"],
            correlationId: "corr_port_tos_adapter",
            traceContext: {
              correlationId: "corr_port_tos_adapter",
              requestId: "req_port_tos_adapter",
              operationName: "integration.adapter.port_tos.movement.process",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by adapter test");
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by adapter test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by adapter test");
      },
      async processRailTmsMovement() {
        throw new Error("processRailTmsMovement should not be called by Port TOS adapter test");
      },
      async processPortTosMovement(input) {
        processed.push(input);

        return {
          organizationId: input.organizationId,
          adapter: {
            name: "port-tos",
            mode: "local-synchronous",
          },
          integrationEvent: {
            id: "evt_tos",
            serviceAccountId: input.serviceAccountId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "port_tos.movement",
            payload: {
              movementType: input.movementType,
              shipmentReference: input.shipmentReference,
            },
            receivedAt: input.occurredAt,
            processedAt: input.occurredAt,
          },
          trackingEvent: {
            id: "trk_evt_tos",
            shipmentId: "trk_port",
            referenceCode: input.shipmentReference,
            eventType: "location_updated",
            previousStatus: "in_transit",
            currentStatus: "in_transit",
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
          },
          idempotency: {
            key: `${input.sourceSystem}:${input.externalId}`,
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
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.integrations.processPortTosMovement({
    serviceAccountId: "svc_e2e",
    sourceSystem: "port-tos",
    externalId: "TOS-MOVE-001",
    shipmentReference: "TRK-LOCAL-PORT-002",
    movementType: "gate_in",
    occurredAt: "2026-06-06T10:00:00.000Z",
    locationName: "Terminal B2",
    payload: {
      berth: "B2",
    },
  });

  assert.equal(result.audit.action, "integration.adapter.port_tos.processed");
  assert.equal(processed.length, 1);
  assert.equal(processed[0].organizationId, "org_port_rail");
  assert.equal(processed[0].ipAddress, "127.0.0.1");
});

test("integrations Rail TMS adapter RPC delegates governed movement input", async () => {
  const processed = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.event.ingest", "tracking.event.record"],
            correlationId: "corr_rail_tms_adapter",
            traceContext: {
              correlationId: "corr_rail_tms_adapter",
              requestId: "req_rail_tms_adapter",
              operationName: "integration.adapter.rail_tms.movement.process",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by Rail TMS adapter test");
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by Rail TMS adapter test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by Rail TMS adapter test");
      },
      async processPortTosMovement() {
        throw new Error("processPortTosMovement should not be called by Rail TMS adapter test");
      },
      async processRailTmsMovement(input) {
        processed.push(input);

        return {
          organizationId: input.organizationId,
          adapter: {
            name: "rail-tms",
            mode: "local-synchronous",
          },
          integrationEvent: {
            id: "evt_rail_tms",
            serviceAccountId: input.serviceAccountId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "rail_tms.movement",
            payload: {
              movementType: input.movementType,
              shipmentReference: input.shipmentReference,
            },
            receivedAt: input.occurredAt,
            processedAt: input.occurredAt,
          },
          trackingEvent: {
            id: "trk_evt_rail_tms",
            shipmentId: "trk_rail",
            referenceCode: input.shipmentReference,
            eventType: "departed",
            previousStatus: "in_transit",
            currentStatus: "in_transit",
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
          },
          idempotency: {
            key: `${input.sourceSystem}:${input.externalId}`,
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
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.integrations.processRailTmsMovement({
    serviceAccountId: "svc_e2e",
    sourceSystem: "rail-tms",
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

  assert.equal(result.audit.action, "integration.adapter.rail_tms.processed");
  assert.equal(processed.length, 1);
  assert.equal(processed[0].organizationId, "org_port_rail");
  assert.equal(processed[0].ipAddress, "127.0.0.1");
});

test("integrations Carrier TMS adapter RPC delegates governed movement input", async () => {
  const processed = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.event.ingest", "tracking.event.record"],
            correlationId: "corr_carrier_tms_adapter",
            traceContext: {
              correlationId: "corr_carrier_tms_adapter",
              requestId: "req_carrier_tms_adapter",
              operationName: "integration.adapter.carrier_tms.movement.process",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by Carrier TMS adapter test");
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by Carrier TMS adapter test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by Carrier TMS adapter test");
      },
      async processPortTosMovement() {
        throw new Error("processPortTosMovement should not be called by Carrier TMS adapter test");
      },
      async processRailTmsMovement() {
        throw new Error("processRailTmsMovement should not be called by Carrier TMS adapter test");
      },
      async processCarrierTmsMovement(input) {
        processed.push(input);

        return {
          organizationId: input.organizationId,
          adapter: {
            name: "carrier-tms",
            mode: "local-synchronous",
          },
          integrationEvent: {
            id: "evt_carrier_tms",
            serviceAccountId: input.serviceAccountId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "carrier_tms.movement",
            payload: {
              movementType: input.movementType,
              shipmentReference: input.shipmentReference,
            },
            receivedAt: input.occurredAt,
            processedAt: input.occurredAt,
          },
          trackingEvent: {
            id: "trk_evt_carrier_tms",
            shipmentId: "trk_road",
            referenceCode: input.shipmentReference,
            eventType: "departed",
            previousStatus: "in_transit",
            currentStatus: "in_transit",
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
          },
          idempotency: {
            key: `${input.sourceSystem}:${input.externalId}`,
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
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.integrations.processCarrierTmsMovement({
    serviceAccountId: "svc_e2e",
    sourceSystem: "carrier-tms",
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

  assert.equal(result.audit.action, "integration.adapter.carrier_tms.processed");
  assert.equal(processed.length, 1);
  assert.equal(processed[0].organizationId, "org_port_rail");
  assert.equal(processed[0].ipAddress, "127.0.0.1");
});

test("integrations Telematics GPS adapter RPC delegates governed position input", async () => {
  const processed = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.event.ingest", "tracking.event.record"],
            correlationId: "corr_telematics_gps_adapter",
            traceContext: {
              correlationId: "corr_telematics_gps_adapter",
              requestId: "req_telematics_gps_adapter",
              operationName: "integration.adapter.telematics_gps.position.process",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by Telematics GPS adapter test");
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by Telematics GPS adapter test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by Telematics GPS adapter test");
      },
      async processPortTosMovement() {
        throw new Error(
          "processPortTosMovement should not be called by Telematics GPS adapter test",
        );
      },
      async processRailTmsMovement() {
        throw new Error(
          "processRailTmsMovement should not be called by Telematics GPS adapter test",
        );
      },
      async processCarrierTmsMovement() {
        throw new Error(
          "processCarrierTmsMovement should not be called by Telematics GPS adapter test",
        );
      },
      async processTelematicsGpsPosition(input) {
        processed.push(input);

        return {
          organizationId: input.organizationId,
          adapter: {
            name: "telematics-gps",
            mode: "local-synchronous",
          },
          integrationEvent: {
            id: "evt_telematics_gps",
            serviceAccountId: input.serviceAccountId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "telematics_gps.position",
            payload: {
              positionType: input.positionType,
              shipmentReference: input.shipmentReference,
              latitude: input.latitude,
              longitude: input.longitude,
            },
            receivedAt: input.occurredAt,
            processedAt: input.occurredAt,
          },
          trackingEvent: {
            id: "trk_evt_telematics_gps",
            shipmentId: "trk_rail",
            referenceCode: input.shipmentReference,
            eventType: "location_updated",
            previousStatus: "in_transit",
            currentStatus: "in_transit",
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
          },
          idempotency: {
            key: `${input.sourceSystem}:${input.externalId}`,
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
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.integrations.processTelematicsGpsPosition({
    serviceAccountId: "svc_e2e",
    sourceSystem: "telematics-gps",
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

  assert.equal(result.audit.action, "integration.adapter.telematics_gps.processed");
  assert.equal(processed.length, 1);
  assert.equal(processed[0].organizationId, "org_port_rail");
  assert.equal(processed[0].ipAddress, "127.0.0.1");
});

test("integrations Customs ERP adapter RPC delegates governed status input", async () => {
  const processed = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.event.ingest", "tracking.event.record"],
            correlationId: "corr_customs_erp_adapter",
            traceContext: {
              correlationId: "corr_customs_erp_adapter",
              requestId: "req_customs_erp_adapter",
              operationName: "integration.adapter.customs_erp.status.process",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by Customs ERP adapter test");
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by Customs ERP adapter test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by Customs ERP adapter test");
      },
      async processPortTosMovement() {
        throw new Error("processPortTosMovement should not be called by Customs ERP adapter test");
      },
      async processRailTmsMovement() {
        throw new Error("processRailTmsMovement should not be called by Customs ERP adapter test");
      },
      async processCarrierTmsMovement() {
        throw new Error(
          "processCarrierTmsMovement should not be called by Customs ERP adapter test",
        );
      },
      async processTelematicsGpsPosition() {
        throw new Error(
          "processTelematicsGpsPosition should not be called by Customs ERP adapter test",
        );
      },
      async processCustomsErpStatus(input) {
        processed.push(input);

        return {
          organizationId: input.organizationId,
          adapter: {
            name: "customs-erp",
            mode: "local-synchronous",
          },
          integrationEvent: {
            id: "evt_customs_erp",
            serviceAccountId: input.serviceAccountId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "customs_erp.status",
            payload: {
              statusType: input.statusType,
              shipmentReference: input.shipmentReference,
            },
            receivedAt: input.occurredAt,
            processedAt: input.occurredAt,
          },
          trackingEvent: {
            id: "trk_evt_customs_erp",
            shipmentId: "trk_port",
            referenceCode: input.shipmentReference,
            eventType: "released",
            previousStatus: "exception",
            currentStatus: "in_transit",
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
          },
          idempotency: {
            key: `${input.sourceSystem}:${input.externalId}`,
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
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.integrations.processCustomsErpStatus({
    serviceAccountId: "svc_e2e",
    sourceSystem: "customs-erp",
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

  assert.equal(result.audit.action, "integration.adapter.customs_erp.processed");
  assert.equal(processed.length, 1);
  assert.equal(processed[0].organizationId, "org_port_rail");
  assert.equal(processed[0].ipAddress, "127.0.0.1");
});

test("integrations Warehouse WMS adapter RPC delegates governed activity input", async () => {
  const processed = [];
  const router = createIntegrationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["integration.event.ingest", "tracking.event.record"],
            correlationId: "corr_warehouse_wms_adapter",
            traceContext: {
              correlationId: "corr_warehouse_wms_adapter",
              requestId: "req_warehouse_wms_adapter",
              operationName: "integration.adapter.warehouse_wms.activity.process",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    integrationsService: {
      async getOverview() {
        throw new Error("getOverview should not be called by Warehouse WMS adapter test");
      },
      async createServiceAccount() {
        throw new Error("createServiceAccount should not be called by Warehouse WMS adapter test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by Warehouse WMS adapter test");
      },
      async processPortTosMovement() {
        throw new Error(
          "processPortTosMovement should not be called by Warehouse WMS adapter test",
        );
      },
      async processRailTmsMovement() {
        throw new Error(
          "processRailTmsMovement should not be called by Warehouse WMS adapter test",
        );
      },
      async processCarrierTmsMovement() {
        throw new Error(
          "processCarrierTmsMovement should not be called by Warehouse WMS adapter test",
        );
      },
      async processTelematicsGpsPosition() {
        throw new Error(
          "processTelematicsGpsPosition should not be called by Warehouse WMS adapter test",
        );
      },
      async processCustomsErpStatus() {
        throw new Error(
          "processCustomsErpStatus should not be called by Warehouse WMS adapter test",
        );
      },
      async processWarehouseWmsActivity(input) {
        processed.push(input);

        return {
          organizationId: input.organizationId,
          adapter: {
            name: "warehouse-wms",
            mode: "local-synchronous",
          },
          integrationEvent: {
            id: "evt_warehouse_wms",
            serviceAccountId: input.serviceAccountId,
            sourceSystem: input.sourceSystem,
            externalId: input.externalId,
            eventType: "warehouse_wms.activity",
            payload: {
              activityType: input.activityType,
              shipmentReference: input.shipmentReference,
            },
            receivedAt: input.occurredAt,
            processedAt: input.occurredAt,
          },
          trackingEvent: {
            id: "trk_evt_warehouse_wms",
            shipmentId: "trk_multi",
            referenceCode: input.shipmentReference,
            eventType: "departed",
            previousStatus: "arrived",
            currentStatus: "in_transit",
            occurredAt: input.occurredAt,
            sourceSystem: input.sourceSystem,
          },
          idempotency: {
            key: `${input.sourceSystem}:${input.externalId}`,
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
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "user-agent": "node-test",
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.integrations.processWarehouseWmsActivity({
    serviceAccountId: "svc_e2e",
    sourceSystem: "warehouse-wms",
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

  assert.equal(result.audit.action, "integration.adapter.warehouse_wms.processed");
  assert.equal(processed.length, 1);
  assert.equal(processed[0].organizationId, "org_port_rail");
  assert.equal(processed[0].ipAddress, "127.0.0.1");
});
