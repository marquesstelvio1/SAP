#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const title = getArg("--title");
const severity = getArg("--severity") || "medium";
const impact = getArg("--impact");
const evidence = getArg("--evidence");
const recommendedAction =
  getArg("--recommended-action") || "Generate task bundle and route through governance gates.";
let diagnosticId = getArg("--diagnostic-id");

if (!domain || !title || !impact || !evidence) {
  console.error(
    "Usage: new-ai-diagnostic.mjs --domain <domain> --title <title> --impact <impact> --evidence <evidence> [--severity critical|high|medium|low] [--diagnostic-id <id>]",
  );
  process.exit(1);
}

const manifestPath = join(repoRoot, ".ai", "operating-system.json");
if (!existsSync(manifestPath)) {
  throw new Error(`Missing operating system manifest at ${manifestPath}`);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const domains = Object.keys(manifest.domains);

if (!domains.includes(domain)) {
  throw new Error(`Unknown domain '${domain}'. Allowed values: ${domains.join(", ")}`);
}

if (!diagnosticId) {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  diagnosticId = `DIAG-${ts}`;
}

const ownerAgent = manifest.domains[domain].ownerAgent;
const outputDir = join(repoRoot, "docs", "diagnostics", "domains");
const outputPath = join(outputDir, `${diagnosticId}-${domain}.md`);

mkdirSync(outputDir, { recursive: true });

const content = `---
id: ${diagnosticId}
domain: ${domain}
severity: ${severity}
ownerAgent: ${ownerAgent}
title: ${title}
---

# ${diagnosticId} - ${title}

## Domain

${domain}

## Severity

${severity}

## Impact

${impact}

## Evidence

${evidence}

## Recommended action

${recommendedAction}

## Suggested task conversion

Run:

\`\`\`
node scripts/new-ai-task-from-diagnostic.mjs --diagnostic-path "${outputPath}"
\`\`\`
`;

writeFileSync(outputPath, content, "utf-8");
console.log(outputPath);
