import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createWebhookInputSchema,
  createWebhookMetadata,
  createWebhookOutputSchema,
  updateWebhookInputSchema,
  updateWebhookMetadata,
  updateWebhookOutputSchema,
  deleteWebhookInputSchema,
  deleteWebhookMetadata,
  deleteWebhookOutputSchema,
  listWebhooksInputSchema,
  listWebhooksMetadata,
  listWebhooksOutputSchema,
  getWebhookDeliveryLogInputSchema,
  getWebhookDeliveryLogMetadata,
  getWebhookDeliveryLogOutputSchema,
  retryWebhookDeliveryInputSchema,
  retryWebhookDeliveryMetadata,
  retryWebhookDeliveryOutputSchema,
  webhookEndpointSummarySchema,
  webhookDeliverySummarySchema,
} from "../dist/index.js";

test("create webhook metadata requires sensitive idempotent mutation", () => {
  assert.equal(createWebhookMetadata.name, "webhook.create");
  assert.equal(createWebhookMetadata.kind, "mutation");
  assert.equal(createWebhookMetadata.auth, "session");
  assert.equal(createWebhookMetadata.organizationRequired, true);
  assert.deepEqual(createWebhookMetadata.permissions, ["tenant.manage"]);
  assert.equal(createWebhookMetadata.audit, "sensitive");
  assert.equal(createWebhookMetadata.idempotency, "required");
  assert.equal(createWebhookMetadata.observability.criticality, "medium");
});

test("create webhook input schema validates webhook registration", () => {
  assert.throws(() =>
    createWebhookInputSchema.parse({
      name: "X",
      url: "https://example.com/webhook",
      events: ["cargo.registered"],
      idempotencyKey: "idem_webhook_create_001",
    }),
  );

  assert.throws(() =>
    createWebhookInputSchema.parse({
      name: "Cargo Webhook",
      url: "not-a-url",
      events: ["cargo.registered"],
      idempotencyKey: "idem_webhook_create_001",
    }),
  );

  assert.throws(() =>
    createWebhookInputSchema.parse({
      name: "Cargo Webhook",
      url: "https://example.com/webhook",
      events: [],
      idempotencyKey: "idem_webhook_create_001",
    }),
  );

  const input = createWebhookInputSchema.parse({
    name: "Cargo Webhook",
    url: "https://example.com/webhooks/cargo",
    events: ["cargo.registered", "cargo.transport_departed"],
    idempotencyKey: "idem_webhook_create_001",
  });

  assert.equal(input.name, "Cargo Webhook");
  assert.equal(input.events.length, 2);
  assert.ok(input.events.includes("cargo.registered"));
});

test("create webhook output validates audit and outbox contract", () => {
  const output = createWebhookOutputSchema.parse({
    webhook: {
      id: "wh_001",
      organizationId: "org_rail_port",
      name: "Cargo Webhook",
      url: "https://example.com/webhooks/cargo",
      events: ["cargo.registered"],
      isActive: true,
      lastTriggeredAt: null,
      failureCount: 0,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
    idempotency: { key: "idem_webhook_create_001", replayed: false },
    audit: { action: "webhook.created", subjectType: "webhook", subjectId: "wh_001" },
    outbox: { eventType: "webhook.created", aggregateType: "webhook", aggregateId: "wh_001" },
  });

  assert.equal(output.webhook.name, "Cargo Webhook");
  assert.equal(output.webhook.isActive, true);
  assert.equal(output.audit.action, "webhook.created");
});

test("update webhook metadata requires sensitive idempotent mutation", () => {
  assert.equal(updateWebhookMetadata.name, "webhook.update");
  assert.equal(updateWebhookMetadata.kind, "mutation");
  assert.equal(updateWebhookMetadata.auth, "session");
  assert.equal(updateWebhookMetadata.organizationRequired, true);
  assert.equal(updateWebhookMetadata.audit, "sensitive");
  assert.equal(updateWebhookMetadata.idempotency, "required");
});

test("update webhook input schema validates partial updates", () => {
  const input = updateWebhookInputSchema.parse({
    webhookId: "wh_001",
    name: "Updated Webhook",
    idempotencyKey: "idem_webhook_update_001",
  });

  assert.equal(input.webhookId, "wh_001");
  assert.equal(input.name, "Updated Webhook");
  assert.equal(input.url, undefined);
  assert.equal(input.isActive, undefined);
});

test("update webhook output schema", () => {
  const output = updateWebhookOutputSchema.parse({
    webhook: {
      id: "wh_001",
      organizationId: "org_rail_port",
      name: "Updated Webhook",
      url: "https://example.com/webhooks/cargo",
      events: ["cargo.registered"],
      isActive: false,
      lastTriggeredAt: null,
      failureCount: 1,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    },
    idempotency: { key: "idem_webhook_update_001", replayed: false },
    audit: { action: "webhook.updated", subjectType: "webhook", subjectId: "wh_001" },
    outbox: { eventType: "webhook.updated", aggregateType: "webhook", aggregateId: "wh_001" },
  });

  assert.equal(output.webhook.isActive, false);
});

test("delete webhook metadata requires sensitive idempotent mutation", () => {
  assert.equal(deleteWebhookMetadata.name, "webhook.delete");
  assert.equal(deleteWebhookMetadata.kind, "mutation");
  assert.equal(deleteWebhookMetadata.audit, "sensitive");
  assert.equal(deleteWebhookMetadata.idempotency, "required");
});

test("delete webhook input schema validates", () => {
  const input = deleteWebhookInputSchema.parse({
    webhookId: "wh_001",
    idempotencyKey: "idem_webhook_delete_001",
  });

  assert.equal(input.webhookId, "wh_001");
});

test("delete webhook output schema", () => {
  const output = deleteWebhookOutputSchema.parse({
    webhookId: "wh_001",
    idempotency: { key: "idem_webhook_delete_001", replayed: false },
    audit: { action: "webhook.deleted", subjectType: "webhook", subjectId: "wh_001" },
    outbox: { eventType: "webhook.deleted", aggregateType: "webhook", aggregateId: "wh_001" },
  });

  assert.equal(output.audit.action, "webhook.deleted");
});

test("list webhooks metadata requires session query", () => {
  assert.equal(listWebhooksMetadata.name, "webhook.list");
  assert.equal(listWebhooksMetadata.kind, "query");
  assert.equal(listWebhooksMetadata.auth, "session");
  assert.equal(listWebhooksMetadata.organizationRequired, true);
  assert.equal(listWebhooksMetadata.audit, "standard");
  assert.equal(listWebhooksMetadata.idempotency, "none");
});

test("list webhooks input schema defaults to paginated result", () => {
  const defaultInput = listWebhooksInputSchema.parse(undefined);

  assert.equal(defaultInput.limit, 25);
  assert.equal(defaultInput.offset, 0);
});

test("list webhooks output schema validates paginated response", () => {
  const output = listWebhooksOutputSchema.parse({
    webhooks: [
      {
        id: "wh_001",
        organizationId: "org_rail_port",
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
      limit: 25,
      offset: 0,
    },
  });

  assert.equal(output.webhooks.length, 1);
  assert.equal(output.pagination.totalCount, 1);
});

test("webhook endpoint summary schema validates endpoint structure", () => {
  const summary = webhookEndpointSummarySchema.parse({
    id: "wh_001",
    organizationId: "org_rail_port",
    name: "Test Webhook",
    url: "https://example.com/webhook",
    events: ["cargo.registered"],
    isActive: true,
    lastTriggeredAt: "2026-06-01T12:00:00.000Z",
    failureCount: 2,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(summary.failureCount, 2);
  assert.equal(summary.lastTriggeredAt, "2026-06-01T12:00:00.000Z");
});

test("get webhook delivery log metadata requires session query", () => {
  assert.equal(getWebhookDeliveryLogMetadata.name, "webhook.deliveryLog");
  assert.equal(getWebhookDeliveryLogMetadata.kind, "query");
  assert.equal(getWebhookDeliveryLogMetadata.audit, "standard");
  assert.equal(getWebhookDeliveryLogMetadata.idempotency, "none");
});

test("get webhook delivery log input schema validates", () => {
  const input = getWebhookDeliveryLogInputSchema.parse({
    webhookId: "wh_001",
  });

  assert.equal(input.webhookId, "wh_001");
  assert.equal(input.limit, 25);
  assert.equal(input.offset, 0);
});

test("get webhook delivery log output schema validates delivery logs", () => {
  const output = getWebhookDeliveryLogOutputSchema.parse({
    deliveries: [
      {
        id: "del_001",
        webhookId: "wh_001",
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
      limit: 25,
      offset: 0,
    },
  });

  assert.equal(output.deliveries.length, 1);
  assert.equal(output.deliveries[0].status, "delivered");
  assert.equal(output.deliveries[0].statusCode, 200);
});

test("delivery summary schema validates individual delivery record", () => {
  const delivery = webhookDeliverySummarySchema.parse({
    id: "del_002",
    webhookId: "wh_001",
    eventType: "cargo.transport_departed",
    status: "failed",
    statusCode: 500,
    responseBody: "Internal Server Error",
    attemptCount: 3,
    nextRetryAt: "2026-06-01T13:00:00.000Z",
    deliveredAt: null,
    createdAt: "2026-06-01T12:00:00.000Z",
  });

  assert.equal(delivery.status, "failed");
  assert.equal(delivery.attemptCount, 3);
  assert.ok(delivery.nextRetryAt);
});

test("retry webhook delivery metadata requires sensitive idempotent mutation", () => {
  assert.equal(retryWebhookDeliveryMetadata.name, "webhook.retryDelivery");
  assert.equal(retryWebhookDeliveryMetadata.kind, "mutation");
  assert.equal(retryWebhookDeliveryMetadata.audit, "sensitive");
  assert.equal(retryWebhookDeliveryMetadata.idempotency, "required");
  assert.equal(retryWebhookDeliveryMetadata.organizationRequired, true);
});

test("retry webhook delivery input schema validates", () => {
  const input = retryWebhookDeliveryInputSchema.parse({
    deliveryId: "del_001",
    idempotencyKey: "idem_webhook_retry_001",
  });

  assert.equal(input.deliveryId, "del_001");
});

test("retry webhook delivery output schema", () => {
  const output = retryWebhookDeliveryOutputSchema.parse({
    deliveryId: "del_001",
    status: "queued",
    idempotency: { key: "idem_webhook_retry_001", replayed: false },
    audit: { action: "webhook.delivery_retried", subjectType: "webhook_delivery", subjectId: "del_001" },
    outbox: { eventType: "webhook.delivery_retried", aggregateType: "webhook", aggregateId: "wh_001" },
  });

  assert.equal(output.status, "queued");
  assert.equal(output.audit.action, "webhook.delivery_retried");
});
