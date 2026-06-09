import assert from "node:assert/strict";
import { test } from "node:test";

import { ForbiddenException } from "@nestjs/common";
import { createRouterClient } from "@orpc/server";

import { createReportsRpcRouter } from "../dist/reports/reports-rpc.router.js";

test("reports export RPC authorizes export and delegates auditable input", async () => {
  const exported = [];
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_reporter",
            userId: "user_reporter",
            organizationId: "org_port_rail",
            permissions: ["report.export", "cargo.read"],
            correlationId: "corr_report_export",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport(input) {
        exported.push(input);

        return {
          generatedAt: "2026-06-05T00:00:00.000Z",
          organizationId: input.organizationId,
          domain: input.domain,
          format: "csv",
          filename: "saptm-report-cargo-20260605T000000Z.csv",
          contentType: "text/csv; charset=utf-8",
          rowCount: 1,
          sections: [{ name: "cargo", rowCount: 1 }],
          content: "section,primaryId,reference,status\ncargo,cargo_001,CGO-001,registered\n",
          audit: {
            action: "report.exported",
            subjectType: "report.export",
            subjectId: "report_export_001",
          },
          outbox: {
            eventType: "report.exported",
            aggregateType: "report.export",
            aggregateId: "report_export_001",
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

  const result = await client.reports.export({ domain: "cargo", format: "csv", limit: 25 });

  assert.equal(result.domain, "cargo");
  assert.equal(exported.length, 1);
  assert.equal(exported[0].organizationId, "org_port_rail");
  assert.equal(exported[0].actorId, "user_reporter");
  assert.equal(exported[0].ipAddress, "127.0.0.1");
});

test("reports export RPC blocks missing domain read permission", async () => {
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_reporter",
            organizationId: "org_port_rail",
            permissions: ["report.export", "cargo.read"],
            correlationId: "corr_report_forbidden",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport() {
        throw new Error("exportOperationalReport should not be called without domain permission");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  await assert.rejects(
    () => client.reports.export({ domain: "tracking", format: "csv", limit: 25 }),
    ForbiddenException,
  );
});

test("reports export RPC requires planning read permission for planning domain", async () => {
  const exported = [];
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_planner",
            organizationId: "org_port_rail",
            permissions: ["report.export", "planning.order.read"],
            correlationId: "corr_report_planning",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport(input) {
        exported.push(input);

        return {
          generatedAt: "2026-06-07T00:00:00.000Z",
          organizationId: input.organizationId,
          domain: input.domain,
          format: "csv",
          filename: "saptm-report-planning-20260607T000000Z.csv",
          contentType: "text/csv; charset=utf-8",
          rowCount: 1,
          sections: [{ name: "transport_orders", rowCount: 1 }],
          content:
            "section,primaryId,reference,status\ntransport_orders,transport_order_001,TO-001,confirmed\n",
          audit: {
            action: "report.exported",
            subjectType: "report.export",
            subjectId: "report_export_planning_001",
          },
          outbox: {
            eventType: "report.exported",
            aggregateType: "report.export",
            aggregateId: "report_export_planning_001",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  const result = await client.reports.export({ domain: "planning", format: "csv", limit: 10 });

  assert.equal(result.domain, "planning");
  assert.equal(result.sections[0].name, "transport_orders");
  assert.equal(exported[0].organizationId, "org_port_rail");
  assert.equal(exported[0].actorId, "user_planner");
});

test("reports export RPC requires tracking read permission for tracking domain", async () => {
  const exported = [];
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_tracking",
            organizationId: "org_port_rail",
            permissions: ["report.export", "tracking.shipment.read"],
            correlationId: "corr_report_tracking",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport(input) {
        exported.push(input);

        return {
          generatedAt: "2026-06-08T00:00:00.000Z",
          organizationId: input.organizationId,
          domain: input.domain,
          format: "csv",
          filename: "saptm-report-tracking-20260608T000000Z.csv",
          contentType: "text/csv; charset=utf-8",
          rowCount: 1,
          sections: [{ name: "shipments", rowCount: 1 }],
          content:
            "section,primaryId,reference,status\nshipments,shipment_001,TRK-001,in_transit\n",
          audit: {
            action: "report.exported",
            subjectType: "report.export",
            subjectId: "report_export_tracking_001",
          },
          outbox: {
            eventType: "report.exported",
            aggregateType: "report.export",
            aggregateId: "report_export_tracking_001",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  const result = await client.reports.export({ domain: "tracking", format: "csv", limit: 10 });

  assert.equal(result.domain, "tracking");
  assert.equal(result.sections[0].name, "shipments");
  assert.equal(exported[0].organizationId, "org_port_rail");
  assert.equal(exported[0].actorId, "user_tracking");
});

test("reports export RPC requires capacity read permission for capacity domain", async () => {
  const exported = [];
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_capacity",
            organizationId: "org_port_rail",
            permissions: ["report.export", "capacity.read"],
            correlationId: "corr_report_capacity",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport(input) {
        exported.push(input);

        return {
          generatedAt: "2026-06-09T00:00:00.000Z",
          organizationId: input.organizationId,
          domain: input.domain,
          format: "csv",
          filename: "saptm-report-capacity-20260609T000000Z.csv",
          contentType: "text/csv; charset=utf-8",
          rowCount: 1,
          sections: [{ name: "slots", rowCount: 1 }],
          content: "section,primaryId,reference,status\nslots,slot_001,SLOT-001,open\n",
          audit: {
            action: "report.exported",
            subjectType: "report.export",
            subjectId: "report_export_capacity_001",
          },
          outbox: {
            eventType: "report.exported",
            aggregateType: "report.export",
            aggregateId: "report_export_capacity_001",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  const result = await client.reports.export({ domain: "capacity", format: "csv", limit: 10 });

  assert.equal(result.domain, "capacity");
  assert.equal(result.sections[0].name, "slots");
  assert.equal(exported[0].organizationId, "org_port_rail");
  assert.equal(exported[0].actorId, "user_capacity");
});

test("reports export RPC requires tariff read permission for tariff domain", async () => {
  const exported = [];
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_tariff",
            organizationId: "org_port_rail",
            permissions: ["report.export", "tariff.read"],
            correlationId: "corr_report_tariff",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport(input) {
        exported.push(input);

        return {
          generatedAt: "2026-06-10T00:00:00.000Z",
          organizationId: input.organizationId,
          domain: input.domain,
          format: "csv",
          filename: "saptm-report-tariff-20260610T000000Z.csv",
          contentType: "text/csv; charset=utf-8",
          rowCount: 1,
          sections: [{ name: "rate_cards", rowCount: 1 }],
          content: "section,primaryId,reference,status\nrate_cards,rate_card_001,RATE-001,active\n",
          audit: {
            action: "report.exported",
            subjectType: "report.export",
            subjectId: "report_export_tariff_001",
          },
          outbox: {
            eventType: "report.exported",
            aggregateType: "report.export",
            aggregateId: "report_export_tariff_001",
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  const result = await client.reports.export({ domain: "tariff", format: "csv", limit: 10 });

  assert.equal(result.domain, "tariff");
  assert.equal(result.sections[0].name, "rate_cards");
  assert.equal(exported[0].organizationId, "org_port_rail");
  assert.equal(exported[0].actorId, "user_tariff");
});

test("reports export RPC blocks tracking read user from cargo domain", async () => {
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_tracking_only",
            organizationId: "org_port_rail",
            permissions: ["report.export", "tracking.shipment.read"],
            correlationId: "corr_report_forbidden_cargo",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport() {
        throw new Error("exportOperationalReport should not be called without cargo.read");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  await assert.rejects(
    () => client.reports.export({ domain: "cargo", format: "csv", limit: 25 }),
    ForbiddenException,
  );
});

test("reports export RPC blocks capacity read user from planning domain", async () => {
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_capacity_only",
            organizationId: "org_port_rail",
            permissions: ["report.export", "capacity.read"],
            correlationId: "corr_report_forbidden_planning",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport() {
        throw new Error("exportOperationalReport should not be called without planning.order.read");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  await assert.rejects(
    () => client.reports.export({ domain: "planning", format: "csv", limit: 25 }),
    ForbiddenException,
  );
});

test("reports export RPC blocks planning order read user from tariff domain", async () => {
  const router = createReportsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_planning_only",
            organizationId: "org_port_rail",
            permissions: ["report.export", "planning.order.read"],
            correlationId: "corr_report_forbidden_tariff",
          },
        };
      },
    },
    reportsService: {
      async exportOperationalReport() {
        throw new Error("exportOperationalReport should not be called without tariff.read");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {},
      },
    },
  });

  await assert.rejects(
    () => client.reports.export({ domain: "tariff", format: "csv", limit: 25 }),
    ForbiddenException,
  );
});
