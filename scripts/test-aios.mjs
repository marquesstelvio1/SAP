#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const strict = process.argv.includes("--strict");
const failures = [];

const domains = [
  "frontend",
  "backend",
  "auth",
  "mobile",
  "infra",
  "qa",
  "observability",
  "performance",
  "design-system",
];

function addFailure(message) {
  failures.push(message);
}

function testRequiredPath(relativePath) {
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) {
    addFailure(`Missing required path: ${relativePath}`);
  }
}

function testJsonFile(relativePath) {
  const path = join(repoRoot, relativePath);
  testRequiredPath(relativePath);
  if (existsSync(path)) {
    try {
      JSON.parse(readFileSync(path, "utf-8"));
    } catch (err) {
      addFailure(`Invalid JSON: ${relativePath} - ${err.message}`);
    }
  }
}

function testPowerShellFile(relativePath) {
  // In Node.js we can't parse PowerShell, so just check the file exists
  testRequiredPath(relativePath);
}

const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  ".ai/operating-system.json",
  ".ai/automations/matrix.json",
  ".ai/agents/registry.json",
  ".ai/skills/registry.json",
  ".ai/rules/rule-index.json",
  ".ai/routing.json",
  ".ai/policies/risk-matrix.json",
  ".ai/policies/governance-gates.json",
  "docs/architecture/ai-engineering-os.md",
  "docs/governance/operating-model.md",
  "docs/standards/commit-standards.md",
  "docs/standards/branch-standards.md",
  "docs/standards/testing-standards.md",
  "docs/standards/documentation-standards.md",
  "docs/standards/security-standards.md",
  "docs/standards/observability-standards.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
];

for (const file of requiredFiles) {
  testRequiredPath(file);
}

const diagnosticsRoot = join(process.cwd(), "docs", "diagnostics");
if (!existsSync(diagnosticsRoot)) {
  addFailure("Missing required diagnostics directory: docs/diagnostics/");
}

const jsonFiles = [
  ".ai/operating-system.json",
  ".ai/automations/matrix.json",
  ".ai/agents/registry.json",
  ".ai/skills/registry.json",
  ".ai/rules/rule-index.json",
  ".ai/routing.json",
  ".ai/pipelines/diagnostic-pipeline.json",
  ".ai/pipelines/execution-pipeline.json",
  ".ai/pipelines/stabilization-pipeline.json",
  ".ai/policies/risk-matrix.json",
  ".ai/policies/governance-gates.json",
  ".ai/schemas/task.schema.json",
  ".ai/schemas/diagnostic.schema.json",
  ".ai/schemas/execution-report.schema.json",
  "workflows/diagnostic-to-backlog.json",
  "workflows/feature-delivery.json",
  "workflows/release-governance.json",
  "jira/task-payload-template.json",
  "linear/issue-payload-template.json",
];

for (const file of jsonFiles) {
  testJsonFile(file);
}

const scriptFiles = [
  "scripts/invoke-ai-workflow.mjs",
  "scripts/new-ai-task-bundle.mjs",
  "scripts/new-ai-test-plan.mjs",
  "scripts/new-ai-documentation-pack.mjs",
  "scripts/new-ai-pull-request-draft.mjs",
  "scripts/new-ai-changelog.mjs",
  "scripts/new-ai-diagnostic.mjs",
  "scripts/new-ai-task-from-diagnostic.mjs",
  "scripts/new-ai-governance-review.mjs",
  "scripts/test-aios.mjs",
];

for (const file of scriptFiles) {
  testPowerShellFile(file);
}

for (const domain of domains) {
  testRequiredPath(`docs/rules/domains/${domain}.md`);
  testRequiredPath(`docs/skills/domains/${domain}.md`);
  testRequiredPath(`docs/workflows/domains/${domain}.md`);
  testRequiredPath(`.ai/prompts/domains/${domain}.md`);
  testRequiredPath(`docs/diagnostics/domains/${domain}.md`);
  testRequiredPath(`.ai/tasks/${domain}`);
}

if (strict) {
  testRequiredPath(".git");
}

if (failures.length > 0) {
  console.log("AI OS validation failed:");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  process.exit(1);
}

console.log("AI OS validation passed.");
console.log(`Validated domains: ${domains.join(", ")}`);
