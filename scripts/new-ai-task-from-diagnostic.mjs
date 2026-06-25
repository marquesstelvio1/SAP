#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

let diagnosticPath = getArg("--diagnostic-path");
const taskId = getArg("--task-id");
let priority = getArg("--priority");

if (!diagnosticPath) {
  console.error(
    "Usage: new-ai-task-from-diagnostic.mjs --diagnostic-path <path> [--task-id <id>] [--priority <p>]",
  );
  process.exit(1);
}

if (!isAbsolute(diagnosticPath)) {
  diagnosticPath = join(repoRoot, diagnosticPath);
}

if (!existsSync(diagnosticPath)) {
  throw new Error(`Diagnostic not found: ${diagnosticPath}`);
}

const raw = readFileSync(diagnosticPath, "utf-8");

function getFrontMatterValue(content, key) {
  const pattern = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*(.+)$`, "m");
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

const domain = getFrontMatterValue(raw, "domain");
let title = getFrontMatterValue(raw, "title");
const severity = getFrontMatterValue(raw, "severity");

if (!domain) {
  throw new Error("Diagnostic is missing front matter value: domain");
}

if (!title) {
  title = diagnosticPath.replace(/\.md$/, "").split(/[/\\]/).pop();
}

if (!priority) {
  priority = severity || "medium";
}

const bundleScript = join(__dirname, "new-ai-task-bundle.mjs");
const bundleArgs = ["--domain", domain, "--feature", title, "--priority", priority];
if (taskId) {
  bundleArgs.push("--task-id", taskId);
}

execSync(`node ${bundleScript} ${bundleArgs.join(" ")}`, { stdio: "inherit" });
