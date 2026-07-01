import assert from "node:assert/strict";
import { test } from "node:test";

import { AuditService } from "../dist/audit/audit.service.js";
import { NotificationsService } from "../dist/notifications/notifications.service.js";
import { ReportsService } from "../dist/reports/reports.service.js";

const fixedNow = new Date("2026-06-04T12:00:00.000Z");

test("evidence services export operational reports and governed audit records", async () => {
  const { database, state } = createEvidenceDatabase();
  seedOperationalEvidence(state);
  const reportsRepository = createReportsRepository(database);
  const reportsService = new ReportsService(reportsRepository, database);
  const auditRepository = createAuditRepository(database);
  const auditService = new AuditService(auditRepository, database);
  const actor = createActorContext("evidence_exports");

  for (const domain of ["cargo", "tracking", "capacity", "planning", "tariff"]) {
    const report = await reportsService.exportOperationalReport({
      ...actor,
      domain,
      format: "csv",
      limit: 10,
      generatedAt: fixedNow,
    });

    assert.equal(report.organizationId, actor.organizationId);
    assert.equal(report.domain, domain);
    assert.equal(report.format, "csv");
    assert.ok(report.rowCount > 0, `Expected rows for ${domain}`);
    assert.ok(report.content.includes("section,primaryId,reference"));
    assert.equal(report.audit.action, "report.exported");
    assert.equal(report.outbox.eventType, "report.exported");
  }

  const search = await auditService.searchRecords({
    organizationId: actor.organizationId,
    action: "cargo",
    severity: "high",
    limit: 10,
    generatedAt: fixedNow,
  });

  assert.equal(search.totals.records, 1);
  assert.equal(search.totals.high, 1);
  assert.equal(search.records[0]?.action, "cargo.delivery_exception.recorded");

  const exportedAudit = await auditService.exportRecords({
    organizationId: actor.organizationId,
    actorType: actor.actorType,
    actorId: actor.actorId,
    requestCorrelationId: actor.correlationId,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
    action: "cargo",
    format: "csv",
    limit: 10,
    generatedAt: fixedNow,
  });

  assert.equal(exportedAudit.audit.action, "audit.records.exported");
  assert.equal(exportedAudit.outbox.eventType, "audit.records.exported");
  assert.ok(exportedAudit.content.includes("cargo.delivery_exception.recorded"));
  assert.equal(
    state.outboxEvents.filter((event) => event.eventType === "report.exported").length,
    5,
  );
  assert.equal(
    state.outboxEvents.filter((event) => event.eventType === "audit.records.exported").length,
    1,
  );
});

test("notifications service reads inbox and acknowledges notifications with audit", async () => {
  const { database, state } = createEvidenceDatabase();
  const notificationsRepository = createNotificationsRepository(database);
  const service = new NotificationsService(notificationsRepository, database);
  const actor = createActorContext("notifications");
  seedNotification(state, {
    id: "notification_critical_001",
    eventType: "cargo.delivery_exception.recorded",
    severity: "critical",
    status: "unread",
    title: "Cargo exception recorded",
  });
  seedNotification(state, {
    id: "notification_read_001",
    eventType: "capacity.slot.reserved",
    severity: "medium",
    status: "read",
    title: "Capacity reserved",
    readAt: new Date("2026-06-04T11:00:00.000Z"),
  });

  const inbox = await service.readInbox({
    organizationId: actor.organizationId,
    status: "unread",
    limit: 10,
    generatedAt: fixedNow,
  });

  assert.equal(inbox.totals.notifications, 2);
  assert.equal(inbox.totals.unread, 1);
  assert.equal(inbox.totals.read, 1);
  assert.equal(inbox.notifications.length, 1);
  assert.equal(inbox.notifications[0]?.id, "notification_critical_001");

  const marked = await service.markRead({
    ...actor,
    notificationId: "notification_critical_001",
    readAt: fixedNow,
  });

  assert.equal(marked.notification.status, "read");
  assert.equal(marked.notification.readAt, fixedNow.toISOString());
  assert.equal(marked.audit.action, "notification.marked_read");
  assert.equal(state.auditRecords.at(-1)?.action, "notification.marked_read");
});

function createActorContext(correlationSuffix) {
  return {
    organizationId: "org_port_rail",
    actorType: "user",
    actorId: "user_ops",
    correlationId: `corr_${correlationSuffix}`,
    ipAddress: "127.0.0.1",
    userAgent: "node-test",
  };
}

function createEvidenceDatabase() {
  const state = {
    cargo: [],
    trackingShipments: [],
    capacitySlots: [],
    capacityReservations: [],
    tariffRateCards: [],
    tariffQuotes: [],
    transportOrders: [],
    auditRecords: [],
    outboxEvents: [],
    notifications: [],
    counters: {
      auditRecord: 0,
      outboxEvent: 0,
    },
  };

  const database = {
    async $transaction(input) {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return input(database);
    },
    trackingShipment: {
      async findMany(query) {
        return takeRecords(state.trackingShipments, query).map((shipment) => ({
          ...shipment,
          events: shipment.events.slice(0, 1),
        }));
      },
    },
    cargo: {
      async findMany(query) {
        return takeRecords(state.cargo, query);
      },
    },
    capacitySlot: {
      async findMany(query) {
        return takeRecords(state.capacitySlots, query).map((slot) => ({ ...slot }));
      },
    },
    capacitySlotReservation: {
      async findMany(query) {
        return takeRecords(state.capacityReservations, query).map((reservation) => ({
          ...reservation,
        }));
      },
    },
    tariffRateCard: {
      async findMany(query) {
        return takeRecords(state.tariffRateCards, query);
      },
    },
    tariffQuote: {
      async findMany(query) {
        return takeRecords(state.tariffQuotes, query);
      },
    },
    transportOrder: {
      async findMany(query) {
        return takeRecords(state.transportOrders, query);
      },
    },
    auditRecord: {
      async findMany(query) {
        return takeRecords(state.auditRecords, query);
      },
      async count(query) {
        return state.auditRecords.filter((record) => matchesWhere(record, query?.where ?? {}))
          .length;
      },
      async create({ data }) {
        const record = createAuditRecord(state, data);

        state.auditRecords.push(record);

        return record;
      },
    },
    outboxEvent: {
      async create({ data }) {
        const record = {
          id: nextId(state, "outboxEvent"),
          ...data,
          status: "pending",
          createdAt: fixedNow,
          updatedAt: fixedNow,
        };

        state.outboxEvents.push(record);

        return record;
      },
    },
    notification: {
      async findMany(query) {
        return takeRecords(state.notifications, query);
      },
      async count(query) {
        return state.notifications.filter((notification) =>
          matchesWhere(notification, query?.where ?? {}),
        ).length;
      },
      async findFirst(query) {
        return (
          state.notifications.find((notification) =>
            matchesWhere(notification, query?.where ?? {}),
          ) ?? null
        );
      },
      async update({ where, data }) {
        const notification = state.notifications.find((item) => matchesWhere(item, where));

        assert.ok(notification, `Expected notification matching ${JSON.stringify(where)}`);
        Object.assign(notification, data, { updatedAt: fixedNow });

        return notification;
      },
    },
  };

  return { database, state };
}

function seedOperationalEvidence(state) {
  const organizationId = "org_port_rail";

  state.cargo.push({
    id: "cargo_001",
    organizationId,
    cargoReference: "CGO-2026-0001",
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
    expectedReadyAt: fixedNow,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  state.trackingShipments.push({
    id: "shipment_001",
    organizationId,
    referenceCode: "TRK-2026-0001",
    cargoDescription: "Fuel drums",
    originName: "Rail Yard A",
    destinationName: "Port Terminal B",
    transportMode: "rail",
    status: "exception",
    priority: 3,
    createdAt: fixedNow,
    updatedAt: fixedNow,
    events: [
      {
        eventType: "exception",
        locationName: "Port Terminal B",
        occurredAt: fixedNow,
        createdAt: fixedNow,
      },
    ],
  });
  const resource = {
    id: "resource_001",
    resourceCode: "TRACK-7",
    resourceName: "Rail Track 7",
    resourceType: "rail_track",
    locationName: "Rail Yard A",
  };
  const slot = {
    id: "slot_001",
    organizationId,
    resourceId: resource.id,
    slotReference: "SLOT-TRACK-7-AM",
    windowStartAt: fixedNow,
    windowEndAt: new Date(fixedNow.getTime() + 3_600_000),
    capacityUnits: 3,
    reservedUnits: 2,
    status: "open",
    resource,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };
  state.capacitySlots.push(slot);
  state.capacityReservations.push({
    id: "reservation_001",
    organizationId,
    cargoId: "cargo_001",
    slotId: slot.id,
    reservationReference: "RES-TRACK-7-READY",
    reservationPurpose: "departure",
    status: "reserved",
    reservedUnits: 2,
    reservedByName: "Rail Planner",
    reservedAt: fixedNow,
    cancellationReference: null,
    cargo: {
      cargoReference: "CGO-2026-0001",
      cargoDescription: "Fuel drums",
    },
    slot,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  const rateCard = {
    id: "rate_card_001",
    organizationId,
    rateCardCode: "RATE-RAIL-2026",
    rateCardName: "Rail Rate Card",
    status: "active",
    currencyCode: "USD",
    sourceSystem: "tests",
    validFrom: fixedNow,
    validUntil: null,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };
  state.tariffRateCards.push(rateCard);
  state.tariffQuotes.push({
    id: "quote_001",
    organizationId,
    quoteReference: "QUOTE-2026-0001",
    status: "approved",
    currencyCode: "USD",
    quotedAmount: 12_500,
    calculatedByName: "Tariff Analyst",
    calculatedAt: fixedNow,
    approvalReference: "APP-2026-0001",
    cargo: {
      cargoReference: "CGO-2026-0001",
      cargoDescription: "Fuel drums",
    },
    rateCard,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  state.transportOrders.push({
    id: "transport_order_001",
    organizationId,
    orderReference: "TO-2026-0001",
    status: "dispatched",
    mode: "rail",
    confirmationReference: "CONF-2026-0001",
    originName: "Rail Yard A",
    destinationName: "Port Terminal B",
    responsiblePlannerName: "Rail Planner",
    carrierName: "Rail Carrier",
    plannedDepartureAt: fixedNow,
    cancellationReference: null,
    cargo: {
      cargoReference: "CGO-2026-0001",
      cargoDescription: "Fuel drums",
      status: "held",
    },
    capacityReservation: {
      reservationReference: "RES-TRACK-7-READY",
      status: "reserved",
    },
    trackingShipment: {
      referenceCode: "TRK-2026-0001",
      status: "exception",
    },
    _count: {
      scheduleRevisions: 1,
      dispatches: 1,
    },
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  state.auditRecords.push(
    createAuditRecord(state, {
      organizationId,
      actorType: "user",
      actorId: "user_ops",
      action: "cargo.delivery_exception.recorded",
      subjectType: "cargo_delivery_exception",
      subjectId: "dex_001",
      severity: "high",
      after: {
        cargoReference: "CGO-2026-0001",
      },
      reason: "Exception recorded.",
      correlationId: "corr_cargo_exception",
    }),
  );
}

function seedNotification(state, overrides) {
  state.notifications.push({
    id: overrides.id,
    organizationId: overrides.organizationId ?? "org_port_rail",
    sourceOutboxEventId: overrides.sourceOutboxEventId ?? "outbox_001",
    eventType: overrides.eventType,
    aggregateType: overrides.aggregateType ?? "cargo",
    aggregateId: overrides.aggregateId ?? "cargo_001",
    title: overrides.title,
    message: overrides.message ?? overrides.title,
    severity: overrides.severity,
    status: overrides.status,
    createdAt: overrides.createdAt ?? fixedNow,
    updatedAt: overrides.updatedAt ?? fixedNow,
    readAt: overrides.readAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
  });
}

function createAuditRecord(state, data) {
  return {
    id: nextId(state, "auditRecord"),
    organizationId: data.organizationId ?? null,
    actorType: data.actorType,
    actorId: data.actorId ?? null,
    action: data.action,
    subjectType: data.subjectType,
    subjectId: data.subjectId ?? null,
    severity: data.severity,
    before: data.before ?? null,
    after: data.after ?? null,
    reason: data.reason ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
    correlationId: data.correlationId,
    createdAt: fixedNow,
  };
}

function createAuditRepository(database) {
  return {
    async searchRecords(where, limit) {
      return database.auditRecord.findMany({ where, take: limit });
    },
    async countRecords(where) {
      return database.auditRecord.count({ where });
    },
    async countBySeverity(where, severity) {
      return database.auditRecord.count({ where: { ...where, severity } });
    },
    async createAuditRecord(tx, input) {
      await tx.auditRecord.create({ data: input });
    },
    async createOutboxEvent(tx, input) {
      await tx.outboxEvent.create({ data: input });
    },
  };
}

function createNotificationsRepository(database) {
  return {
    async searchNotifications(where, limit) {
      return database.notification.findMany({ where, take: limit });
    },
    async countNotifications(organizationId) {
      return database.notification.count({ where: { organizationId } });
    },
    async countByStatus(organizationId, status) {
      return database.notification.count({ where: { organizationId, status } });
    },
    async findNotificationById(organizationId, notificationId) {
      return database.notification.findFirst({
        where: { id: notificationId, organizationId },
      });
    },
    async updateNotificationReadStatus(tx, notificationId, readAt) {
      return tx.notification.update({
        where: { id: notificationId },
        data: { status: "read", readAt },
      });
    },
    async createAuditRecord(tx, input) {
      await tx.auditRecord.create({ data: input });
    },
  };
}

function createReportsRepository(database) {
  return {
    async findCargoRows(organizationId, limit) {
      return database.cargo.findMany({
        where: { organizationId },
        take: limit,
        select: { id: true, cargoReference: true, status: true },
      });
    },
    async findTrackingShipmentRows(organizationId, limit) {
      return database.trackingShipment.findMany({
        where: { organizationId },
        take: limit,
        select: { id: true, referenceCode: true, status: true },
      });
    },
    async findCapacitySlotRows(organizationId, limit) {
      return database.capacitySlot.findMany({
        where: { organizationId },
        take: limit,
        select: { id: true, slotReference: true, status: true },
      });
    },
    async findTransportOrderRows(organizationId, limit) {
      return database.transportOrder.findMany({
        where: { organizationId },
        take: limit,
        select: { id: true, orderReference: true, status: true },
      });
    },
    async findTariffRateCardRows(organizationId, limit) {
      return database.tariffRateCard.findMany({
        where: { organizationId },
        take: limit,
        select: { id: true, rateCardCode: true, status: true },
      });
    },
    async createAuditRecord(tx, input) {
      await tx.auditRecord.create({ data: input });
    },
    async createOutboxEvent(tx, input) {
      await tx.outboxEvent.create({ data: input });
    },
  };
}

function takeRecords(records, query) {
  return records
    .filter((record) => matchesWhere(record, query?.where ?? {}))
    .slice(0, query?.take ?? records.length)
    .map((record) => ({ ...record }));
}

function matchesWhere(record, where) {
  return Object.entries(where).every(([key, value]) => {
    if (typeof value === "object" && value !== null && "contains" in value) {
      const recordValue = String(record[key] ?? "");
      const expectedValue = String(value.contains);

      return value.mode === "insensitive"
        ? recordValue.toLowerCase().includes(expectedValue.toLowerCase())
        : recordValue.includes(expectedValue);
    }

    if (typeof value === "object" && value !== null && ("gte" in value || "lte" in value)) {
      const recordTime = new Date(record[key]).getTime();
      const afterStart = value.gte === undefined || recordTime >= new Date(value.gte).getTime();
      const beforeEnd = value.lte === undefined || recordTime <= new Date(value.lte).getTime();

      return afterStart && beforeEnd;
    }

    return record[key] === value;
  });
}

function nextId(state, entityName) {
  state.counters[entityName] += 1;

  return `${entityName}_${String(state.counters[entityName]).padStart(3, "0")}`;
}
