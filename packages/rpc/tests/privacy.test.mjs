import assert from "node:assert/strict";
import { test } from "node:test";

import {
  privacyExportInputSchema,
  privacyExportMetadata,
  privacyExportOutputSchema,
  privacyDeleteInputSchema,
  privacyDeleteMetadata,
  privacyDeleteOutputSchema,
  privacyAccountSummarySchema,
  privacyAssociatedAccountSchema,
  privacyMembershipSchema,
  privacyAuditRecordSchema,
  privacySessionSchema,
} from "../dist/index.js";

test("privacy export metadata requires session with sensitive audit", () => {
  assert.equal(privacyExportMetadata.name, "privacy.data.export");
  assert.equal(privacyExportMetadata.kind, "query");
  assert.equal(privacyExportMetadata.auth, "session");
  assert.equal(privacyExportMetadata.organizationRequired, false);
  assert.deepEqual(privacyExportMetadata.permissions, []);
  assert.equal(privacyExportMetadata.audit, "sensitive");
  assert.equal(privacyExportMetadata.observability.criticality, "high");
});

test("privacy export input schema validates data export options", () => {
  const defaultInput = privacyExportInputSchema.parse({});

  assert.equal(defaultInput.format, "json");
  assert.equal(defaultInput.includeAuditLogs, true);
  assert.equal(defaultInput.includeSessions, false);

  const csvInput = privacyExportInputSchema.parse({
    format: "csv",
    includeAuditLogs: false,
    includeSessions: true,
  });

  assert.equal(csvInput.format, "csv");
  assert.equal(csvInput.includeAuditLogs, false);
  assert.equal(csvInput.includeSessions, true);

  assert.throws(() =>
    privacyExportInputSchema.parse({
      format: "xml",
    }),
  );
});

test("privacy export output schema validates GDPR export contract", () => {
  const output = privacyExportOutputSchema.parse({
    exportedAt: "2026-06-04T00:00:00.000Z",
    account: {
      userId: "user_001",
      name: "John Doe",
      email: "john@saptm.local",
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
    associatedAccounts: [
      {
        providerId: "google",
        accountId: "google_12345",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    memberships: [
      {
        organizationId: "org_rail_port",
        organizationName: "Rail Port SA",
        status: "active",
        roles: ["admin"],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    auditRecords: [
      {
        id: "audit_001",
        action: "cargo.register",
        subjectType: "cargo",
        subjectId: "cargo_001",
        severity: "info",
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ],
    sessions: [
      {
        id: "session_001",
        createdAt: "2026-06-01T00:00:00.000Z",
        expiresAt: "2026-06-08T00:00:00.000Z",
        ipAddress: "192.168.1.1",
        userAgent: "node-test",
      },
    ],
  });

  assert.equal(output.account.name, "John Doe");
  assert.equal(output.account.email, "john@saptm.local");
  assert.ok(output.associatedAccounts);
  assert.equal(output.associatedAccounts.length, 1);
  assert.ok(output.memberships);
  assert.equal(output.memberships[0].organizationName, "Rail Port SA");
  assert.ok(output.auditRecords);
  assert.equal(output.auditRecords[0].action, "cargo.register");
  assert.ok(output.sessions);
  assert.equal(output.sessions[0].id, "session_001");
});

test("privacy export output allows optional arrays to be omitted", () => {
  const output = privacyExportOutputSchema.parse({
    exportedAt: "2026-06-04T00:00:00.000Z",
    account: {
      userId: "user_001",
      name: "John Doe",
      email: "john@saptm.local",
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
  });

  assert.equal(output.account.userId, "user_001");
  assert.equal(output.associatedAccounts, undefined);
  assert.equal(output.memberships, undefined);
});

test("privacy account summary schema validates user account data", () => {
  const account = privacyAccountSummarySchema.parse({
    userId: "user_001",
    name: "Jane Smith",
    email: "jane@saptm.local",
    emailVerified: true,
    twoFactorEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(account.email, "jane@saptm.local");
  assert.equal(account.twoFactorEnabled, true);
});

test("privacy associated account schema", () => {
  const account = privacyAssociatedAccountSchema.parse({
    providerId: "github",
    accountId: "gh_67890",
    createdAt: "2026-02-01T00:00:00.000Z",
  });

  assert.equal(account.providerId, "github");
});

test("privacy membership schema", () => {
  const membership = privacyMembershipSchema.parse({
    organizationId: "org_rail_port",
    organizationName: "Rail Port SA",
    status: "active",
    roles: ["admin", "operator"],
    createdAt: "2026-01-01T00:00:00.000Z",
  });

  assert.equal(membership.roles.length, 2);
  assert.ok(membership.roles.includes("admin"));
});

test("privacy audit record schema with optional subjectId", () => {
  const record = privacyAuditRecordSchema.parse({
    id: "audit_002",
    action: "user.login",
    subjectType: "session",
    severity: "info",
    createdAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(record.action, "user.login");
  assert.equal(record.subjectId, undefined);
});

test("privacy session schema with optional fields", () => {
  const session = privacySessionSchema.parse({
    id: "session_002",
    createdAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2026-06-08T00:00:00.000Z",
  });

  assert.equal(session.ipAddress, undefined);
  assert.equal(session.userAgent, undefined);
});

test("privacy delete metadata requires critical idempotent mutation", () => {
  assert.equal(privacyDeleteMetadata.name, "privacy.account.delete");
  assert.equal(privacyDeleteMetadata.kind, "mutation");
  assert.equal(privacyDeleteMetadata.auth, "session");
  assert.equal(privacyDeleteMetadata.organizationRequired, false);
  assert.deepEqual(privacyDeleteMetadata.permissions, []);
  assert.equal(privacyDeleteMetadata.audit, "critical");
  assert.equal(privacyDeleteMetadata.idempotency, "required");
  assert.equal(privacyDeleteMetadata.observability.criticality, "critical");
});

test("privacy delete input schema requires confirmation literal", () => {
  assert.throws(() =>
    privacyDeleteInputSchema.parse({
      confirmation: "I want to delete",
      idempotencyKey: "idem_delete_001",
    }),
  );

  assert.throws(() =>
    privacyDeleteInputSchema.parse({
      confirmation: "CONFIRM_DELETE_MY_ACCOUNT",
      idempotencyKey: "short",
    }),
  );

  const input = privacyDeleteInputSchema.parse({
    confirmation: "CONFIRM_DELETE_MY_ACCOUNT",
    idempotencyKey: "idem_delete_account_001",
  });

  assert.equal(input.confirmation, "CONFIRM_DELETE_MY_ACCOUNT");
});

test("privacy delete output validates scheduled deletion contract", () => {
  const output = privacyDeleteOutputSchema.parse({
    scheduledAt: "2026-06-11T00:00:00.000Z",
    message: "Your account deletion has been scheduled and will be processed within 7 days.",
    idempotency: { key: "idem_delete_account_001", replayed: false },
    audit: { action: "account.deletion_scheduled", subjectType: "user", subjectId: "user_001" },
    outbox: { eventType: "account.deletion_scheduled", aggregateType: "user", aggregateId: "user_001" },
  });

  assert.equal(output.message.includes("deletion"), true);
  assert.equal(output.audit.action, "account.deletion_scheduled");
});
