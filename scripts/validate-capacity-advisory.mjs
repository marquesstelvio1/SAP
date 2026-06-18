import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/features/capacity-optimization-advisory.md",
  "docs/features/capacity-advisory-decision.md",
  "docs/features/capacity-advisory-decision-analytics.md",
  "docs/governance/capacity-advisory-release-evidence.md",
  "docs/governance/capacity-advisory-decision-release-evidence.md",
  "docs/governance/capacity-advisory-decision-analytics-release-evidence.md",
  "packages/rpc/src/capacity.ts",
  "packages/rpc/tests/capacity.test.mjs",
  "packages/database/prisma/migrations/20260604230000_capacity_advisory_decision/migration.sql",
  "apps/api/src/capacity/capacity.service.ts",
  "apps/api/src/capacity/capacity-rpc.router.ts",
  "apps/api/tests/capacity-rpc.test.mjs",
  "apps/web/lib/capacity-advisory.ts",
  "apps/web/lib/capacity-advisory-decision-analytics.ts",
  "apps/web/app/(platform)/app/capacity/actions.ts",
  "apps/web/app/(platform)/app/capacity/form-state.ts",
  "apps/web/app/(platform)/app/capacity/page.tsx",
  "apps/web/components/capacity-advisory-decision-form.tsx",
];

const requiredSnippets = [
  {
    file: "packages/auth/src/permissions.ts",
    snippets: ["capacity.advisory.decide"],
  },
  {
    file: "packages/database/src/rbac-bootstrap.ts",
    snippets: ["capacity.advisory.decide", "tenant.operations_manager"],
  },
  {
    file: "packages/database/prisma/schema.prisma",
    snippets: [
      "enum CapacityAdvisoryRecommendationType",
      "enum CapacityAdvisoryDecisionStatus",
      "model CapacityAdvisoryDecision",
      "decisionIdempotencyKey",
      "@@unique([organizationId, recommendationId])",
    ],
  },
  {
    file: "packages/rpc/src/capacity.ts",
    snippets: [
      "capacityAdvisoryInputSchema",
      "capacityAdvisoryOutputSchema",
      "capacityAdvisoryRecommendationSchema",
      "capacityAdvisoryMetadata",
      "capacityAdvisoryDecisionRecordInputSchema",
      "capacityAdvisoryDecisionRecordOutputSchema",
      "capacityAdvisoryDecisionRecordMetadata",
      "capacityAdvisoryDecisionAnalyticsInputSchema",
      "capacityAdvisoryDecisionAnalyticsOutputSchema",
      "capacityAdvisoryDecisionAnalyticsMetadata",
      "capacity.optimization.advisory.read",
      "capacity.advisory.decision.record",
      "capacity.advisory.decision.analytics.read",
      "rule_based_capacity_optimizer",
      "capacity_advisory_decision_analytics",
      "Approved advisory decisions require an approval reference.",
      "humanApprovalRequired: z.literal(true)",
      "automationAllowed: z.literal(false)",
      "capacity.read",
      "capacity.advisory.decide",
    ],
  },
  {
    file: "apps/api/src/capacity/capacity.service.ts",
    snippets: [
      "getAdvisory",
      "recordAdvisoryDecision",
      "getAdvisoryDecisionAnalytics",
      "createCapacityAdvisoryDecisionAnalyticsOutput",
      "createCapacityAdvisoryRecommendations",
      "createCapacityAdvisoryCandidate",
      "resolveCapacityAdvisoryDecisionBusinessRules",
      "createCapacityAdvisoryDecisionRecordOutput",
      "capacity.advisory.decision.recorded",
      "calculateCapacityUtilizationPercent",
      "slot_saturation",
      "expiring_slot",
      "unused_capacity",
      "reservation_imbalance",
      "cancellation_review",
      "automationAllowed: false",
      "humanApprovalRequired: true",
      "rule_based_capacity_optimizer",
      "capacity_advisory_decision_analytics",
    ],
  },
  {
    file: "apps/api/src/capacity/capacity-rpc.router.ts",
    snippets: [
      "capacityAdvisoryMetadata",
      "capacityAdvisoryInputSchema",
      "capacityAdvisoryOutputSchema",
      "capacityAdvisoryDecisionRecordMetadata",
      "capacityAdvisoryDecisionRecordInputSchema",
      "capacityAdvisoryDecisionRecordOutputSchema",
      "capacityAdvisoryDecisionAnalyticsMetadata",
      "capacityAdvisoryDecisionAnalyticsInputSchema",
      "capacityAdvisoryDecisionAnalyticsOutputSchema",
      "/capacity/advisory",
      "/capacity/recordAdvisoryDecision",
      "/capacity/advisoryDecisionAnalytics",
      "getAdvisory",
      "recordAdvisoryDecision",
      "getAdvisoryDecisionAnalytics",
      "authorizeRequest",
    ],
  },
  {
    file: "packages/rpc/tests/capacity.test.mjs",
    snippets: [
      "capacity optimization advisory schemas validate human-approved recommendations",
      "capacity advisory decision contract requires human approval evidence",
      "capacity advisory decision analytics contract is read-only and governed",
      "capacity.optimization.advisory.read",
      "capacity.advisory.decision.record",
      "capacity.advisory.decision.analytics.read",
      "rule_based_capacity_optimizer",
    ],
  },
  {
    file: "apps/api/tests/capacity-rpc.test.mjs",
    snippets: [
      "capacity optimization advisory RPC authorizes read and delegates limit",
      "capacity advisory decision RPC delegates auditable human decision input",
      "capacity advisory decision analytics RPC authorizes read and delegates window",
      "client.capacity.advisory",
      "client.capacity.recordAdvisoryDecision",
      "client.capacity.advisoryDecisionAnalytics",
      "capacity.optimization.advisory.read",
      "capacity.advisory.decision.record",
      "capacity.advisory.decision.analytics.read",
    ],
  },
  {
    file: "apps/web/lib/capacity-advisory.ts",
    snippets: ["/rpc/capacity/advisory", "capacityAdvisoryOutputSchema", "getCapacityAdvisory"],
  },
  {
    file: "apps/web/lib/capacity-advisory-decision-analytics.ts",
    snippets: [
      "/rpc/capacity/advisoryDecisionAnalytics",
      "capacityAdvisoryDecisionAnalyticsOutputSchema",
      "getCapacityAdvisoryDecisionAnalytics",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/capacity/actions.ts",
    snippets: [
      "recordCapacityAdvisoryDecisionAction",
      "/rpc/capacity/recordAdvisoryDecision",
      "capacityAdvisoryDecisionRecordInputSchema",
      "capacity.advisory.decide",
      "revalidatePath",
    ],
  },
  {
    file: "apps/web/components/capacity-advisory-decision-form.tsx",
    snippets: [
      "CapacityAdvisoryDecisionForm",
      "capacity.advisory.decide",
      "Registar decisao de advisory",
      "nao executa comandos operacionais",
    ],
  },
  {
    file: "apps/web/app/(platform)/app/capacity/page.tsx",
    snippets: [
      "getCapacityAdvisory",
      "getCapacityAdvisoryDecisionAnalytics",
      "CapacityAdvisoryDecisionForm",
      "Capacity advisory",
      "Analytics de decisoes de advisory",
      "capacity.optimization.advisory.read",
      "capacity.advisory.decision.analytics.read",
      "capacity.advisory.decide",
      "GET /rpc/capacity/advisory",
      "Sem automacao direta",
    ],
  },
  {
    file: "docs/features/capacity-optimization-advisory.md",
    snippets: [
      "Capacity Optimization Advisory",
      "capacity.optimization.advisory.read",
      "rule_based_capacity_optimizer",
      "No autonomous execution",
    ],
  },
  {
    file: "docs/features/capacity-advisory-decision.md",
    snippets: [
      "Capacity Advisory Decision",
      "capacity.advisory.decision.record",
      "capacity.advisory.decide",
      "No autonomous execution",
    ],
  },
  {
    file: "docs/features/capacity-advisory-decision-analytics.md",
    snippets: [
      "Capacity Advisory Decision Analytics",
      "capacity.advisory.decision.analytics.read",
      "GET /rpc/capacity/advisoryDecisionAnalytics",
      "No operational capacity command is executed automatically",
    ],
  },
  {
    file: "docs/governance/capacity-advisory-release-evidence.md",
    snippets: [
      "Capacity Advisory Release Evidence",
      "pnpm validate:capacity-advisory",
      "human approval",
      "/app/capacity",
    ],
  },
  {
    file: "docs/governance/capacity-advisory-decision-release-evidence.md",
    snippets: [
      "Capacity Advisory Decision Release Evidence",
      "capacity.advisory.decision.record",
      "capacity.advisory.decide",
      "No operational capacity command is executed automatically",
    ],
  },
  {
    file: "docs/governance/capacity-advisory-decision-analytics-release-evidence.md",
    snippets: [
      "Capacity Advisory Decision Analytics Release Evidence",
      "capacity.advisory.decision.analytics.read",
      "GET /rpc/capacity/advisoryDecisionAnalytics",
      "No operational capacity command is executed automatically",
    ],
  },
];

const forbiddenSnippets = [
  {
    file: "apps/api/src/capacity/capacity.service.ts",
    snippets: ["auditRecord.create({", "outboxEvent.create({", "capacity.optimization.executed"],
  },
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing capacity advisory files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
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

const serviceSource = readFileSync(join(root, "apps/api/src/capacity/capacity.service.ts"), "utf8");
const advisoryStart = serviceSource.indexOf("async getAdvisory(");
const advisoryEnd = serviceSource.indexOf("async registerResource(", advisoryStart);
const advisorySource = serviceSource.slice(advisoryStart, advisoryEnd);

for (const assertion of forbiddenSnippets) {
  for (const snippet of assertion.snippets) {
    if (advisorySource.includes(snippet)) {
      console.error(`Forbidden advisory mutation snippet "${snippet}" in ${assertion.file}`);
      process.exit(1);
    }
  }
}

console.log(`SAPTM capacity advisory validation passed: ${requiredFiles.length} files present.`);
