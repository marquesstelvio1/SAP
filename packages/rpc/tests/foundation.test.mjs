import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createFoundationRpcHealthReport,
  foundationRpcHealthMetadata,
  foundationRpcHealthOutputSchema,
} from "../dist/index.js";

test("foundation RPC health report is deterministic and public", async () => {
  const checkedAt = new Date("2026-06-03T00:00:00.000Z");
  const report = createFoundationRpcHealthReport(checkedAt);

  assert.equal(report.serviceName, "@saptm/rpc");
  assert.equal(report.status, "ok");
  assert.equal(report.checkedAt, "2026-06-03T00:00:00.000Z");
  assert.equal(report.contract.name, "system.health");
  assert.equal(report.contract.version, 1);
  assert.equal(report.contract.transport, "orpc");
  assert.equal(foundationRpcHealthMetadata.auth, "public");
  assert.equal(foundationRpcHealthMetadata.audit, "none");
});

test("foundation RPC health schema validates the public output contract", () => {
  const report = createFoundationRpcHealthReport(new Date("2026-06-03T00:00:00.000Z"));
  const parsed = foundationRpcHealthOutputSchema.parse(report);

  assert.equal(parsed.serviceName, "@saptm/rpc");
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.contract.name, "system.health");
});
