import assert from "node:assert/strict";
import { test } from "node:test";

import {
  notificationInboxInputSchema,
  notificationInboxMetadata,
  notificationInboxOutputSchema,
  notificationMarkReadInputSchema,
  notificationMarkReadMetadata,
  notificationMarkReadOutputSchema,
} from "../dist/index.js";

test("notification inbox metadata requires tenant notification read permission", () => {
  assert.equal(notificationInboxMetadata.name, "notification.inbox.read");
  assert.equal(notificationInboxMetadata.kind, "query");
  assert.equal(notificationInboxMetadata.auth, "session");
  assert.deepEqual(notificationInboxMetadata.permissions, ["notification.read"]);
  assert.equal(notificationInboxMetadata.organizationRequired, true);
});

test("notification inbox schemas validate tenant-scoped notifications", () => {
  assert.deepEqual(notificationInboxInputSchema.parse(undefined), { limit: 25 });

  const output = notificationInboxOutputSchema.parse({
    generatedAt: "2026-06-06T00:00:00.000Z",
    organizationId: "org_rail_port",
    filters: {
      status: "unread",
      limit: 25,
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
        organizationId: "org_rail_port",
        eventType: "cargo.registered",
        aggregateType: "cargo",
        aggregateId: "cargo_001",
        title: "Cargo registered",
        message: "CGO-001 was registered.",
        severity: "high",
        status: "unread",
        sourceOutboxEventId: "outbox_001",
        createdAt: "2026-06-06T00:00:00.000Z",
        updatedAt: "2026-06-06T00:00:00.000Z",
        readAt: null,
        archivedAt: null,
      },
    ],
  });

  assert.equal(output.notifications[0].eventType, "cargo.registered");
});

test("notification mark-read contract validates auditable acknowledgement", () => {
  assert.equal(notificationMarkReadMetadata.name, "notification.mark_read");
  assert.equal(notificationMarkReadMetadata.kind, "mutation");
  assert.deepEqual(notificationMarkReadMetadata.permissions, ["notification.read"]);

  assert.equal(
    notificationMarkReadInputSchema.parse({ notificationId: "notification_001" }).notificationId,
    "notification_001",
  );

  const output = notificationMarkReadOutputSchema.parse({
    organizationId: "org_rail_port",
    notification: {
      id: "notification_001",
      organizationId: "org_rail_port",
      eventType: "report.exported",
      aggregateType: "report.export",
      aggregateId: "report_export_001",
      title: "Report exported",
      message: "A cargo report was exported.",
      severity: "high",
      status: "read",
      sourceOutboxEventId: "outbox_001",
      createdAt: "2026-06-06T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z",
      readAt: "2026-06-06T00:01:00.000Z",
      archivedAt: null,
    },
    audit: {
      action: "notification.marked_read",
      subjectType: "notification",
      subjectId: "notification_001",
    },
  });

  assert.equal(output.notification.status, "read");
});
