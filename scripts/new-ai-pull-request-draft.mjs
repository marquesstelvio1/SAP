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
const title = getArg("--title");
const commitType = getArg("--commit-type") || "feat";
const summary = getArg("--summary") || "AI-generated delivery artifact";

if (!domain || !taskId || !title) {
  console.error(
    "Usage: new-ai-pull-request-draft.mjs --domain <domain> --task-id <id> --title <title> [--commit-type <type>] [--summary <text>]",
  );
  process.exit(1);
}

function toSlug(value) {
  let slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  if (slug.length > 32) {
    slug = slug.slice(0, 32).replace(/-+$/g, "");
  }
  return slug;
}

const prDir = join(repoRoot, ".ai", "reports", "pr-drafts");
const commitDir = join(repoRoot, ".ai", "commits");
const slug = toSlug(title);
const branchName = `${commitType}/${domain}/${taskId.toLowerCase()}-${slug}`;
const commitSummary = `${commitType}(${domain}): ${summary}`;
const prPath = join(prDir, `${taskId}-pr.md`);
const commitPath = join(commitDir, `${taskId}.commit.md`);

mkdirSync(prDir, { recursive: true });
mkdirSync(commitDir, { recursive: true });

const prContent = `# ${title}

## Context

AI-generated PR draft for task ${taskId}.

## Linked task

- ${taskId}

## Change summary

${summary}

## Impacted domains

- ${domain}

## Validation

- tests generated or updated
- docs generated or updated
- governance gates checked

## Risk

- review domain-specific rules before merge

## Rollout and rollback

- Branch: ${branchName}
- Rollback: revert commit and redeploy previous known-good state
`;

const commitContent = `${commitSummary}

Task: ${taskId}
Branch: ${branchName}
Validation: tests, docs, changelog, and governance review expected
`;

writeFileSync(prPath, prContent, "utf-8");
writeFileSync(commitPath, commitContent, "utf-8");

console.log(prPath);
console.log(commitPath);
