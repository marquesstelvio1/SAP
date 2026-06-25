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
const summary = getArg("--summary") || "Update technical memory and operational guidance";

if (!domain || !taskId) {
  console.error(
    "Usage: new-ai-documentation-pack.mjs --domain <domain> --task-id <id> [--summary <text>]",
  );
  process.exit(1);
}

const outputDir = join(repoRoot, ".ai", "reports", "docs");
const outputPath = join(outputDir, `${taskId}-docs.md`);

mkdirSync(outputDir, { recursive: true });

const content = `# Documentation Pack - ${taskId}

## Summary

${summary}

## Updated architecture

- confirm whether the domain flow for ${domain} changed
- record new dependencies or boundaries

## Updated business rules

- confirm whether docs/business-rules/global.md or domain rules require an update

## Updated runbooks

- add rollout, rollback, and operational notes when needed

## Follow-up docs

- user-facing docs if behavior changed
- observability docs if metrics or alerts changed
`;

writeFileSync(outputPath, content, "utf-8");
console.log(outputPath);
