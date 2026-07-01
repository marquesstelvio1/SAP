#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const risk = getArg("--risk") || "medium";

if (!domain || !taskId) {
  console.error(
    "Usage: new-ai-governance-review.mjs --domain <domain> --task-id <id> [--risk critical|high|medium|low]",
  );
  process.exit(1);
}

const manifestPath = join(repoRoot, ".ai", "operating-system.json");
const gatesPath = join(repoRoot, ".ai", "policies", "governance-gates.json");
const riskPath = join(repoRoot, ".ai", "policies", "risk-matrix.json");
const outputDir = join(repoRoot, ".ai", "reports", "governance");
const outputPath = join(outputDir, `${taskId}-governance.md`);

mkdirSync(outputDir, { recursive: true });

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const gates = JSON.parse(readFileSync(gatesPath, "utf-8"));
const riskMatrix = JSON.parse(readFileSync(riskPath, "utf-8"));

if (!Object.keys(manifest.domains).includes(domain)) {
  throw new Error(`Unknown domain '${domain}'`);
}

const ownerAgent = manifest.domains[domain].ownerAgent;

const requiredGates = gates.gates.filter(
  (gate) =>
    gate.requiredFor.includes("all") ||
    gate.requiredFor.includes(domain) ||
    gate.requiredFor.includes(risk),
);

const riskConfig = riskMatrix.levels[risk];
const approvalText = riskConfig.approvalRequired ? "required" : "not required by default";
const releaseBlockerText = riskConfig.releaseBlocker ? "yes" : "no";

const gateLines = requiredGates.map((gate) => `- ${gate.name}: owner ${gate.owner}`);

const content = `# Governance Review - ${taskId}

## Domain

${domain}

## Owner agent

${ownerAgent}

## Risk

- Level: ${risk}
- Human approval: ${approvalText}
- Release blocker: ${releaseBlockerText}

## Required gates

${gateLines.join("\n")}

## Review checklist

- Scope is explicit.
- Contracts are protected.
- Auth and security impact is clear.
- Tests are planned or implemented.
- Docs and changelog are planned or updated.
- Release and rollback are known.

## Decision

Pending human or designated gate owner review.
`;

writeFileSync(outputPath, content, "utf-8");
console.log(outputPath);
