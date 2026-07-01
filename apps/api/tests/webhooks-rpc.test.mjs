import assert from "node:assert/strict";
import { test } from "node:test";

import { ForbiddenException } from "@nestjs/common";
import { createRouterClient } from "@orpc/server";

import { createWebhooksRpcRouter } from "../dist/webhooks/webhooks-rpc.router.js";

test("webhooks create RPC authorizes mutation and delegates to service", async () => {
  const calls = [];
  const router = createWebhooksRpcRouter({
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
            correlationId: "corr_webhook_create",
            traceContext: {
              correlationId: "corr_webhook_create",
              requestId: "req_webhook_create",
              operationName: "webhook.create",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    webhooksService: {
      async create(input) {
        return {
          webhook: {
            id: "wh_001",
            organizationId: input.organizationId,
            name: input.name,
            url: input.url,
            events: input.events,
            isActive: true,
            lastTriggeredAt: null,
            failureCount: 0,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "webhook.created", subjectType: "webhook", subjectId: "wh_001" },
          outbox: { eventType: "webhook.created", aggregateType: "webhook", aggregateId: "wh_001" },
        };
      },
      async update() {
        throw new Error("update should not be called by create test");
      },
      async delete() {
        throw new Error("delete should not be called by create test");
      },
      async list() {
        throw new Error("list should not be called by create test");
      },
      async getDeliveryLog() {
        throw new Error("getDeliveryLog should not be called by create test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_webhook_create",
        },
      },
    },
  });

  const result = await client.webhooks.create({
    name: "Cargo Webhook",
    url: "https://example.com/webhooks/cargo",
    events: ["cargo.registered", "cargo.transport_departed"],
    idempotencyKey: "webhook_create_001",
  });

  assert.equal(result.webhook.name, "Cargo Webhook");
  assert.equal(result.webhook.isActive, true);
  assert.equal(result.audit.action, "webhook.created");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "webhook.create");
});

test("webhooks update RPC authorizes mutation and delegates to service", async () => {
  const router = createWebhooksRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_webhook_update",
          },
        };
      },
    },
    webhooksService: {
      async create() {
        throw new Error("create should not be called by update test");
      },
      async update(input) {
        return {
          webhook: {
            id: input.webhookId,
            organizationId: input.organizationId,
            name: input.name ?? "Cargo Webhook",
            url: input.url ?? "https://example.com/webhooks/cargo",
            events: input.events ?? ["cargo.registered"],
            isActive: input.isActive ?? true,
            lastTriggeredAt: null,
            failureCount: 0,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-02T00:00:00.000Z",
          },
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "webhook.updated", subjectType: "webhook", subjectId: input.webhookId },
          outbox: {
            eventType: "webhook.updated",
            aggregateType: "webhook",
            aggregateId: input.webhookId,
          },
        };
      },
      async delete() {
        throw new Error("delete should not be called by update test");
      },
      async list() {
        throw new Error("list should not be called by update test");
      },
      async getDeliveryLog() {
        throw new Error("getDeliveryLog should not be called by update test");
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

  const result = await client.webhooks.update({
    webhookId: "wh_001",
    name: "Updated Webhook",
    isActive: false,
    idempotencyKey: "webhook_update_001",
  });

  assert.equal(result.webhook.name, "Updated Webhook");
  assert.equal(result.webhook.isActive, false);
  assert.equal(result.audit.action, "webhook.updated");
});

test("webhooks delete RPC authorizes mutation", async () => {
  const router = createWebhooksRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_webhook_delete",
          },
        };
      },
    },
    webhooksService: {
      async create() {
        throw new Error("create should not be called by delete test");
      },
      async update() {
        throw new Error("update should not be called by delete test");
      },
      async delete(input) {
        return {
          webhookId: input.webhookId,
          idempotency: { key: input.idempotencyKey, replayed: false },
          audit: { action: "webhook.deleted", subjectType: "webhook", subjectId: input.webhookId },
          outbox: {
            eventType: "webhook.deleted",
            aggregateType: "webhook",
            aggregateId: input.webhookId,
          },
        };
      },
      async list() {
        throw new Error("list should not be called by delete test");
      },
      async getDeliveryLog() {
        throw new Error("getDeliveryLog should not be called by delete test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.webhooks.delete({
    webhookId: "wh_001",
    idempotencyKey: "webhook_delete_001",
  });

  assert.equal(result.audit.action, "webhook.deleted");
});

test("webhooks list RPC returns paginated webhooks", async () => {
  const router = createWebhooksRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_webhook_list",
          },
        };
      },
    },
    webhooksService: {
      async create() {
        throw new Error("create should not be called by list test");
      },
      async update() {
        throw new Error("update should not be called by list test");
      },
      async delete() {
        throw new Error("delete should not be called by list test");
      },
      async list(input) {
        return {
          webhooks: [
            {
              id: "wh_001",
              organizationId: input.organizationId,
              name: "Cargo Webhook",
              url: "https://example.com/webhook",
              events: ["cargo.registered"],
              isActive: true,
              lastTriggeredAt: null,
              failureCount: 0,
              createdAt: "2026-06-01T00:00:00.000Z",
              updatedAt: "2026-06-01T00:00:00.000Z",
            },
          ],
          pagination: {
            totalCount: 1,
            limit: input.limit,
            offset: input.offset,
          },
        };
      },
      async getDeliveryLog() {
        throw new Error("getDeliveryLog should not be called by list test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.webhooks.list({ limit: 25 });

  assert.equal(result.webhooks.length, 1);
  assert.equal(result.webhooks[0].name, "Cargo Webhook");
  assert.equal(result.pagination.totalCount, 1);
});

test("webhooks get delivery log RPC returns delivery history", async () => {
  const router = createWebhooksRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_admin",
            userId: "user_admin",
            organizationId: "org_port_rail",
            permissions: ["tenant.manage"],
            correlationId: "corr_webhook_delivery_log",
          },
        };
      },
    },
    webhooksService: {
      async create() {
        throw new Error("create should not be called by delivery log test");
      },
      async update() {
        throw new Error("update should not be called by delivery log test");
      },
      async delete() {
        throw new Error("delete should not be called by delivery log test");
      },
      async list() {
        throw new Error("list should not be called by delivery log test");
      },
      async getDeliveryLog(input) {
        return {
          deliveries: [
            {
              id: "del_001",
              webhookId: input.webhookId,
              eventType: "cargo.registered",
              status: "delivered",
              statusCode: 200,
              responseBody: '{"ok":true}',
              attemptCount: 1,
              nextRetryAt: null,
              deliveredAt: "2026-06-01T12:00:00.000Z",
              createdAt: "2026-06-01T12:00:00.000Z",
            },
          ],
          pagination: {
            totalCount: 1,
            limit: input.limit,
            offset: input.offset,
          },
        };
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.webhooks.getDeliveryLog({
    webhookId: "wh_001",
    limit: 25,
    offset: 0,
  });

  assert.equal(result.deliveries.length, 1);
  assert.equal(result.deliveries[0].status, "delivered");
  assert.equal(result.deliveries[0].statusCode, 200);
});

test("webhooks RPC denies request without organization", async () => {
  const router = createWebhooksRpcRouter({
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
    webhooksService: {
      async create() {
        throw new Error("create should not be called by no-org test");
      },
      async update() {
        throw new Error("update should not be called by no-org test");
      },
      async delete() {
        throw new Error("delete should not be called by no-org test");
      },
      async list() {
        throw new Error("list should not be called by no-org test");
      },
      async getDeliveryLog() {
        throw new Error("getDeliveryLog should not be called by no-org test");
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

  await assert.rejects(() => client.webhooks.list({ limit: 10 }), ForbiddenException);
});
