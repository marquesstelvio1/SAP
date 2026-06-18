import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createAuditRpcRouter } from "../dist/audit/audit-rpc.router.js";

test("audit search RPC authorizes request and delegates tenant filters", async () => {
  const calls = [];
  const searched = [];
  const router = createAuditRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_auditor",
            userId: "user_auditor",
            organizationId: "org_port_rail",
            permissions: ["audit.read"],
            correlationId: "corr_audit_search",
            traceContext: {
              correlationId: "corr_audit_search",
              requestId: "req_audit_search",
              operationName: "audit.records.search",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    auditService: {
      async searchRecords(input) {
        searched.push(input);

        return {
          generatedAt: "2026-06-05T00:00:00.000Z",
          organizationId: input.organizationId,
          filters: {
            limit: input.limit,
            severity: input.severity,
          },
          totals: {
            records: 1,
            low: 0,
            medium: 0,
            high: 1,
            critical: 0,
          },
          records: [
            {
              id: "audit_001",
              organizationId: input.organizationId,
              actorType: "user",
              actorId: "user_ops",
              action: "cargo.registered",
              subjectType: "cargo",
              subjectId: "cargo_001",
              severity: "high",
              before: null,
              after: { cargoReference: "CGO-001" },
              reason: "Governed cargo registration.",
              ipAddress: "127.0.0.1",
              userAgent: "node-test",
              correlationId: "corr_audit_001",
              createdAt: "2026-06-05T00:00:00.000Z",
            },
          ],
        };
      },
      async exportRecords() {
        throw new Error("exportRecords should not be called by search test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_audit_search",
        },
      },
    },
  });

  const result = await client.audit.search({ limit: 10, severity: "high" });

  assert.equal(result.organizationId, "org_port_rail");
  assert.equal(result.records[0].action, "cargo.registered");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "audit.records.search");
  assert.equal(searched[0].organizationId, "org_port_rail");
});

test("audit export RPC authorizes export and delegates auditable actor input", async () => {
  const exported = [];
  const router = createAuditRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_auditor",
            userId: "user_auditor",
            organizationId: "org_port_rail",
            permissions: ["audit.read", "report.export"],
            correlationId: "corr_audit_export",
            traceContext: {
              correlationId: "corr_audit_export",
              requestId: "req_audit_export",
              operationName: "audit.records.export",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    auditService: {
      async searchRecords() {
        throw new Error("searchRecords should not be called by export test");
      },
      async exportRecords(input) {
        exported.push(input);

        return {
          generatedAt: "2026-06-05T00:00:00.000Z",
          organizationId: input.organizationId,
          format: "csv",
          filename: "saptm-audit-20260605T000000Z.csv",
          contentType: "text/csv; charset=utf-8",
          rowCount: 1,
          content: "createdAt,severity,action\n2026-06-05T00:00:00.000Z,high,cargo.registered\n",
          audit: {
            action: "audit.records.exported",
            subjectType: "audit.export",
            subjectId: "audit_export_001",
          },
          outbox: {
            eventType: "audit.records.exported",
            aggregateType: "audit.export",
            aggregateId: "audit_export_001",
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

  const result = await client.audit.export({ format: "csv", limit: 25 });

  assert.equal(result.audit.action, "audit.records.exported");
  assert.equal(exported.length, 1);
  assert.equal(exported[0].organizationId, "org_port_rail");
  assert.equal(exported[0].actorId, "user_auditor");
  assert.equal(exported[0].ipAddress, "127.0.0.1");
});
