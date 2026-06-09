import assert from "node:assert/strict";
import { test } from "node:test";
import { createRouterClient } from "@orpc/server";
import { evaluateAuthorization } from "@saptm/auth";

import { createCargoRpcRouter } from "../dist/cargo/cargo-rpc.router.js";

test("cargo overview RPC authorizes request and delegates by organization", async () => {
  const calls = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.read"],
            correlationId: "corr_cargo_overview",
            traceContext: {
              correlationId: "corr_cargo_overview",
              requestId: "req_cargo_overview",
              operationName: "cargo.overview.read",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async getOverview(input) {
        return {
          generatedAt: "2026-06-04T00:00:00.000Z",
          organizationId: input.organizationId,
          totals: {
            cargo: 0,
            activeCargo: 0,
            heldCargo: 0,
            hazardousCargo: 0,
            inspectionRequiredCargo: 0,
          },
          statusCounts: [],
          recentCargo: [],
        };
      },
      async registerCargo() {
        throw new Error("registerCargo should not be called by overview test");
      },
      async releaseCargo() {
        throw new Error("releaseCargo should not be called by overview test");
      },
      async planTransport() {
        throw new Error("planTransport should not be called by overview test");
      },
      async departTransport() {
        throw new Error("departTransport should not be called by overview test");
      },
      async recordComplianceEvidence() {
        throw new Error("recordComplianceEvidence should not be called by overview test");
      },
      async verifyComplianceEvidence() {
        throw new Error("verifyComplianceEvidence should not be called by overview test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_cargo_overview",
        },
      },
    },
  });

  const overview = await client.cargo.overview({ limit: 5 });

  assert.equal(overview.organizationId, "org_port_rail");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.overview.read");
});

test("cargo register RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const registered = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.register"],
            correlationId: "corr_cargo_register",
            traceContext: {
              correlationId: "corr_cargo_register",
              requestId: "req_cargo_register",
              operationName: "cargo.register",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async getOverview() {
        throw new Error("getOverview should not be called by register test");
      },
      async releaseCargo() {
        throw new Error("releaseCargo should not be called by register test");
      },
      async planTransport() {
        throw new Error("planTransport should not be called by register test");
      },
      async departTransport() {
        throw new Error("departTransport should not be called by register test");
      },
      async recordComplianceEvidence() {
        throw new Error("recordComplianceEvidence should not be called by register test");
      },
      async verifyComplianceEvidence() {
        throw new Error("verifyComplianceEvidence should not be called by register test");
      },
      async registerCargo(input) {
        registered.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: "cargo_001",
          cargo: {
            id: "cargo_001",
            cargoReference: input.cargoReference,
            externalReference: input.externalReference ?? null,
            cargoDescription: input.cargoDescription,
            cargoType: input.cargoType,
            status: input.hazardous || input.requiresInspection ? "held" : "registered",
            customsStatus: input.customsStatus,
            customsReference: input.customsReference ?? null,
            conditionStatus: input.conditionStatus,
            grossWeightKg: input.grossWeightKg,
            packageCount: input.packageCount,
            hazardous: input.hazardous,
            unNumber: input.unNumber ?? null,
            hazardClass: input.hazardClass ?? null,
            requiresInspection: input.hazardous || input.requiresInspection,
            shipperName: input.shipperName,
            consigneeName: input.consigneeName,
            originName: input.originName,
            destinationName: input.destinationName,
            custodyOwnerName: input.custodyOwnerName,
            priority: input.priority,
            expectedReadyAt: input.expectedReadyAt ?? null,
            sourceSystem: input.sourceSystem,
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: "2026-06-04T00:00:00.000Z",
          },
          businessRules: {
            movementBlocked: input.hazardous || input.requiresInspection,
            inspectionRequired: input.hazardous || input.requiresInspection,
            customsBlocked: input.customsStatus === "held",
            appliedRules: ["idempotent_registration"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.registered",
            subjectType: "cargo",
            subjectId: "cargo_001",
          },
          outbox: {
            eventType: "cargo.registered",
            aggregateType: "cargo",
            aggregateId: "cargo_001",
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

  const result = await client.cargo.register({
    cargoReference: "CGO-2026-0001",
    cargoDescription: "Fuel drums",
    cargoType: "hazardous",
    grossWeightKg: 900,
    packageCount: 10,
    shipperName: "Shipper A",
    consigneeName: "Consignee B",
    originName: "Rail Yard A",
    destinationName: "Port Terminal B",
    custodyOwnerName: "Operations Desk",
    hazardous: true,
    unNumber: "UN1203",
    hazardClass: "3",
    requiresInspection: true,
    idempotencyKey: "idem_cargo_001",
  });

  assert.equal(result.audit.action, "cargo.registered");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.register");
  assert.equal(registered.length, 1);
  assert.equal(registered[0].organizationId, "org_port_rail");
  assert.equal(registered[0].actorId, "user_ops");
  assert.equal(registered[0].userAgent, "node-test");
  assert.equal(registered[0].ipAddress, "127.0.0.1");
});

test("cargo release RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const released = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.release"],
            correlationId: "corr_cargo_release",
            traceContext: {
              correlationId: "corr_cargo_release",
              requestId: "req_cargo_release",
              operationName: "cargo.release",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async getOverview() {
        throw new Error("getOverview should not be called by release test");
      },
      async registerCargo() {
        throw new Error("registerCargo should not be called by release test");
      },
      async planTransport() {
        throw new Error("planTransport should not be called by release test");
      },
      async departTransport() {
        throw new Error("departTransport should not be called by release test");
      },
      async recordComplianceEvidence() {
        throw new Error("recordComplianceEvidence should not be called by release test");
      },
      async verifyComplianceEvidence() {
        throw new Error("verifyComplianceEvidence should not be called by release test");
      },
      async releaseCargo(input) {
        released.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          cargo: {
            id: input.cargoId,
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "ready_for_transport",
            customsStatus: input.customsStatus,
            customsReference: null,
            conditionStatus: "sound",
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            releaseReference: input.releaseReference ?? null,
            releaseReason: input.releaseReason,
            releasedAt: input.releasedAt ?? "2026-06-04T00:00:00.000Z",
            sourceSystem: input.sourceSystem,
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: "2026-06-04T00:00:00.000Z",
          },
          businessRules: {
            releaseAllowed: true,
            movementBlocked: false,
            customsReleaseRequired: true,
            inspectionRequiredBeforeRelease: true,
            appliedRules: ["cargo_ready_for_transport_after_governed_release"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.released",
            subjectType: "cargo",
            subjectId: input.cargoId,
          },
          outbox: {
            eventType: "cargo.released",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.release({
    cargoId: "cargo_001",
    customsStatus: "cleared",
    inspectionOutcome: "passed",
    releaseReference: "CLR-2026-0001",
    releaseReason: "Customs released and inspection passed",
    idempotencyKey: "idem_cargo_release_001",
  });

  assert.equal(result.audit.action, "cargo.released");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.release");
  assert.equal(released.length, 1);
  assert.equal(released[0].organizationId, "org_port_rail");
  assert.equal(released[0].actorId, "user_ops");
  assert.equal(released[0].userAgent, "node-test");
  assert.equal(released[0].ipAddress, "127.0.0.1");
});

test("cargo transport plan RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const planned = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.transport.plan"],
            correlationId: "corr_cargo_plan",
            traceContext: {
              correlationId: "corr_cargo_plan",
              requestId: "req_cargo_plan",
              operationName: "cargo.transport.plan",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async getOverview() {
        throw new Error("getOverview should not be called by plan test");
      },
      async registerCargo() {
        throw new Error("registerCargo should not be called by plan test");
      },
      async releaseCargo() {
        throw new Error("releaseCargo should not be called by plan test");
      },
      async departTransport() {
        throw new Error("departTransport should not be called by plan test");
      },
      async recordComplianceEvidence() {
        throw new Error("recordComplianceEvidence should not be called by plan test");
      },
      async verifyComplianceEvidence() {
        throw new Error("verifyComplianceEvidence should not be called by plan test");
      },
      async planTransport(input) {
        planned.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          shipmentId: "shipment_001",
          cargo: {
            id: input.cargoId,
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "ready_for_transport",
            customsStatus: "cleared",
            conditionStatus: "sound",
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            transportPlannedAt: "2026-06-04T00:00:00.000Z",
            transportPlanningReference: input.planningReference ?? null,
            transportOwnerTeam: input.operationsOwnerTeam,
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: "2026-06-04T00:00:00.000Z",
          },
          shipment: {
            id: "shipment_001",
            referenceCode: input.referenceCode ?? "CGO-2026-0001",
            transportMode: input.transportMode,
            status: "planned",
            plannedDepartureAt: input.plannedDepartureAt,
            estimatedArrivalAt: input.estimatedArrivalAt,
          },
          businessRules: {
            planningAllowed: true,
            cargoReadyForTracking: true,
            trackingLinked: true,
            appliedRules: ["cargo_linked_to_tracking_shipment"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.transport_planned",
            subjectType: "cargo",
            subjectId: input.cargoId,
          },
          outbox: {
            eventType: "cargo.transport_planned",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.planTransport({
    cargoId: "cargo_001",
    referenceCode: "TRK-2026-0001",
    transportMode: "rail",
    plannedDepartureAt: "2026-06-05T08:00:00.000Z",
    estimatedArrivalAt: "2026-06-06T08:00:00.000Z",
    operationsOwnerTeam: "Rail Ops",
    planningReference: "PLAN-2026-0001",
    firstCheckpointName: "Rail Yard A",
    idempotencyKey: "idem_cargo_plan_001",
  });

  assert.equal(result.audit.action, "cargo.transport_planned");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.transport.plan");
  assert.equal(planned.length, 1);
  assert.equal(planned[0].organizationId, "org_port_rail");
  assert.equal(planned[0].actorId, "user_ops");
  assert.equal(planned[0].userAgent, "node-test");
  assert.equal(planned[0].ipAddress, "127.0.0.1");
});

test("cargo transport depart RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const departed = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.transport.depart"],
            correlationId: "corr_cargo_depart",
            traceContext: {
              correlationId: "corr_cargo_depart",
              requestId: "req_cargo_depart",
              operationName: "cargo.transport.depart",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async getOverview() {
        throw new Error("getOverview should not be called by depart test");
      },
      async registerCargo() {
        throw new Error("registerCargo should not be called by depart test");
      },
      async releaseCargo() {
        throw new Error("releaseCargo should not be called by depart test");
      },
      async planTransport() {
        throw new Error("planTransport should not be called by depart test");
      },
      async recordComplianceEvidence() {
        throw new Error("recordComplianceEvidence should not be called by depart test");
      },
      async verifyComplianceEvidence() {
        throw new Error("verifyComplianceEvidence should not be called by depart test");
      },
      async departTransport(input) {
        departed.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          shipmentId: "shipment_001",
          eventId: "event_001",
          cargo: {
            id: input.cargoId,
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "in_transport",
            customsStatus: "cleared",
            conditionStatus: "sound",
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            departedAt: input.departedAt,
            departureReference: input.departureReference ?? null,
            departureLocationName: input.departureLocationName,
            departureOperatorName: input.operatorName,
            carrierReference: input.carrierReference ?? null,
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: input.departedAt,
          },
          shipment: {
            id: "shipment_001",
            referenceCode: "TRK-2026-0001",
            transportMode: "rail",
            previousStatus: "planned",
            status: "in_transit",
          },
          event: {
            id: "event_001",
            eventType: "departed",
            occurredAt: input.departedAt,
            locationName: input.departureLocationName,
          },
          businessRules: {
            departureAllowed: true,
            cargoReadyForDeparture: true,
            trackingShipmentPlanned: true,
            approvedComplianceEvidencePresent: true,
            openComplianceReviewBlocked: false,
            appliedRules: ["cargo_departed_to_in_transport"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.transport_departed",
            subjectType: "cargo",
            subjectId: input.cargoId,
          },
          outbox: {
            eventType: "cargo.transport_departed",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.departTransport({
    cargoId: "cargo_001",
    departedAt: "2026-06-05T08:00:00.000Z",
    departureLocationName: "Rail Yard A",
    operatorName: "Operations Controller",
    departureReference: "DEP-2026-0001",
    carrierReference: "TRAIN-77",
    idempotencyKey: "idem_cargo_depart_001",
  });

  assert.equal(result.audit.action, "cargo.transport_departed");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.transport.depart");
  assert.equal(departed.length, 1);
  assert.equal(departed[0].organizationId, "org_port_rail");
  assert.equal(departed[0].actorId, "user_ops");
  assert.equal(departed[0].userAgent, "node-test");
  assert.equal(departed[0].ipAddress, "127.0.0.1");
});

test("cargo transport arrive RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const arrived = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.transport.arrive"],
            correlationId: "corr_cargo_arrive",
            traceContext: {
              correlationId: "corr_cargo_arrive",
              requestId: "req_cargo_arrive",
              operationName: "cargo.transport.arrive",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async arriveTransport(input) {
        arrived.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          shipmentId: "shipment_001",
          eventId: "event_arrived_001",
          cargo: {
            id: input.cargoId,
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "in_transport",
            customsStatus: "cleared",
            conditionStatus: "sound",
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            arrivedAt: input.arrivedAt,
            arrivalReference: input.arrivalReference ?? null,
            arrivalLocationName: input.arrivalLocationName,
            arrivalOperatorName: input.operatorName,
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: input.arrivedAt,
          },
          shipment: {
            id: "shipment_001",
            referenceCode: "TRK-2026-0001",
            transportMode: "rail",
            previousStatus: "in_transit",
            status: "arrived",
            actualArrivalAt: input.arrivedAt,
          },
          event: {
            id: "event_arrived_001",
            eventType: "arrived",
            occurredAt: input.arrivedAt,
            locationName: input.arrivalLocationName,
          },
          businessRules: {
            arrivalAllowed: true,
            cargoInTransport: true,
            trackingShipmentInTransit: true,
            arrivalAfterDeparture: true,
            appliedRules: ["tracking_shipment_moved_to_arrived"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.transport_arrived",
            subjectType: "cargo",
            subjectId: input.cargoId,
          },
          outbox: {
            eventType: "cargo.transport_arrived",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.arriveTransport({
    cargoId: "cargo_001",
    arrivedAt: "2026-06-06T08:00:00.000Z",
    arrivalLocationName: "Port Terminal B",
    operatorName: "Terminal Controller",
    arrivalReference: "ARR-2026-0001",
    idempotencyKey: "idem_cargo_arrive_001",
  });

  assert.equal(result.audit.action, "cargo.transport_arrived");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.transport.arrive");
  assert.equal(arrived.length, 1);
  assert.equal(arrived[0].organizationId, "org_port_rail");
  assert.equal(arrived[0].actorId, "user_ops");
  assert.equal(arrived[0].userAgent, "node-test");
  assert.equal(arrived[0].ipAddress, "127.0.0.1");
});

test("cargo delivery complete RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const delivered = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.delivery.complete"],
            correlationId: "corr_cargo_delivery",
            traceContext: {
              correlationId: "corr_cargo_delivery",
              requestId: "req_cargo_delivery",
              operationName: "cargo.delivery.complete",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async completeDelivery(input) {
        delivered.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          shipmentId: "shipment_001",
          eventId: "event_handover_001",
          cargo: {
            id: input.cargoId,
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "delivered",
            customsStatus: "cleared",
            conditionStatus: input.deliveryConditionStatus,
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            deliveredAt: input.deliveredAt,
            deliveryReference: input.deliveryReference,
            receivedByName: input.receivedByName,
            deliveryNotes: input.deliveryNotes ?? null,
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: input.deliveredAt,
          },
          shipment: {
            id: "shipment_001",
            referenceCode: "TRK-2026-0001",
            transportMode: "rail",
            previousStatus: "arrived",
            status: "completed",
          },
          event: {
            id: "event_handover_001",
            eventType: "handover_completed",
            occurredAt: input.deliveredAt,
            locationName: "Port Terminal B",
          },
          businessRules: {
            deliveryAllowed: true,
            cargoArrivedForDelivery: true,
            trackingShipmentArrived: true,
            deliveryAfterArrival: true,
            deliveryConditionAccepted: true,
            appliedRules: ["cargo_marked_delivered"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.delivery_completed",
            subjectType: "cargo",
            subjectId: input.cargoId,
          },
          outbox: {
            eventType: "cargo.delivery_completed",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.completeDelivery({
    cargoId: "cargo_001",
    deliveredAt: "2026-06-06T10:00:00.000Z",
    receivedByName: "Consignee Controller",
    deliveryReference: "DLV-2026-0001",
    deliveryConditionStatus: "sound",
    idempotencyKey: "idem_cargo_delivery_001",
  });

  assert.equal(result.audit.action, "cargo.delivery_completed");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.delivery.complete");
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].organizationId, "org_port_rail");
  assert.equal(delivered[0].actorId, "user_ops");
  assert.equal(delivered[0].userAgent, "node-test");
  assert.equal(delivered[0].ipAddress, "127.0.0.1");
});

test("cargo operational handoff record RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const handoffs = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.handoff.record"],
            correlationId: "corr_cargo_handoff",
            traceContext: {
              correlationId: "corr_cargo_handoff",
              requestId: "req_cargo_handoff",
              operationName: "cargo.handoff.record",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async recordOperationalHandoff(input) {
        handoffs.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          handoffId: "handoff_001",
          shipmentId: "shipment_001",
          eventId: "event_handoff_001",
          cargo: {
            id: input.cargoId,
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "in_transport",
            customsStatus: "cleared",
            conditionStatus: "sound",
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: input.toCustodyOwnerName,
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: input.handoffAt,
          },
          handoff: {
            id: "handoff_001",
            cargoId: input.cargoId,
            trackingShipmentId: "shipment_001",
            handoffType: input.handoffType,
            fromCustodyOwnerName: input.fromCustodyOwnerName,
            toCustodyOwnerName: input.toCustodyOwnerName,
            handoffLocationName: input.handoffLocationName,
            operatorName: input.operatorName,
            handoffReference: input.handoffReference,
            sealReference: input.sealReference ?? null,
            conditionStatus: input.conditionStatus,
            handoffNotes: input.handoffNotes ?? null,
            handoffAt: input.handoffAt,
            sourceSystem: input.sourceSystem,
            createdAt: input.handoffAt,
            updatedAt: input.handoffAt,
          },
          shipment: {
            id: "shipment_001",
            referenceCode: "TRK-2026-0001",
            transportMode: "multimodal",
            previousStatus: "in_transit",
            status: "in_transit",
          },
          event: {
            id: "event_handoff_001",
            eventType: "location_updated",
            occurredAt: input.handoffAt,
            locationName: input.handoffLocationName,
          },
          businessRules: {
            handoffAllowed: true,
            cargoInTransport: true,
            trackingShipmentInTransit: true,
            handoffAfterDeparture: true,
            handoffBeforeArrival: true,
            currentCustodyMatched: true,
            custodyChanged: true,
            conditionAccepted: true,
            duplicateReferenceBlocked: false,
            appliedRules: ["cargo_custody_transferred"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.operational_handoff.recorded",
            subjectType: "cargo_operational_handoff",
            subjectId: "handoff_001",
          },
          outbox: {
            eventType: "cargo.operational_handoff.recorded",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.recordOperationalHandoff({
    cargoId: "cargo_001",
    handoffType: "rail_to_port",
    handoffAt: "2026-06-05T12:00:00.000Z",
    handoffLocationName: "Port Gate A",
    fromCustodyOwnerName: "Rail Operator",
    toCustodyOwnerName: "Port Operator",
    operatorName: "Gate Controller",
    handoffReference: "HND-2026-0001",
    sealReference: "SEAL-001",
    idempotencyKey: "idem_cargo_handoff_001",
  });

  assert.equal(result.audit.action, "cargo.operational_handoff.recorded");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.handoff.record");
  assert.equal(handoffs.length, 1);
  assert.equal(handoffs[0].organizationId, "org_port_rail");
  assert.equal(handoffs[0].actorId, "user_ops");
  assert.equal(handoffs[0].userAgent, "node-test");
  assert.equal(handoffs[0].ipAddress, "127.0.0.1");
});

test("cargo delivery exception record RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const exceptions = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.delivery.exception.record"],
            correlationId: "corr_cargo_delivery_exception",
            traceContext: {
              correlationId: "corr_cargo_delivery_exception",
              requestId: "req_cargo_delivery_exception",
              operationName: "cargo.delivery.exception.record",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async recordDeliveryException(input) {
        exceptions.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          exceptionId: "dex_001",
          shipmentId: "shipment_001",
          eventId: "event_exception_001",
          cargo: {
            id: input.cargoId,
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "held",
            customsStatus: "cleared",
            conditionStatus: input.deliveryConditionStatus,
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: true,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: input.occurredAt,
          },
          exception: {
            id: "dex_001",
            cargoId: input.cargoId,
            trackingShipmentId: "shipment_001",
            exceptionType: input.exceptionType,
            deliveryConditionStatus: input.deliveryConditionStatus,
            status: "open",
            reportedByName: input.reportedByName,
            exceptionSummary: input.exceptionSummary,
            evidenceReference: input.evidenceReference,
            claimReference: input.claimReference ?? null,
            occurredAt: input.occurredAt,
            resolverName: null,
            resolutionCode: null,
            resolutionReference: null,
            resolutionSummary: null,
            resolvedAt: null,
            sourceSystem: input.sourceSystem,
            createdAt: input.occurredAt,
            updatedAt: input.occurredAt,
          },
          shipment: {
            id: "shipment_001",
            referenceCode: "TRK-2026-0001",
            transportMode: "rail",
            previousStatus: "arrived",
            status: "exception",
          },
          event: {
            id: "event_exception_001",
            eventType: "exception",
            occurredAt: input.occurredAt,
            locationName: "Port Terminal B",
          },
          businessRules: {
            exceptionAccepted: true,
            cargoArrivedForException: true,
            trackingShipmentArrived: true,
            openExceptionBlocked: false,
            exceptionAfterArrival: true,
            appliedRules: ["cargo_delivery_exception_opened"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.delivery_exception.recorded",
            subjectType: "cargo_delivery_exception",
            subjectId: "dex_001",
          },
          outbox: {
            eventType: "cargo.delivery_exception.recorded",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.recordDeliveryException({
    cargoId: "cargo_001",
    exceptionType: "damage",
    deliveryConditionStatus: "damaged",
    occurredAt: "2026-06-06T10:00:00.000Z",
    reportedByName: "Terminal Inspector",
    exceptionSummary: "Container damaged at destination",
    evidenceReference: "PHOTO-001",
    claimReference: "CLM-2026-0001",
    idempotencyKey: "idem_cargo_delivery_exception_001",
  });

  assert.equal(result.audit.action, "cargo.delivery_exception.recorded");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.delivery.exception.record");
  assert.equal(exceptions.length, 1);
  assert.equal(exceptions[0].organizationId, "org_port_rail");
  assert.equal(exceptions[0].actorId, "user_ops");
  assert.equal(exceptions[0].userAgent, "node-test");
  assert.equal(exceptions[0].ipAddress, "127.0.0.1");
});

test("cargo delivery exception resolve RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const resolutions = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.delivery.exception.resolve"],
            correlationId: "corr_cargo_delivery_exception_resolve",
            traceContext: {
              correlationId: "corr_cargo_delivery_exception_resolve",
              requestId: "req_cargo_delivery_exception_resolve",
              operationName: "cargo.delivery.exception.resolve",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async resolveDeliveryException(input) {
        resolutions.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: "cargo_001",
          exceptionId: input.exceptionId,
          shipmentId: "shipment_001",
          eventId: "event_released_001",
          cargo: {
            id: "cargo_001",
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "in_transport",
            customsStatus: "cleared",
            conditionStatus: "sound",
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: input.resolvedAt,
          },
          exception: {
            id: input.exceptionId,
            cargoId: "cargo_001",
            trackingShipmentId: "shipment_001",
            exceptionType: "damage",
            deliveryConditionStatus: "damaged",
            status: "resolved",
            reportedByName: "Terminal Inspector",
            exceptionSummary: "Container damaged at destination",
            evidenceReference: "PHOTO-001",
            claimReference: "CLM-2026-0001",
            occurredAt: "2026-06-06T10:00:00.000Z",
            resolverName: input.resolverName,
            resolutionCode: input.resolutionCode,
            resolutionReference: input.resolutionReference,
            resolutionSummary: input.resolutionSummary,
            resolvedAt: input.resolvedAt,
            sourceSystem: input.sourceSystem,
            createdAt: "2026-06-06T10:00:00.000Z",
            updatedAt: input.resolvedAt,
          },
          shipment: {
            id: "shipment_001",
            referenceCode: "TRK-2026-0001",
            transportMode: "rail",
            previousStatus: "exception",
            status: "arrived",
          },
          event: {
            id: "event_released_001",
            eventType: "released",
            occurredAt: input.resolvedAt,
            locationName: "Port Terminal B",
          },
          businessRules: {
            resolutionAllowed: true,
            openException: true,
            cargoHeldForInspection: true,
            trackingShipmentException: true,
            resolutionAfterException: true,
            cargoRestoredForDelivery: true,
            appliedRules: ["cargo_restored_for_delivery_completion"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.delivery_exception.resolved",
            subjectType: "cargo_delivery_exception",
            subjectId: input.exceptionId,
          },
          outbox: {
            eventType: "cargo.delivery_exception.resolved",
            aggregateType: "cargo",
            aggregateId: "cargo_001",
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

  const result = await client.cargo.resolveDeliveryException({
    exceptionId: "dex_001",
    resolutionCode: "inspection_passed",
    resolvedAt: "2026-06-06T11:00:00.000Z",
    resolverName: "QA Supervisor",
    resolutionReference: "INSP-2026-0001",
    resolutionSummary: "Inspection passed after rework",
    idempotencyKey: "idem_cargo_delivery_exception_resolve_001",
  });

  assert.equal(result.audit.action, "cargo.delivery_exception.resolved");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.delivery.exception.resolve");
  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].organizationId, "org_port_rail");
  assert.equal(resolutions[0].actorId, "user_ops");
  assert.equal(resolutions[0].userAgent, "node-test");
  assert.equal(resolutions[0].ipAddress, "127.0.0.1");
});

test("cargo claim settlement RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const settlements = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_claims",
            userId: "user_claims",
            organizationId: "org_port_rail",
            permissions: ["cargo.claim.settle"],
            correlationId: "corr_cargo_claim_settlement",
            traceContext: {
              correlationId: "corr_cargo_claim_settlement",
              requestId: "req_cargo_claim_settlement",
              operationName: "cargo.claim.settle",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async recordClaimSettlement(input) {
        settlements.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: "cargo_001",
          exceptionId: input.exceptionId,
          settlementId: "settlement_001",
          cargo: {
            id: "cargo_001",
            cargoReference: "CGO-2026-0001",
            externalReference: null,
            cargoDescription: "Fuel drums",
            cargoType: "hazardous",
            status: "in_transport",
            customsStatus: "cleared",
            conditionStatus: "sound",
            grossWeightKg: 900,
            packageCount: 10,
            hazardous: true,
            requiresInspection: false,
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            custodyOwnerName: "Operations Desk",
            priority: 3,
            expectedReadyAt: null,
            trackingShipmentId: "shipment_001",
            createdAt: "2026-06-04T00:00:00.000Z",
            updatedAt: input.settledAt,
          },
          exception: {
            id: input.exceptionId,
            cargoId: "cargo_001",
            trackingShipmentId: "shipment_001",
            exceptionType: "damage",
            deliveryConditionStatus: "damaged",
            status: "resolved",
            reportedByName: "Terminal Inspector",
            exceptionSummary: "Container damaged at destination",
            evidenceReference: "PHOTO-001",
            claimReference: input.claimReference,
            occurredAt: "2026-06-06T10:00:00.000Z",
            resolverName: "Claims Supervisor",
            resolutionCode: "claim_accepted",
            resolutionReference: input.claimReference,
            resolutionSummary: "Claim accepted after inspection",
            resolvedAt: "2026-06-06T11:00:00.000Z",
            sourceSystem: input.sourceSystem,
            createdAt: "2026-06-06T10:00:00.000Z",
            updatedAt: "2026-06-06T11:00:00.000Z",
          },
          settlement: {
            id: "settlement_001",
            cargoId: "cargo_001",
            deliveryExceptionId: input.exceptionId,
            claimReference: input.claimReference,
            settlementReference: input.settlementReference,
            settlementType: input.settlementType,
            settlementStatus: "settled",
            currencyCode: input.currencyCode,
            settlementAmount: input.settlementAmount,
            settledByName: input.settledByName,
            counterpartyName: input.counterpartyName,
            settlementSummary: input.settlementSummary,
            settledAt: input.settledAt,
            sourceSystem: input.sourceSystem,
            createdAt: input.settledAt,
            updatedAt: input.settledAt,
          },
          businessRules: {
            settlementAllowed: true,
            resolvedException: true,
            claimReferencePresent: true,
            claimReferenceMatched: true,
            claimResolutionAccepted: true,
            settlementAfterResolution: true,
            duplicateSettlementBlocked: false,
            duplicateReferenceBlocked: false,
            appliedRules: ["claim_settlement_accounting_recorded"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.claim_settlement.recorded",
            subjectType: "cargo_claim_settlement",
            subjectId: "settlement_001",
          },
          outbox: {
            eventType: "cargo.claim_settlement.recorded",
            aggregateType: "cargo",
            aggregateId: "cargo_001",
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

  const result = await client.cargo.recordClaimSettlement({
    exceptionId: "dex_001",
    claimReference: "CLM-2026-0001",
    settlementReference: "SET-2026-0001",
    settlementType: "carrier_liability",
    currencyCode: "USD",
    settlementAmount: 12_500,
    settledByName: "Claims Manager",
    counterpartyName: "Rail Carrier",
    settlementSummary: "Carrier liability accepted after inspection",
    settledAt: "2026-06-06T12:00:00.000Z",
    idempotencyKey: "idem_cargo_claim_settlement_001",
  });

  assert.equal(result.audit.action, "cargo.claim_settlement.recorded");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.claim.settle");
  assert.equal(settlements.length, 1);
  assert.equal(settlements[0].organizationId, "org_port_rail");
  assert.equal(settlements[0].actorId, "user_claims");
  assert.equal(settlements[0].userAgent, "node-test");
  assert.equal(settlements[0].ipAddress, "127.0.0.1");
});

test("cargo compliance evidence record RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const recorded = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.compliance.record"],
            correlationId: "corr_cargo_evidence_record",
            traceContext: {
              correlationId: "corr_cargo_evidence_record",
              requestId: "req_cargo_evidence_record",
              operationName: "cargo.compliance.evidence.record",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async getOverview() {
        throw new Error("getOverview should not be called by evidence record test");
      },
      async registerCargo() {
        throw new Error("registerCargo should not be called by evidence record test");
      },
      async releaseCargo() {
        throw new Error("releaseCargo should not be called by evidence record test");
      },
      async planTransport() {
        throw new Error("planTransport should not be called by evidence record test");
      },
      async departTransport() {
        throw new Error("departTransport should not be called by evidence record test");
      },
      async verifyComplianceEvidence() {
        throw new Error("verifyComplianceEvidence should not be called by evidence record test");
      },
      async recordComplianceEvidence(input) {
        recorded.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: input.cargoId,
          evidenceId: "evidence_001",
          evidence: {
            id: "evidence_001",
            cargoId: input.cargoId,
            evidenceType: input.evidenceType,
            documentReference: input.documentReference,
            documentTitle: input.documentTitle,
            documentUri: input.documentUri ?? null,
            issuerName: input.issuerName,
            issuedAt: input.issuedAt ?? null,
            expiresAt: input.expiresAt ?? null,
            status: "pending_review",
            reviewerName: null,
            reviewReference: null,
            reviewSummary: null,
            rejectionReason: null,
            reviewedAt: null,
            sourceSystem: input.sourceSystem,
            recordedAt: "2026-06-04T00:00:00.000Z",
            updatedAt: "2026-06-04T00:00:00.000Z",
          },
          businessRules: {
            evidenceAccepted: true,
            reviewRequired: true,
            appliedRules: ["compliance_evidence_requires_human_review"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.compliance_evidence.recorded",
            subjectType: "cargo_compliance_evidence",
            subjectId: "evidence_001",
          },
          outbox: {
            eventType: "cargo.compliance_evidence.recorded",
            aggregateType: "cargo",
            aggregateId: input.cargoId,
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

  const result = await client.cargo.recordComplianceEvidence({
    cargoId: "cargo_001",
    evidenceType: "bill_of_lading",
    documentReference: "BL-2026-0001",
    documentTitle: "Primary bill of lading",
    issuerName: "Shipping Line",
    idempotencyKey: "idem_cargo_evidence_001",
  });

  assert.equal(result.audit.action, "cargo.compliance_evidence.recorded");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.compliance.evidence.record");
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].organizationId, "org_port_rail");
  assert.equal(recorded[0].actorId, "user_ops");
  assert.equal(recorded[0].userAgent, "node-test");
  assert.equal(recorded[0].ipAddress, "127.0.0.1");
});

test("cargo compliance evidence verify RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const verified = [];
  const router = createCargoRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_ops",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["cargo.compliance.verify"],
            correlationId: "corr_cargo_evidence_verify",
            traceContext: {
              correlationId: "corr_cargo_evidence_verify",
              requestId: "req_cargo_evidence_verify",
              operationName: "cargo.compliance.evidence.verify",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    cargoService: {
      async getOverview() {
        throw new Error("getOverview should not be called by evidence verify test");
      },
      async registerCargo() {
        throw new Error("registerCargo should not be called by evidence verify test");
      },
      async releaseCargo() {
        throw new Error("releaseCargo should not be called by evidence verify test");
      },
      async planTransport() {
        throw new Error("planTransport should not be called by evidence verify test");
      },
      async departTransport() {
        throw new Error("departTransport should not be called by evidence verify test");
      },
      async recordComplianceEvidence() {
        throw new Error("recordComplianceEvidence should not be called by evidence verify test");
      },
      async verifyComplianceEvidence(input) {
        verified.push(input);

        return {
          organizationId: input.organizationId,
          cargoId: "cargo_001",
          evidenceId: input.evidenceId,
          evidence: {
            id: input.evidenceId,
            cargoId: "cargo_001",
            evidenceType: "bill_of_lading",
            documentReference: "BL-2026-0001",
            documentTitle: "Primary bill of lading",
            documentUri: null,
            issuerName: "Shipping Line",
            issuedAt: "2026-06-04T00:00:00.000Z",
            expiresAt: null,
            status: input.status,
            reviewerName: input.reviewerName,
            reviewReference: input.reviewReference,
            reviewSummary: input.reviewSummary,
            rejectionReason: input.rejectionReason ?? null,
            reviewedAt: input.reviewedAt ?? "2026-06-04T01:00:00.000Z",
            sourceSystem: input.sourceSystem,
            recordedAt: "2026-06-04T00:00:00.000Z",
            updatedAt: "2026-06-04T01:00:00.000Z",
          },
          businessRules: {
            verificationAllowed: true,
            evidenceApproved: input.status === "approved",
            evidenceRejected: input.status === "rejected",
            appliedRules: ["compliance_evidence_approved_for_operations"],
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "cargo.compliance_evidence.verified",
            subjectType: "cargo_compliance_evidence",
            subjectId: input.evidenceId,
          },
          outbox: {
            eventType: "cargo.compliance_evidence.verified",
            aggregateType: "cargo",
            aggregateId: "cargo_001",
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

  const result = await client.cargo.verifyComplianceEvidence({
    evidenceId: "evidence_001",
    status: "approved",
    reviewerName: "Compliance Officer",
    reviewReference: "REV-2026-0001",
    reviewSummary: "Document verified.",
    idempotencyKey: "idem_cargo_verify_001",
  });

  assert.equal(result.audit.action, "cargo.compliance_evidence.verified");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "cargo.compliance.evidence.verify");
  assert.equal(verified.length, 1);
  assert.equal(verified[0].organizationId, "org_port_rail");
  assert.equal(verified[0].actorId, "user_ops");
  assert.equal(verified[0].userAgent, "node-test");
  assert.equal(verified[0].ipAddress, "127.0.0.1");
});

test("cargo RPC denies tracking.read-only user from cargo.release via authorization policy", async () => {
  const requirement = {
    actorTypes: ["user"],
    permissions: ["cargo.release"],
    permissionMode: "all",
    organizationRequired: true,
  };

  const trackingOnly = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_tracking_only",
      permissions: ["tracking.shipment.read"],
    },
    requirement,
  );

  assert.equal(trackingOnly.allowed, false);
  assert.ok(trackingOnly.missingPermissions.includes("cargo.release"));
});

test("cargo RPC denies tracking.read-only user from cargo.register via authorization policy", async () => {
  const requirement = {
    actorTypes: ["user"],
    permissions: ["cargo.register"],
    permissionMode: "all",
    organizationRequired: true,
  };

  const trackingOnly = evaluateAuthorization(
    {
      actorType: "user",
      actorId: "user_tracking_only",
      permissions: ["tracking.shipment.read"],
    },
    requirement,
  );

  assert.equal(trackingOnly.allowed, false);
  assert.ok(trackingOnly.missingPermissions.includes("cargo.register"));
});
