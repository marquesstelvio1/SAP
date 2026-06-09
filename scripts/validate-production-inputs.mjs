import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/environment-deploy.yml",
  "docs/devops/production-inputs.md",
  "docs/devops/tls-ingress-strategy.md",
  "scripts/render-kubernetes-environment.mjs",
  "scripts/validate-production-inputs.mjs",
];

const requiredContent = {
  ".github/workflows/environment-deploy.yml": [
    "SAPTM_API_URL: $" + "{{ vars.NEXT_PUBLIC_API_URL }}",
    "SAPTM_WEB_URL: $" + "{{ vars.NEXT_PUBLIC_APP_URL }}",
    "Render environment Kubernetes overlay",
    "node scripts/render-kubernetes-environment.mjs",
  ],
  "scripts/render-kubernetes-environment.mjs": [
    "DEPLOY_ENVIRONMENT",
    "SAPTM_WEB_URL",
    "SAPTM_API_URL",
    "example.com",
    "must use https",
    "replaceAll",
    "runtime-config-patch.yaml",
    "ingress-patch.yaml",
  ],
  "docs/devops/production-inputs.md": [
    "Production Inputs",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_API_URL",
    "Render Contract",
    "Acceptance Criteria",
  ],
  "docs/devops/tls-ingress-strategy.md": [
    "environment URL variables",
    "render-kubernetes-environment",
    "example.com",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing production inputs foundation files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const missingNeedles = [];

for (const [file, needles] of Object.entries(requiredContent)) {
  const source = readFileSync(join(root, file), "utf8");

  for (const needle of needles) {
    if (!source.includes(needle)) {
      missingNeedles.push(`${file}: ${needle}`);
    }
  }
}

if (missingNeedles.length > 0) {
  console.error("Production inputs foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM production inputs validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
