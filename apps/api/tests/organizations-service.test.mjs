import assert from "node:assert/strict";
import { test } from "node:test";

import { OrganizationsService } from "../dist/organizations/organizations.service.js";

const fixedNow = new Date("2026-06-23T00:00:00.000Z");

test("organizations service returns profile for an existing organization", async () => {
  const repository = createMockRepository();
  const service = createOrganizationsService(repository);
  const orgId = "org_001";

  const profile = await service.getProfile({ organizationId: orgId });

  assert.equal(profile.id, orgId);
  assert.equal(profile.name, "Porto Logistics");
  assert.equal(profile.slug, "porto-logistics");
  assert.equal(profile.status, "active");
  assert.equal(profile.memberCount, 5);
  assert.equal(new Date(profile.createdAt).getTime(), fixedNow.getTime());
  assert.equal(new Date(profile.updatedAt).getTime(), fixedNow.getTime());
});

test("organizations service throws NotFoundException for non-existent organization", async () => {
  const repository = createMockRepository();
  const service = createOrganizationsService(repository);

  await assertRejectsWithMessage(
    () => service.getProfile({ organizationId: "org_nonexistent" }),
    "organizations.not_found",
  );
});

test("organizations service updates organization status", async () => {
  const repository = createMockRepository();
  const service = createOrganizationsService(repository);

  const result = await service.updateStatus({
    organizationId: "org_001",
    status: "suspended",
  });

  assert.equal(result.organizationId, "org_001");
  assert.equal(result.status, "suspended");
  assert.equal(typeof result.updatedAt, "string");
  assert.ok(new Date(result.updatedAt).getTime() > fixedNow.getTime());
});

test("organizations service throws NotFoundException when updating status of non-existent org", async () => {
  const repository = createMockRepository();
  const service = createOrganizationsService(repository);

  await assertRejectsWithMessage(
    () => service.updateStatus({ organizationId: "org_nonexistent", status: "suspended" }),
    "organizations.not_found",
  );
});

test("organizations service throws NotFoundException when profile is not found (repository returns null)", async () => {
  const repository = createMockRepository();
  // Override findById to return null for any id
  repository.findById = async () => null;
  const service = createOrganizationsService(repository);

  await assertRejectsWithMessage(
    () => service.getProfile({ organizationId: "org_any" }),
    "organizations.not_found",
  );
});

function createOrganizationsService(repository) {
  const service = Object.create(OrganizationsService.prototype);

  service.organizationsRepo = repository;

  return service;
}

function createMockRepository() {
  const organizations = [
    {
      id: "org_001",
      name: "Porto Logistics",
      slug: "porto-logistics",
      status: "active",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    },
    {
      id: "org_002",
      name: "Rail Terminal A",
      slug: "rail-terminal-a",
      status: "active",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    },
    {
      id: "org_003",
      name: "Archived Operator",
      slug: "archived-operator",
      status: "archived",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    },
  ];

  let nextOrgId = organizations.length + 1;
  let nextUpdateRef = 0;

  return {
    async findById(organizationId) {
      const org = organizations.find((o) => o.id === organizationId);
      if (org === undefined) return null;
      return { ...org };
    },
    async countMembers(organizationId) {
      const counts = { org_001: 5, org_002: 12, org_003: 0 };
      return counts[organizationId] ?? 0;
    },
    async updateStatus(organizationId, data) {
      const org = organizations.find((o) => o.id === organizationId);
      if (org === undefined) return null;
      nextUpdateRef++;
      org.status = data.status;
      org.updatedAt = new Date(fixedNow.getTime() + nextUpdateRef);
      return { ...org };
    },
  };
}

async function assertRejectsWithMessage(action, expectedMessage) {
  let rejectedError = null;

  try {
    await action();
  } catch (error) {
    rejectedError = error;
  }

  assert.ok(rejectedError, `Expected rejection with ${expectedMessage}`);

  const response =
    typeof rejectedError.getResponse === "function" ? rejectedError.getResponse() : undefined;
  const message =
    typeof response === "object" && response !== null ? response.message : rejectedError.message;

  assert.equal(message, expectedMessage);
}
