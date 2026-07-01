import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSoftDeleteExtension } from "../dist/src/soft-delete.js";

function callExtension(model, operation, args = {}) {
  const ext = createSoftDeleteExtension();
  const query = (updatedArgs) => updatedArgs;
  const result = ext.query.$allModels.$allOperations({
    model,
    operation,
    args,
    query,
  });
  return result;
}

describe("createSoftDeleteExtension", () => {
  describe("soft-deletable models", () => {
    it("injects deletedAt: null for findMany on soft-deletable model", async () => {
      const result = await callExtension("Cargo", "findMany", { where: { status: "active" } });
      assert.deepEqual(result.where, { status: "active", deletedAt: null });
    });

    it("injects deletedAt: null for findFirst on soft-deletable model", async () => {
      const result = await callExtension("Organization", "findFirst", { where: { id: "org_1" } });
      assert.deepEqual(result.where, { id: "org_1", deletedAt: null });
    });

    it("injects deletedAt: null for count on soft-deletable model", async () => {
      const result = await callExtension("Membership", "count", { where: { role: "admin" } });
      assert.deepEqual(result.where, { role: "admin", deletedAt: null });
    });

    it("injects deletedAt: null for update on soft-deletable model", async () => {
      const result = await callExtension("Cargo", "update", {
        where: { id: "cargo_1" },
        data: { status: "released" },
      });
      assert.deepEqual(result.where, { id: "cargo_1", deletedAt: null });
    });

    it("injects deletedAt: null for delete on soft-deletable model", async () => {
      const result = await callExtension("Cargo", "delete", { where: { id: "cargo_1" } });
      assert.deepEqual(result.where, { id: "cargo_1", deletedAt: null });
    });

    it("injects deletedAt: null for upsert on soft-deletable model", async () => {
      const result = await callExtension("Invoice", "upsert", {
        where: { id: "inv_1" },
        create: { amount: 100 },
        update: { amount: 200 },
      });
      assert.deepEqual(result.where, { id: "inv_1", deletedAt: null });
    });

    it("injects deletedAt: null for findUnique on soft-deletable model", async () => {
      const result = await callExtension("Cargo", "findUnique", {
        where: { id: "cargo_1" },
      });
      assert.deepEqual(result.where, { id: "cargo_1", deletedAt: null });
    });
  });

  describe("explicit deletedAt value", () => {
    it("skips injection when deletedAt is explicitly provided", async () => {
      const result = await callExtension("Cargo", "findMany", {
        where: { deletedAt: { not: null } },
      });
      assert.deepEqual(result.where, { deletedAt: { not: null } });
    });

    it("skips injection when deletedAt is set to a date", async () => {
      const date = new Date().toISOString();
      const result = await callExtension("Cargo", "findMany", {
        where: { deletedAt: date },
      });
      assert.deepEqual(result.where, { deletedAt: date });
    });
  });

  describe("non-soft-deletable models", () => {
    it("passes through for non-soft-deletable models", async () => {
      const args = { where: { id: "some_id" } };
      const result = await callExtension("User", "findMany", args);
      assert.equal(result, args);
    });

    it("passes through for non-soft-deletable model operations", async () => {
      const args = { where: { email: "test@test.com" } };
      const result = await callExtension("Session", "findFirst", args);
      assert.equal(result, args);
    });
  });

  describe("operations not in the filter list", () => {
    it("passes through for create operation", async () => {
      const args = { data: { name: "new cargo" } };
      const result = await callExtension("Cargo", "create", args);
      assert.equal(result, args);
    });

    it("passes through for createMany operation", async () => {
      const args = { data: [{ name: "cargo 1" }] };
      const result = await callExtension("Cargo", "createMany", args);
      assert.equal(result, args);
    });
  });
});
