import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateAuthorization } from "../dist/index.js";

function makeContext(overrides = {}) {
  return {
    actorId: "user_1",
    actorType: "user",
    permissions: [],
    correlationId: "corr_123",
    ...overrides,
  };
}

describe("evaluateAuthorization", () => {
  describe("all permission mode (default)", () => {
    it("allows when all required permissions are present", () => {
      const result = evaluateAuthorization(
        makeContext({ permissions: ["cargo.read", "cargo.register"] }),
        { permissions: ["cargo.read", "cargo.register"] },
      );

      assert.equal(result.allowed, true);
      assert.equal(result.reason, "authorization.allowed");
      assert.deepEqual(result.missingPermissions, []);
      assert.deepEqual(result.failedAttributes, []);
    });

    it("denies when any required permission is missing", () => {
      const result = evaluateAuthorization(makeContext({ permissions: ["cargo.read"] }), {
        permissions: ["cargo.read", "cargo.register"],
      });

      assert.equal(result.allowed, false);
      assert.deepEqual(result.missingPermissions, ["cargo.register"]);
    });
  });

  describe("any permission mode", () => {
    it("allows when at least one permission is present", () => {
      const result = evaluateAuthorization(makeContext({ permissions: ["cargo.read"] }), {
        permissions: ["cargo.read", "cargo.register"],
        permissionMode: "any",
      });

      assert.equal(result.allowed, true);
      assert.deepEqual(result.missingPermissions, []);
    });

    it("lists all permissions as missing when none are present", () => {
      const result = evaluateAuthorization(makeContext({ permissions: [] }), {
        permissions: ["cargo.read", "cargo.register"],
        permissionMode: "any",
      });

      assert.equal(result.allowed, false);
      assert.deepEqual(result.missingPermissions, ["cargo.read", "cargo.register"]);
    });
  });

  describe("actor type restriction", () => {
    it("allows when actor type matches", () => {
      const result = evaluateAuthorization(makeContext({ actorType: "service_account" }), {
        actorTypes: ["service_account"],
      });

      assert.equal(result.allowed, true);
    });

    it("denies when actor type does not match", () => {
      const result = evaluateAuthorization(makeContext({ actorType: "user" }), {
        actorTypes: ["service_account"],
      });

      assert.equal(result.allowed, false);
      assert.deepEqual(result.failedAttributes, ["actor_type"]);
    });
  });

  describe("organization requirements", () => {
    it("denies when organization is required but missing", () => {
      const result = evaluateAuthorization(makeContext({ organizationId: undefined }), {
        organizationRequired: true,
      });

      assert.equal(result.allowed, false);
      assert.deepEqual(result.failedAttributes, ["organization"]);
    });

    it("denies when organization ID does not match", () => {
      const result = evaluateAuthorization(makeContext({ organizationId: "org_a" }), {
        organizationId: "org_b",
      });

      assert.equal(result.allowed, false);
      assert.deepEqual(result.failedAttributes, ["organization_scope"]);
    });

    it("allows when organization ID matches", () => {
      const result = evaluateAuthorization(makeContext({ organizationId: "org_123" }), {
        organizationId: "org_123",
      });

      assert.equal(result.allowed, true);
    });
  });

  describe("combined constraints", () => {
    it("denies with combined reason when both fail", () => {
      const result = evaluateAuthorization(makeContext({ actorType: "user", permissions: [] }), {
        actorTypes: ["service_account"],
        permissions: ["cargo.read"],
      });

      assert.equal(result.allowed, false);
      assert.equal(result.reason, "authorization.denied.attributes_and_permissions");
    });
  });

  describe("empty requirement", () => {
    it("allows when no requirements are specified", () => {
      const result = evaluateAuthorization(makeContext());

      assert.equal(result.allowed, true);
      assert.equal(result.reason, "authorization.allowed");
    });
  });
});
