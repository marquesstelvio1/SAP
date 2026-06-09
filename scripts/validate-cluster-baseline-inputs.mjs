import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/cluster-baseline.yml",
  "docs/devops/cluster-readiness.md",
  "docs/devops/tls-ingress-strategy.md",
  "scripts/render-cluster-baseline.mjs",
  "scripts/validate-cluster-baseline-inputs.mjs",
];

const requiredContent = {
  ".github/workflows/cluster-baseline.yml": [
    "SAPTM_ACME_EMAIL: $" + "{{ vars.SAPTM_ACME_EMAIL }}",
    "Render cluster baseline",
    "node scripts/render-cluster-baseline.mjs",
  ],
  "scripts/render-cluster-baseline.mjs": [
    "SAPTM_ACME_EMAIL",
    "platform@example.com",
    "example.com",
    "cert-manager-staging-issuer.yaml",
    "cert-manager-production-issuer.yaml",
    "replace(/email:",
  ],
  "docs/devops/cluster-readiness.md": [
    "SAPTM_ACME_EMAIL",
    "Render cluster baseline",
    "ClusterIssuer",
  ],
  "docs/devops/tls-ingress-strategy.md": [
    "SAPTM_ACME_EMAIL",
    "render-cluster-baseline",
    "ClusterIssuer",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing cluster baseline input foundation files:");
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
  console.error("Cluster baseline input foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM cluster baseline input validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
