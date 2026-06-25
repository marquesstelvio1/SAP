import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createTrackingRpcRouter } from "../dist/tracking/tracking-rpc.router.js";

test("tracking overview RPC authorizes request and delegates by organization", async () => {
  const calls = [];
  const router = createTrackingRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            userId: "user_ops",
            organizationId: "org_port_rail",
            permissions: ["tracking.shipment.read"],
            traceContext: {
              correlationId: "corr_tracking_test",
              requestId: "req_tracking_test",
              operationName: "tracking.overview.read",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    trackingService: {
      async getOverview(input) {
        return {
          generatedAt: "2026-06-03T00:00:00.000Z",
          organizationId: input.organizationId,
          totals: {
            shipments: 0,
            activeShipments: 0,
            delayedShipments: 0,
            exceptionShipments: 0,
          },
          statusCounts: [],
          recentShipments: [],
          pagination: {
            totalCount: 0,
            limit: 5,
            offset: 0,
          },
        };
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by overview test");
      },
      async getShipmentDetail() {
        throw new Error("getShipmentDetail should not be called by overview test");
      },
      async manageException() {
        throw new Error("manageException should not be called by overview test");
      },
      async resolveException() {
        throw new Error("resolveException should not be called by overview test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_tracking_test",
        },
      },
    },
  });

  const overview = await client.tracking.overview({ limit: 5 });

  assert.equal(overview.organizationId, "org_port_rail");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "tracking.overview.read");
});

test("tracking analytics RPC authorizes read and delegates aggregate window", async () => {
  const calls = [];
  const requested = [];
  const router = createTrackingRpcRouter({
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
            permissions: ["tracking.shipment.read"],
            correlationId: "corr_tracking_analytics",
            traceContext: {
              correlationId: "corr_tracking_analytics",
              requestId: "req_tracking_analytics",
              operationName: "tracking.analytics.read",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    trackingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by analytics test");
      },
      async getAnalytics(input) {
        requested.push(input);

        return {
          generatedAt: "2026-06-03T00:00:00.000Z",
          organizationId: input.organizationId,
          window: {
            lookbackDays: input.lookbackDays,
            startedAt: "2026-05-04T00:00:00.000Z",
            endedAt: "2026-06-03T00:00:00.000Z",
          },
          kpis: {
            totalShipments: 10,
            activeShipments: 8,
            delayedShipments: 2,
            exceptionShipments: 1,
            completedShipments: 2,
            highPriorityActiveShipments: 3,
            eventsInWindow: 24,
            delayRatePercent: 20,
            exceptionRatePercent: 10,
            averageEventsPerShipment: 2.4,
          },
          slaRisk: {
            overdueShipments: 1,
            dueWithin24Hours: 2,
            unscheduledActiveShipments: 3,
          },
          modeDistribution: [],
          eventTypeCounts: [],
          workflowStateCounts: [],
        };
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by analytics test");
      },
      async getShipmentDetail() {
        throw new Error("getShipmentDetail should not be called by analytics test");
      },
      async manageException() {
        throw new Error("manageException should not be called by analytics test");
      },
      async resolveException() {
        throw new Error("resolveException should not be called by analytics test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_tracking_analytics",
        },
      },
    },
  });

  const analytics = await client.tracking.analytics({ lookbackDays: 14 });

  assert.equal(analytics.organizationId, "org_port_rail");
  assert.equal(analytics.window.lookbackDays, 14);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "tracking.analytics.read");
  assert.equal(requested.length, 1);
  assert.equal(requested[0].organizationId, "org_port_rail");
  assert.equal(requested[0].lookbackDays, 14);
});

test("tracking advisory RPC authorizes read and delegates recommendation limit", async () => {
  const calls = [];
  const requested = [];
  const router = createTrackingRpcRouter({
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
            permissions: ["tracking.shipment.read"],
            correlationId: "corr_tracking_advisory",
            traceContext: {
              correlationId: "corr_tracking_advisory",
              requestId: "req_tracking_advisory",
              operationName: "tracking.ai.advisory.read",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    trackingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by advisory test");
      },
      async getAnalytics() {
        throw new Error("getAnalytics should not be called by advisory test");
      },
      async getAdvisory(input) {
        requested.push(input);

        return {
          generatedAt: "2026-06-03T00:00:00.000Z",
          organizationId: input.organizationId,
          policy: {
            automationAllowed: false,
            humanApprovalRequired: true,
            source: "rule_based_operational_advisor",
          },
          recommendations: [
            {
              id: "tracking-advisory:sla_risk:trk_001",
              type: "sla_risk",
              severity: "high",
              title: "Rever ETA vencido e risco de SLA",
              rationale: "A ETA planeada ja passou e a carga continua ativa.",
              recommendedAction: "Registar evento atualizado e abrir excecao se aplicavel.",
              shipment: {
                id: "trk_001",
                referenceCode: "SAPTM-RAIL-001",
                cargoDescription: "Containers",
                status: "delayed",
                transportMode: "multimodal",
                estimatedArrivalAt: "2026-06-03T08:00:00.000Z",
              },
              humanApprovalRequired: true,
              approvalRequiredFor: "tracking.exception.manage",
              confidenceScore: 0.78,
              source: "rule_based_operational_advisor",
            },
          ],
        };
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by advisory test");
      },
      async getShipmentDetail() {
        throw new Error("getShipmentDetail should not be called by advisory test");
      },
      async manageException() {
        throw new Error("manageException should not be called by advisory test");
      },
      async resolveException() {
        throw new Error("resolveException should not be called by advisory test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_tracking_advisory",
        },
      },
    },
  });

  const advisory = await client.tracking.advisory({ limit: 3 });

  assert.equal(advisory.organizationId, "org_port_rail");
  assert.equal(advisory.policy.automationAllowed, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "tracking.ai.advisory.read");
  assert.equal(requested.length, 1);
  assert.equal(requested[0].organizationId, "org_port_rail");
  assert.equal(requested[0].limit, 3);
});

test("tracking event record RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const recorded = [];
  const router = createTrackingRpcRouter({
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
            permissions: ["tracking.event.record"],
            correlationId: "corr_tracking_event",
            traceContext: {
              correlationId: "corr_tracking_event",
              requestId: "req_tracking_event",
              operationName: "tracking.event.record",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    trackingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by event record test");
      },
      async getShipmentDetail() {
        throw new Error("getShipmentDetail should not be called by event record test");
      },
      async manageException() {
        throw new Error("manageException should not be called by event record test");
      },
      async resolveException() {
        throw new Error("resolveException should not be called by event record test");
      },
      async recordEvent(input) {
        recorded.push(input);

        return {
          organizationId: input.organizationId,
          shipmentId: input.shipmentId,
          event: {
            id: "evt_001",
            eventType: input.eventType,
            occurredAt: input.occurredAt,
            locationName: input.locationName ?? null,
            notes: input.notes ?? null,
            sourceSystem: input.sourceSystem,
            correlationId: input.correlationId,
            idempotencyKey: input.idempotencyKey,
          },
          shipment: {
            id: input.shipmentId,
            referenceCode: "SAPTM-RAIL-001",
            currentStatus: "in_transit",
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "tracking.event.recorded",
            subjectType: "tracking.shipment",
            subjectId: input.shipmentId,
          },
          outbox: {
            eventType: "tracking.event.recorded",
            aggregateType: "tracking.shipment",
            aggregateId: input.shipmentId,
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

  const result = await client.tracking.events({
    shipmentId: "trk_001",
    eventType: "departed",
    occurredAt: "2026-06-03T12:00:00.000Z",
    idempotencyKey: "idem_tracking_001",
    locationName: "Rail Yard A",
  });

  assert.equal(result.event.eventType, "departed");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "tracking.event.record");
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].organizationId, "org_port_rail");
  assert.equal(recorded[0].actorId, "user_ops");
  assert.equal(recorded[0].userAgent, "node-test");
  assert.equal(recorded[0].ipAddress, "127.0.0.1");
});

test("tracking shipment detail RPC authorizes read and delegates by organization", async () => {
  const calls = [];
  const requested = [];
  const router = createTrackingRpcRouter({
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
            permissions: ["tracking.shipment.read"],
            correlationId: "corr_tracking_detail",
            traceContext: {
              correlationId: "corr_tracking_detail",
              requestId: "req_tracking_detail",
              operationName: "tracking.shipment.detail.read",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    trackingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by shipment detail test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by shipment detail test");
      },
      async manageException() {
        throw new Error("manageException should not be called by shipment detail test");
      },
      async resolveException() {
        throw new Error("resolveException should not be called by shipment detail test");
      },
      async getShipmentDetail(input) {
        requested.push(input);

        return {
          generatedAt: "2026-06-03T00:00:00.000Z",
          organizationId: input.organizationId,
          shipment: {
            id: input.shipmentId,
            referenceCode: "SAPTM-RAIL-001",
            externalReference: null,
            cargoDescription: "Containers",
            originName: "Rail Yard A",
            destinationName: "Port Terminal B",
            transportMode: "multimodal",
            status: "in_transit",
            priority: 2,
            plannedDepartureAt: null,
            estimatedArrivalAt: "2026-06-04T08:00:00.000Z",
            actualArrivalAt: null,
            createdAt: "2026-06-03T07:00:00.000Z",
            updatedAt: "2026-06-03T12:00:00.000Z",
            lastEventAt: "2026-06-03T12:00:00.000Z",
            lastEventType: "departed",
            lastKnownLocation: "Rail Yard A",
            eventCount: 1,
          },
          timeline: [
            {
              id: "evt_001",
              eventType: "departed",
              occurredAt: "2026-06-03T12:00:00.000Z",
              locationName: "Rail Yard A",
              notes: "Train departed origin yard.",
              payload: null,
              workflowState: null,
              sourceSystem: "saptm",
              correlationId: "corr_tracking_event",
              idempotencyKey: "idem_tracking_001",
              createdAt: "2026-06-03T12:01:00.000Z",
            },
          ],
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_tracking_detail",
        },
      },
    },
  });

  const result = await client.tracking.shipmentDetail({
    shipmentId: "trk_001",
    eventLimit: 10,
  });

  assert.equal(result.shipment.referenceCode, "SAPTM-RAIL-001");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "tracking.shipment.detail.read");
  assert.equal(requested.length, 1);
  assert.equal(requested[0].organizationId, "org_port_rail");
  assert.equal(requested[0].shipmentId, "trk_001");
  assert.equal(requested[0].eventLimit, 10);
});

test("tracking exception manage RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const managed = [];
  const router = createTrackingRpcRouter({
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
            permissions: ["tracking.exception.manage"],
            correlationId: "corr_tracking_exception",
            traceContext: {
              correlationId: "corr_tracking_exception",
              requestId: "req_tracking_exception",
              operationName: "tracking.exception.manage",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    trackingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by exception manage test");
      },
      async getShipmentDetail() {
        throw new Error("getShipmentDetail should not be called by exception manage test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by exception manage test");
      },
      async resolveException() {
        throw new Error("resolveException should not be called by exception manage test");
      },
      async manageException(input) {
        managed.push(input);

        return {
          organizationId: input.organizationId,
          shipmentId: input.shipmentId,
          exception: {
            category: input.category,
            severity: input.severity,
            summary: input.summary,
            recoveryPlan: input.recoveryPlan,
            ownerTeam: input.ownerTeam ?? null,
            expectedResolutionAt: input.expectedResolutionAt ?? null,
          },
          evidence: {
            operatorName: input.evidence.operatorName,
            evidenceType: input.evidence.evidenceType,
            evidenceReference: input.evidence.evidenceReference,
            evidenceSummary: input.evidence.evidenceSummary,
            approvalStatus: input.evidence.approvalStatus,
            approvalReference: input.evidence.approvalReference ?? null,
            approverName: input.evidence.approverName ?? null,
          },
          workflow: {
            state:
              input.evidence.approvalStatus === "approved"
                ? "approved_for_resolution"
                : "pending_review",
            terminal: false,
            releaseEvidenceRequired: true,
          },
          event: {
            id: "evt_exception_001",
            eventType: "customs_hold",
            occurredAt: input.occurredAt,
            locationName: input.locationName ?? null,
            notes: `${input.summary}\n\nRecovery plan: ${input.recoveryPlan}`,
            sourceSystem: input.sourceSystem,
            correlationId: input.correlationId,
            idempotencyKey: input.idempotencyKey,
          },
          shipment: {
            id: input.shipmentId,
            referenceCode: "SAPTM-RAIL-001",
            previousStatus: "in_transit",
            currentStatus: "exception",
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "tracking.exception.managed",
            subjectType: "tracking.shipment",
            subjectId: input.shipmentId,
          },
          outbox: {
            eventType: "tracking.exception.managed",
            aggregateType: "tracking.shipment",
            aggregateId: input.shipmentId,
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

  const result = await client.tracking.exceptions({
    shipmentId: "trk_001",
    category: "customs_hold",
    occurredAt: "2026-06-03T15:00:00.000Z",
    idempotencyKey: "idem_exception_001",
    summary: "Cargo retained by customs.",
    recoveryPlan: "Submit corrected manifest.",
    evidence: {
      operatorName: "Joao Silva",
      evidenceType: "document",
      evidenceReference: "DOC-REV-2026-0042",
      evidenceSummary: "Corrected manifest request received from customs desk.",
    },
    locationName: "Port Terminal B",
  });

  assert.equal(result.exception.category, "customs_hold");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "tracking.exception.manage");
  assert.equal(managed.length, 1);
  assert.equal(managed[0].organizationId, "org_port_rail");
  assert.equal(managed[0].actorId, "user_ops");
  assert.equal(managed[0].userAgent, "node-test");
  assert.equal(managed[0].ipAddress, "127.0.0.1");
  assert.equal(managed[0].severity, "high");
});

test("tracking exception resolve RPC authorizes mutation and delegates auditable input", async () => {
  const calls = [];
  const resolved = [];
  const router = createTrackingRpcRouter({
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
            permissions: ["tracking.exception.resolve"],
            correlationId: "corr_tracking_exception_resolve",
            traceContext: {
              correlationId: "corr_tracking_exception_resolve",
              requestId: "req_tracking_exception_resolve",
              operationName: "tracking.exception.resolve",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    trackingService: {
      async getOverview() {
        throw new Error("getOverview should not be called by exception resolve test");
      },
      async getShipmentDetail() {
        throw new Error("getShipmentDetail should not be called by exception resolve test");
      },
      async recordEvent() {
        throw new Error("recordEvent should not be called by exception resolve test");
      },
      async manageException() {
        throw new Error("manageException should not be called by exception resolve test");
      },
      async resolveException(input) {
        resolved.push(input);

        return {
          organizationId: input.organizationId,
          shipmentId: input.shipmentId,
          resolution: {
            resolutionCode: input.resolutionCode,
            summary: input.summary,
            ownerTeam: input.ownerTeam ?? null,
            nextStatus: input.nextStatus,
          },
          evidence: {
            operatorName: input.evidence.operatorName,
            evidenceType: input.evidence.evidenceType,
            evidenceReference: input.evidence.evidenceReference,
            evidenceSummary: input.evidence.evidenceSummary,
            approvalStatus: input.evidence.approvalStatus,
            approvalReference: input.evidence.approvalReference,
            approverName: input.evidence.approverName,
          },
          workflow: {
            state: "closed",
            terminal: true,
            releaseEvidenceRequired: false,
          },
          event: {
            id: "evt_exception_resolved_001",
            eventType: "released",
            occurredAt: input.occurredAt,
            locationName: input.locationName ?? null,
            notes: `${input.summary}\n\nResolution code: ${input.resolutionCode}`,
            sourceSystem: input.sourceSystem,
            correlationId: input.correlationId,
            idempotencyKey: input.idempotencyKey,
          },
          shipment: {
            id: input.shipmentId,
            referenceCode: "SAPTM-RAIL-001",
            previousStatus: "exception",
            currentStatus: input.nextStatus,
          },
          idempotency: {
            key: input.idempotencyKey,
            replayed: false,
          },
          audit: {
            action: "tracking.exception.resolved",
            subjectType: "tracking.shipment",
            subjectId: input.shipmentId,
          },
          outbox: {
            eventType: "tracking.exception.resolved",
            aggregateType: "tracking.shipment",
            aggregateId: input.shipmentId,
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

  const result = await client.tracking.exceptionResolution({
    shipmentId: "trk_001",
    occurredAt: "2026-06-03T18:00:00.000Z",
    idempotencyKey: "idem_exception_resolve_001",
    resolutionCode: "customs_released",
    summary: "Customs released the cargo after document correction.",
    evidence: {
      operatorName: "Maria Costa",
      evidenceType: "external_reference",
      evidenceReference: "REL-900",
      evidenceSummary: "Release reference confirmed against customs portal.",
      approvalStatus: "approved",
      approvalReference: "APR-OPS-2026-019",
      approverName: "Supervisor de Operacoes",
    },
    locationName: "Port Terminal B",
  });

  assert.equal(result.resolution.resolutionCode, "customs_released");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "tracking.exception.resolve");
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].organizationId, "org_port_rail");
  assert.equal(resolved[0].actorId, "user_ops");
  assert.equal(resolved[0].userAgent, "node-test");
  assert.equal(resolved[0].ipAddress, "127.0.0.1");
  assert.equal(resolved[0].nextStatus, "in_transit");
});
