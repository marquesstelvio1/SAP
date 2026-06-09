import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/environment-deploy.yml",
  ".github/workflows/observability-deploy.yml",
  "deploy/kubernetes/base/api-network-policy.yaml",
  "deploy/kubernetes/base/kustomization.yaml",
  "deploy/kubernetes/base/web-network-policy.yaml",
  "deploy/kubernetes/external-secrets/alertmanager-config.external-secret.example.yaml",
  "deploy/kubernetes/external-secrets/cluster-secret-store.example.yaml",
  "deploy/kubernetes/external-secrets/observability-secrets.external-secret.example.yaml",
  "deploy/kubernetes/external-secrets/runtime-secrets.external-secret.example.yaml",
  "deploy/kubernetes/networking/restricted-egress-policy.example.yaml",
  "docs/devops/external-secrets-strategy.md",
  "docs/devops/secrets-strategy.md",
  "docs/security/network-policy.md",
];

const requiredContent = {
  ".github/workflows/environment-deploy.yml": [
    "Verify required runtime secret",
    "kubectl get secret saptm-runtime-secrets",
    "Apply Kubernetes overlay",
  ],
  ".github/workflows/observability-deploy.yml": [
    "KUBE_CONFIG_B64 secret is required.",
    "kubectl get secret saptm-observability-secrets",
    "kubectl get secret saptm-alertmanager-config",
  ],
  "deploy/kubernetes/base/kustomization.yaml": [
    "api-network-policy.yaml",
    "web-network-policy.yaml",
  ],
  "deploy/kubernetes/base/api-network-policy.yaml": [
    "kind: NetworkPolicy",
    "saptm-api-ingress",
    "app.kubernetes.io/component: api",
    "ingress-nginx",
    "saptm-observability",
    "app.kubernetes.io/component: web",
    "port: 4000",
  ],
  "deploy/kubernetes/base/web-network-policy.yaml": [
    "kind: NetworkPolicy",
    "saptm-web-ingress",
    "app.kubernetes.io/component: web",
    "ingress-nginx",
    "port: 3000",
  ],
  "deploy/kubernetes/networking/restricted-egress-policy.example.yaml": [
    "kind: NetworkPolicy",
    "saptm-restricted-egress-example",
    "DATABASE_HOST_CIDR",
    "EXTERNAL_SECRET_STORE_CIDR",
    "kube-dns",
    "saptm-observability",
  ],
  "deploy/kubernetes/external-secrets/cluster-secret-store.example.yaml": [
    "kind: ClusterSecretStore",
    "saptm-vault",
    "provider:",
    "vault:",
  ],
  "deploy/kubernetes/external-secrets/runtime-secrets.external-secret.example.yaml": [
    "kind: ExternalSecret",
    "saptm-runtime-secrets",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "saptm/<environment>/runtime",
  ],
  "deploy/kubernetes/external-secrets/observability-secrets.external-secret.example.yaml": [
    "kind: ExternalSecret",
    "saptm-observability-secrets",
    "GRAFANA_ADMIN_USER",
    "GRAFANA_ADMIN_PASSWORD",
    "saptm/<environment>/observability",
  ],
  "deploy/kubernetes/external-secrets/alertmanager-config.external-secret.example.yaml": [
    "kind: ExternalSecret",
    "saptm-alertmanager-config",
    "alertmanager.yml",
    "INCIDENT_WEBHOOK_URL",
    "saptm/<environment>/observability",
  ],
  "docs/devops/external-secrets-strategy.md": [
    "External Secrets Operator",
    "saptm-runtime-secrets",
    "saptm-observability-secrets",
    "saptm-alertmanager-config",
    "Acceptance Criteria",
  ],
  "docs/security/network-policy.md": [
    "Kubernetes Network Policy",
    "Applied Baseline",
    "Restricted Egress Template",
    "Acceptance Criteria",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing secrets/network foundation files:");
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
  console.error("Secrets/network foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM secrets/network validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
