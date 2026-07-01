import assert from "node:assert/strict";
import { test } from "node:test";

import {
  cargoClaimSettlementRecordInputSchema,
  cargoClaimSettlementRecordMetadata,
  cargoClaimSettlementRecordOutputSchema,
  cargoComplianceEvidenceRecordInputSchema,
  cargoComplianceEvidenceRecordMetadata,
  cargoComplianceEvidenceRecordOutputSchema,
  cargoComplianceEvidenceVerifyInputSchema,
  cargoComplianceEvidenceVerifyMetadata,
  cargoComplianceEvidenceVerifyOutputSchema,
  cargoDeliveryCompleteInputSchema,
  cargoDeliveryCompleteMetadata,
  cargoDeliveryCompleteOutputSchema,
  cargoDeliveryExceptionRecordInputSchema,
  cargoDeliveryExceptionRecordMetadata,
  cargoDeliveryExceptionRecordOutputSchema,
  cargoDeliveryExceptionResolveInputSchema,
  cargoDeliveryExceptionResolveMetadata,
  cargoDeliveryExceptionResolveOutputSchema,
  cargoOperationalHandoffRecordInputSchema,
  cargoOperationalHandoffRecordMetadata,
  cargoOperationalHandoffRecordOutputSchema,
  cargoOverviewInputSchema,
  cargoOverviewMetadata,
  cargoOverviewOutputSchema,
  cargoRegisterInputSchema,
  cargoRegisterMetadata,
  cargoRegisterOutputSchema,
  cargoReleaseInputSchema,
  cargoReleaseMetadata,
  cargoReleaseOutputSchema,
  cargoTransportArriveInputSchema,
  cargoTransportArriveMetadata,
  cargoTransportArriveOutputSchema,
  cargoTransportDepartInputSchema,
  cargoTransportDepartMetadata,
  cargoTransportDepartOutputSchema,
  cargoTransportPlanInputSchema,
  cargoTransportPlanMetadata,
  cargoTransportPlanOutputSchema,
} from "../dist/index.js";

test("cargo overview metadata requires session and cargo read permission", () => {
  assert.equal(cargoOverviewMetadata.name, "cargo.overview.read");
  assert.equal(cargoOverviewMetadata.kind, "query");
  assert.equal(cargoOverviewMetadata.auth, "session");
  assert.equal(cargoOverviewMetadata.organizationRequired, true);
  assert.deepEqual(cargoOverviewMetadata.permissions, ["cargo.read"]);
  assert.equal(cargoOverviewMetadata.audit, "standard");
  assert.equal(cargoOverviewMetadata.observability.criticality, "high");
});

test("cargo overview schema validates tenant-scoped cargo dashboard", () => {
  assert.deepEqual(cargoOverviewInputSchema.parse(undefined), { limit: 10, offset: 0 });

  const parsed = cargoOverviewOutputSchema.parse({
    generatedAt: "2026-06-04T00:00:00.000Z",
    organizationId: "org_rail_port",
    totals: {
      cargo: 1,
      activeCargo: 1,
      heldCargo: 1,
      hazardousCargo: 1,
      inspectionRequiredCargo: 1,
    },
    statusCounts: [{ status: "held", count: 1 }],
    recentCargo: [
      {
        id: "cargo_001",
        cargoReference: "CGO-2026-0001",
        externalReference: null,
        cargoDescription: "Industrial components",
        cargoType: "hazardous",
        status: "held",
        customsStatus: "pending",
        conditionStatus: "requires_inspection",
        grossWeightKg: 12_000,
        packageCount: 20,
        hazardous: true,
        requiresInspection: true,
        originName: "Rail Yard A",
        destinationName: "Port Terminal B",
        custodyOwnerName: "Operations Desk",
        priority: 2,
        expectedReadyAt: "2026-06-05T08:00:00.000Z",
        createdAt: "2026-06-04T00:00:00.000Z",
        updatedAt: "2026-06-04T00:00:00.000Z",
      },
    ],
    pagination: {
      totalCount: 1,
      limit: 10,
      offset: 0,
    },
  });

  assert.equal(parsed.recentCargo[0].cargoReference, "CGO-2026-0001");
});

test("cargo register metadata requires critical idempotent permission", () => {
  assert.equal(cargoRegisterMetadata.name, "cargo.register");
  assert.equal(cargoRegisterMetadata.kind, "mutation");
  assert.equal(cargoRegisterMetadata.auth, "session");
  assert.equal(cargoRegisterMetadata.organizationRequired, true);
  assert.deepEqual(cargoRegisterMetadata.permissions, ["cargo.register"]);
  assert.equal(cargoRegisterMetadata.audit, "critical");
  assert.equal(cargoRegisterMetadata.idempotency, "required");
  assert.equal(cargoRegisterMetadata.observability.criticality, "critical");
});

test("cargo register schema enforces P0 business rules", () => {
  assert.throws(() =>
    cargoRegisterInputSchema.parse({
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
      idempotencyKey: "idem_cargo_001",
    }),
  );

  const input = cargoRegisterInputSchema.parse({
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

  assert.equal(input.customsStatus, "pending");
  assert.equal(input.conditionStatus, "sound");
  assert.equal(input.sourceSystem, "saptm");
});

test("cargo register output validates audit and outbox contract", () => {
  const output = cargoRegisterOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    cargo: {
      id: "cargo_001",
      cargoReference: "CGO-2026-0001",
      externalReference: null,
      cargoDescription: "Fuel drums",
      cargoType: "hazardous",
      status: "held",
      customsStatus: "pending",
      customsReference: null,
      conditionStatus: "requires_inspection",
      grossWeightKg: 900,
      packageCount: 10,
      hazardous: true,
      unNumber: "UN1203",
      hazardClass: "3",
      requiresInspection: true,
      shipperName: "Shipper A",
      consigneeName: "Consignee B",
      originName: "Rail Yard A",
      destinationName: "Port Terminal B",
      custodyOwnerName: "Operations Desk",
      priority: 3,
      expectedReadyAt: null,
      sourceSystem: "saptm",
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    },
    businessRules: {
      movementBlocked: true,
      inspectionRequired: true,
      customsBlocked: false,
      appliedRules: ["hazardous_cargo_requires_un_number_and_hazard_class"],
    },
    idempotency: {
      key: "idem_cargo_001",
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
  });

  assert.equal(output.businessRules.movementBlocked, true);
  assert.equal(output.audit.action, "cargo.registered");
});

test("cargo release metadata requires critical idempotent permission", () => {
  assert.equal(cargoReleaseMetadata.name, "cargo.release");
  assert.equal(cargoReleaseMetadata.kind, "mutation");
  assert.equal(cargoReleaseMetadata.auth, "session");
  assert.equal(cargoReleaseMetadata.organizationRequired, true);
  assert.deepEqual(cargoReleaseMetadata.permissions, ["cargo.release"]);
  assert.equal(cargoReleaseMetadata.audit, "critical");
  assert.equal(cargoReleaseMetadata.idempotency, "required");
  assert.equal(cargoReleaseMetadata.observability.criticality, "critical");
});

test("cargo release schema enforces P1 release evidence rules", () => {
  assert.throws(() =>
    cargoReleaseInputSchema.parse({
      cargoId: "cargo_001",
      customsStatus: "cleared",
      releaseReason: "Customs release completed",
      idempotencyKey: "idem_cargo_release_001",
    }),
  );

  const input = cargoReleaseInputSchema.parse({
    cargoId: "cargo_001",
    customsStatus: "cleared",
    inspectionOutcome: "passed",
    releaseReference: "CLR-2026-0001",
    releaseReason: "Customs release completed",
    idempotencyKey: "idem_cargo_release_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.releaseReference, "CLR-2026-0001");
  assert.equal(input.inspectionOutcome, "passed");
});

test("cargo release output validates audit and outbox contract", () => {
  const output = cargoReleaseOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    cargo: {
      id: "cargo_001",
      cargoReference: "CGO-2026-0001",
      externalReference: null,
      cargoDescription: "Fuel drums",
      cargoType: "hazardous",
      status: "ready_for_transport",
      customsStatus: "cleared",
      customsReference: "HOLD-2026-001",
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
      releaseReference: "CLR-2026-0001",
      releaseReason: "Customs release completed",
      releasedAt: "2026-06-04T00:00:00.000Z",
      sourceSystem: "saptm",
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
      key: "idem_cargo_release_001",
      replayed: false,
    },
    audit: {
      action: "cargo.released",
      subjectType: "cargo",
      subjectId: "cargo_001",
    },
    outbox: {
      eventType: "cargo.released",
      aggregateType: "cargo",
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.businessRules.releaseAllowed, true);
  assert.equal(output.audit.action, "cargo.released");
});

test("cargo transport plan metadata requires critical idempotent permission", () => {
  assert.equal(cargoTransportPlanMetadata.name, "cargo.transport.plan");
  assert.equal(cargoTransportPlanMetadata.kind, "mutation");
  assert.equal(cargoTransportPlanMetadata.auth, "session");
  assert.equal(cargoTransportPlanMetadata.organizationRequired, true);
  assert.deepEqual(cargoTransportPlanMetadata.permissions, ["cargo.transport.plan"]);
  assert.equal(cargoTransportPlanMetadata.audit, "critical");
  assert.equal(cargoTransportPlanMetadata.idempotency, "required");
  assert.equal(cargoTransportPlanMetadata.observability.criticality, "critical");
});

test("cargo transport plan schema enforces ETA after departure", () => {
  assert.throws(() =>
    cargoTransportPlanInputSchema.parse({
      cargoId: "cargo_001",
      transportMode: "rail",
      plannedDepartureAt: "2026-06-05T08:00:00.000Z",
      estimatedArrivalAt: "2026-06-05T07:00:00.000Z",
      operationsOwnerTeam: "Rail Ops",
      idempotencyKey: "idem_cargo_plan_001",
    }),
  );

  const input = cargoTransportPlanInputSchema.parse({
    cargoId: "cargo_001",
    referenceCode: "TRK-2026-0001",
    transportMode: "multimodal",
    plannedDepartureAt: "2026-06-05T08:00:00.000Z",
    estimatedArrivalAt: "2026-06-06T08:00:00.000Z",
    operationsOwnerTeam: "Rail Port Ops",
    planningReference: "PLAN-2026-0001",
    firstCheckpointName: "Rail Yard A",
    idempotencyKey: "idem_cargo_plan_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.transportMode, "multimodal");
  assert.equal(input.referenceCode, "TRK-2026-0001");
});

test("cargo transport plan output validates tracking linkage contract", () => {
  const output = cargoTransportPlanOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    shipmentId: "shipment_001",
    cargo: {
      id: "cargo_001",
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
      transportPlanningReference: "PLAN-2026-0001",
      transportOwnerTeam: "Rail Port Ops",
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    },
    shipment: {
      id: "shipment_001",
      referenceCode: "TRK-2026-0001",
      transportMode: "rail",
      status: "planned",
      plannedDepartureAt: "2026-06-05T08:00:00.000Z",
      estimatedArrivalAt: "2026-06-06T08:00:00.000Z",
    },
    businessRules: {
      planningAllowed: true,
      cargoReadyForTracking: true,
      trackingLinked: true,
      appliedRules: ["cargo_linked_to_tracking_shipment"],
    },
    idempotency: {
      key: "idem_cargo_plan_001",
      replayed: false,
    },
    audit: {
      action: "cargo.transport_planned",
      subjectType: "cargo",
      subjectId: "cargo_001",
    },
    outbox: {
      eventType: "cargo.transport_planned",
      aggregateType: "cargo",
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.businessRules.trackingLinked, true);
  assert.equal(output.shipment.status, "planned");
});

test("cargo transport depart metadata requires critical idempotent permission", () => {
  assert.equal(cargoTransportDepartMetadata.name, "cargo.transport.depart");
  assert.equal(cargoTransportDepartMetadata.kind, "mutation");
  assert.equal(cargoTransportDepartMetadata.auth, "session");
  assert.equal(cargoTransportDepartMetadata.organizationRequired, true);
  assert.deepEqual(cargoTransportDepartMetadata.permissions, ["cargo.transport.depart"]);
  assert.equal(cargoTransportDepartMetadata.audit, "critical");
  assert.equal(cargoTransportDepartMetadata.idempotency, "required");
  assert.equal(cargoTransportDepartMetadata.observability.criticality, "critical");
});

test("cargo transport depart schema validates governed departure command", () => {
  const input = cargoTransportDepartInputSchema.parse({
    cargoId: "cargo_001",
    departedAt: "2026-06-05T08:00:00.000Z",
    departureLocationName: "Rail Yard A",
    operatorName: "Operations Controller",
    departureReference: "DEP-2026-0001",
    carrierReference: "TRAIN-77",
    idempotencyKey: "idem_cargo_depart_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.departureLocationName, "Rail Yard A");
});

test("cargo transport depart output validates cargo and tracking transition", () => {
  const output = cargoTransportDepartOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    shipmentId: "shipment_001",
    eventId: "event_001",
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
      departedAt: "2026-06-05T08:00:00.000Z",
      departureReference: "DEP-2026-0001",
      departureLocationName: "Rail Yard A",
      departureOperatorName: "Operations Controller",
      carrierReference: "TRAIN-77",
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-05T08:00:00.000Z",
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
      occurredAt: "2026-06-05T08:00:00.000Z",
      locationName: "Rail Yard A",
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
      key: "idem_cargo_depart_001",
      replayed: false,
    },
    audit: {
      action: "cargo.transport_departed",
      subjectType: "cargo",
      subjectId: "cargo_001",
    },
    outbox: {
      eventType: "cargo.transport_departed",
      aggregateType: "cargo",
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.cargo.status, "in_transport");
  assert.equal(output.shipment.status, "in_transit");
  assert.equal(output.businessRules.approvedComplianceEvidencePresent, true);
});

test("cargo transport arrive metadata requires critical idempotent permission", () => {
  assert.equal(cargoTransportArriveMetadata.name, "cargo.transport.arrive");
  assert.equal(cargoTransportArriveMetadata.kind, "mutation");
  assert.equal(cargoTransportArriveMetadata.auth, "session");
  assert.equal(cargoTransportArriveMetadata.organizationRequired, true);
  assert.deepEqual(cargoTransportArriveMetadata.permissions, ["cargo.transport.arrive"]);
  assert.equal(cargoTransportArriveMetadata.audit, "critical");
  assert.equal(cargoTransportArriveMetadata.idempotency, "required");
  assert.equal(cargoTransportArriveMetadata.observability.criticality, "critical");
});

test("cargo transport arrive schema validates governed arrival command", () => {
  const input = cargoTransportArriveInputSchema.parse({
    cargoId: "cargo_001",
    arrivedAt: "2026-06-06T08:00:00.000Z",
    arrivalLocationName: "Port Terminal B",
    operatorName: "Terminal Controller",
    arrivalReference: "ARR-2026-0001",
    idempotencyKey: "idem_cargo_arrive_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.arrivalLocationName, "Port Terminal B");
});

test("cargo transport arrive output validates tracking arrived transition", () => {
  const output = cargoTransportArriveOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    shipmentId: "shipment_001",
    eventId: "event_arrived_001",
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
      arrivedAt: "2026-06-06T08:00:00.000Z",
      arrivalReference: "ARR-2026-0001",
      arrivalLocationName: "Port Terminal B",
      arrivalOperatorName: "Terminal Controller",
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-06T08:00:00.000Z",
    },
    shipment: {
      id: "shipment_001",
      referenceCode: "TRK-2026-0001",
      transportMode: "rail",
      previousStatus: "in_transit",
      status: "arrived",
      actualArrivalAt: "2026-06-06T08:00:00.000Z",
    },
    event: {
      id: "event_arrived_001",
      eventType: "arrived",
      occurredAt: "2026-06-06T08:00:00.000Z",
      locationName: "Port Terminal B",
    },
    businessRules: {
      arrivalAllowed: true,
      cargoInTransport: true,
      trackingShipmentInTransit: true,
      arrivalAfterDeparture: true,
      appliedRules: ["tracking_shipment_moved_to_arrived"],
    },
    idempotency: {
      key: "idem_cargo_arrive_001",
      replayed: false,
    },
    audit: {
      action: "cargo.transport_arrived",
      subjectType: "cargo",
      subjectId: "cargo_001",
    },
    outbox: {
      eventType: "cargo.transport_arrived",
      aggregateType: "cargo",
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.shipment.status, "arrived");
  assert.equal(output.businessRules.arrivalAfterDeparture, true);
});

test("cargo operational handoff record metadata requires critical idempotent permission", () => {
  assert.equal(cargoOperationalHandoffRecordMetadata.name, "cargo.handoff.record");
  assert.equal(cargoOperationalHandoffRecordMetadata.kind, "mutation");
  assert.equal(cargoOperationalHandoffRecordMetadata.auth, "session");
  assert.equal(cargoOperationalHandoffRecordMetadata.organizationRequired, true);
  assert.deepEqual(cargoOperationalHandoffRecordMetadata.permissions, ["cargo.handoff.record"]);
  assert.equal(cargoOperationalHandoffRecordMetadata.audit, "critical");
  assert.equal(cargoOperationalHandoffRecordMetadata.idempotency, "required");
  assert.equal(cargoOperationalHandoffRecordMetadata.observability.criticality, "critical");
});

test("cargo operational handoff schema requires sound custody transfer", () => {
  assert.throws(() =>
    cargoOperationalHandoffRecordInputSchema.parse({
      cargoId: "cargo_001",
      handoffType: "rail_to_port",
      handoffAt: "2026-06-05T12:00:00.000Z",
      handoffLocationName: "Port Gate A",
      fromCustodyOwnerName: "Rail Operator",
      toCustodyOwnerName: "Port Operator",
      operatorName: "Gate Controller",
      handoffReference: "HND-2026-0001",
      conditionStatus: "damaged",
      idempotencyKey: "idem_cargo_handoff_001",
    }),
  );

  const input = cargoOperationalHandoffRecordInputSchema.parse({
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

  assert.equal(input.conditionStatus, "sound");
  assert.equal(input.sourceSystem, "saptm");
});

test("cargo operational handoff output validates custody transfer", () => {
  const output = cargoOperationalHandoffRecordOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    handoffId: "handoff_001",
    shipmentId: "shipment_001",
    eventId: "event_handoff_001",
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
      custodyOwnerName: "Port Operator",
      priority: 3,
      expectedReadyAt: null,
      trackingShipmentId: "shipment_001",
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-05T12:00:00.000Z",
    },
    handoff: {
      id: "handoff_001",
      cargoId: "cargo_001",
      trackingShipmentId: "shipment_001",
      handoffType: "rail_to_port",
      fromCustodyOwnerName: "Rail Operator",
      toCustodyOwnerName: "Port Operator",
      handoffLocationName: "Port Gate A",
      operatorName: "Gate Controller",
      handoffReference: "HND-2026-0001",
      sealReference: "SEAL-001",
      conditionStatus: "sound",
      handoffNotes: null,
      handoffAt: "2026-06-05T12:00:00.000Z",
      sourceSystem: "saptm",
      createdAt: "2026-06-05T12:00:00.000Z",
      updatedAt: "2026-06-05T12:00:00.000Z",
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
      occurredAt: "2026-06-05T12:00:00.000Z",
      locationName: "Port Gate A",
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
      key: "idem_cargo_handoff_001",
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
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.handoff.handoffType, "rail_to_port");
  assert.equal(output.cargo.custodyOwnerName, "Port Operator");
});

test("cargo delivery complete metadata requires critical idempotent permission", () => {
  assert.equal(cargoDeliveryCompleteMetadata.name, "cargo.delivery.complete");
  assert.equal(cargoDeliveryCompleteMetadata.kind, "mutation");
  assert.equal(cargoDeliveryCompleteMetadata.auth, "session");
  assert.equal(cargoDeliveryCompleteMetadata.organizationRequired, true);
  assert.deepEqual(cargoDeliveryCompleteMetadata.permissions, ["cargo.delivery.complete"]);
  assert.equal(cargoDeliveryCompleteMetadata.audit, "critical");
  assert.equal(cargoDeliveryCompleteMetadata.idempotency, "required");
  assert.equal(cargoDeliveryCompleteMetadata.observability.criticality, "critical");
});

test("cargo delivery complete schema blocks non-sound condition without notes", () => {
  assert.throws(() =>
    cargoDeliveryCompleteInputSchema.parse({
      cargoId: "cargo_001",
      deliveredAt: "2026-06-06T10:00:00.000Z",
      receivedByName: "Consignee Controller",
      deliveryReference: "DLV-2026-0001",
      deliveryConditionStatus: "damaged",
      idempotencyKey: "idem_cargo_delivery_001",
    }),
  );

  const input = cargoDeliveryCompleteInputSchema.parse({
    cargoId: "cargo_001",
    deliveredAt: "2026-06-06T10:00:00.000Z",
    receivedByName: "Consignee Controller",
    deliveryReference: "DLV-2026-0001",
    deliveryConditionStatus: "sound",
    idempotencyKey: "idem_cargo_delivery_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.deliveryConditionStatus, "sound");
});

test("cargo delivery complete output validates delivered and completed transition", () => {
  const output = cargoDeliveryCompleteOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    shipmentId: "shipment_001",
    eventId: "event_handover_001",
    cargo: {
      id: "cargo_001",
      cargoReference: "CGO-2026-0001",
      externalReference: null,
      cargoDescription: "Fuel drums",
      cargoType: "hazardous",
      status: "delivered",
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
      deliveredAt: "2026-06-06T10:00:00.000Z",
      deliveryReference: "DLV-2026-0001",
      receivedByName: "Consignee Controller",
      deliveryNotes: null,
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-06T10:00:00.000Z",
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
      occurredAt: "2026-06-06T10:00:00.000Z",
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
      key: "idem_cargo_delivery_001",
      replayed: false,
    },
    audit: {
      action: "cargo.delivery_completed",
      subjectType: "cargo",
      subjectId: "cargo_001",
    },
    outbox: {
      eventType: "cargo.delivery_completed",
      aggregateType: "cargo",
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.cargo.status, "delivered");
  assert.equal(output.shipment.status, "completed");
});

test("cargo delivery exception record metadata requires critical idempotent permission", () => {
  assert.equal(cargoDeliveryExceptionRecordMetadata.name, "cargo.delivery.exception.record");
  assert.equal(cargoDeliveryExceptionRecordMetadata.kind, "mutation");
  assert.equal(cargoDeliveryExceptionRecordMetadata.auth, "session");
  assert.equal(cargoDeliveryExceptionRecordMetadata.organizationRequired, true);
  assert.deepEqual(cargoDeliveryExceptionRecordMetadata.permissions, [
    "cargo.delivery.exception.record",
  ]);
  assert.equal(cargoDeliveryExceptionRecordMetadata.audit, "critical");
  assert.equal(cargoDeliveryExceptionRecordMetadata.idempotency, "required");
  assert.equal(cargoDeliveryExceptionRecordMetadata.observability.criticality, "critical");
});

test("cargo delivery exception record schema validates non-sound delivery exception", () => {
  assert.throws(() =>
    cargoDeliveryExceptionRecordInputSchema.parse({
      cargoId: "cargo_001",
      exceptionType: "damage",
      deliveryConditionStatus: "sound",
      occurredAt: "2026-06-06T10:00:00.000Z",
      reportedByName: "Terminal Inspector",
      exceptionSummary: "Container damaged at destination",
      evidenceReference: "PHOTO-001",
      idempotencyKey: "idem_cargo_delivery_exception_001",
    }),
  );

  const input = cargoDeliveryExceptionRecordInputSchema.parse({
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

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.deliveryConditionStatus, "damaged");
});

test("cargo delivery exception record output validates exception transition", () => {
  const output = cargoDeliveryExceptionRecordOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    exceptionId: "dex_001",
    shipmentId: "shipment_001",
    eventId: "event_exception_001",
    cargo: {
      id: "cargo_001",
      cargoReference: "CGO-2026-0001",
      externalReference: null,
      cargoDescription: "Fuel drums",
      cargoType: "hazardous",
      status: "held",
      customsStatus: "cleared",
      conditionStatus: "damaged",
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
      updatedAt: "2026-06-06T10:00:00.000Z",
    },
    exception: {
      id: "dex_001",
      cargoId: "cargo_001",
      trackingShipmentId: "shipment_001",
      exceptionType: "damage",
      deliveryConditionStatus: "damaged",
      status: "open",
      reportedByName: "Terminal Inspector",
      exceptionSummary: "Container damaged at destination",
      evidenceReference: "PHOTO-001",
      claimReference: "CLM-2026-0001",
      occurredAt: "2026-06-06T10:00:00.000Z",
      resolverName: null,
      resolutionCode: null,
      resolutionReference: null,
      resolutionSummary: null,
      resolvedAt: null,
      sourceSystem: "saptm",
      createdAt: "2026-06-06T10:00:00.000Z",
      updatedAt: "2026-06-06T10:00:00.000Z",
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
      occurredAt: "2026-06-06T10:00:00.000Z",
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
      key: "idem_cargo_delivery_exception_001",
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
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.exception.status, "open");
  assert.equal(output.shipment.status, "exception");
});

test("cargo delivery exception resolve metadata requires critical idempotent permission", () => {
  assert.equal(cargoDeliveryExceptionResolveMetadata.name, "cargo.delivery.exception.resolve");
  assert.equal(cargoDeliveryExceptionResolveMetadata.kind, "mutation");
  assert.equal(cargoDeliveryExceptionResolveMetadata.auth, "session");
  assert.equal(cargoDeliveryExceptionResolveMetadata.organizationRequired, true);
  assert.deepEqual(cargoDeliveryExceptionResolveMetadata.permissions, [
    "cargo.delivery.exception.resolve",
  ]);
  assert.equal(cargoDeliveryExceptionResolveMetadata.audit, "critical");
  assert.equal(cargoDeliveryExceptionResolveMetadata.idempotency, "required");
  assert.equal(cargoDeliveryExceptionResolveMetadata.observability.criticality, "critical");
});

test("cargo delivery exception resolve schema restores sound condition", () => {
  assert.throws(() =>
    cargoDeliveryExceptionResolveInputSchema.parse({
      exceptionId: "dex_001",
      resolutionCode: "inspection_passed",
      resolvedAt: "2026-06-06T11:00:00.000Z",
      resolverName: "QA Supervisor",
      resolutionReference: "INSP-2026-0001",
      resolutionSummary: "Inspection passed after rework",
      finalConditionStatus: "damaged",
      idempotencyKey: "idem_cargo_delivery_exception_resolve_001",
    }),
  );

  const input = cargoDeliveryExceptionResolveInputSchema.parse({
    exceptionId: "dex_001",
    resolutionCode: "inspection_passed",
    resolvedAt: "2026-06-06T11:00:00.000Z",
    resolverName: "QA Supervisor",
    resolutionReference: "INSP-2026-0001",
    resolutionSummary: "Inspection passed after rework",
    idempotencyKey: "idem_cargo_delivery_exception_resolve_001",
  });

  assert.equal(input.finalConditionStatus, "sound");
  assert.equal(input.sourceSystem, "saptm");
});

test("cargo delivery exception resolve output validates restored delivery state", () => {
  const output = cargoDeliveryExceptionResolveOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    exceptionId: "dex_001",
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
      updatedAt: "2026-06-06T11:00:00.000Z",
    },
    exception: {
      id: "dex_001",
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
      resolverName: "QA Supervisor",
      resolutionCode: "inspection_passed",
      resolutionReference: "INSP-2026-0001",
      resolutionSummary: "Inspection passed after rework",
      resolvedAt: "2026-06-06T11:00:00.000Z",
      sourceSystem: "saptm",
      createdAt: "2026-06-06T10:00:00.000Z",
      updatedAt: "2026-06-06T11:00:00.000Z",
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
      occurredAt: "2026-06-06T11:00:00.000Z",
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
      key: "idem_cargo_delivery_exception_resolve_001",
      replayed: false,
    },
    audit: {
      action: "cargo.delivery_exception.resolved",
      subjectType: "cargo_delivery_exception",
      subjectId: "dex_001",
    },
    outbox: {
      eventType: "cargo.delivery_exception.resolved",
      aggregateType: "cargo",
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.exception.status, "resolved");
  assert.equal(output.shipment.status, "arrived");
});

test("cargo claim settlement record metadata requires critical idempotent permission", () => {
  assert.equal(cargoClaimSettlementRecordMetadata.name, "cargo.claim.settle");
  assert.equal(cargoClaimSettlementRecordMetadata.kind, "mutation");
  assert.equal(cargoClaimSettlementRecordMetadata.auth, "session");
  assert.equal(cargoClaimSettlementRecordMetadata.organizationRequired, true);
  assert.deepEqual(cargoClaimSettlementRecordMetadata.permissions, ["cargo.claim.settle"]);
  assert.equal(cargoClaimSettlementRecordMetadata.audit, "critical");
  assert.equal(cargoClaimSettlementRecordMetadata.idempotency, "required");
  assert.equal(cargoClaimSettlementRecordMetadata.observability.criticality, "critical");
});

test("cargo claim settlement schema validates accounting settlement input", () => {
  assert.throws(() =>
    cargoClaimSettlementRecordInputSchema.parse({
      exceptionId: "dex_001",
      claimReference: "CLM-2026-0001",
      settlementReference: "SET-2026-0001",
      settlementType: "carrier_liability",
      currencyCode: "US1",
      settlementAmount: 12_500,
      settledByName: "Claims Manager",
      counterpartyName: "Rail Carrier",
      settlementSummary: "Carrier liability accepted",
      settledAt: "2026-06-06T12:00:00.000Z",
      idempotencyKey: "idem_cargo_claim_settlement_001",
    }),
  );

  assert.throws(() =>
    cargoClaimSettlementRecordInputSchema.parse({
      exceptionId: "dex_001",
      claimReference: "CLM-2026-0001",
      settlementReference: "SET-2026-0001",
      settlementType: "carrier_liability",
      currencyCode: "USD",
      settlementAmount: 0,
      settledByName: "Claims Manager",
      counterpartyName: "Rail Carrier",
      settlementSummary: "Carrier liability accepted",
      settledAt: "2026-06-06T12:00:00.000Z",
      idempotencyKey: "idem_cargo_claim_settlement_001",
    }),
  );

  const input = cargoClaimSettlementRecordInputSchema.parse({
    exceptionId: "dex_001",
    claimReference: "CLM-2026-0001",
    settlementReference: "SET-2026-0001",
    settlementType: "carrier_liability",
    currencyCode: "usd",
    settlementAmount: 12_500,
    settledByName: "Claims Manager",
    counterpartyName: "Rail Carrier",
    settlementSummary: "Carrier liability accepted after inspection",
    settledAt: "2026-06-06T12:00:00.000Z",
    idempotencyKey: "idem_cargo_claim_settlement_001",
  });

  assert.equal(input.currencyCode, "USD");
  assert.equal(input.sourceSystem, "saptm");
});

test("cargo claim settlement output validates accounting audit contract", () => {
  const output = cargoClaimSettlementRecordOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    exceptionId: "dex_001",
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
      updatedAt: "2026-06-06T11:00:00.000Z",
    },
    exception: {
      id: "dex_001",
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
      resolverName: "QA Supervisor",
      resolutionCode: "claim_accepted",
      resolutionReference: "CLM-2026-0001",
      resolutionSummary: "Claim accepted after inspection",
      resolvedAt: "2026-06-06T11:00:00.000Z",
      sourceSystem: "saptm",
      createdAt: "2026-06-06T10:00:00.000Z",
      updatedAt: "2026-06-06T11:00:00.000Z",
    },
    settlement: {
      id: "settlement_001",
      cargoId: "cargo_001",
      deliveryExceptionId: "dex_001",
      claimReference: "CLM-2026-0001",
      settlementReference: "SET-2026-0001",
      settlementType: "carrier_liability",
      settlementStatus: "settled",
      currencyCode: "USD",
      settlementAmount: 12_500,
      settledByName: "Claims Manager",
      counterpartyName: "Rail Carrier",
      settlementSummary: "Carrier liability accepted after inspection",
      settledAt: "2026-06-06T12:00:00.000Z",
      sourceSystem: "saptm",
      createdAt: "2026-06-06T12:00:00.000Z",
      updatedAt: "2026-06-06T12:00:00.000Z",
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
      key: "idem_cargo_claim_settlement_001",
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
  });

  assert.equal(output.settlement.settlementStatus, "settled");
  assert.equal(output.businessRules.claimResolutionAccepted, true);
});

test("cargo compliance evidence record metadata requires auditable permission", () => {
  assert.equal(cargoComplianceEvidenceRecordMetadata.name, "cargo.compliance.evidence.record");
  assert.equal(cargoComplianceEvidenceRecordMetadata.kind, "mutation");
  assert.equal(cargoComplianceEvidenceRecordMetadata.auth, "session");
  assert.equal(cargoComplianceEvidenceRecordMetadata.organizationRequired, true);
  assert.deepEqual(cargoComplianceEvidenceRecordMetadata.permissions, ["cargo.compliance.record"]);
  assert.equal(cargoComplianceEvidenceRecordMetadata.audit, "critical");
  assert.equal(cargoComplianceEvidenceRecordMetadata.idempotency, "required");
  assert.equal(cargoComplianceEvidenceRecordMetadata.observability.criticality, "high");
});

test("cargo compliance evidence record schema enforces expiry after issue date", () => {
  assert.throws(() =>
    cargoComplianceEvidenceRecordInputSchema.parse({
      cargoId: "cargo_001",
      evidenceType: "customs_declaration",
      documentReference: "DOC-2026-0001",
      documentTitle: "Customs declaration",
      issuerName: "Customs Authority",
      issuedAt: "2026-06-05T08:00:00.000Z",
      expiresAt: "2026-06-05T07:00:00.000Z",
      idempotencyKey: "idem_cargo_evidence_001",
    }),
  );

  const input = cargoComplianceEvidenceRecordInputSchema.parse({
    cargoId: "cargo_001",
    evidenceType: "hazardous_goods_declaration",
    documentReference: "HGD-2026-0001",
    documentTitle: "Hazardous goods declaration",
    issuerName: "Port Safety Authority",
    issuedAt: "2026-06-05T08:00:00.000Z",
    expiresAt: "2026-07-05T08:00:00.000Z",
    idempotencyKey: "idem_cargo_evidence_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.evidenceType, "hazardous_goods_declaration");
});

test("cargo compliance evidence record output validates audit and outbox contract", () => {
  const output = cargoComplianceEvidenceRecordOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    evidenceId: "evidence_001",
    evidence: {
      id: "evidence_001",
      cargoId: "cargo_001",
      evidenceType: "bill_of_lading",
      documentReference: "BL-2026-0001",
      documentTitle: "Primary bill of lading",
      documentUri: null,
      issuerName: "Shipping Line",
      issuedAt: "2026-06-04T00:00:00.000Z",
      expiresAt: null,
      status: "pending_review",
      reviewerName: null,
      reviewReference: null,
      reviewSummary: null,
      rejectionReason: null,
      reviewedAt: null,
      sourceSystem: "saptm",
      recordedAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    },
    businessRules: {
      evidenceAccepted: true,
      reviewRequired: true,
      appliedRules: ["compliance_evidence_requires_human_review"],
    },
    idempotency: {
      key: "idem_cargo_evidence_001",
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
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.businessRules.reviewRequired, true);
  assert.equal(output.evidence.status, "pending_review");
});

test("cargo compliance evidence verify metadata requires critical permission", () => {
  assert.equal(cargoComplianceEvidenceVerifyMetadata.name, "cargo.compliance.evidence.verify");
  assert.equal(cargoComplianceEvidenceVerifyMetadata.kind, "mutation");
  assert.equal(cargoComplianceEvidenceVerifyMetadata.auth, "session");
  assert.equal(cargoComplianceEvidenceVerifyMetadata.organizationRequired, true);
  assert.deepEqual(cargoComplianceEvidenceVerifyMetadata.permissions, ["cargo.compliance.verify"]);
  assert.equal(cargoComplianceEvidenceVerifyMetadata.audit, "critical");
  assert.equal(cargoComplianceEvidenceVerifyMetadata.idempotency, "required");
  assert.equal(cargoComplianceEvidenceVerifyMetadata.observability.criticality, "critical");
});

test("cargo compliance evidence verify schema requires rejection reason", () => {
  assert.throws(() =>
    cargoComplianceEvidenceVerifyInputSchema.parse({
      evidenceId: "evidence_001",
      status: "rejected",
      reviewerName: "Compliance Officer",
      reviewReference: "REV-2026-0001",
      reviewSummary: "Document mismatch.",
      idempotencyKey: "idem_cargo_verify_001",
    }),
  );

  const input = cargoComplianceEvidenceVerifyInputSchema.parse({
    evidenceId: "evidence_001",
    status: "rejected",
    reviewerName: "Compliance Officer",
    reviewReference: "REV-2026-0001",
    reviewSummary: "Document mismatch.",
    rejectionReason: "Document reference does not match manifest.",
    idempotencyKey: "idem_cargo_verify_001",
  });

  assert.equal(input.sourceSystem, "saptm");
  assert.equal(input.status, "rejected");
});

test("cargo compliance evidence verify output validates decision contract", () => {
  const output = cargoComplianceEvidenceVerifyOutputSchema.parse({
    organizationId: "org_rail_port",
    cargoId: "cargo_001",
    evidenceId: "evidence_001",
    evidence: {
      id: "evidence_001",
      cargoId: "cargo_001",
      evidenceType: "bill_of_lading",
      documentReference: "BL-2026-0001",
      documentTitle: "Primary bill of lading",
      documentUri: null,
      issuerName: "Shipping Line",
      issuedAt: "2026-06-04T00:00:00.000Z",
      expiresAt: null,
      status: "approved",
      reviewerName: "Compliance Officer",
      reviewReference: "REV-2026-0001",
      reviewSummary: "Document verified.",
      rejectionReason: null,
      reviewedAt: "2026-06-04T01:00:00.000Z",
      sourceSystem: "saptm",
      recordedAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T01:00:00.000Z",
    },
    businessRules: {
      verificationAllowed: true,
      evidenceApproved: true,
      evidenceRejected: false,
      appliedRules: ["compliance_evidence_approved_for_operations"],
    },
    idempotency: {
      key: "idem_cargo_verify_001",
      replayed: false,
    },
    audit: {
      action: "cargo.compliance_evidence.verified",
      subjectType: "cargo_compliance_evidence",
      subjectId: "evidence_001",
    },
    outbox: {
      eventType: "cargo.compliance_evidence.verified",
      aggregateType: "cargo",
      aggregateId: "cargo_001",
    },
  });

  assert.equal(output.businessRules.evidenceApproved, true);
  assert.equal(output.evidence.status, "approved");
});
