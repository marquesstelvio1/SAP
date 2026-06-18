import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "deploy/kubernetes/base/ingress.yaml",
  "deploy/kubernetes/cluster/cert-manager-production-issuer.yaml",
  "deploy/kubernetes/cluster/cert-manager-staging-issuer.yaml",
  "deploy/kubernetes/overlays/production/ingress-patch.yaml",
  "deploy/kubernetes/overlays/staging/ingress-patch.yaml",
  "docs/devops/tls-ingress-strategy.md",
  "scripts/render-cluster-baseline.mjs",
  "scripts/render-kubernetes-environment.mjs",
];

const requiredContent = {
  "deploy/kubernetes/base/ingress.yaml": ["nginx.ingress.kubernetes.io/ssl-redirect"],
  "deploy/kubernetes/overlays/staging/ingress-patch.yaml": [
    "cert-manager.io/cluster-issuer: letsencrypt-staging",
    "tls:",
    "saptm-staging-tls",
    "api.staging.saptm.example.com",
  ],
  "deploy/kubernetes/overlays/production/ingress-patch.yaml": [
    "cert-manager.io/cluster-issuer: letsencrypt-production",
    "tls:",
    "saptm-production-tls",
    "api.saptm.example.com",
  ],
  "scripts/render-kubernetes-environment.mjs": [
    "must use https",
    "example.com",
    "ingress-patch.yaml",
  ],
  "scripts/render-cluster-baseline.mjs": [
    "SAPTM_ACME_EMAIL",
    "platform@example.com",
    "cert-manager-production-issuer.yaml",
  ],
  "deploy/kubernetes/cluster/cert-manager-staging-issuer.yaml": [
    "kind: ClusterIssuer",
    "https://acme-staging-v02.api.letsencrypt.org/directory",
    "class: nginx",
  ],
  "deploy/kubernetes/cluster/cert-manager-production-issuer.yaml": [
    "kind: ClusterIssuer",
    "https://acme-v02.api.letsencrypt.org/directory",
    "class: nginx",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing TLS foundation files:");
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
  console.error("TLS foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM TLS validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
