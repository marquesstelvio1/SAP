import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluateAuthorization } from "@saptm/auth";
import { evaluateRpcAuthorization } from "@saptm/rpc";

function ctx(overrides = {}) {
  return {
    actorType: "user",
    actorId: "test-user",
    permissions: [],
    ...overrides,
  };
}

function meta(overrides = {}) {
  return {
    name: "test.operation",
    auth: "session",
    kind: "query",
    permissions: [],
    permissionMode: "all",
    organizationRequired: false,
    audit: "standard",
    idempotency: "none",
    ...overrides,
  };
}

test("auth: empty requirement always allowed", () => {
  const decision = evaluateAuthorization(ctx({ permissions: [] }), {});
  assert.equal(decision.allowed, true);
});

test("auth: public RPC always allowed without auth context", () => {
  const decision = evaluateRpcAuthorization(undefined, meta({ auth: "public" }));
  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, "rpc.authorization.public");
});

test("auth: session RPC denied without auth context", () => {
  const decision = evaluateRpcAuthorization(undefined, meta({ auth: "session" }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "rpc.authorization.unauthenticated");
});

test("auth: user with all required permissions allowed", () => {
  const decision = evaluateAuthorization(ctx({ permissions: ["cargo.read", "cargo.register"] }), {
    permissions: ["cargo.read", "cargo.register"],
    permissionMode: "all",
  });
  assert.equal(decision.allowed, true);
});

test("auth: user missing one of all required permissions denied", () => {
  const decision = evaluateAuthorization(ctx({ permissions: ["cargo.read"] }), {
    permissions: ["cargo.read", "cargo.register"],
    permissionMode: "all",
  });
  assert.equal(decision.allowed, false);
  assert.deepEqual(decision.missingPermissions, ["cargo.register"]);
});

test("auth: user with any one required permission allowed in any mode", () => {
  const decision = evaluateAuthorization(ctx({ permissions: ["cargo.register"] }), {
    permissions: ["cargo.read", "cargo.register"],
    permissionMode: "any",
  });
  assert.equal(decision.allowed, true);
});

test("auth: user with none of any permissions denied", () => {
  const decision = evaluateAuthorization(ctx({ permissions: ["planning.order.read"] }), {
    permissions: ["cargo.read", "cargo.register"],
    permissionMode: "any",
  });
  assert.equal(decision.allowed, false);
  assert.deepEqual(decision.missingPermissions, ["cargo.read", "cargo.register"]);
});

test("auth: actor type mismatch denied", () => {
  const decision = evaluateAuthorization(ctx({ actorType: "service_account" }), {
    actorTypes: ["user"],
  });
  assert.equal(decision.allowed, false);
  assert.ok(decision.failedAttributes.includes("actor_type"));
});

test("auth: actor type match allowed", () => {
  const decision = evaluateAuthorization(ctx({ actorType: "service_account" }), {
    actorTypes: ["user", "service_account"],
  });
  assert.equal(decision.allowed, true);
});

test("auth: organization required but missing denied", () => {
  const decision = evaluateAuthorization(ctx({ organizationId: undefined }), {
    organizationRequired: true,
  });
  assert.equal(decision.allowed, false);
  assert.ok(decision.failedAttributes.includes("organization"));
});

test("auth: organization required and present allowed", () => {
  const decision = evaluateAuthorization(ctx({ organizationId: "org_1" }), {
    organizationRequired: true,
  });
  assert.equal(decision.allowed, true);
});

test("auth: specific org scope match allowed", () => {
  const decision = evaluateAuthorization(ctx({ organizationId: "org_1" }), {
    organizationId: "org_1",
  });
  assert.equal(decision.allowed, true);
});

test("auth: specific org scope mismatch denied", () => {
  const decision = evaluateAuthorization(ctx({ organizationId: "org_1" }), {
    organizationId: "org_2",
  });
  assert.equal(decision.allowed, false);
  assert.ok(decision.failedAttributes.includes("organization_scope"));
});

test("auth: multiple failed attributes and permissions", () => {
  const decision = evaluateAuthorization(
    ctx({ actorType: "service_account", organizationId: undefined, permissions: ["cargo.read"] }),
    {
      actorTypes: ["user"],
      organizationRequired: true,
      permissions: ["cargo.register"],
      permissionMode: "all",
    },
  );
  assert.equal(decision.allowed, false);
  assert.ok(decision.failedAttributes.includes("actor_type"));
  assert.ok(decision.failedAttributes.includes("organization"));
  assert.deepEqual(decision.missingPermissions, ["cargo.register"]);
  assert.equal(decision.reason, "authorization.denied.attributes_and_permissions");
});

test("auth: platform actor bypasses org and permission checks", () => {
  const decision = evaluateAuthorization(
    ctx({ actorType: "platform", organizationId: "org_1", permissions: [] }),
    {
      actorTypes: ["platform"],
      organizationRequired: false,
      permissions: [],
    },
  );
  assert.equal(decision.allowed, true);
});

test("auth: service account with full permissions allowed", () => {
  const decision = evaluateAuthorization(
    ctx({
      actorType: "service_account",
      permissions: ["integration.api_key.manage", "integration.event.ingest"],
    }),
    {
      actorTypes: ["service_account"],
      permissions: ["integration.event.ingest"],
      permissionMode: "any",
    },
  );
  assert.equal(decision.allowed, true);
});

test("auth: service account denied for user-only operation", () => {
  const decision = evaluateAuthorization(
    ctx({ actorType: "service_account", permissions: ["identity.user.invite"] }),
    {
      actorTypes: ["user"],
      permissions: ["identity.user.invite"],
      permissionMode: "all",
    },
  );
  assert.equal(decision.allowed, false);
  assert.ok(decision.failedAttributes.includes("actor_type"));
});

test("rpc: session operation requires auth context", () => {
  const decision = evaluateRpcAuthorization(undefined, meta({ auth: "session" }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "rpc.authorization.unauthenticated");
});

test("rpc: service operation defaults to service_account actor type", () => {
  const decision = evaluateRpcAuthorization(
    ctx({ actorType: "service_account", permissions: ["integration.event.ingest"] }),
    meta({ auth: "service", permissions: ["integration.event.ingest"] }),
  );
  assert.equal(decision.allowed, true);
});

test("rpc: service operation denied for user actor", () => {
  const decision = evaluateRpcAuthorization(
    ctx({ actorType: "user", permissions: ["integration.event.ingest"] }),
    meta({ auth: "service", permissions: ["integration.event.ingest"] }),
  );
  assert.equal(decision.allowed, false);
  assert.ok(decision.failedAttributes.includes("actor_type"));
});

test("rpc: operation requiring org but missing org", () => {
  const decision = evaluateRpcAuthorization(
    ctx({ organizationId: undefined }),
    meta({ auth: "session", organizationRequired: true }),
  );
  assert.equal(decision.allowed, false);
  assert.ok(decision.failedAttributes.includes("organization"));
});

test("auth: empty permissions requirement always allowed", () => {
  const decision = evaluateAuthorization(ctx({ permissions: [] }), { permissions: [] });
  assert.equal(decision.allowed, true);
});

test("auth: undefined permissions requirement always allowed", () => {
  const decision = evaluateAuthorization(ctx({ permissions: ["cargo.read"] }), {});
  assert.equal(decision.allowed, true);
});
