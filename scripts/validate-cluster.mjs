import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/cluster-baseline.yml",
  ".github/workflows/environment-deploy.yml",
  ".github/workflows/observability-deploy.yml",
  "deploy/kubernetes/cluster/admission-policies.yaml",
  "deploy/kubernetes/cluster/cert-manager-production-issuer.yaml",
  "deploy/kubernetes/cluster/cert-manager-staging-issuer.yaml",
  "docs/devops/cluster-readiness.md",
  "docs/security/admission-control.md",
  "scripts/cluster-preflight.mjs",
  "scripts/render-cluster-baseline.mjs",
];

const requiredContent = {
  ".github/workflows/cluster-baseline.yml": [
    "workflow_dispatch:",
    "environment: $" + "{{ inputs.environment }}",
    "KUBE_CONFIG_B64",
    "SAPTM_PREFLIGHT_SCOPE: cluster",
    "node scripts/cluster-preflight.mjs",
    "SAPTM_ACME_EMAIL",
    "Render cluster baseline",
    "node scripts/render-cluster-baseline.mjs",
    "deploy/kubernetes/cluster/cert-manager-staging-issuer.yaml",
    "deploy/kubernetes/cluster/cert-manager-production-issuer.yaml",
    "deploy/kubernetes/cluster/admission-policies.yaml",
  ],
  ".github/workflows/environment-deploy.yml": [
    "Run cluster preflight",
    "SAPTM_PREFLIGHT_SCOPE: app",
    "node scripts/cluster-preflight.mjs",
  ],
  ".github/workflows/observability-deploy.yml": [
    "Setup Node.js",
    "Run cluster preflight",
    "SAPTM_PREFLIGHT_SCOPE: observability",
    "node scripts/cluster-preflight.mjs",
  ],
  "scripts/cluster-preflight.mjs": [
    "SAPTM_PREFLIGHT_SCOPE",
    "resourcequotas",
    "limitranges",
    "networkpolicies",
    "horizontalpodautoscalers",
    "poddisruptionbudgets",
    "clusterissuers",
    "externalsecrets",
    "validatingadmissionpolicies",
    "saptm-deployment-security",
    "saptm-service-exposure",
  ],
  "scripts/render-cluster-baseline.mjs": [
    "SAPTM_ACME_EMAIL",
    "platform@example.com",
    "cert-manager-production-issuer.yaml",
  ],
  "deploy/kubernetes/cluster/admission-policies.yaml": [
    "kind: ValidatingAdmissionPolicy",
    "name: saptm-deployment-security",
    "name: saptm-service-exposure",
    "ValidatingAdmissionPolicyBinding",
    "sha-",
    "runAsNonRoot",
    "readOnlyRootFilesystem",
    "LoadBalancer",
  ],
  "docs/devops/cluster-readiness.md": [
    "Cluster Readiness",
    "Required Cluster Capabilities",
    "Preflight Scopes",
    "Acceptance Criteria",
  ],
  "docs/security/admission-control.md": [
    "Admission Control",
    "saptm-deployment-security",
    "saptm-service-exposure",
    "Acceptance Criteria",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing cluster foundation files:");
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
  console.error("Cluster foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM cluster validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
