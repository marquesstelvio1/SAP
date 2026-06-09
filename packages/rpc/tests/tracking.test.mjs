import assert from "node:assert/strict";
import { test } from "node:test";

import {
  trackingAdvisoryInputSchema,
  trackingAdvisoryMetadata,
  trackingAdvisoryOutputSchema,
  trackingAnalyticsInputSchema,
  trackingAnalyticsMetadata,
  trackingAnalyticsOutputSchema,
  trackingEventRecordInputSchema,
  trackingEventRecordMetadata,
  trackingEventRecordOutputSchema,
  trackingExceptionManageInputSchema,
  trackingExceptionManageMetadata,
  trackingExceptionManageOutputSchema,
  trackingExceptionResolveInputSchema,
  trackingExceptionResolveMetadata,
  trackingExceptionResolveOutputSchema,
  trackingOperatorEvidenceSchema,
  trackingOverviewInputSchema,
  trackingOverviewMetadata,
  trackingOverviewOutputSchema,
  trackingShipmentDetailInputSchema,
  trackingShipmentDetailMetadata,
  trackingShipmentDetailOutputSchema,
} from "../dist/index.js";

test("tracking overview metadata requires session and read permission", () => {
  assert.equal(trackingOverviewMetadata.name, "tracking.overview.read");
  assert.equal(trackingOverviewMetadata.auth, "session");
  assert.equal(trackingOverviewMetadata.organizationRequired, true);
  assert.deepEqual(trackingOverviewMetadata.permissions, ["tracking.shipment.read"]);
  assert.equal(trackingOverviewMetadata.audit, "standard");
  assert.equal(trackingOverviewMetadata.observability.criticality, "high");
});

test("tracking overview schemas validate operational dashboard contracts", () => {
  assert.deepEqual(trackingOverviewInputSchema.parse(undefined), { limit: 10 });

  const parsed = trackingOverviewOutputSchema.parse({
    generatedAt: "2026-06-03T00:00:00.000Z",
    organizationId: "org_rail_port",
    totals: {
      shipments: 1,
      activeShipments: 1,
      delayedShipments: 0,
      exceptionShipments: 0,
    },
    statusCounts: [{ status: "in_transit", count: 1 }],
    recentShipments: [
      {
        id: "trk_001",
        referenceCode: "SAPTM-RAIL-001",
        externalReference: null,
        cargoDescription: "Containers",
        originName: "Rail Yard A",
        destinationName: "Port Terminal B",
        transportMode: "multimodal",
        status: "in_transit",
        priority: 2,
        estimatedArrivalAt: "2026-06-04T08:00:00.000Z",
        lastEventAt: "2026-06-03T12:00:00.000Z",
        lastEventType: "departed",
        lastKnownLocation: "Rail Yard A",
      },
    ],
  });

  assert.equal(parsed.recentShipments[0].referenceCode, "SAPTM-RAIL-001");
});

test("tracking analytics metadata reuses governed read permission", () => {
  assert.equal(trackingAnalyticsMetadata.name, "tracking.analytics.read");
  assert.equal(trackingAnalyticsMetadata.kind, "query");
  assert.equal(trackingAnalyticsMetadata.auth, "session");
  assert.equal(trackingAnalyticsMetadata.organizationRequired, true);
  assert.deepEqual(trackingAnalyticsMetadata.permissions, ["tracking.shipment.read"]);
  assert.equal(trackingAnalyticsMetadata.audit, "standard");
  assert.equal(trackingAnalyticsMetadata.observability.criticality, "high");
});

test("tracking analytics schemas validate operational aggregate contracts", () => {
  assert.deepEqual(trackingAnalyticsInputSchema.parse(undefined), { lookbackDays: 30 });

  const parsed = trackingAnalyticsOutputSchema.parse({
    generatedAt: "2026-06-03T00:00:00.000Z",
    organizationId: "org_rail_port",
    window: {
      lookbackDays: 30,
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
    modeDistribution: [
      {
        transportMode: "rail",
        shipments: 5,
        activeShipments: 4,
        delayedShipments: 1,
        exceptionShipments: 1,
      },
    ],
    eventTypeCounts: [
      {
        eventType: "departed",
        count: 3,
        latestOccurredAt: "2026-06-03T12:00:00.000Z",
      },
    ],
    workflowStateCounts: [
      {
        state: "closed",
        count: 1,
      },
    ],
  });

  assert.equal(parsed.kpis.eventsInWindow, 24);
  assert.equal(parsed.workflowStateCounts[0].state, "closed");
});

test("tracking advisory metadata requires session read permission", () => {
  assert.equal(trackingAdvisoryMetadata.name, "tracking.ai.advisory.read");
  assert.equal(trackingAdvisoryMetadata.kind, "query");
  assert.equal(trackingAdvisoryMetadata.auth, "session");
  assert.equal(trackingAdvisoryMetadata.organizationRequired, true);
  assert.deepEqual(trackingAdvisoryMetadata.permissions, ["tracking.shipment.read"]);
  assert.equal(trackingAdvisoryMetadata.audit, "standard");
  assert.equal(trackingAdvisoryMetadata.observability.criticality, "high");
});

test("tracking advisory schemas validate human-approved recommendations", () => {
  assert.deepEqual(trackingAdvisoryInputSchema.parse(undefined), { limit: 5 });

  const parsed = trackingAdvisoryOutputSchema.parse({
    generatedAt: "2026-06-03T00:00:00.000Z",
    organizationId: "org_rail_port",
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
  });

  assert.equal(parsed.policy.automationAllowed, false);
  assert.equal(parsed.recommendations[0].humanApprovalRequired, true);
});

test("tracking event record metadata requires idempotent session mutation permission", () => {
  assert.equal(trackingEventRecordMetadata.name, "tracking.event.record");
  assert.equal(trackingEventRecordMetadata.kind, "mutation");
  assert.equal(trackingEventRecordMetadata.auth, "session");
  assert.equal(trackingEventRecordMetadata.organizationRequired, true);
  assert.deepEqual(trackingEventRecordMetadata.permissions, ["tracking.event.record"]);
  assert.equal(trackingEventRecordMetadata.audit, "critical");
  assert.equal(trackingEventRecordMetadata.idempotency, "required");
  assert.equal(trackingEventRecordMetadata.observability.criticality, "critical");
});

test("tracking event record schemas validate auditable command contracts", () => {
  const input = trackingEventRecordInputSchema.parse({
    shipmentId: "trk_001",
    eventType: "departed",
    occurredAt: "2026-06-03T12:00:00.000Z",
    locationName: "Rail Yard A",
    notes: "Train departed origin yard.",
    idempotencyKey: "idem_tracking_001",
    payload: {
      trainNumber: "CF-900",
      wagons: 12,
      hazardous: false,
    },
  });

  assert.equal(input.sourceSystem, "saptm");

  const output = trackingEventRecordOutputSchema.parse({
    organizationId: "org_rail_port",
    shipmentId: "trk_001",
    event: {
      id: "evt_001",
      eventType: "departed",
      occurredAt: "2026-06-03T12:00:00.000Z",
      locationName: "Rail Yard A",
      notes: "Train departed origin yard.",
      sourceSystem: "saptm",
      correlationId: "corr_tracking_event",
      idempotencyKey: "idem_tracking_001",
    },
    shipment: {
      id: "trk_001",
      referenceCode: "SAPTM-RAIL-001",
      currentStatus: "in_transit",
    },
    idempotency: {
      key: "idem_tracking_001",
      replayed: false,
    },
    audit: {
      action: "tracking.event.recorded",
      subjectType: "tracking.shipment",
      subjectId: "trk_001",
    },
    outbox: {
      eventType: "tracking.event.recorded",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_001",
    },
  });

  assert.equal(output.event.idempotencyKey, "idem_tracking_001");
});

test("tracking shipment detail metadata reuses governed read permission", () => {
  assert.equal(trackingShipmentDetailMetadata.name, "tracking.shipment.detail.read");
  assert.equal(trackingShipmentDetailMetadata.kind, "query");
  assert.equal(trackingShipmentDetailMetadata.auth, "session");
  assert.equal(trackingShipmentDetailMetadata.organizationRequired, true);
  assert.deepEqual(trackingShipmentDetailMetadata.permissions, ["tracking.shipment.read"]);
  assert.equal(trackingShipmentDetailMetadata.audit, "standard");
  assert.equal(trackingShipmentDetailMetadata.observability.criticality, "high");
});

test("tracking shipment detail schemas validate timeline read contracts", () => {
  const input = trackingShipmentDetailInputSchema.parse({
    shipmentId: "trk_001",
  });

  assert.equal(input.eventLimit, 50);

  const output = trackingShipmentDetailOutputSchema.parse({
    generatedAt: "2026-06-03T00:00:00.000Z",
    organizationId: "org_rail_port",
    shipment: {
      id: "trk_001",
      referenceCode: "SAPTM-RAIL-001",
      externalReference: "EXT-001",
      cargoDescription: "Containers",
      originName: "Rail Yard A",
      destinationName: "Port Terminal B",
      transportMode: "multimodal",
      status: "in_transit",
      priority: 2,
      plannedDepartureAt: "2026-06-03T08:00:00.000Z",
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
        payload: {
          trainNumber: "CF-900",
          wagons: 12,
          hazardous: false,
        },
        workflowState: null,
        sourceSystem: "saptm",
        correlationId: "corr_tracking_event",
        idempotencyKey: "idem_tracking_001",
        createdAt: "2026-06-03T12:01:00.000Z",
      },
    ],
  });

  assert.equal(output.shipment.referenceCode, "SAPTM-RAIL-001");
  assert.equal(output.timeline[0].payload.trainNumber, "CF-900");
});

test("tracking exception manage metadata requires critical permission and idempotency", () => {
  assert.equal(trackingExceptionManageMetadata.name, "tracking.exception.manage");
  assert.equal(trackingExceptionManageMetadata.kind, "mutation");
  assert.equal(trackingExceptionManageMetadata.auth, "session");
  assert.equal(trackingExceptionManageMetadata.organizationRequired, true);
  assert.deepEqual(trackingExceptionManageMetadata.permissions, ["tracking.exception.manage"]);
  assert.equal(trackingExceptionManageMetadata.audit, "critical");
  assert.equal(trackingExceptionManageMetadata.idempotency, "required");
  assert.equal(trackingExceptionManageMetadata.observability.criticality, "critical");
});

test("tracking exception manage schemas validate governed exception command", () => {
  const evidence = trackingOperatorEvidenceSchema.parse({
    operatorName: "Joao Silva",
    evidenceType: "document",
    evidenceReference: "DOC-REV-2026-0042",
    evidenceSummary: "Corrected manifest request received from customs desk.",
  });

  assert.equal(evidence.approvalStatus, "pending_review");

  const input = trackingExceptionManageInputSchema.parse({
    shipmentId: "trk_001",
    category: "customs_hold",
    occurredAt: "2026-06-03T15:00:00.000Z",
    idempotencyKey: "idem_exception_001",
    summary: "Cargo retained by customs for document review.",
    recoveryPlan: "Operations team will submit corrected manifest and monitor release.",
    evidence,
    ownerTeam: "Port operations",
    expectedResolutionAt: "2026-06-04T09:00:00.000Z",
    locationName: "Port Terminal B",
    payload: {
      terminal: "PT-B",
      holdCode: "DOC_REVIEW",
    },
  });

  assert.equal(input.severity, "high");
  assert.equal(input.sourceSystem, "saptm");

  const output = trackingExceptionManageOutputSchema.parse({
    organizationId: "org_rail_port",
    shipmentId: "trk_001",
    exception: {
      category: "customs_hold",
      severity: "high",
      summary: "Cargo retained by customs for document review.",
      recoveryPlan: "Operations team will submit corrected manifest and monitor release.",
      ownerTeam: "Port operations",
      expectedResolutionAt: "2026-06-04T09:00:00.000Z",
    },
    evidence: {
      operatorName: "Joao Silva",
      evidenceType: "document",
      evidenceReference: "DOC-REV-2026-0042",
      evidenceSummary: "Corrected manifest request received from customs desk.",
      approvalStatus: "pending_review",
      approvalReference: null,
      approverName: null,
    },
    workflow: {
      state: "pending_review",
      terminal: false,
      releaseEvidenceRequired: true,
    },
    event: {
      id: "evt_exception_001",
      eventType: "customs_hold",
      occurredAt: "2026-06-03T15:00:00.000Z",
      locationName: "Port Terminal B",
      notes:
        "Cargo retained by customs for document review.\n\nRecovery plan: Operations team will submit corrected manifest and monitor release.",
      sourceSystem: "saptm",
      correlationId: "corr_exception_001",
      idempotencyKey: "idem_exception_001",
    },
    shipment: {
      id: "trk_001",
      referenceCode: "SAPTM-RAIL-001",
      previousStatus: "in_transit",
      currentStatus: "exception",
    },
    idempotency: {
      key: "idem_exception_001",
      replayed: false,
    },
    audit: {
      action: "tracking.exception.managed",
      subjectType: "tracking.shipment",
      subjectId: "trk_001",
    },
    outbox: {
      eventType: "tracking.exception.managed",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_001",
    },
  });

  assert.equal(output.exception.category, "customs_hold");
  assert.equal(output.shipment.currentStatus, "exception");
  assert.equal(output.workflow.state, "pending_review");
});

test("tracking exception resolve metadata requires critical permission and idempotency", () => {
  assert.equal(trackingExceptionResolveMetadata.name, "tracking.exception.resolve");
  assert.equal(trackingExceptionResolveMetadata.kind, "mutation");
  assert.equal(trackingExceptionResolveMetadata.auth, "session");
  assert.equal(trackingExceptionResolveMetadata.organizationRequired, true);
  assert.deepEqual(trackingExceptionResolveMetadata.permissions, ["tracking.exception.resolve"]);
  assert.equal(trackingExceptionResolveMetadata.audit, "critical");
  assert.equal(trackingExceptionResolveMetadata.idempotency, "required");
  assert.equal(trackingExceptionResolveMetadata.observability.criticality, "critical");
});

test("tracking exception resolve schemas validate governed resolution command", () => {
  const input = trackingExceptionResolveInputSchema.parse({
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
    ownerTeam: "Port operations",
    locationName: "Port Terminal B",
    payload: {
      releaseReference: "REL-900",
    },
  });

  assert.equal(input.nextStatus, "in_transit");
  assert.equal(input.sourceSystem, "saptm");

  const output = trackingExceptionResolveOutputSchema.parse({
    organizationId: "org_rail_port",
    shipmentId: "trk_001",
    resolution: {
      resolutionCode: "customs_released",
      summary: "Customs released the cargo after document correction.",
      ownerTeam: "Port operations",
      nextStatus: "in_transit",
    },
    evidence: {
      operatorName: "Maria Costa",
      evidenceType: "external_reference",
      evidenceReference: "REL-900",
      evidenceSummary: "Release reference confirmed against customs portal.",
      approvalStatus: "approved",
      approvalReference: "APR-OPS-2026-019",
      approverName: "Supervisor de Operacoes",
    },
    workflow: {
      state: "closed",
      terminal: true,
      releaseEvidenceRequired: false,
    },
    event: {
      id: "evt_exception_resolved_001",
      eventType: "released",
      occurredAt: "2026-06-03T18:00:00.000Z",
      locationName: "Port Terminal B",
      notes:
        "Customs released the cargo after document correction.\n\nResolution code: customs_released",
      sourceSystem: "saptm",
      correlationId: "corr_exception_resolved_001",
      idempotencyKey: "idem_exception_resolve_001",
    },
    shipment: {
      id: "trk_001",
      referenceCode: "SAPTM-RAIL-001",
      previousStatus: "exception",
      currentStatus: "in_transit",
    },
    idempotency: {
      key: "idem_exception_resolve_001",
      replayed: false,
    },
    audit: {
      action: "tracking.exception.resolved",
      subjectType: "tracking.shipment",
      subjectId: "trk_001",
    },
    outbox: {
      eventType: "tracking.exception.resolved",
      aggregateType: "tracking.shipment",
      aggregateId: "trk_001",
    },
  });

  assert.equal(output.event.eventType, "released");
  assert.equal(output.shipment.currentStatus, "in_transit");
  assert.equal(output.workflow.terminal, true);
});
