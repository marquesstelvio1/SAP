import assert from "node:assert/strict";
import { test } from "node:test";

import {
  settingsOrganizationUpdateInputSchema,
  settingsOrganizationUpdateMetadata,
  settingsBrandingUpdateInputSchema,
  settingsBrandingUpdateMetadata,
  settingsOverviewMetadata,
  settingsOverviewOutputSchema,
  settingsMutationOutputSchema,
  settingsOrganizationStatuses,
} from "../dist/index.js";

test("settings overview metadata requires session and tenant manage permission", () => {
  assert.equal(settingsOverviewMetadata.name, "settings.overview");
  assert.equal(settingsOverviewMetadata.kind, "query");
  assert.equal(settingsOverviewMetadata.auth, "session");
  assert.equal(settingsOverviewMetadata.organizationRequired, true);
  assert.deepEqual(settingsOverviewMetadata.permissions, ["tenant.manage"]);
  assert.equal(settingsOverviewMetadata.audit, "standard");
  assert.equal(settingsOverviewMetadata.observability.criticality, "low");
  assert.equal(settingsOverviewMetadata.idempotency, "none");
});

test("settings overview output schema validates organization settings", () => {
  const output = settingsOverviewOutputSchema.parse({
    organizationId: "org_rail_port",
    name: "Rail Port SA",
    slug: "rail-port",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    memberCount: 15,
  });

  assert.equal(output.organizationId, "org_rail_port");
  assert.equal(output.name, "Rail Port SA");
  assert.equal(output.slug, "rail-port");
  assert.equal(output.memberCount, 15);
});

test("settings organization update metadata requires idempotent mutation", () => {
  assert.equal(settingsOrganizationUpdateMetadata.name, "settings.organization.update");
  assert.equal(settingsOrganizationUpdateMetadata.kind, "mutation");
  assert.equal(settingsOrganizationUpdateMetadata.auth, "session");
  assert.equal(settingsOrganizationUpdateMetadata.organizationRequired, true);
  assert.deepEqual(settingsOrganizationUpdateMetadata.permissions, ["tenant.manage"]);
  assert.equal(settingsOrganizationUpdateMetadata.audit, "standard");
  assert.equal(settingsOrganizationUpdateMetadata.idempotency, "recommended");
});

test("settings organization update input schema validates name and slug", () => {
  assert.throws(() =>
    settingsOrganizationUpdateInputSchema.parse({
      name: "A",
      slug: "rail-port",
      idempotencyKey: "idem_settings_001",
    }),
  );

  assert.throws(() =>
    settingsOrganizationUpdateInputSchema.parse({
      name: "Rail Port SA",
      slug: "-invalid-slug",
      idempotencyKey: "idem_settings_001",
    }),
  );

  assert.throws(() =>
    settingsOrganizationUpdateInputSchema.parse({
      name: "Rail Port SA",
      slug: "rail-port",
      idempotencyKey: "short",
    }),
  );

  const input = settingsOrganizationUpdateInputSchema.parse({
    name: "Rail Port SA Updated",
    slug: "rail-port-updated",
    idempotencyKey: "idem_settings_001",
  });

  assert.equal(input.name, "Rail Port SA Updated");
  assert.equal(input.slug, "rail-port-updated");
});

test("settings branding update metadata requires session", () => {
  assert.equal(settingsBrandingUpdateMetadata.name, "settings.branding.update");
  assert.equal(settingsBrandingUpdateMetadata.kind, "mutation");
  assert.equal(settingsBrandingUpdateMetadata.auth, "session");
  assert.equal(settingsBrandingUpdateMetadata.organizationRequired, true);
  assert.deepEqual(settingsBrandingUpdateMetadata.permissions, ["tenant.manage"]);
  assert.equal(settingsBrandingUpdateMetadata.audit, "standard");
  assert.equal(settingsBrandingUpdateMetadata.idempotency, "none");
});

test("settings branding update input schema validates hex color", () => {
  assert.throws(() =>
    settingsBrandingUpdateInputSchema.parse({
      primaryColor: "red",
      idempotencyKey: "idem_branding_001",
    }),
  );

  const input = settingsBrandingUpdateInputSchema.parse({
    primaryColor: "#FF6600",
    idempotencyKey: "idem_branding_001",
  });

  assert.equal(input.primaryColor, "#FF6600");
});

test("settings branding update accepts optional file fields", () => {
  // logo and favicon use z.instanceof(File) which can't be tested in Node test env easily
  // but primaryColor is validated
  const input = settingsBrandingUpdateInputSchema.parse({
    idempotencyKey: "idem_branding_002",
  });

  assert.equal(input.primaryColor, undefined);
  assert.equal(input.logo, undefined);
});

test("settings mutation output validates audit and outbox contract", () => {
  const output = settingsMutationOutputSchema.parse({
    organizationId: "org_rail_port",
    updatedAt: "2026-06-04T00:00:00.000Z",
    idempotency: { key: "idem_settings_001", replayed: false },
    audit: { action: "settings.organization.updated", subjectType: "organization", subjectId: "org_rail_port" },
    outbox: { eventType: "settings.organization.updated", aggregateType: "organization", aggregateId: "org_rail_port" },
  });

  assert.equal(output.organizationId, "org_rail_port");
  assert.equal(output.audit.action, "settings.organization.updated");
});

test("settings organization statuses are correctly defined", () => {
  assert.deepEqual(settingsOrganizationStatuses, ["active", "suspended"]);
});
