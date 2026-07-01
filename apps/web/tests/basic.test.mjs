import assert from "node:assert/strict";
import { test } from "node:test";

import { foundationRpcHealthOutputSchema } from "@saptm/rpc";

test("foundation health output schema validates health report", () => {
  const report = foundationRpcHealthOutputSchema.parse({
    serviceName: "@saptm/web",
    status: "ok",
    checkedAt: "2026-07-01T00:00:00.000Z",
    contract: {
      name: "system.health",
      version: 1,
      transport: "orpc",
    },
  });

  assert.equal(report.serviceName, "@saptm/web");
  assert.equal(report.status, "ok");
  assert.equal(report.contract.name, "system.health");
});

test("foundation health output schema rejects invalid status", () => {
  assert.throws(() =>
    foundationRpcHealthOutputSchema.parse({
      serviceName: "@saptm/web",
      status: "unknown",
      checkedAt: "2026-07-01T00:00:00.000Z",
      contract: {
        name: "system.health",
        version: 1,
        transport: "orpc",
      },
    }),
  );
});
