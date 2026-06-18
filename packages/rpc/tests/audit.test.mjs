import assert from "node:assert/strict";
import { test } from "node:test";

import {
  auditExportInputSchema,
  auditExportMetadata,
  auditExportOutputSchema,
  auditSearchInputSchema,
  auditSearchMetadata,
  auditSearchOutputSchema,
} from "../dist/index.js";

test("audit search metadata requires tenant audit read permission", () => {
  assert.equal(auditSearchMetadata.name, "audit.records.search");
  assert.equal(auditSearchMetadata.kind, "query");
  assert.equal(auditSearchMetadata.auth, "session");
  assert.equal(auditSearchMetadata.organizationRequired, true);
  assert.deepEqual(auditSearchMetadata.permissions, ["audit.read"]);
  assert.equal(auditSearchMetadata.audit, "sensitive");
  assert.equal(auditSearchMetadata.observability.criticality, "high");
});

test("audit search schema validates tenant-scoped filters and output", () => {
  assert.deepEqual(auditSearchInputSchema.parse(undefined), { limit: 25 });
  assert.throws(() =>
    auditSearchInputSchema.parse({
      createdFrom: "2026-06-06T00:00:00.000Z",
      createdTo: "2026-06-05T00:00:00.000Z",
    }),
  );

  const parsed = auditSearchOutputSchema.parse({
    generatedAt: "2026-06-05T00:00:00.000Z",
    organizationId: "org_rail_port",
    filters: {
      limit: 25,
      severity: "critical",
    },
    totals: {
      records: 1,
      low: 0,
      medium: 0,
      high: 0,
      critical: 1,
    },
    records: [
      {
        id: "audit_001",
        organizationId: "org_rail_port",
        actorType: "user",
        actorId: "user_admin",
        action: "cargo.registered",
        subjectType: "cargo",
        subjectId: "cargo_001",
        severity: "critical",
        before: null,
        after: { cargoReference: "CGO-001" },
        reason: "Governed cargo registration.",
        ipAddress: "127.0.0.1",
        userAgent: "node-test",
        correlationId: "corr_audit_001",
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    ],
  });

  assert.equal(parsed.records[0].action, "cargo.registered");
});

test("audit export contract requires audit read and report export", () => {
  assert.equal(auditExportMetadata.name, "audit.records.export");
  assert.equal(auditExportMetadata.kind, "query");
  assert.deepEqual(auditExportMetadata.permissions, ["audit.read", "report.export"]);
  assert.equal(auditExportMetadata.audit, "critical");
  assert.equal(auditExportMetadata.observability.criticality, "critical");

  const input = auditExportInputSchema.parse({
    action: "cargo",
    format: "csv",
    limit: 50,
  });

  assert.equal(input.format, "csv");
  assert.equal(input.limit, 50);
});

test("audit export output validates CSV artifact and audit evidence", () => {
  const output = auditExportOutputSchema.parse({
    generatedAt: "2026-06-05T00:00:00.000Z",
    organizationId: "org_rail_port",
    format: "csv",
    filename: "saptm-audit-20260605T000000Z.csv",
    contentType: "text/csv; charset=utf-8",
    rowCount: 1,
    content: "createdAt,severity,action\n2026-06-05T00:00:00.000Z,critical,cargo.registered\n",
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
  });

  assert.equal(output.contentType, "text/csv; charset=utf-8");
});
