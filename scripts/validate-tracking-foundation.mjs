import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/features/tracking-overview.md",
  "docs/governance/tracking-release-evidence.md",
  "packages/rpc/src/tracking.ts",
  "packages/rpc/tests/tracking.test.mjs",
  "packages/database/prisma/migrations/20260603193000_tracking_foundation/migration.sql",
  "packages/database/prisma/migrations/20260603210000_tracking_event_idempotency/migration.sql",
  "apps/api/src/tracking/tracking.module.ts",
  "apps/api/src/tracking/tracking.service.ts",
  "apps/api/src/tracking/tracking-rpc.router.ts",
  "apps/api/src/rpc/platform-rpc.router.ts",
  "apps/api/tests/tracking-rpc.test.mjs",
  "apps/web/app/(platform)/app/tracking/actions.ts",
  "apps/web/app/(platform)/app/tracking/form-state.ts",
  "apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx",
  "apps/web/components/tracking-exception-manage-form.tsx",
  "apps/web/components/tracking-exception-resolve-form.tsx",
  "apps/web/components/tracking-event-record-form.tsx",
  "apps/web/lib/tracking-advisory.ts",
  "apps/web/lib/tracking-analytics.ts",
  "apps/web/lib/tracking-shipment-detail.ts",
  "apps/web/lib/tracking-overview.ts",
  "apps/web/app/(platform)/app/tracking/page.tsx",
  "packages/ui/src/components/select-native.tsx",
  "packages/ui/src/components/textarea.tsx",
];

const requiredSnippets = [
  {
    file: "packages/auth/src/permissions.ts",
    snippets: [
      "tracking.shipment.read",
      "tracking.event.record",
      "tracking.exception.manage",
      "tracking.exception.resolve",
    ],
  },
  {
    file: "packages/database/src/rbac-bootstrap.ts",
    snippets: ["tenant.operations_manager", "tenant.operations_viewer"],
  },
  {
    file: "packages/rpc/src/tracking.ts",
    snippets: [
      "trackingOverviewMetadata",
      "trackingAdvisoryMetadata",
      "trackingAnalyticsMetadata",
      "trackingEventRecordMetadata",
      "trackingShipmentDetailMetadata",
      "trackingExceptionManageMetadata",
      "trackingExceptionResolveMetadata",
      "trackingOperatorEvidenceSchema",
      "trackingOperatorEvidenceTypes",
      "trackingApprovalStatuses",
      "trackingExceptionWorkflowStates",
      "organizationRequired: true",
      "tracking.shipment.read",
      "tracking.ai.advisory.read",
      "tracking.analytics.read",
      "tracking.event.record",
      "tracking.exception.manage",
      "tracking.exception.resolve",
      'idempotency: "required"',
      "trackingShipmentDetailOutputSchema",
      "trackingAdvisoryOutputSchema",
      "trackingAnalyticsOutputSchema",
      "trackingExceptionManageOutputSchema",
      "trackingExceptionResolveOutputSchema",
    ],
  },
  {
    file: "apps/api/src/tracking/tracking.service.ts",
    snippets: [
      "trackingShipment.groupBy",
      "trackingShipment.findMany",
      "getAdvisory",
      "rule_based_operational_advisor",
      "getAnalytics",
      "trackingEvent.groupBy",
      "modeDistribution",
      "getShipmentDetail",
      "manageException",
      "resolveException",
      "trackingEvent.create",
      "auditRecord.create",
      "outboxEvent.create",
      "idempotencyKey",
      "organizationId",
      "tracking.exception.managed",
      "tracking.exception.resolved",
      "operatorEvidence",
      "workflowState",
      "createOperatorEvidenceContext",
      "readOperatorEvidencePayload",
      "readNullableExceptionWorkflowState",
    ],
  },
  {
    file: "apps/api/src/tracking/tracking-rpc.router.ts",
    snippets: [
      "authorizeRequest",
      "trackingOverviewMetadata",
      "trackingAdvisoryMetadata",
      "trackingAnalyticsMetadata",
      "trackingEventRecordMetadata",
      "trackingShipmentDetailMetadata",
      "trackingExceptionManageMetadata",
      "trackingExceptionResolveMetadata",
      "/tracking/overview",
      "/tracking/advisory",
      "/tracking/analytics",
      "/tracking/events",
      "/tracking/shipmentDetail",
      "/tracking/exceptions",
      "/tracking/exceptionResolution",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/tracking/page.tsx",
    snippets: [
      "tracking.shipment.read",
      "tracking.event.record",
      "getTrackingOverview",
      "getTrackingAdvisory",
      "getTrackingAnalytics",
      "IA advisory",
      "Sem automacao direta",
      "Analytics operacional",
      "Workflow de excecoes",
      "TrackingEventRecordForm",
      "createTrackingShipmentRoute",
      "antes de qualquer CRUD",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/tracking/[shipmentId]/page.tsx",
    snippets: [
      "getTrackingShipmentDetail",
      "tracking.shipment.detail.read",
      "TrackingExceptionManageForm",
      "TrackingExceptionResolveForm",
      "tracking.exception.manage",
      "tracking.exception.resolve",
      "POST /rpc/tracking/exceptions",
      "POST /rpc/tracking/exceptionResolution",
      "Timeline de eventos",
      "Workflow final",
      "GET /rpc/tracking/shipmentDetail",
    ],
  },
  {
    file: "apps/web/components/tracking-exception-manage-form.tsx",
    snippets: [
      "useActionState",
      "idempotencyKey",
      "tracking.exception.manage",
      "Gerir excecao",
      "operatorName",
      "evidenceReference",
      "approvalStatus",
    ],
  },
  {
    file: "apps/web/components/tracking-exception-resolve-form.tsx",
    snippets: [
      "useActionState",
      "idempotencyKey",
      "tracking.exception.resolve",
      "Resolver excecao",
      "operatorName",
      "evidenceReference",
      "approvalReference",
    ],
  },
  {
    file: "apps/web/lib/tracking-advisory.ts",
    snippets: [
      "trackingAdvisoryOutputSchema",
      "/rpc/tracking/advisory",
      "url.searchParams.set",
      "advisory",
    ],
  },
  {
    file: "apps/web/lib/tracking-analytics.ts",
    snippets: [
      "trackingAnalyticsOutputSchema",
      "/rpc/tracking/analytics",
      "url.searchParams.set",
      "analytics",
    ],
  },
  {
    file: "apps/web/lib/tracking-shipment-detail.ts",
    snippets: [
      "trackingShipmentDetailOutputSchema",
      "/rpc/tracking/shipmentDetail",
      "url.searchParams.set",
      "data",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/tracking/actions.ts",
    snippets: [
      "recordTrackingEventAction",
      "manageTrackingExceptionAction",
      "resolveTrackingExceptionAction",
      "/rpc/tracking/events",
      "/rpc/tracking/exceptions",
      "/rpc/tracking/exceptionResolution",
      "trackingEventRecordInputSchema",
      "trackingEventRecordOutputSchema",
      "trackingExceptionManageInputSchema",
      "trackingExceptionManageOutputSchema",
      "trackingExceptionResolveInputSchema",
      "trackingExceptionResolveOutputSchema",
      "readOperatorEvidenceFormData",
      "revalidatePath",
    ],
  },
  {
    file: "apps/web/components/tracking-event-record-form.tsx",
    snippets: ["useActionState", "idempotencyKey", "SelectNative", "Textarea", "Registar evento"],
  },
  {
    file: "tests/e2e/runtime-health.spec.ts",
    snippets: [
      "toHaveScreenshot",
      "sign-in-page.png",
      "tracking-protected-redirect.png",
      "visual regression",
    ],
  },
];

const forbiddenRoutes = [
  "apps/web/app/(platform)/app/ports",
  "apps/web/app/(platform)/app/portos",
  "apps/web/app/(platform)/app/rail",
  "apps/web/app/(platform)/app/ferrovia",
  "apps/web/app/(platform)/app/analytics",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing tracking foundation files:");
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

console.log(`SAPTM tracking foundation validation passed: ${requiredFiles.length} files present.`);
