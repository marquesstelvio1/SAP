import assert from "node:assert/strict";
import { test } from "node:test";

import { CapacityService } from "../dist/capacity/capacity.service.js";

const fixedNow = new Date("2026-06-04T00:00:00.000Z");

test("capacity service enforces tenant resource uniqueness and valid slot windows", async () => {
  const { database } = createCapacityDatabase();
  const service = createCapacityService(database);
  const actor = createActorContext("capacity_resource_slot");

  const resource = await service.registerResource({
    ...actor,
    resourceCode: " gate-a ",
    resourceName: "Main Gate A",
    resourceType: "gate",
    locationName: "Port Terminal B",
    maxConcurrentBookings: 3,
    idempotencyKey: "idem_capacity_resource_001",
  });

  assert.equal(resource.resource.resourceCode, "GATE-A");
  assert.equal(resource.businessRules.resourceAccepted, true);

  await assertRejectsWithMessage(
    () =>
      service.registerResource({
        ...actor,
        resourceCode: "GATE-A",
        resourceName: "Duplicate Gate A",
        resourceType: "gate",
        locationName: "Port Terminal B",
        maxConcurrentBookings: 3,
        idempotencyKey: "idem_capacity_resource_002",
      }),
    "capacity.resource_register_blocked",
  );

  const window = createFutureWindow();

  await assertRejectsWithMessage(
    () =>
      service.openSlot({
        ...actor,
        resourceId: resource.resourceId,
        slotReference: "SLOT-INVALID-WINDOW",
        windowStartAt: window.windowEndAt,
        windowEndAt: window.windowStartAt,
        capacityUnits: 1,
        idempotencyKey: "idem_capacity_slot_invalid_window",
      }),
    "capacity.slot_open_blocked",
  );

  await assertRejectsWithMessage(
    () =>
      service.openSlot({
        ...actor,
        resourceId: resource.resourceId,
        slotReference: "SLOT-OVER-LIMIT",
        windowStartAt: window.windowStartAt,
        windowEndAt: window.windowEndAt,
        capacityUnits: 4,
        idempotencyKey: "idem_capacity_slot_over_limit",
      }),
    "capacity.slot_open_blocked",
  );

  const slotInput = {
    ...actor,
    resourceId: resource.resourceId,
    slotReference: " slot-2026-gate-a ",
    windowStartAt: window.windowStartAt,
    windowEndAt: window.windowEndAt,
    capacityUnits: 3,
    idempotencyKey: "idem_capacity_slot_open_001",
  };
  const slot = await service.openSlot(slotInput);
  const replayedSlot = await service.openSlot(slotInput);

  assert.equal(slot.slot.slotReference, "SLOT-2026-GATE-A");
  assert.equal(slot.slot.availableUnits, 3);
  assert.equal(slot.businessRules.slotOpened, true);
  assert.equal(replayedSlot.idempotency.replayed, true);
});

test("capacity service blocks ineligible and overbooked reservations then releases units on cancel", async () => {
  const { database, state } = createCapacityDatabase();
  const service = createCapacityService(database);
  const actor = createActorContext("capacity_reservation");
  const readyCargo = seedCargo(state, {
    id: "cargo_ready_001",
    cargoReference: "CGO-READY-001",
    status: "ready_for_transport",
  });
  const ineligibleCargo = seedCargo(state, {
    id: "cargo_registered_001",
    cargoReference: "CGO-REGISTERED-001",
    status: "registered",
  });
  const secondReadyCargo = seedCargo(state, {
    id: "cargo_ready_002",
    cargoReference: "CGO-READY-002",
    status: "ready_for_transport",
  });
  const resource = await service.registerResource({
    ...actor,
    resourceCode: "TRACK-7",
    resourceName: "Rail Track 7",
    resourceType: "rail_track",
    locationName: "Rail Yard A",
    maxConcurrentBookings: 3,
    idempotencyKey: "idem_capacity_resource_reserve",
  });
  const window = createFutureWindow();
  const slot = await service.openSlot({
    ...actor,
    resourceId: resource.resourceId,
    slotReference: "SLOT-TRACK-7-AM",
    windowStartAt: window.windowStartAt,
    windowEndAt: window.windowEndAt,
    capacityUnits: 3,
    idempotencyKey: "idem_capacity_slot_reserve",
  });

  await assertRejectsWithMessage(
    () =>
      service.reserveSlot({
        ...actor,
        cargoId: ineligibleCargo.id,
        slotId: slot.slotId,
        reservationReference: "RES-INELIGIBLE",
        reservationPurpose: "departure",
        reservedUnits: 1,
        reservedByName: "Rail Planner",
        reservedAt: window.reservedAt,
        idempotencyKey: "idem_capacity_reserve_ineligible",
      }),
    "capacity.slot_reserve_blocked",
  );

  const reservationInput = {
    ...actor,
    cargoId: readyCargo.id,
    slotId: slot.slotId,
    reservationReference: " res-track-7-ready ",
    reservationPurpose: "departure",
    reservedUnits: 2,
    reservedByName: "Rail Planner",
    reservedAt: window.reservedAt,
    idempotencyKey: "idem_capacity_reserve_ready_001",
  };
  const reservation = await service.reserveSlot(reservationInput);
  const replayedReservation = await service.reserveSlot(reservationInput);

  assert.equal(reservation.reservation.reservationReference, "RES-TRACK-7-READY");
  assert.equal(reservation.slot.reservedUnits, 2);
  assert.equal(reservation.slot.availableUnits, 1);
  assert.equal(reservation.businessRules.reservationAllowed, true);
  assert.equal(replayedReservation.idempotency.replayed, true);

  await assertRejectsWithMessage(
    () =>
      service.reserveSlot({
        ...reservationInput,
        reservationReference: "RES-DUPLICATE-CARGO-SLOT",
        reservedUnits: 1,
        idempotencyKey: "idem_capacity_reserve_duplicate_cargo_slot",
      }),
    "capacity.slot_reserve_blocked",
  );

  await assertRejectsWithMessage(
    () =>
      service.reserveSlot({
        ...actor,
        cargoId: secondReadyCargo.id,
        slotId: slot.slotId,
        reservationReference: "RES-OVERBOOKED",
        reservationPurpose: "departure",
        reservedUnits: 2,
        reservedByName: "Rail Planner",
        reservedAt: window.reservedAt,
        idempotencyKey: "idem_capacity_reserve_overbooked",
      }),
    "capacity.slot_reserve_blocked",
  );

  await assertRejectsWithMessage(
    () =>
      service.cancelSlotReservation({
        ...actor,
        reservationId: reservation.reservationId,
        cancellationReference: "CXL-BEFORE-RESERVED",
        cancelledByName: "Rail Planner",
        cancellationReason: "Invalid early cancellation",
        cancelledAt: new Date(new Date(window.reservedAt).getTime() - 60_000).toISOString(),
        idempotencyKey: "idem_capacity_cancel_before_reserved",
      }),
    "capacity.slot_cancel_blocked",
  );

  const cancelled = await service.cancelSlotReservation({
    ...actor,
    reservationId: reservation.reservationId,
    cancellationReference: " cxl-track-7-ready ",
    cancelledByName: "Rail Planner",
    cancellationReason: "Operational plan changed",
    cancelledAt: window.cancelledAt,
    idempotencyKey: "idem_capacity_cancel_ready_001",
  });

  assert.equal(cancelled.reservation.status, "cancelled");
  assert.equal(cancelled.reservation.cancellationReference, "CXL-TRACK-7-READY");
  assert.equal(cancelled.slot.reservedUnits, 0);
  assert.equal(cancelled.slot.availableUnits, 3);
  assert.equal(cancelled.businessRules.cancellationAllowed, true);

  const restoredReservation = await service.reserveSlot({
    ...actor,
    cargoId: secondReadyCargo.id,
    slotId: slot.slotId,
    reservationReference: "RES-RESTORED-CAPACITY",
    reservationPurpose: "departure",
    reservedUnits: 2,
    reservedByName: "Rail Planner",
    reservedAt: window.reservedAt,
    idempotencyKey: "idem_capacity_reserve_restored",
  });

  assert.equal(restoredReservation.slot.reservedUnits, 2);
  assert.deepEqual(
    state.outboxEvents.map((event) => event.eventType),
    [
      "capacity.resource.registered",
      "capacity.slot.opened",
      "capacity.slot.reserved",
      "capacity.slot_reservation.cancelled",
      "capacity.slot.reserved",
    ],
  );
});

function createCapacityService(database) {
  const service = Object.create(CapacityService.prototype);

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

function createFutureWindow() {
  const windowStartAt = new Date(Date.now() + 86_400_000);
  const windowEndAt = new Date(Date.now() + 172_800_000);
  const reservedAt = new Date(windowStartAt.getTime() + 3_600_000);
  const cancelledAt = new Date(reservedAt.getTime() + 3_600_000);

  return {
    windowStartAt: windowStartAt.toISOString(),
    windowEndAt: windowEndAt.toISOString(),
    reservedAt: reservedAt.toISOString(),
    cancelledAt: cancelledAt.toISOString(),
  };
}

function createCapacityDatabase() {
  const state = {
    resources: [],
    slots: [],
    reservations: [],
    cargo: [],
    auditRecords: [],
    outboxEvents: [],
    counters: {
      resource: 0,
      slot: 0,
      reservation: 0,
      auditRecord: 0,
      outboxEvent: 0,
    },
  };

  const database = {
    async $transaction(callback) {
      return callback(database);
    },
    capacityResource: {
      async findFirst(query) {
        return findRecord(state.resources, query);
      },
      async create({ data }) {
        const record = {
          id: nextId(state, "resource"),
          organizationId: data.organizationId,
          resourceCode: data.resourceCode,
          resourceName: data.resourceName,
          resourceType: data.resourceType,
          locationName: data.locationName,
          maxConcurrentBookings: data.maxConcurrentBookings,
          sourceSystem: data.sourceSystem,
          recordIdempotencyKey: data.recordIdempotencyKey,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        };

        state.resources.push(record);

        return { ...record };
      },
    },
    capacitySlot: {
      async findFirst(query) {
        const slot = findRecord(state.slots, query);

        if (slot === null || query?.include?.resource !== true) {
          return slot;
        }

        return includeSlotResource(state, slot);
      },
      async create({ data, include }) {
        const record = {
          id: nextId(state, "slot"),
          organizationId: data.organizationId,
          resourceId: data.resourceId,
          slotReference: data.slotReference,
          windowStartAt: data.windowStartAt,
          windowEndAt: data.windowEndAt,
          capacityUnits: data.capacityUnits,
          reservedUnits: data.reservedUnits,
          status: data.status,
          sourceSystem: data.sourceSystem,
          recordIdempotencyKey: data.recordIdempotencyKey,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        };

        state.slots.push(record);

        return include?.resource === true ? includeSlotResource(state, record) : { ...record };
      },
      async update({ where, data }) {
        const slot = findMutableByWhere(state.slots, where);

        applyMutation(slot, data);

        return { ...slot };
      },
      async updateMany({ where, data }) {
        const slot = state.slots.find((item) => matchesWhere(item, where));

        if (slot === undefined) {
          return { count: 0 };
        }

        applyMutation(slot, data);

        return { count: 1 };
      },
    },
    capacitySlotReservation: {
      async findFirst(query) {
        const reservation = findRecord(state.reservations, query);

        if (reservation === null || query?.include === undefined) {
          return reservation;
        }

        return includeReservationRelations(state, reservation);
      },
      async findFirstOrThrow(query) {
        const reservation = await database.capacitySlotReservation.findFirst(query);

        assert.ok(reservation, `Expected reservation matching ${JSON.stringify(query.where)}`);

        return reservation;
      },
      async create({ data, include }) {
        const record = {
          id: nextId(state, "reservation"),
          organizationId: data.organizationId,
          cargoId: data.cargoId,
          slotId: data.slotId,
          reservationReference: data.reservationReference,
          reservationPurpose: data.reservationPurpose,
          status: data.status,
          reservedUnits: data.reservedUnits,
          reservedByName: data.reservedByName,
          reservedAt: data.reservedAt,
          cancellationReference: null,
          cancelledByName: null,
          cancellationReason: null,
          cancelledAt: null,
          sourceSystem: data.sourceSystem,
          reserveIdempotencyKey: data.reserveIdempotencyKey,
          cancelIdempotencyKey: null,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        };

        state.reservations.push(record);

        return include === undefined ? { ...record } : includeReservationRelations(state, record);
      },
      async updateMany({ where, data }) {
        const reservation = state.reservations.find((item) => matchesWhere(item, where));

        if (reservation === undefined) {
          return { count: 0 };
        }

        applyMutation(reservation, data);

        return { count: 1 };
      },
    },
    cargo: {
      async findFirst(query) {
        return findRecord(state.cargo, query);
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

function seedCargo(state, overrides = {}) {
  const record = {
    id: overrides.id ?? `cargo_${state.cargo.length + 1}`,
    organizationId: overrides.organizationId ?? "org_port_rail",
    cargoReference: overrides.cargoReference ?? "CGO-2026-0001",
    cargoDescription: overrides.cargoDescription ?? "Containerized cargo",
    status: overrides.status ?? "ready_for_transport",
    custodyOwnerName: overrides.custodyOwnerName ?? "Operations Desk",
  };

  state.cargo.push(record);

  return record;
}

function includeSlotResource(state, slot) {
  return {
    ...slot,
    resource: {
      ...findMutableByWhere(state.resources, {
        id: slot.resourceId,
        organizationId: slot.organizationId,
      }),
    },
  };
}

function includeReservationRelations(state, reservation) {
  return {
    ...reservation,
    cargo: {
      ...findMutableByWhere(state.cargo, {
        id: reservation.cargoId,
        organizationId: reservation.organizationId,
      }),
    },
    slot: includeSlotResource(
      state,
      findMutableByWhere(state.slots, {
        id: reservation.slotId,
        organizationId: reservation.organizationId,
      }),
    ),
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
  return Object.entries(where).every(([key, value]) => {
    if (typeof value === "object" && value !== null && "lte" in value) {
      return record[key] <= value.lte;
    }

    return record[key] === value;
  });
}

function applyMutation(record, data) {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null && "increment" in value) {
      record[key] += value.increment;
      continue;
    }

    if (typeof value === "object" && value !== null && "decrement" in value) {
      record[key] -= value.decrement;
      continue;
    }

    record[key] = value;
  }

  record.updatedAt = fixedNow;
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
