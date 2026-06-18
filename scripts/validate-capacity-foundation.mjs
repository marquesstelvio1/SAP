import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/features/capacity-management.md",
  "docs/governance/capacity-release-evidence.md",
  "packages/rpc/src/capacity.ts",
  "packages/rpc/tests/capacity.test.mjs",
  "packages/database/prisma/migrations/20260604210000_capacity_slot_constraints/migration.sql",
  "apps/api/src/capacity/capacity.module.ts",
  "apps/api/src/capacity/capacity.service.ts",
  "apps/api/src/capacity/capacity-rpc.router.ts",
  "apps/api/tests/capacity-rpc.test.mjs",
  "apps/web/lib/capacity-overview.ts",
  "apps/web/app/(platform)/app/capacity/actions.ts",
  "apps/web/app/(platform)/app/capacity/form-state.ts",
  "apps/web/app/(platform)/app/capacity/page.tsx",
  "apps/web/components/capacity-resource-register-form.tsx",
  "apps/web/components/capacity-slot-open-form.tsx",
  "apps/web/components/capacity-slot-reserve-form.tsx",
  "apps/web/components/capacity-slot-cancel-form.tsx",
];

const requiredSnippets = [
  {
    file: "packages/auth/src/permissions.ts",
    snippets: ["capacity.read", "capacity.manage", "capacity.slot.reserve", "capacity.slot.cancel"],
  },
  {
    file: "packages/database/src/rbac-bootstrap.ts",
    snippets: [
      "capacity.read",
      "capacity.manage",
      "capacity.slot.reserve",
      "capacity.slot.cancel",
      "tenant.operations_manager",
      "tenant.operations_viewer",
    ],
  },
  {
    file: "packages/database/prisma/schema.prisma",
    snippets: [
      "enum CapacityResourceType",
      "enum CapacitySlotStatus",
      "enum CapacityReservationPurpose",
      "enum CapacityReservationStatus",
      "model CapacityResource",
      "model CapacitySlot",
      "model CapacitySlotReservation",
      "recordIdempotencyKey",
      "reserveIdempotencyKey",
      "cancelIdempotencyKey",
      "@@unique([organizationId, resourceCode])",
      "@@unique([organizationId, slotReference])",
      "@@unique([organizationId, reservationReference])",
      "@@unique([organizationId, cargoId, slotId, reservationPurpose])",
    ],
  },
  {
    file: "packages/rpc/src/capacity.ts",
    snippets: [
      "capacityOverviewMetadata",
      "capacityResourceRegisterMetadata",
      "capacitySlotOpenMetadata",
      "capacitySlotReserveMetadata",
      "capacitySlotCancelMetadata",
      "capacityOverviewOutputSchema",
      "capacityResourceRegisterInputSchema",
      "capacitySlotOpenInputSchema",
      "capacitySlotReserveInputSchema",
      "capacitySlotCancelInputSchema",
      "capacity.read",
      "capacity.manage",
      "capacity.slot.reserve",
      "capacity.slot.cancel",
      'idempotency: "required"',
      "Slot window end must be after window start.",
    ],
  },
  {
    file: "apps/api/src/capacity/capacity.service.ts",
    snippets: [
      "registerResource",
      "openSlot",
      "reserveSlot",
      "cancelSlotReservation",
      "findResourceByRecordIdempotencyKey",
      "findSlotByRecordIdempotencyKey",
      "findReservationByReserveIdempotencyKey",
      "findReservationByCancelIdempotencyKey",
      "resolveCapacityResourceRegisterBusinessRules",
      "resolveCapacitySlotOpenBusinessRules",
      "resolveCapacitySlotReserveBusinessRules",
      "resolveCapacitySlotCancelBusinessRules",
      "auditRecord.create",
      "outboxEvent.create",
      "reservedUnits",
      "increment",
      "decrement",
      "capacity.resource.registered",
      "capacity.slot.opened",
      "capacity.slot.reserved",
      "capacity.slot_reservation.cancelled",
      "CAPACITY_RESERVATION_CANNOT_OVERBOOK_SLOT",
      "CAPACITY_CANCELLATION_RELEASES_RESERVED_UNITS",
    ],
  },
  {
    file: "apps/api/src/capacity/capacity-rpc.router.ts",
    snippets: [
      "authorizeRequest",
      "capacityOverviewMetadata",
      "capacityResourceRegisterMetadata",
      "capacitySlotOpenMetadata",
      "capacitySlotReserveMetadata",
      "capacitySlotCancelMetadata",
      "/capacity/overview",
      "/capacity/registerResource",
      "/capacity/openSlot",
      "/capacity/reserveSlot",
      "/capacity/cancelSlotReservation",
    ],
  },
  {
    file: "apps/api/src/rpc/platform-rpc.router.ts",
    snippets: ["createCapacityRpcRouter", "capacity: capacityRpcRouter.capacity"],
  },
  {
    file: "apps/api/src/rpc/rpc-http.middleware.ts",
    snippets: ["CapacityService", "capacityService"],
  },
  {
    file: "apps/web/app/(platform)/app/capacity/page.tsx",
    snippets: [
      "capacity.read",
      "capacity.manage",
      "capacity.slot.reserve",
      "capacity.slot.cancel",
      "getCapacityOverview",
      "CapacityResourceRegisterForm",
      "CapacitySlotOpenForm",
      "CapacitySlotReserveForm",
      "CapacitySlotCancelForm",
      "Capacity / Slot Constraints",
      "sem overbooking",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/capacity/actions.ts",
    snippets: [
      "registerCapacityResourceAction",
      "openCapacitySlotAction",
      "reserveCapacitySlotAction",
      "cancelCapacitySlotReservationAction",
      "/rpc/capacity/registerResource",
      "/rpc/capacity/openSlot",
      "/rpc/capacity/reserveSlot",
      "/rpc/capacity/cancelSlotReservation",
      "capacityResourceRegisterInputSchema",
      "capacitySlotOpenInputSchema",
      "capacitySlotReserveInputSchema",
      "capacitySlotCancelInputSchema",
      "revalidatePath",
    ],
  },
  {
    file: "apps/web/lib/platform-navigation.ts",
    snippets: [
      "capacity.read",
      "capacity.manage",
      "capacity.slot.reserve",
      "capacity.slot.cancel",
      "/app/capacity",
      "Capacidade operacional",
    ],
  },
  {
    file: "tests/e2e/runtime-health.spec.ts",
    snippets: ["protected capacity shell redirects anonymous users to sign-in", "/app/capacity"],
  },
];

const forbiddenRoutes = [
  "apps/web/app/(platform)/app/ports",
  "apps/web/app/(platform)/app/portos",
  "apps/web/app/(platform)/app/rail",
  "apps/web/app/(platform)/app/ferrovia",
  "apps/web/app/(platform)/app/capacity/crud",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing capacity foundation files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

for (const route of forbiddenRoutes) {
  if (existsSync(join(root, route))) {
    console.error(`Unexpected business route before modular acceptance: ${route}`);
    process.exit(1);
  }
}

for (const assertion of requiredSnippets) {
  const source = readFileSync(join(root, assertion.file), "utf8");

  for (const snippet of assertion.snippets) {
    if (!source.includes(snippet)) {
      console.error(`Missing snippet "${snippet}" in ${assertion.file}`);
      process.exit(1);
    }
  }
}

console.log(`SAPTM capacity foundation validation passed: ${requiredFiles.length} files present.`);
