import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/container-ci.yml",
  "docs/devops/container-registry.md",
  "docs/devops/supply-chain-security.md",
];

const requiredContent = {
  ".github/workflows/container-ci.yml": [
    "id-token: write",
    "provenance: true",
    "sbom: true",
    "aquasecurity/trivy-action@0.28.0",
    "severity: CRITICAL,HIGH",
    "ignore-unfixed: true",
    "Upload vulnerability scan report",
    "sigstore/cosign-installer@v3",
    "cosign sign --yes",
    "cosign verify",
    "https://token.actions.githubusercontent.com",
  ],
  "docs/devops/container-registry.md": [
    "SBOM/provenance",
    "Trivy",
    "Cosign",
    "docs/devops/supply-chain-security.md",
  ],
  "docs/devops/supply-chain-security.md": [
    "Supply Chain Security",
    "Vulnerability Policy",
    "Signing Policy",
    "Acceptance Criteria",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing supply chain foundation files:");
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
  console.error("Supply chain foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM supply chain validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
