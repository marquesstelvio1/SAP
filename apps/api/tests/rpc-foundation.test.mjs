import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { foundationRpcRouter } from "../dist/rpc/foundation-rpc.router.js";

test("API foundation oRPC router is callable", async () => {
  const client = createRouterClient(foundationRpcRouter);
  const report = await client.system.health();

  assert.equal(report.serviceName, "@saptm/rpc");
  assert.equal(report.status, "ok");
  assert.equal(report.contract.name, "system.health");
  assert.equal(report.contract.version, 1);
});
