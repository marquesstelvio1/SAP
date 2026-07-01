import assert from "node:assert/strict";
import { test } from "node:test";

import { ForbiddenException } from "@nestjs/common";
import { createRouterClient } from "@orpc/server";

import { createSettingsRpcRouter } from "../dist/settings/settings-rpc.router.js";

test("settings overview RPC authorizes request and returns organization settings", async () => {
  const calls = [];
  const router = createSettingsRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_settings_overview",
            traceContext: {
              correlationId: "corr_settings_overview",
              requestId: "req_settings_overview",
              operationName: "settings.overview",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    settingsService: {
      async getSettings(input) {
        return {
          organizationId: input.organizationId,
          name: "Rail Port SA",
          slug: "rail-port",
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          memberCount: 15,
        };
      },
      async updateSettings() {
        throw new Error("updateSettings should not be called by overview test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_settings_overview",
        },
      },
    },
  });

  const overview = await client.settings.overview(undefined);

  assert.equal(overview.organizationId, "org_port_rail");
  assert.equal(overview.name, "Rail Port SA");
  assert.equal(overview.memberCount, 15);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "settings.overview");
});

test("settings update RPC authorizes mutation and delegates to service", async () => {
  const calls = [];
  const router = createSettingsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        calls.push({ metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_settings_update",
            traceContext: {
              correlationId: "corr_settings_update",
              requestId: "req_settings_update",
              operationName: "settings.organization.update",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    settingsService: {
      async getSettings() {
        throw new Error("getSettings should not be called by update test");
      },
      async updateSettings(input) {
        return {
          organizationId: input.organizationId,
          updatedAt: "2026-06-04T00:00:00.000Z",
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: {
            action: "settings.organization.updated",
            subjectType: "organization",
            subjectId: input.organizationId,
          },
          outbox: {
            eventType: "settings.organization.updated",
            aggregateType: "organization",
            aggregateId: input.organizationId,
          },
        };
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      },
    },
  });

  const result = await client.settings.update({
    name: "Rail Port SA Updated",
    slug: "rail-port-updated",
    idempotencyKey: "settings_update_001",
  });

  assert.equal(result.organizationId, "org_port_rail");
  assert.equal(result.audit.action, "settings.organization.updated");
  assert.equal(calls.length, 1);
});

test("settings RPC denies request without organization", async () => {
  const router = createSettingsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_no_org",
            userId: "user_no_org",
            permissions: [],
            correlationId: "corr_no_org",
          },
        };
      },
    },
    settingsService: {
      async getSettings() {
        throw new Error("getSettings should not be called by no-org test");
      },
      async updateSettings() {
        throw new Error("updateSettings should not be called by no-org test");
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

  await assert.rejects(() => client.settings.overview(undefined), ForbiddenException);
});
