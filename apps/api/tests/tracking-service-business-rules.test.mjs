import assert from "node:assert/strict";
import { test } from "node:test";
import { TrackingService } from "../dist/tracking/tracking.service.js";
import { assertRejectsWithMessage } from "./test-utils.mjs";

const fixedNow = new Date("2026-06-04T00:00:00.000Z");

test("tracking service enforces shipment status transitions through the lifecycle", async () => {
  const { database, state } = createTrackingDatabase();
  const service = createTrackingService(database);
  const actor = createActorContext("status_lifecycle");
  seedShipment(state, {
    id: "shipment_lifecycle_001",
    referenceCode: "TRK-2026-LIFECYCLE",
    status: "planned",
    transportMode: "rail",
  });

  const departed = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_lifecycle_001",
    eventType: "departed",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    locationName: "Rail Yard A",
    idempotencyKey: "idem_tracking_lifecycle_departed",
  });

  assert.equal(departed.shipment.currentStatus, "in_transit");
  assert.equal(departed.event.eventType, "departed");
  assert.equal(departed.idempotency.replayed, false);

  const arrived = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_lifecycle_001",
    eventType: "arrived",
    occurredAt: new Date(fixedNow.getTime() + 86_400_000).toISOString(),
    locationName: "Port Terminal B",
    idempotencyKey: "idem_tracking_lifecycle_arrived",
  });

  assert.equal(arrived.shipment.currentStatus, "arrived");
  assert.equal(arrived.event.eventType, "arrived");

  assert.deepEqual(
    state.outboxEvents.map((event) => event.eventType),
    ["tracking.event.recorded", "tracking.event.recorded"],
  );
  assert.deepEqual(
    state.auditRecords.map((record) => record.action),
    ["tracking.event.recorded", "tracking.event.recorded"],
  );
});

test("tracking service blocks status changes for terminal shipment statuses", async () => {
  const { database, state } = createTrackingDatabase();
  const service = createTrackingService(database);
  const actor = createActorContext("terminal_block");
  seedShipment(state, {
    id: "shipment_terminal_001",
    referenceCode: "TRK-2026-TERMINAL",
    status: "completed",
    transportMode: "rail",
  });
  seedShipment(state, {
    id: "shipment_cancelled_001",
    referenceCode: "TRK-2026-CANCELLED",
    status: "cancelled",
    transportMode: "rail",
  });

  const completedResult = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_terminal_001",
    eventType: "departed",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    locationName: "Rail Yard A",
    idempotencyKey: "idem_tracking_terminal_depart",
  });

  assert.equal(completedResult.shipment.currentStatus, "completed");

  const cancelledResult = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_cancelled_001",
    eventType: "arrived",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    locationName: "Port Terminal B",
    idempotencyKey: "idem_tracking_cancelled_arrive",
  });

  assert.equal(cancelledResult.shipment.currentStatus, "cancelled");
});

test("tracking service records delayed and customs_hold exceptions via recordEvent", async () => {
  const { database, state } = createTrackingDatabase();
  const service = createTrackingService(database);
  const actor = createActorContext("event_exceptions");
  seedShipment(state, {
    id: "shipment_exc_001",
    referenceCode: "TRK-2026-EXC",
    status: "in_transit",
    transportMode: "rail",
  });

  const delayed = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_exc_001",
    eventType: "delayed",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    locationName: "Rail Yard A",
    notes: "Weather delay",
    idempotencyKey: "idem_tracking_delayed_001",
  });

  assert.equal(delayed.shipment.currentStatus, "delayed");

  const customsHold = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_exc_001",
    eventType: "customs_hold",
    occurredAt: new Date(fixedNow.getTime() + 7_200_000).toISOString(),
    locationName: "Port Terminal B",
    notes: "Customs inspection required",
    idempotencyKey: "idem_tracking_customs_001",
  });

  assert.equal(customsHold.shipment.currentStatus, "exception");
});

test("tracking service manages exceptions with full workflow state and resolves them", async () => {
  const { database, state } = createTrackingDatabase();
  const service = createTrackingService(database);
  const actor = createActorContext("exception_workflow");
  seedShipment(state, {
    id: "shipment_exception_workflow_001",
    referenceCode: "TRK-2026-EX-WF",
    status: "in_transit",
    transportMode: "rail",
  });

  const managed = await service.manageException({
    ...actor,
    shipmentId: "shipment_exception_workflow_001",
    category: "damage",
    severity: "high",
    summary: "Container damaged during loading",
    recoveryPlan: "Inspect and document damage, initiate claim",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    idempotencyKey: "idem_tracking_manage_exception_001",
    evidence: {
      operatorName: "Terminal Inspector",
      evidenceType: "photo",
      evidenceReference: "PHOTO-DMG-001",
      evidenceSummary: "Photo of damaged container corner",
      approvalStatus: "approved",
      approvalReference: "APP-DMG-001",
      approverName: "Claims Manager",
    },
    ownerTeam: "Claims Desk",
    expectedResolutionAt: new Date(fixedNow.getTime() + 259_200_000).toISOString(),
    locationName: "Port Terminal B",
  });

  assert.equal(managed.exception.category, "damage");
  assert.equal(managed.exception.severity, "high");
  assert.equal(managed.shipment.previousStatus, "in_transit");
  assert.equal(managed.shipment.currentStatus, "exception");
  assert.equal(managed.event.eventType, "exception");
  assert.equal(managed.workflow.state, "approved_for_resolution");
  assert.equal(managed.workflow.terminal, false);
  assert.equal(managed.idempotency.replayed, false);

  const resolved = await service.resolveException({
    ...actor,
    shipmentId: "shipment_exception_workflow_001",
    resolutionCode: "cargo_recovered",
    summary: "Container repaired and cargo recovered",
    occurredAt: new Date(fixedNow.getTime() + 86_400_000).toISOString(),
    idempotencyKey: "idem_tracking_resolve_exception_001",
    nextStatus: "in_transit",
    evidence: {
      operatorName: "QA Supervisor",
      evidenceType: "inspection",
      evidenceReference: "INSP-RPR-001",
      evidenceSummary: "Container repair inspection passed",
      approvalStatus: "approved",
      approvalReference: "APP-RPR-001",
      approverName: "Claims Manager",
    },
    ownerTeam: "Claims Desk",
    locationName: "Port Terminal B",
  });

  assert.equal(resolved.resolution.resolutionCode, "cargo_recovered");
  assert.equal(resolved.shipment.previousStatus, "exception");
  assert.equal(resolved.shipment.currentStatus, "in_transit");
  assert.equal(resolved.event.eventType, "released");
  assert.equal(resolved.workflow.state, "closed");
  assert.equal(resolved.workflow.terminal, true);
  assert.equal(resolved.idempotency.replayed, false);

  await assertRejectsWithMessage(
    () =>
      service.resolveException({
        ...actor,
        shipmentId: "shipment_exception_workflow_001",
        resolutionCode: "cargo_recovered",
        summary: "Already resolved exception must be blocked",
        occurredAt: new Date(fixedNow.getTime() + 172_800_000).toISOString(),
        idempotencyKey: "idem_tracking_resolve_exception_002",
        nextStatus: "arrived",
        evidence: {
          operatorName: "QA Supervisor",
          evidenceType: "inspection",
          evidenceReference: "INSP-RES-002",
          evidenceSummary: "Resolution attempt after resolved",
          approvalStatus: "approved",
          approvalReference: "APP-RES-002",
          approverName: "Claims Manager",
        },
        ownerTeam: "Claims Desk",
        locationName: "Port Terminal B",
      }),
    "tracking.exception_not_active",
  );

  assert.ok(state.outboxEvents.some((event) => event.eventType === "tracking.exception.managed"));
  assert.ok(state.outboxEvents.some((event) => event.eventType === "tracking.exception.resolved"));
});

test("tracking service replays duplicate event submissions and returns replayed result", async () => {
  const { database, state } = createTrackingDatabase();
  const service = createTrackingService(database);
  const actor = createActorContext("idempotency");
  seedShipment(state, {
    id: "shipment_idempotency_001",
    referenceCode: "TRK-2026-IDEM",
    status: "planned",
    transportMode: "rail",
  });

  const original = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_idempotency_001",
    eventType: "departed",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    locationName: "Rail Yard A",
    idempotencyKey: "idem_tracking_replay_depart",
  });

  assert.equal(original.idempotency.replayed, false);
  assert.equal(original.shipment.currentStatus, "in_transit");

  const replayed = await service.recordEvent({
    ...actor,
    shipmentId: "shipment_idempotency_001",
    eventType: "departed",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    locationName: "Rail Yard A",
    idempotencyKey: "idem_tracking_replay_depart",
  });

  assert.equal(replayed.idempotency.replayed, true);
  assert.equal(replayed.shipment.currentStatus, "in_transit");
  assert.equal(replayed.event.id, original.event.id);
});

test("tracking service replays duplicate manageException submissions", async () => {
  const { database } = createTrackingDatabase();
  const service = createTrackingService(database);
  const actor = createActorContext("idempotency_exception");
  seedShipment(database._state, {
    id: "shipment_idem_exc_001",
    referenceCode: "TRK-2026-IDEM-EXC",
    status: "in_transit",
    transportMode: "rail",
  });

  const original = await service.manageException({
    ...actor,
    shipmentId: "shipment_idem_exc_001",
    category: "delay",
    severity: "medium",
    summary: "Operational delay",
    recoveryPlan: "Reschedule departure",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    idempotencyKey: "idem_tracking_manage_replay_001",
    evidence: {
      operatorName: "Rail Controller",
      evidenceType: "operator_note",
      evidenceReference: "NOTE-DLY-001",
      evidenceSummary: "Delay confirmed by operations",
      approvalStatus: "pending_review",
      approvalReference: null,
      approverName: null,
    },
    locationName: "Rail Yard A",
  });

  assert.equal(original.idempotency.replayed, false);
  assert.equal(original.shipment.currentStatus, "delayed");

  const replayed = await service.manageException({
    ...actor,
    shipmentId: "shipment_idem_exc_001",
    category: "delay",
    severity: "medium",
    summary: "Operational delay",
    recoveryPlan: "Reschedule departure",
    occurredAt: new Date(fixedNow.getTime() + 3_600_000).toISOString(),
    idempotencyKey: "idem_tracking_manage_replay_001",
    evidence: {
      operatorName: "Rail Controller",
      evidenceType: "operator_note",
      evidenceReference: "NOTE-DLY-001",
      evidenceSummary: "Delay confirmed by operations",
      approvalStatus: "pending_review",
      approvalReference: null,
      approverName: null,
    },
    locationName: "Rail Yard A",
  });

  assert.equal(replayed.idempotency.replayed, true);
  assert.equal(replayed.shipment.currentStatus, "delayed");
});

function createTrackingService(database) {
  const service = Object.create(TrackingService.prototype);

  service.trackingRepo = createMockTrackingRepository(database);
  service.eventBus = {
    async publish(tx, event) {
      await tx.outboxEvent.create({
        data: {
          organizationId: event.organizationId,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
        },
      });
    },
  };
  service.usageService = {
    async trackUsage() {},
  };
  service.databaseTransaction = async (fn) => fn(database);

  return service;
}

function createMockTrackingRepository(database) {
  return {
    async findEventByIdempotencyKey(organizationId, idempotencyKey) {
      return database.trackingEvent.findFirst({
        where: { organizationId, idempotencyKey },
        include: {
          shipment: {
            select: { id: true, referenceCode: true, status: true },
          },
        },
      });
    },
    async findShipmentById(organizationId, id) {
      return database.trackingShipment.findFirst({
        where: { id, organizationId },
        select: { id: true, referenceCode: true, status: true, transportMode: true },
      });
    },
    async createEvent(tx, data) {
      const event = await tx.trackingEvent.create({
        data,
        include: {
          shipment: {
            select: { id: true, referenceCode: true, status: true },
          },
        },
      });
      return event;
    },
    async updateShipmentStatus(tx, id, data) {
      return tx.trackingShipment.update({
        where: { id },
        data,
        select: { id: true, referenceCode: true, status: true },
      });
    },
  };
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

function seedShipment(state, overrides = {}) {
  const record = {
    id: overrides.id,
    organizationId: overrides.organizationId ?? "org_port_rail",
    referenceCode: overrides.referenceCode,
    externalReference: overrides.externalReference ?? null,
    cargoDescription: overrides.cargoDescription ?? "Containerized cargo",
    originName: overrides.originName ?? "Rail Yard A",
    destinationName: overrides.destinationName ?? "Port Terminal B",
    transportMode: overrides.transportMode,
    status: overrides.status,
    priority: overrides.priority ?? 3,
    plannedDepartureAt: overrides.plannedDepartureAt ?? null,
    estimatedArrivalAt: overrides.estimatedArrivalAt ?? null,
    actualArrivalAt: overrides.actualArrivalAt ?? null,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };

  state.trackingShipments.push(record);

  return record;
}

function createTrackingDatabase() {
  const state = {
    trackingShipments: [],
    trackingEvents: [],
    auditRecords: [],
    outboxEvents: [],
    counters: {
      trackingEvent: 0,
      auditRecord: 0,
      outboxEvent: 0,
    },
  };

  const database = {
    _state: state,
    async $transaction(callback) {
      return callback(database);
    },
    trackingShipment: {
      async findFirst(query) {
        const include = query?.include;
        let record = findRecord(state.trackingShipments, query);

        if (record === null) {
          return null;
        }

        if (include?.events !== undefined) {
          record = {
            ...record,
            _count: { events: 0 },
            events: [],
          };
        }

        return record;
      },
      async update({ where, data, select }) {
        const record = findMutableByWhere(state.trackingShipments, where);

        Object.assign(record, data, { updatedAt: fixedNow });

        return projectSelect(record, select);
      },
    },
    trackingEvent: {
      async findFirst(query) {
        const include = query?.include;
        const record = findRecord(state.trackingEvents, query);

        if (record === null) {
          return null;
        }

        if (include?.shipment !== undefined) {
          const shipment = findMutableByWhere(state.trackingShipments, {
            id: record.shipmentId,
            organizationId: record.organizationId,
          });

          return {
            ...record,
            shipment: projectSelect(shipment, include.shipment.select),
          };
        }

        return record;
      },
      async create({ data, include }) {
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

        const result = { ...record };

        if (include?.shipment !== undefined) {
          const shipment = findMutableByWhere(state.trackingShipments, {
            id: data.shipmentId,
            organizationId: data.organizationId,
          });

          result.shipment = projectSelect(shipment, include.shipment.select);
        }

        return result;
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
