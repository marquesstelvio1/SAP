import assert from "node:assert/strict";
import { test } from "node:test";

import { CargoService } from "../dist/cargo/cargo.service.js";

const fixedNow = new Date("2026-06-04T00:00:00.000Z");

test("cargo service enforces governed cargo release, planning, compliance, and departure", async () => {
  const { database, state } = createCargoLifecycleDatabase();
  const service = createCargoService(database);
  const actor = createActorContext("cargo_lifecycle");
  const plannedDepartureAt = new Date(Date.now() + 86_400_000).toISOString();
  const estimatedArrivalAt = new Date(Date.now() + 172_800_000).toISOString();

  const registered = await service.registerCargo({
    ...actor,
    cargoReference: " cgo-2026-0001 ",
    cargoDescription: " Fuel drums ",
    cargoType: "hazardous",
    grossWeightKg: 900,
    packageCount: 10,
    shipperName: "Shipper A",
    consigneeName: "Consignee B",
    originName: "Rail Yard A",
    destinationName: "Port Terminal B",
    custodyOwnerName: "Operations Desk",
    customsStatus: "held",
    customsReference: "CUS-2026-0001",
    conditionStatus: "requires_inspection",
    hazardous: true,
    unNumber: "UN1203",
    hazardClass: "3",
    requiresInspection: true,
    idempotencyKey: "idem_cargo_register_001",
  });

  assert.equal(registered.cargo.cargoReference, "CGO-2026-0001");
  assert.equal(registered.cargo.status, "held");
  assert.equal(registered.businessRules.movementBlocked, true);
  assert.equal(registered.businessRules.inspectionRequired, true);
  assert.ok(
    registered.businessRules.appliedRules.includes("movement_blocked_until_governed_release"),
  );

  await assertRejectsWithMessage(
    () =>
      service.planTransport({
        ...actor,
        cargoId: registered.cargoId,
        referenceCode: "TRK-2026-0001",
        transportMode: "rail",
        plannedDepartureAt,
        estimatedArrivalAt,
        operationsOwnerTeam: "Rail Ops",
        planningReference: "PLAN-2026-0001",
        firstCheckpointName: "Rail Yard A",
        idempotencyKey: "idem_cargo_plan_blocked_001",
      }),
    "cargo.transport_plan_blocked",
  );

  const released = await service.releaseCargo({
    ...actor,
    cargoId: registered.cargoId,
    customsStatus: "cleared",
    inspectionOutcome: "passed",
    releaseReference: "CLR-2026-0001",
    releaseReason: "Customs cleared and inspection passed",
    releasedAt: "2026-06-04T10:00:00.000Z",
    idempotencyKey: "idem_cargo_release_001",
  });

  assert.equal(released.cargo.status, "ready_for_transport");
  assert.equal(released.cargo.customsStatus, "cleared");
  assert.equal(released.cargo.requiresInspection, false);
  assert.equal(released.businessRules.releaseAllowed, true);
  assert.ok(
    released.businessRules.appliedRules.includes(
      "cargo_ready_for_transport_after_governed_release",
    ),
  );

  const planned = await service.planTransport({
    ...actor,
    cargoId: registered.cargoId,
    referenceCode: "TRK-2026-0001",
    transportMode: "rail",
    plannedDepartureAt,
    estimatedArrivalAt,
    operationsOwnerTeam: "Rail Ops",
    planningReference: "PLAN-2026-0001",
    firstCheckpointName: "Rail Yard A",
    idempotencyKey: "idem_cargo_plan_001",
  });

  assert.equal(planned.shipment.status, "planned");
  assert.equal(planned.cargo.trackingShipmentId, planned.shipmentId);
  assert.equal(planned.businessRules.planningAllowed, true);
  assert.equal(planned.businessRules.trackingLinked, true);

  await assertRejectsWithMessage(
    () =>
      service.departTransport({
        ...actor,
        cargoId: registered.cargoId,
        departedAt: plannedDepartureAt,
        departureLocationName: "Rail Yard A",
        operatorName: "Operations Controller",
        departureReference: "DEP-2026-0001",
        carrierReference: "TRAIN-77",
        idempotencyKey: "idem_cargo_depart_blocked_001",
      }),
    "cargo.transport_departure_blocked",
  );

  const evidence = await service.recordComplianceEvidence({
    ...actor,
    cargoId: registered.cargoId,
    evidenceType: "hazardous_goods_declaration",
    documentReference: "hgd-2026-0001",
    documentTitle: "Hazardous goods declaration",
    issuerName: "Safety Office",
    issuedAt: "2026-06-04T09:00:00.000Z",
    idempotencyKey: "idem_cargo_evidence_001",
  });

  assert.equal(evidence.evidence.documentReference, "HGD-2026-0001");
  assert.equal(evidence.evidence.status, "pending_review");
  assert.equal(evidence.businessRules.reviewRequired, true);

  const verified = await service.verifyComplianceEvidence({
    ...actor,
    evidenceId: evidence.evidenceId,
    status: "approved",
    reviewerName: "Compliance Officer",
    reviewReference: "REV-2026-0001",
    reviewSummary: "Hazardous goods declaration verified.",
    reviewedAt: "2026-06-04T11:00:00.000Z",
    idempotencyKey: "idem_cargo_evidence_verify_001",
  });

  assert.equal(verified.evidence.status, "approved");
  assert.equal(verified.businessRules.evidenceApproved, true);

  const departed = await service.departTransport({
    ...actor,
    cargoId: registered.cargoId,
    departedAt: plannedDepartureAt,
    departureLocationName: "Rail Yard A",
    operatorName: "Operations Controller",
    departureReference: "DEP-2026-0001",
    carrierReference: "TRAIN-77",
    idempotencyKey: "idem_cargo_depart_001",
  });

  assert.equal(departed.cargo.status, "in_transport");
  assert.equal(departed.shipment.status, "in_transit");
  assert.equal(departed.event.eventType, "departed");
  assert.equal(departed.businessRules.departureAllowed, true);
  assert.equal(departed.businessRules.approvedComplianceEvidencePresent, true);
  assert.equal(state.cargo.length, 1);
  assert.deepEqual(
    state.outboxEvents.map((event) => event.eventType),
    [
      "cargo.registered",
      "cargo.released",
      "cargo.transport_planned",
      "cargo.compliance_evidence.recorded",
      "cargo.compliance_evidence.verified",
      "cargo.transport_departed",
    ],
  );
  assert.deepEqual(
    state.auditRecords.map((record) => record.action),
    [
      "cargo.registered",
      "cargo.released",
      "cargo.transport_planned",
      "cargo.compliance_evidence.recorded",
      "cargo.compliance_evidence.verified",
      "cargo.transport_departed",
    ],
  );
});

test("cargo service blocks duplicate cargo references within the same tenant", async () => {
  const { database } = createCargoLifecycleDatabase();
  const service = createCargoService(database);
  const actor = createActorContext("cargo_duplicate_reference");

  await service.registerCargo(
    createStandardCargoRegistration(actor, {
      cargoReference: "DUP-2026-0001",
      idempotencyKey: "idem_cargo_duplicate_001",
    }),
  );

  await assertRejectsWithMessage(
    () =>
      service.registerCargo(
        createStandardCargoRegistration(actor, {
          cargoReference: " dup-2026-0001 ",
          idempotencyKey: "idem_cargo_duplicate_002",
        }),
      ),
    "cargo.reference_conflict",
  );
});

test("cargo service replays transport planning and blocks duplicate tracking references", async () => {
  const { database } = createCargoLifecycleDatabase();
  const service = createCargoService(database);
  const actor = createActorContext("cargo_planning_idempotency");
  const firstCargo = await registerAndReleaseStandardCargo(service, actor, "plan_a");
  const planningInput = createTransportPlanInput(actor, firstCargo.cargoId, {
    referenceCode: "TRK-2026-PLAN-A",
    idempotencyKey: "idem_cargo_plan_a_001",
  });

  const planned = await service.planTransport(planningInput);
  const replayed = await service.planTransport(planningInput);

  assert.equal(planned.shipment.referenceCode, "TRK-2026-PLAN-A");
  assert.equal(replayed.idempotency.replayed, true);
  assert.equal(replayed.shipmentId, planned.shipmentId);

  await assertRejectsWithMessage(
    () =>
      service.planTransport({
        ...planningInput,
        referenceCode: "TRK-2026-PLAN-A-REPLAN",
        idempotencyKey: "idem_cargo_plan_a_002",
      }),
    "cargo.transport_already_planned",
  );

  const secondCargo = await registerAndReleaseStandardCargo(service, actor, "plan_b");

  await assertRejectsWithMessage(
    () =>
      service.planTransport(
        createTransportPlanInput(actor, secondCargo.cargoId, {
          referenceCode: " trk-2026-plan-a ",
          idempotencyKey: "idem_cargo_plan_b_001",
        }),
      ),
    "cargo.transport_reference_conflict",
  );
});

test("cargo service enforces arrival and delivery completion ordering", async () => {
  const { database, state } = createCargoLifecycleDatabase();
  const service = createCargoService(database);
  const actor = createActorContext("cargo_arrival_delivery");
  const departedCargo = await prepareDepartedStandardCargo(service, actor, "arrive_delivery");
  const arrivalBeforeDeparture = new Date(
    new Date(departedCargo.departedAt).getTime() - 60_000,
  ).toISOString();

  await assertRejectsWithMessage(
    () =>
      service.arriveTransport({
        ...actor,
        cargoId: departedCargo.cargoId,
        arrivedAt: arrivalBeforeDeparture,
        arrivalLocationName: "Port Terminal B",
        operatorName: "Terminal Controller",
        arrivalReference: "ARR-2026-0001",
        idempotencyKey: "idem_cargo_arrive_blocked_001",
      }),
    "cargo.transport_arrival_blocked",
  );

  const arrivedAt = new Date(
    new Date(departedCargo.departedAt).getTime() + 3_600_000,
  ).toISOString();
  const arrived = await service.arriveTransport({
    ...actor,
    cargoId: departedCargo.cargoId,
    arrivedAt,
    arrivalLocationName: "Port Terminal B",
    operatorName: "Terminal Controller",
    arrivalReference: "ARR-2026-0001",
    idempotencyKey: "idem_cargo_arrive_001",
  });

  assert.equal(arrived.cargo.status, "in_transport");
  assert.equal(arrived.shipment.previousStatus, "in_transit");
  assert.equal(arrived.shipment.status, "arrived");
  assert.equal(arrived.businessRules.arrivalAllowed, true);

  const deliveryBeforeArrival = new Date(new Date(arrivedAt).getTime() - 60_000).toISOString();
  const deliveredAt = new Date(new Date(arrivedAt).getTime() + 3_600_000).toISOString();

  await assertRejectsWithMessage(
    () =>
      service.completeDelivery({
        ...actor,
        cargoId: departedCargo.cargoId,
        deliveredAt: deliveryBeforeArrival,
        receivedByName: "Consignee Controller",
        deliveryReference: "DLV-2026-0001",
        deliveryConditionStatus: "sound",
        idempotencyKey: "idem_cargo_delivery_blocked_time_001",
      }),
    "cargo.delivery_blocked",
  );

  await assertRejectsWithMessage(
    () =>
      service.completeDelivery({
        ...actor,
        cargoId: departedCargo.cargoId,
        deliveredAt,
        receivedByName: "Consignee Controller",
        deliveryReference: "DLV-2026-0001",
        deliveryConditionStatus: "damaged",
        idempotencyKey: "idem_cargo_delivery_blocked_condition_001",
      }),
    "cargo.delivery_blocked",
  );

  const delivered = await service.completeDelivery({
    ...actor,
    cargoId: departedCargo.cargoId,
    deliveredAt,
    receivedByName: "Consignee Controller",
    deliveryReference: "DLV-2026-0001",
    deliveryConditionStatus: "sound",
    deliveryNotes: "Cargo received in sound condition.",
    idempotencyKey: "idem_cargo_delivery_001",
  });

  assert.equal(delivered.cargo.status, "delivered");
  assert.equal(delivered.shipment.previousStatus, "arrived");
  assert.equal(delivered.shipment.status, "completed");
  assert.equal(delivered.businessRules.deliveryAllowed, true);
  assert.equal(delivered.businessRules.deliveryConditionAccepted, true);
  assert.deepEqual(
    state.outboxEvents.slice(-2).map((event) => event.eventType),
    ["cargo.transport_arrived", "cargo.delivery_completed"],
  );
});

test("cargo service controls delivery exception recovery and claim settlement", async () => {
  const { database, state } = createCargoLifecycleDatabase();
  const service = createCargoService(database);
  const actor = createActorContext("cargo_exception_recovery");
  const departedCargo = await prepareDepartedStandardCargo(service, actor, "exception_recovery");
  const arrivedAt = new Date(
    new Date(departedCargo.departedAt).getTime() + 3_600_000,
  ).toISOString();
  const exceptionAt = new Date(new Date(arrivedAt).getTime() + 3_600_000).toISOString();
  const resolvedAt = new Date(new Date(exceptionAt).getTime() + 3_600_000).toISOString();
  const settledAt = new Date(new Date(resolvedAt).getTime() + 3_600_000).toISOString();
  const deliveredAt = new Date(new Date(settledAt).getTime() + 3_600_000).toISOString();

  await assertRejectsWithMessage(
    () =>
      service.recordDeliveryException({
        ...actor,
        cargoId: departedCargo.cargoId,
        exceptionType: "damage",
        deliveryConditionStatus: "damaged",
        occurredAt: exceptionAt,
        reportedByName: "Terminal Inspector",
        exceptionSummary: "Damage reported before arrival scan",
        evidenceReference: "PHOTO-BEFORE-ARRIVAL",
        claimReference: "CLM-2026-EXCEPTION",
        idempotencyKey: "idem_cargo_exception_before_arrival",
      }),
    "cargo.delivery_exception_record_blocked",
  );

  await service.arriveTransport({
    ...actor,
    cargoId: departedCargo.cargoId,
    arrivedAt,
    arrivalLocationName: "Port Terminal B",
    operatorName: "Terminal Controller",
    arrivalReference: "ARR-2026-EXCEPTION",
    idempotencyKey: "idem_cargo_arrive_exception_recovery",
  });

  const exception = await service.recordDeliveryException({
    ...actor,
    cargoId: departedCargo.cargoId,
    exceptionType: "damage",
    deliveryConditionStatus: "damaged",
    occurredAt: exceptionAt,
    reportedByName: "Terminal Inspector",
    exceptionSummary: "Container damaged at destination",
    evidenceReference: "PHOTO-EXCEPTION-001",
    claimReference: "CLM-2026-EXCEPTION",
    idempotencyKey: "idem_cargo_exception_record_001",
  });

  assert.equal(exception.cargo.status, "held");
  assert.equal(exception.shipment.previousStatus, "arrived");
  assert.equal(exception.shipment.status, "exception");
  assert.equal(exception.businessRules.exceptionAccepted, true);

  await assertRejectsWithMessage(
    () =>
      service.recordDeliveryException({
        ...actor,
        cargoId: departedCargo.cargoId,
        exceptionType: "shortage",
        deliveryConditionStatus: "damaged",
        occurredAt: exceptionAt,
        reportedByName: "Terminal Inspector",
        exceptionSummary: "Second open exception should be blocked",
        evidenceReference: "PHOTO-EXCEPTION-002",
        claimReference: "CLM-2026-DUPLICATE",
        idempotencyKey: "idem_cargo_exception_duplicate_open",
      }),
    "cargo.delivery_exception_record_blocked",
  );

  await assertRejectsWithMessage(
    () =>
      service.resolveDeliveryException({
        ...actor,
        exceptionId: exception.exceptionId,
        resolutionCode: "inspection_passed",
        resolvedAt,
        resolverName: "QA Supervisor",
        resolutionReference: "INSP-2026-EXCEPTION",
        resolutionSummary: "Inspection failed to restore sound condition",
        finalConditionStatus: "damaged",
        idempotencyKey: "idem_cargo_exception_resolve_damaged",
      }),
    "cargo.delivery_exception_resolve_blocked",
  );

  const resolved = await service.resolveDeliveryException({
    ...actor,
    exceptionId: exception.exceptionId,
    resolutionCode: "claim_accepted",
    resolvedAt,
    resolverName: "QA Supervisor",
    resolutionReference: "INSP-2026-EXCEPTION",
    resolutionSummary: "Claim accepted and cargo restored for delivery",
    finalConditionStatus: "sound",
    idempotencyKey: "idem_cargo_exception_resolve_001",
  });

  assert.equal(resolved.cargo.status, "in_transport");
  assert.equal(resolved.cargo.conditionStatus, "sound");
  assert.equal(resolved.shipment.previousStatus, "exception");
  assert.equal(resolved.shipment.status, "arrived");
  assert.equal(resolved.exception.status, "resolved");
  assert.equal(resolved.businessRules.resolutionAllowed, true);

  await assertRejectsWithMessage(
    () =>
      service.recordClaimSettlement({
        ...actor,
        exceptionId: exception.exceptionId,
        claimReference: "CLM-2026-MISMATCH",
        settlementReference: "SET-2026-MISMATCH",
        settlementType: "carrier_liability",
        currencyCode: "usd",
        settlementAmount: 12_500,
        settledByName: "Claims Manager",
        counterpartyName: "Rail Carrier",
        settlementSummary: "Mismatched claim must be blocked",
        settledAt,
        idempotencyKey: "idem_cargo_claim_mismatch",
      }),
    "cargo.claim_settlement_record_blocked",
  );

  const settlement = await service.recordClaimSettlement({
    ...actor,
    exceptionId: exception.exceptionId,
    claimReference: "CLM-2026-EXCEPTION",
    settlementReference: " set-2026-exception ",
    settlementType: "carrier_liability",
    currencyCode: "usd",
    settlementAmount: 12_500,
    settledByName: "Claims Manager",
    counterpartyName: "Rail Carrier",
    settlementSummary: "Carrier liability accepted after inspection",
    settledAt,
    idempotencyKey: "idem_cargo_claim_settlement_001",
  });

  assert.equal(settlement.settlement.settlementReference, "set-2026-exception");
  assert.equal(settlement.settlement.currencyCode, "USD");
  assert.equal(settlement.businessRules.settlementAllowed, true);

  await assertRejectsWithMessage(
    () =>
      service.recordClaimSettlement({
        ...actor,
        exceptionId: exception.exceptionId,
        claimReference: "CLM-2026-EXCEPTION",
        settlementReference: "SET-2026-EXCEPTION-DUP",
        settlementType: "carrier_liability",
        currencyCode: "USD",
        settlementAmount: 12_500,
        settledByName: "Claims Manager",
        counterpartyName: "Rail Carrier",
        settlementSummary: "Duplicate exception settlement must be blocked",
        settledAt,
        idempotencyKey: "idem_cargo_claim_settlement_duplicate",
      }),
    "cargo.claim_settlement_record_blocked",
  );

  const delivered = await service.completeDelivery({
    ...actor,
    cargoId: departedCargo.cargoId,
    deliveredAt,
    receivedByName: "Consignee Controller",
    deliveryReference: "DLV-2026-EXCEPTION",
    deliveryConditionStatus: "sound",
    deliveryNotes: "Cargo delivered after exception resolution.",
    idempotencyKey: "idem_cargo_delivery_after_exception",
  });

  assert.equal(delivered.cargo.status, "delivered");
  assert.equal(delivered.shipment.status, "completed");
  assert.deepEqual(
    state.outboxEvents.slice(-4).map((event) => event.eventType),
    [
      "cargo.delivery_exception.recorded",
      "cargo.delivery_exception.resolved",
      "cargo.claim_settlement.recorded",
      "cargo.delivery_completed",
    ],
  );
});

test("cargo service blocks release when cargo is in non-releasable status", async () => {
  const { database, state } = createCargoLifecycleDatabase();
  const service = createCargoService(database);
  const actor = createActorContext("release_blocked_status");

  const registered = await service.registerCargo(
    createStandardCargoRegistration(actor, {
      cargoReference: "BLOCKED-STATUS",
      idempotencyKey: "idem_release_blocked_status",
    }),
  );

  state.cargo[0].status = "ready_for_transport";

  await assertRejectsWithMessage(
    () =>
      service.releaseCargo({
        ...actor,
        cargoId: registered.cargoId,
        customsStatus: "not_required",
        inspectionOutcome: "not_required",
        releaseReason: "Should be blocked for ready_for_transport",
        releasedAt: new Date().toISOString(),
        idempotencyKey: "idem_release_blocked_rft",
      }),
    "cargo.release_blocked",
  );

  state.cargo[0].status = "in_transport";

  await assertRejectsWithMessage(
    () =>
      service.releaseCargo({
        ...actor,
        cargoId: registered.cargoId,
        customsStatus: "not_required",
        inspectionOutcome: "not_required",
        releaseReason: "Should be blocked for in_transport",
        releasedAt: new Date().toISOString(),
        idempotencyKey: "idem_release_blocked_transit",
      }),
    "cargo.release_blocked",
  );

  state.cargo[0].status = "delivered";

  await assertRejectsWithMessage(
    () =>
      service.releaseCargo({
        ...actor,
        cargoId: registered.cargoId,
        customsStatus: "not_required",
        inspectionOutcome: "not_required",
        releaseReason: "Should be blocked for delivered",
        releasedAt: new Date().toISOString(),
        idempotencyKey: "idem_release_blocked_delivered",
      }),
    "cargo.release_blocked",
  );
});

test("cargo service enforces inspection business rules on damaged and inspection-required cargo", async () => {
  const actor = createActorContext("inspection_edge");
  let db;
  let service;
  let registered;

  db = createCargoLifecycleDatabase();
  service = createCargoService(db.database);

  registered = await service.registerCargo(
    createStandardCargoRegistration(actor, {
      cargoReference: "INSP-FAIL",
      requiresInspection: true,
      conditionStatus: "requires_inspection",
      idempotencyKey: "idem_insp_fail",
    }),
  );

  await assertRejectsWithMessage(
    () =>
      service.releaseCargo({
        ...actor,
        cargoId: registered.cargoId,
        customsStatus: "not_required",
        inspectionOutcome: "failed",
        releaseReason: "Blocked - inspection failed",
        releasedAt: new Date().toISOString(),
        idempotencyKey: "idem_release_insp_fail",
      }),
    "cargo.release_blocked",
  );

  db = createCargoLifecycleDatabase();
  service = createCargoService(db.database);

  registered = await service.registerCargo(
    createStandardCargoRegistration(actor, {
      cargoReference: "DMG-PASS",
      conditionStatus: "damaged",
      requiresInspection: true,
      idempotencyKey: "idem_damaged_pass",
    }),
  );

  const releasedDamaged = await service.releaseCargo({
    ...actor,
    cargoId: registered.cargoId,
    customsStatus: "not_required",
    inspectionOutcome: "passed",
    releaseReason: "Inspection passed despite damage",
    releasedAt: new Date().toISOString(),
    idempotencyKey: "idem_release_damaged_pass",
  });

  assert.equal(releasedDamaged.cargo.status, "ready_for_transport");
  assert.equal(releasedDamaged.businessRules.releaseAllowed, true);

  db = createCargoLifecycleDatabase();
  service = createCargoService(db.database);

  registered = await service.registerCargo(
    createStandardCargoRegistration(actor, {
      cargoReference: "NO-OUTCOME",
      requiresInspection: true,
      conditionStatus: "requires_inspection",
      idempotencyKey: "idem_no_outcome",
    }),
  );

  await assertRejectsWithMessage(
    () =>
      service.releaseCargo({
        ...actor,
        cargoId: registered.cargoId,
        customsStatus: "not_required",
        releaseReason: "Blocked - no inspection outcome",
        releasedAt: new Date().toISOString(),
        idempotencyKey: "idem_release_no_outcome",
      }),
    "cargo.release_blocked",
  );
});

function createCargoService(database) {
  const service = Object.create(CargoService.prototype);

  service.database = database;

  return service;
}

function createActorContext(correlationSuffix) {
  return {
    organizationId: "org_port_rail",
    actorType: "user",
    actorId: "user_ops",
    correlationId: `corr_${correlationSuffix}`,
    sourceSystem: "tests",
    ipAddress: "127.0.0.1",
    userAgent: "node-test",
  };
}

function createStandardCargoRegistration(actor, overrides = {}) {
  return {
    ...actor,
    cargoReference: "CGO-2026-0001",
    cargoDescription: "Containerized spare parts",
    cargoType: "container",
    grossWeightKg: 1_200,
    packageCount: 12,
    shipperName: "Shipper A",
    consigneeName: "Consignee B",
    originName: "Rail Yard A",
    destinationName: "Port Terminal B",
    custodyOwnerName: "Operations Desk",
    customsStatus: "not_required",
    conditionStatus: "sound",
    hazardous: false,
    requiresInspection: false,
    idempotencyKey: "idem_cargo_standard_001",
    ...overrides,
  };
}

async function prepareDepartedStandardCargo(service, actor, sequence) {
  const cargo = await registerAndReleaseStandardCargo(service, actor, sequence);
  const planningInput = createTransportPlanInput(actor, cargo.cargoId, {
    referenceCode: `TRK-2026-${sequence.toUpperCase()}`,
    idempotencyKey: `idem_cargo_plan_${sequence}`,
  });

  await service.planTransport(planningInput);

  const evidence = await service.recordComplianceEvidence({
    ...actor,
    cargoId: cargo.cargoId,
    evidenceType: "bill_of_lading",
    documentReference: `BL-2026-${sequence.toUpperCase()}`,
    documentTitle: "Primary bill of lading",
    issuerName: "Shipping Line",
    issuedAt: "2026-06-04T09:00:00.000Z",
    idempotencyKey: `idem_cargo_evidence_${sequence}`,
  });

  await service.verifyComplianceEvidence({
    ...actor,
    evidenceId: evidence.evidenceId,
    status: "approved",
    reviewerName: "Compliance Officer",
    reviewReference: `REV-2026-${sequence.toUpperCase()}`,
    reviewSummary: "Document verified for departure.",
    reviewedAt: "2026-06-04T11:00:00.000Z",
    idempotencyKey: `idem_cargo_evidence_verify_${sequence}`,
  });

  const departed = await service.departTransport({
    ...actor,
    cargoId: cargo.cargoId,
    departedAt: planningInput.plannedDepartureAt,
    departureLocationName: "Rail Yard A",
    operatorName: "Operations Controller",
    departureReference: `DEP-2026-${sequence.toUpperCase()}`,
    carrierReference: `TRAIN-${sequence.toUpperCase()}`,
    idempotencyKey: `idem_cargo_depart_${sequence}`,
  });

  return {
    ...cargo,
    departed,
    departedAt: planningInput.plannedDepartureAt,
  };
}

async function registerAndReleaseStandardCargo(service, actor, sequence) {
  const registered = await service.registerCargo(
    createStandardCargoRegistration(actor, {
      cargoReference: `CGO-2026-${sequence.toUpperCase()}`,
      idempotencyKey: `idem_cargo_register_${sequence}`,
    }),
  );
  const released = await service.releaseCargo({
    ...actor,
    cargoId: registered.cargoId,
    customsStatus: "not_required",
    inspectionOutcome: "not_required",
    releaseReason: "No customs or inspection hold for standard cargo",
    releasedAt: "2026-06-04T10:00:00.000Z",
    idempotencyKey: `idem_cargo_release_${sequence}`,
  });

  return {
    cargoId: registered.cargoId,
    registered,
    released,
  };
}

function createTransportPlanInput(actor, cargoId, overrides = {}) {
  return {
    ...actor,
    cargoId,
    referenceCode: "TRK-2026-0001",
    transportMode: "rail",
    plannedDepartureAt: new Date(Date.now() + 86_400_000).toISOString(),
    estimatedArrivalAt: new Date(Date.now() + 172_800_000).toISOString(),
    operationsOwnerTeam: "Rail Ops",
    planningReference: "PLAN-2026-0001",
    firstCheckpointName: "Rail Yard A",
    idempotencyKey: "idem_cargo_plan_001",
    ...overrides,
  };
}

function createCargoLifecycleDatabase() {
  const state = {
    cargo: [],
    trackingShipments: [],
    trackingEvents: [],
    complianceEvidence: [],
    deliveryExceptions: [],
    claimSettlements: [],
    auditRecords: [],
    outboxEvents: [],
    counters: {
      cargo: 0,
      trackingShipment: 0,
      trackingEvent: 0,
      complianceEvidence: 0,
      deliveryException: 0,
      claimSettlement: 0,
      auditRecord: 0,
      outboxEvent: 0,
    },
  };

  const database = {
    async $transaction(callback) {
      return callback(database);
    },
    cargo: {
      async findFirst(query) {
        return findRecord(state.cargo, query);
      },
      async create({ data }) {
        const record = createCargoRecord({
          ...data,
          id: nextId(state, "cargo"),
        });

        state.cargo.push(record);

        return record;
      },
      async update({ where, data }) {
        const record = findMutableByWhere(state.cargo, where);

        Object.assign(record, data, { updatedAt: fixedNow });

        return record;
      },
    },
    trackingShipment: {
      async findFirst(query) {
        return findRecord(state.trackingShipments, query);
      },
      async create({ data }) {
        const record = {
          id: nextId(state, "trackingShipment"),
          organizationId: data.organizationId,
          referenceCode: data.referenceCode,
          externalReference: data.externalReference ?? null,
          cargoDescription: data.cargoDescription,
          originName: data.originName,
          destinationName: data.destinationName,
          transportMode: data.transportMode,
          status: data.status,
          priority: data.priority,
          plannedDepartureAt: data.plannedDepartureAt ?? null,
          estimatedArrivalAt: data.estimatedArrivalAt ?? null,
          actualArrivalAt: data.actualArrivalAt ?? null,
        };

        state.trackingShipments.push(record);

        return record;
      },
      async update({ where, data }) {
        const record = findMutableByWhere(state.trackingShipments, where);

        Object.assign(record, data);

        return record;
      },
    },
    trackingEvent: {
      async findFirst(query) {
        return findRecord(state.trackingEvents, query);
      },
      async create({ data, select }) {
        const record = {
          id: nextId(state, "trackingEvent"),
          organizationId: data.organizationId,
          shipmentId: data.shipmentId,
          eventType: data.eventType,
          occurredAt: data.occurredAt,
          locationName: data.locationName ?? null,
          notes: data.notes ?? null,
          payload: data.payload ?? {},
          sourceSystem: data.sourceSystem,
          correlationId: data.correlationId,
          idempotencyKey: data.idempotencyKey,
        };

        state.trackingEvents.push(record);

        return projectSelect(record, select);
      },
    },
    cargoComplianceEvidence: {
      async findFirst(query) {
        const evidence = findRecord(state.complianceEvidence, query);

        if (evidence === null || query?.include?.cargo !== true) {
          return evidence;
        }

        return {
          ...evidence,
          cargo: state.cargo.find((cargo) => cargo.id === evidence.cargoId) ?? null,
        };
      },
      async create({ data }) {
        const record = {
          id: nextId(state, "complianceEvidence"),
          organizationId: data.organizationId,
          cargoId: data.cargoId,
          evidenceType: data.evidenceType,
          documentReference: data.documentReference,
          documentTitle: data.documentTitle,
          documentUri: data.documentUri ?? null,
          issuerName: data.issuerName,
          issuedAt: data.issuedAt ?? null,
          expiresAt: data.expiresAt ?? null,
          status: "pending_review",
          reviewerName: null,
          reviewReference: null,
          reviewSummary: null,
          rejectionReason: null,
          reviewedAt: null,
          sourceSystem: data.sourceSystem,
          recordIdempotencyKey: data.recordIdempotencyKey,
          verifyIdempotencyKey: null,
          recordedByActorId: data.recordedByActorId,
          reviewedByActorId: null,
          recordedAt: fixedNow,
          updatedAt: fixedNow,
        };

        state.complianceEvidence.push(record);

        return record;
      },
      async update({ where, data }) {
        const record = findMutableByWhere(state.complianceEvidence, where);

        Object.assign(record, data, { updatedAt: fixedNow });

        return record;
      },
      async groupBy({ where }) {
        const counts = new Map();

        for (const record of state.complianceEvidence.filter((item) => matchesWhere(item, where))) {
          counts.set(record.status, (counts.get(record.status) ?? 0) + 1);
        }

        return Array.from(counts, ([status, count]) => ({
          status,
          _count: {
            _all: count,
          },
        }));
      },
    },
    cargoDeliveryException: {
      async findFirst(query) {
        const exception = findRecord(state.deliveryExceptions, query);

        if (exception === null || query?.include?.cargo !== true) {
          return exception;
        }

        return {
          ...exception,
          cargo: {
            ...findMutableByWhere(state.cargo, {
              id: exception.cargoId,
              organizationId: exception.organizationId,
            }),
          },
        };
      },
      async create({ data }) {
        const record = {
          id: nextId(state, "deliveryException"),
          organizationId: data.organizationId,
          cargoId: data.cargoId,
          trackingShipmentId: data.trackingShipmentId,
          exceptionType: data.exceptionType,
          deliveryConditionStatus: data.deliveryConditionStatus,
          status: "open",
          reportedByName: data.reportedByName,
          exceptionSummary: data.exceptionSummary,
          evidenceReference: data.evidenceReference,
          claimReference: data.claimReference ?? null,
          occurredAt: data.occurredAt,
          resolverName: null,
          resolutionCode: null,
          resolutionReference: null,
          resolutionSummary: null,
          resolvedAt: null,
          sourceSystem: data.sourceSystem,
          recordIdempotencyKey: data.recordIdempotencyKey,
          resolveIdempotencyKey: null,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        };

        state.deliveryExceptions.push(record);

        return record;
      },
      async update({ where, data }) {
        const record = findMutableByWhere(state.deliveryExceptions, where);

        Object.assign(record, data, { updatedAt: fixedNow });

        return record;
      },
    },
    cargoClaimSettlement: {
      async findFirst(query) {
        return findRecord(state.claimSettlements, query);
      },
      async create({ data }) {
        const record = {
          id: nextId(state, "claimSettlement"),
          organizationId: data.organizationId,
          cargoId: data.cargoId,
          deliveryExceptionId: data.deliveryExceptionId,
          claimReference: data.claimReference,
          settlementReference: data.settlementReference,
          settlementType: data.settlementType,
          settlementStatus: data.settlementStatus,
          currencyCode: data.currencyCode,
          settlementAmount: data.settlementAmount,
          settledByName: data.settledByName,
          counterpartyName: data.counterpartyName,
          settlementSummary: data.settlementSummary,
          settledAt: data.settledAt,
          sourceSystem: data.sourceSystem,
          recordIdempotencyKey: data.recordIdempotencyKey,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        };

        state.claimSettlements.push(record);

        return record;
      },
    },
    auditRecord: {
      async create({ data }) {
        const record = {
          id: nextId(state, "auditRecord"),
          ...data,
        };

        state.auditRecords.push(record);

        return record;
      },
    },
    outboxEvent: {
      async create({ data }) {
        const record = {
          id: nextId(state, "outboxEvent"),
          ...data,
        };

        state.outboxEvents.push(record);

        return record;
      },
    },
  };

  return { database, state };
}

function createCargoRecord(data) {
  return {
    id: data.id,
    organizationId: data.organizationId,
    cargoReference: data.cargoReference,
    externalReference: data.externalReference ?? null,
    cargoDescription: data.cargoDescription,
    cargoType: data.cargoType,
    status: data.status ?? "registered",
    customsStatus: data.customsStatus,
    customsReference: data.customsReference ?? null,
    conditionStatus: data.conditionStatus,
    grossWeightKg: data.grossWeightKg,
    packageCount: data.packageCount,
    volumeM3: data.volumeM3 ?? null,
    hazardous: data.hazardous,
    unNumber: data.unNumber ?? null,
    hazardClass: data.hazardClass ?? null,
    requiresInspection: data.requiresInspection,
    shipperName: data.shipperName,
    consigneeName: data.consigneeName,
    originName: data.originName,
    destinationName: data.destinationName,
    custodyOwnerName: data.custodyOwnerName,
    priority: data.priority ?? 3,
    expectedReadyAt: data.expectedReadyAt ?? null,
    sourceSystem: data.sourceSystem,
    registrationIdempotencyKey: data.registrationIdempotencyKey ?? null,
    releaseIdempotencyKey: data.releaseIdempotencyKey ?? null,
    releaseReference: data.releaseReference ?? null,
    releaseReason: data.releaseReason ?? null,
    transportPlanIdempotencyKey: data.transportPlanIdempotencyKey ?? null,
    departureIdempotencyKey: data.departureIdempotencyKey ?? null,
    arrivalIdempotencyKey: data.arrivalIdempotencyKey ?? null,
    deliveryIdempotencyKey: data.deliveryIdempotencyKey ?? null,
    transportPlanningReference: data.transportPlanningReference ?? null,
    transportOwnerTeam: data.transportOwnerTeam ?? null,
    departureReference: data.departureReference ?? null,
    departureLocationName: data.departureLocationName ?? null,
    departureOperatorName: data.departureOperatorName ?? null,
    carrierReference: data.carrierReference ?? null,
    arrivalReference: data.arrivalReference ?? null,
    arrivalLocationName: data.arrivalLocationName ?? null,
    arrivalOperatorName: data.arrivalOperatorName ?? null,
    deliveryReference: data.deliveryReference ?? null,
    receivedByName: data.receivedByName ?? null,
    deliveryNotes: data.deliveryNotes ?? null,
    trackingShipmentId: data.trackingShipmentId ?? null,
    createdAt: data.createdAt ?? fixedNow,
    releasedAt: data.releasedAt ?? null,
    transportPlannedAt: data.transportPlannedAt ?? null,
    departedAt: data.departedAt ?? null,
    arrivedAt: data.arrivedAt ?? null,
    deliveredAt: data.deliveredAt ?? null,
    updatedAt: data.updatedAt ?? fixedNow,
  };
}

function findRecord(records, query) {
  const record = records.find((item) => matchesWhere(item, query?.where ?? {})) ?? null;

  if (record === null) {
    return null;
  }

  return projectSelect(record, query?.select);
}

function findMutableByWhere(records, where) {
  const record = records.find((item) => matchesWhere(item, where));

  assert.ok(record, `Expected record matching ${JSON.stringify(where)}`);

  return record;
}

function matchesWhere(record, where) {
  return Object.entries(where).every(([key, value]) => record[key] === value);
}

function projectSelect(record, select) {
  if (select === undefined) {
    return { ...record };
  }

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => [key, record[key]]),
  );
}

function nextId(state, entityName) {
  state.counters[entityName] += 1;

  return `${entityName}_${String(state.counters[entityName]).padStart(3, "0")}`;
}

async function assertRejectsWithMessage(action, expectedMessage) {
  let rejectedError = null;

  try {
    await action();
  } catch (error) {
    rejectedError = error;
  }

  assert.ok(rejectedError, `Expected rejection with ${expectedMessage}`);

  const response =
    typeof rejectedError.getResponse === "function" ? rejectedError.getResponse() : undefined;
  const message =
    typeof response === "object" && response !== null ? response.message : rejectedError.message;

  assert.equal(message, expectedMessage);
}
