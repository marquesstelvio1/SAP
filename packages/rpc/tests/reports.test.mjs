import assert from "node:assert/strict";
import { test } from "node:test";

import {
  reportExportDomains,
  reportExportInputSchema,
  reportExportMetadata,
  reportExportOutputSchema,
} from "../dist/index.js";

test("report export metadata requires governed export permission", () => {
  assert.equal(reportExportMetadata.name, "report.export.generate");
  assert.equal(reportExportMetadata.kind, "query");
  assert.equal(reportExportMetadata.auth, "session");
  assert.deepEqual(reportExportMetadata.permissions, ["report.export"]);
  assert.equal(reportExportMetadata.organizationRequired, true);
  assert.equal(reportExportMetadata.audit, "critical");
  assert.equal(reportExportMetadata.observability.criticality, "critical");
});

test("report export input validates supported operational domains", () => {
  assert.deepEqual(reportExportDomains, ["tracking", "cargo", "capacity", "planning", "tariff"]);

  const parsed = reportExportInputSchema.parse({
    domain: "cargo",
    format: "csv",
    limit: 50,
  });

  assert.equal(parsed.domain, "cargo");
  assert.equal(parsed.format, "csv");
  assert.equal(parsed.limit, 50);
  assert.throws(() => reportExportInputSchema.parse({ domain: "audit" }));
  assert.throws(() => reportExportInputSchema.parse({ domain: "tracking", limit: 500 }));
});

test("report export output validates CSV artifact and evidence", () => {
  const output = reportExportOutputSchema.parse({
    generatedAt: "2026-06-05T00:00:00.000Z",
    organizationId: "org_rail_port",
    domain: "tracking",
    format: "csv",
    filename: "saptm-report-tracking-20260605T000000Z.csv",
    contentType: "text/csv; charset=utf-8",
    rowCount: 1,
    sections: [{ name: "shipments", rowCount: 1 }],
    content: "section,primaryId,reference,status\nshipments,shipment_001,TRK-001,planned\n",
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
  });

  assert.equal(output.domain, "tracking");
  assert.equal(output.sections[0].name, "shipments");
});
