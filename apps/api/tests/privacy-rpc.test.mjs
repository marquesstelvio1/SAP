import assert from "node:assert/strict";
import { test } from "node:test";

import { createRouterClient } from "@orpc/server";

import { createPrivacyRpcRouter } from "../dist/privacy/privacy-rpc.router.js";

test("privacy export data RPC authorizes request and returns GDPR data export", async () => {
  const calls = [];
  const router = createPrivacyRpcRouter({
    rpcContextService: {
      async authorizeRequest(request, metadata) {
        calls.push({ request, metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_001",
            userId: "user_001",
            organizationId: "org_port_rail",
            permissions: [],
            correlationId: "corr_privacy_export",
            traceContext: {
              correlationId: "corr_privacy_export",
              requestId: "req_privacy_export",
              operationName: "privacy.data.export",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    privacyService: {
      async exportUserData(actorId, options) {
        return {
          exportedAt: "2026-06-04T00:00:00.000Z",
          account: {
            userId: actorId,
            name: "John Doe",
            email: "john@saptm.local",
            emailVerified: true,
            twoFactorEnabled: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
          associatedAccounts: [],
          memberships: [],
          auditRecords: options.includeAuditLogs
            ? [
                {
                  id: "audit_001",
                  action: "cargo.register",
                  subjectType: "cargo",
                  subjectId: "cargo_001",
                  severity: "info",
                  createdAt: "2026-06-01T00:00:00.000Z",
                },
              ]
            : [],
          sessions: options.includeSessions
            ? [
                {
                  id: "session_001",
                  createdAt: "2026-06-01T00:00:00.000Z",
                  expiresAt: "2026-06-08T00:00:00.000Z",
                  ipAddress: "192.168.1.1",
                  userAgent: "node-test",
                },
              ]
            : [],
        };
      },
      async scheduleAccountDeletion() {
        throw new Error("scheduleAccountDeletion should not be called by export test");
      },
    },
  });
  const client = createRouterClient(router, {
    context: {
      request: {
        headers: {
          "x-correlation-id": "corr_privacy_export",
        },
      },
    },
  });

  const result = await client.privacy.exportData({
    format: "json",
    includeAuditLogs: true,
    includeSessions: false,
  });

  assert.equal(result.account.userId, "user_001");
  assert.equal(result.account.name, "John Doe");
  assert.ok(result.auditRecords);
  assert.equal(result.auditRecords.length, 1);
  assert.equal(result.sessions, undefined);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "privacy.data.export");
});

test("privacy export data with CSV format and sessions included", async () => {
  const router = createPrivacyRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_001",
            userId: "user_001",
            permissions: [],
            correlationId: "corr_privacy_csv",
          },
        };
      },
    },
    privacyService: {
      async exportUserData(actorId, options) {
        return {
          exportedAt: "2026-06-04T00:00:00.000Z",
          account: {
            userId: actorId,
            name: "John Doe",
            email: "john@saptm.local",
            emailVerified: true,
            twoFactorEnabled: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
          associatedAccounts: [],
          memberships: [],
          auditRecords: options.includeAuditLogs
            ? []
            : [],
          sessions: options.includeSessions
            ? [
                {
                  id: "session_001",
                  createdAt: "2026-06-01T00:00:00.000Z",
                  expiresAt: "2026-06-08T00:00:00.000Z",
                },
              ]
            : [],
        };
      },
      async scheduleAccountDeletion() {
        throw new Error("scheduleAccountDeletion should not be called by export test");
      },
    },
  });
  const client = createRouterClient(router);

  const result = await client.privacy.exportData({
    format: "csv",
    includeAuditLogs: false,
    includeSessions: true,
  });

  assert.equal(result.sessions.length, 1);
  assert.equal(result.auditRecords, undefined);
});

test("privacy delete account RPC authorizes deletion mutation", async () => {
  const calls = [];
  let deleteCalled = false;
  const router = createPrivacyRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, metadata) {
        calls.push({ metadata });

        return {
          metadata,
          authContext: {
            actorType: "user",
            actorId: "user_001",
            userId: "user_001",
            permissions: [],
            correlationId: "corr_privacy_delete",
            traceContext: {
              correlationId: "corr_privacy_delete",
              requestId: "req_privacy_delete",
              operationName: "privacy.account.delete",
              sourceSystem: "tests",
            },
          },
        };
      },
    },
    privacyService: {
      async exportUserData() {
        throw new Error("exportUserData should not be called by delete test");
      },
      async scheduleAccountDeletion(actorId, context) {
        deleteCalled = true;
        return {
          scheduledAt: "2026-06-11T00:00:00.000Z",
          message: "Your account deletion has been scheduled and will be processed within 7 days.",
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

  const result = await client.privacy.deleteAccount({
    confirmation: "CONFIRM_DELETE_MY_ACCOUNT",
    idempotencyKey: "privacy_delete_001",
  });

  assert.ok(result.scheduledAt);
  assert.ok(result.message.includes("deletion"));
  assert.equal(result.audit.action, "account.deletion_scheduled");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].metadata.name, "privacy.account.delete");
  assert.equal(deleteCalled, true);
});

test("privacy RPC denies unauthenticated request", async () => {
  const router = createPrivacyRpcRouter({
    rpcContextService: {
      async authorizeRequest(_request, _metadata) {
        return {
          metadata: _metadata,
          authContext: undefined,
        };
      },
    },
    privacyService: {
      async exportUserData() {
        throw new Error("exportUserData should not be called by unauthenticated test");
      },
      async scheduleAccountDeletion() {
        throw new Error("scheduleAccountDeletion should not be called by unauthenticated test");
      },
    },
  });
  const client = createRouterClient(router);

  await assert.rejects(
    () =>
      client.privacy.exportData({
        format: "json",
        includeAuditLogs: false,
        includeSessions: false,
      }),
    Error,
  );
});
