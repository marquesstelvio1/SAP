#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const domain = getArg("--domain");
const taskId = getArg("--task-id");
const criticalPath = getArg("--critical-path") || "core journey";

if (!domain || !taskId) {
  console.error(
    "Usage: new-ai-test-plan.mjs --domain <domain> --task-id <id> [--critical-path <path>]",
  );
  process.exit(1);
}

const outputDir = join(repoRoot, ".ai", "reports", "tests");
const outputPath = join(outputDir, `${taskId}-test-plan.md`);

mkdirSync(outputDir, { recursive: true });

const content = `# Test Plan - ${taskId}

## Scope

- Domain: ${domain}
- Critical path: ${criticalPath}

## Critical paths

- happy path
- error handling
- permission and boundary checks
- rollback-sensitive behavior

## Test types

- unit
- integration
- smoke
- regression

## Required fixtures

- representative domain data
- failure mode inputs
- monitoring expectations for critical flows

## Automation strategy

- automate high-risk and repeated checks first
- keep smoke coverage for release protection

## Exit criteria

- critical-path checks pass
- no unresolved blocker remains
- residual risk is documented
`;

writeFileSync(outputPath, content, "utf-8");
console.log(outputPath);
