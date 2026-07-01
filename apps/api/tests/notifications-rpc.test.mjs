import assert from "node:assert/strict";
import { test } from "node:test";

import { ForbiddenException } from "@nestjs/common";
import { createRouterClient } from "@orpc/server";

import { createNotificationsRpcRouter } from "../dist/notifications/notifications-rpc.router.js";

test("notifications inbox RPC authorizes tenant scope and delegates filters", async () => {
  const reads = [];
  const router = createNotificationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_operator",
            userId: "user_operator",
            organizationId: "org_port_rail",
            permissions: ["notification.read"],
            correlationId: "corr_notification_inbox",
          },
        };
      },
    },
    notificationsService: {
      async readInbox(input) {
        reads.push(input);

        return {
          generatedAt: "2026-06-06T00:00:00.000Z",
          organizationId: input.organizationId,
          filters: {
            status: input.status,
            limit: input.limit,
          },
          totals: {
            notifications: 1,
            unread: 1,
            read: 0,
            archived: 0,
          },
          notifications: [
            {
              id: "notification_001",
              organizationId: input.organizationId,
              sourceOutboxEventId: "outbox_001",
              eventType: "report.exported",
              aggregateType: "report.export",
              aggregateId: "report_export_001",
              title: "Report exported",
              message: "A cargo report was exported.",
              severity: "high",
              status: "unread",
              createdAt: "2026-06-06T00:00:00.000Z",
              updatedAt: "2026-06-06T00:00:00.000Z",
              readAt: null,
              archivedAt: null,
            },
          ],
        };
      },
      async markRead() {
        throw new Error("markRead should not be called by inbox test");
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

  const result = await client.notifications.inbox({ status: "unread", limit: 10 });

  assert.equal(result.organizationId, "org_port_rail");
  assert.equal(result.notifications.length, 1);
  assert.equal(reads.length, 1);
  assert.equal(reads[0].organizationId, "org_port_rail");
  assert.equal(reads[0].status, "unread");
});

test("notifications markRead RPC passes actor and request metadata", async () => {
  const acknowledgements = [];
  const router = createNotificationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_operator",
            userId: "user_operator",
            organizationId: "org_port_rail",
            permissions: ["notification.read"],
            correlationId: "corr_notification_mark_read",
          },
        };
      },
    },
    notificationsService: {
      async readInbox() {
        throw new Error("readInbox should not be called by markRead test");
      },
      async markRead(input) {
        acknowledgements.push(input);

        return {
          organizationId: input.organizationId,
          notification: {
            id: input.notificationId,
            organizationId: input.organizationId,
            sourceOutboxEventId: "outbox_001",
            eventType: "report.exported",
            aggregateType: "report.export",
            aggregateId: "report_export_001",
            title: "Report exported",
            message: "A cargo report was exported.",
            severity: "high",
            status: "read",
            createdAt: "2026-06-06T00:00:00.000Z",
            updatedAt: "2026-06-06T00:01:00.000Z",
            readAt: "2026-06-06T00:01:00.000Z",
            archivedAt: null,
          },
          idempotency: { key: "idem_abc123def456", replayed: false },
          audit: {
            action: "notification.marked_read",
            subjectType: "notification",
            subjectId: input.notificationId,
          },
          outbox: {
            eventType: "notification.marked_read",
            aggregateType: "notification",
            aggregateId: input.notificationId,
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

  const result = await client.notifications.markRead({
    notificationId: "notification_001",
    idempotencyKey: "idem_abc123def456",
  });

  assert.equal(result.notification.status, "read");
  assert.equal(acknowledgements.length, 1);
  assert.equal(acknowledgements[0].actorId, "user_operator");
  assert.equal(acknowledgements[0].correlationId, "corr_notification_mark_read");
  assert.equal(acknowledgements[0].ipAddress, "127.0.0.1");
});

test("notifications RPC blocks requests without organization scope", async () => {
  const router = createNotificationsRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_operator",
            userId: "user_operator",
            permissions: ["notification.read"],
            correlationId: "corr_notification_forbidden",
          },
        };
      },
    },
    notificationsService: {
      async readInbox() {
        throw new Error("readInbox should not be called without organization");
      },
      async markRead() {
        throw new Error("markRead should not be called without organization");
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

  await assert.rejects(
    () => client.notifications.inbox({ status: "unread", limit: 10 }),
    ForbiddenException,
  );
});
