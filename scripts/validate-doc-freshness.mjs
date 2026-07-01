#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

const DOCS_DIR = join(process.cwd(), "docs");
const AI_DIR = join(process.cwd(), ".ai");
const MAX_AGE_DAYS = 30;
const now = Date.now();

let hasStale = false;
let hasDrift = false;
const issues = [];

function walkDir(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith(".md")) {
      const st = statSync(fullPath);
      const ageDays = (now - st.mtimeMs) / (1000 * 60 * 60 * 24);
      if (ageDays > MAX_AGE_DAYS) {
        const relPath = relative(process.cwd(), fullPath);
        issues.push(
          `STALE: ${relPath} is ${Math.round(ageDays)} days old (> ${MAX_AGE_DAYS} days)`,
        );
        hasStale = true;
      }
    }
  }
}

function detectArchitectureDrift() {
  const archDir = join(DOCS_DIR, "architecture");
  if (!existsSync(archDir)) {
    issues.push("DRIFT: docs/architecture/ directory missing — architecture docs do not exist");
    hasDrift = true;
    return;
  }

  const appModules = existsSync(join(process.cwd(), "apps", "api", "src", "modules"))
    ? readdirSync(join(process.cwd(), "apps", "api", "src", "modules"), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  const docModules = [];
  if (existsSync(archDir)) {
    const entries = readdirSync(archDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = readFileSync(join(archDir, entry.name), "utf-8");
        const moduleMatches = content.matchAll(/module['"]?:\s*['"](\w+)['"]/g);
        for (const m of moduleMatches) docModules.push(m[1]);
      }
    }
  }

  for (const mod of appModules) {
    if (!docModules.includes(mod) && mod !== "common" && mod !== "app") {
      issues.push(`DRIFT: Module "${mod}" exists in apps/api/src/modules but not documented`);
      hasDrift = true;
    }
  }
}

function detectDependencyDrift() {
  const standardsDir = join(DOCS_DIR, "standards");
  if (!existsSync(standardsDir)) return;

  const pkgPath = join(process.cwd(), "pnpm-workspace.yaml");
  if (!existsSync(pkgPath)) return;

  const workspaceYaml = readFileSync(pkgPath, "utf-8");
  const catalogMatch = workspaceYaml.match(/catalog:\s*\n([\s\S]*?)(?=\n\w|\n$)/);
  if (!catalogMatch) return;

  const catalogDeps = catalogMatch[1].matchAll(/\s+(\S+):\s*['"]([^'"]+)['"]/g);
  const standardFiles = readdirSync(standardsDir, { withFileTypes: true }).filter(
    (e) => e.isFile() && e.name.endsWith(".md"),
  );

  for (const dep of catalogDeps) {
    const depName = dep[1];
    for (const file of standardFiles) {
      const content = readFileSync(join(standardsDir, file.name), "utf-8");
      if (content.includes(depName)) {
        const versionMatch = content.match(new RegExp(`${depName}[^\\n]*?(\\d+\\.\\d+\\.\\d+)`));
        if (versionMatch && versionMatch[1] !== dep[2]) {
          issues.push(
            `DRIFT: ${basename(file.name, ".md")} mentions ${depName}@${versionMatch[1]} but catalog has ${dep[2]}`,
          );
          hasDrift = true;
        }
      }
    }
  }
}

function detectDatabaseDrift() {
  const schemaPath = join(process.cwd(), "packages", "database", "prisma", "schema.prisma");
  const dbDocsDir = join(DOCS_DIR, "architecture");
  if (!existsSync(schemaPath) || !existsSync(dbDocsDir)) return;

  const schema = readFileSync(schemaPath, "utf-8");
  const modelNames = schema.matchAll(/^model\s+(\w+)/gm);
  const models = [...modelNames].map((m) => m[1]);

  const dbDoc = join(dbDocsDir, "database.md");
  if (existsSync(dbDoc)) {
    const content = readFileSync(dbDoc, "utf-8");
    for (const model of models) {
      if (!content.includes(model)) {
        issues.push(
          `DRIFT: Prisma model "${model}" not mentioned in docs/architecture/database.md`,
        );
        hasDrift = true;
      }
    }
  }
}

function detectBusinessRuleDrift() {
  const brDir = join(DOCS_DIR, "business-rules");
  if (!existsSync(brDir)) return;

  const permissionsPath = join(process.cwd(), "packages", "auth", "src", "permissions.ts");
  if (!existsSync(permissionsPath)) return;

  const content = readFileSync(permissionsPath, "utf-8");
  const permMatches = content.matchAll(/["']([a-z_]+\.[a-z_]+(?:\.[a-z_]+)*)["']/g);
  const platformPermissions = [...new Set([...permMatches].map((m) => m[1]))];

  if (platformPermissions.length > 0) {
    const brFiles = readdirSync(brDir, { withFileTypes: true }).filter((e) =>
      e.name.endsWith(".md"),
    );
    const brContent = brFiles.map((f) => readFileSync(join(brDir, f.name), "utf-8")).join("\n");
    for (const perm of platformPermissions) {
      if (!brContent.includes(perm)) {
        issues.push(
          `DRIFT: Permission "${perm}" defined in permissions.ts but not documented in docs/business-rules/`,
        );
        hasDrift = true;
      }
    }
  }
}

function detectCiCdDrift() {
  const workflowDir = join(process.cwd(), ".github", "workflows");
  const deployDoc = join(DOCS_DIR, "architecture", "deployment.md");
  if (!existsSync(workflowDir) || !existsSync(deployDoc)) return;

  const workflows = readdirSync(workflowDir).filter(
    (f) => f.endsWith(".yml") || f.endsWith(".yaml"),
  );
  const docContent = readFileSync(deployDoc, "utf-8");

  const nameMappings = {
    "platform-ci": ["Platform CI"],
    "container-ci": ["Container CI"],
    "ai-ci": ["AI CI"],
    "ai-release": ["AI Release"],
    "cluster-baseline": ["Cluster Baseline"],
    "environment-deploy": ["Environment Deploy"],
    "environment-rollback": ["Environment Rollback"],
    "observability-deploy": ["Observability Deploy"],
    "ai-backlog-sync": ["AI Backlog Sync"],
    "docs-freshness": ["Documentation Freshness", "Docs Freshness"],
  };

  for (const wf of workflows) {
    const wfName = wf.replace(".yml", "").replace(".yaml", "");
    const variants = nameMappings[wfName] || [
      wfName,
      wfName.replace(/-/g, " "),
      wfName.replace(/-/g, "_"),
    ];
    const isDocd = variants.some((v) => docContent.toLowerCase().includes(v.toLowerCase()));
    if (!isDocd) {
      issues.push(`DRIFT: CI workflow "${wf}" not mentioned in docs/architecture/deployment.md`);
      hasDrift = true;
    }
  }
}

console.log("🔍 Validating documentation freshness...\n");

walkDir(DOCS_DIR);
walkDir(AI_DIR);
detectArchitectureDrift();
detectDependencyDrift();
detectDatabaseDrift();
detectBusinessRuleDrift();
detectCiCdDrift();

for (const issue of issues) {
  console.warn(`  ${issue}`);
}

console.log(
  `\n📊 Results: ${issues.length} issue(s), ${hasStale ? "stale" : "fresh"}, ${hasDrift ? "drift detected" : "no drift"}`,
);

if (hasDrift && process.env.CI) {
  console.error("\n❌ Documentation drift detected in CI. Update docs or add exceptions.");
  process.exit(1);
}

if (hasStale) {
  console.warn("\n⚠️  Some documentation is stale. Consider reviewing.");
}

if (!hasStale && !hasDrift) {
  console.log("\n✅ All documentation is fresh and aligned with the codebase.");
}
