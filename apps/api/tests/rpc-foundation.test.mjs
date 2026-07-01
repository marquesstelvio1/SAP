import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createPlatformRpcRouter } from "../dist/rpc/platform-rpc.router.js";

describe("API foundation oRPC router", () => {
  it("is callable", async () => {
    const rpcContextService = {
      authorizeRequest: async () => ({
        allowed: true,
        permissions: [],
      }),
    };
    const platformRpcRouter = createPlatformRpcRouter({
      adminService: {},
      auditService: {},
      capacityService: {},
      cargoService: {},
      integrationsService: {},
      notificationsService: {},
      planningService: {},
      reportsService: {},
      tariffService: {},
      trackingService: {},
      rpcContextService,
    });
    const client = createRouterClient(platformRpcRouter);
    const report = await client.system.health();

    assert.equal(report.serviceName, "@saptm/rpc");
    assert.equal(report.status, "ok");
    assert.equal(report.contract.name, "system.health");
    assert.equal(report.contract.version, 1);
  });
});
