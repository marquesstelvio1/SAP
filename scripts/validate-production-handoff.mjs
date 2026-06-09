import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/container-ci.yml",
  ".github/workflows/cluster-baseline.yml",
  ".github/workflows/environment-deploy.yml",
  ".github/workflows/environment-rollback.yml",
  "deploy/kubernetes/base/kustomization.yaml",
  "deploy/kubernetes/base/database-backup-cronjob.yaml",
  "deploy/kubernetes/cluster/admission-policies.yaml",
  "deploy/kubernetes/external-secrets/runtime-secrets.external-secret.example.yaml",
  "deploy/kubernetes/observability/kustomization.yaml",
  "deploy/kubernetes/overlays/staging/kustomization.yaml",
  "deploy/kubernetes/overlays/production/kustomization.yaml",
  "docs/devops/container-registry.md",
  "docs/devops/disaster-recovery-strategy.md",
  "docs/devops/external-secrets-strategy.md",
  "docs/devops/production-cutover-handoff.md",
  "docs/devops/production-inputs.md",
  "docs/devops/runtime-readiness.md",
  "docs/devops/tls-ingress-strategy.md",
  "docs/observability/alert-routing.md",
  "docs/runbooks/release-runbook.md",
  "docs/security/admission-control.md",
  "docs/security/network-policy.md",
  "scripts/cluster-preflight.mjs",
  "scripts/render-kubernetes-environment.mjs",
  "scripts/smoke-runtime.mjs",
];

const requiredContent = {
  "docs/devops/production-cutover-handoff.md": [
    "Environment Owner Inputs",
    "Registry Evidence",
    "Secrets Evidence",
    "Cluster Evidence",
    "DNS/TLS Evidence",
    "Observability Evidence",
    "Backup/DR Evidence",
    "Security/Load Evidence",
    "Cutover Sequence",
    "No-Go Conditions",
    "pnpm validate:production-handoff",
  ],
  "docs/runbooks/release-runbook.md": [
    "pnpm validate:production-handoff",
    "Production cutover handoff",
  ],
  "package.json": ["validate:production-handoff"],
  ".github/workflows/container-ci.yml": ["provenance: true", "sbom: true", "cosign verify"],
  ".github/workflows/environment-deploy.yml": [
    "node scripts/render-kubernetes-environment.mjs",
    "pnpm db:migrate:deploy",
    "node scripts/smoke-runtime.mjs",
  ],
  "scripts/smoke-runtime.mjs": ["/health/live", "/health/ready", "/api/health", "/metrics"],
  "docs/devops/production-inputs.md": [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_API_URL",
    "GHCR_IMAGE_NAMESPACE",
  ],
  "docs/devops/external-secrets-strategy.md": [
    "saptm-runtime-secrets",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
  ],
  "docs/devops/tls-ingress-strategy.md": ["TLS", "cert-manager", "production"],
  "docs/observability/alert-routing.md": ["Alertmanager", "escalation"],
  "docs/devops/disaster-recovery-strategy.md": ["RPO", "RTO", "Restore"],
  "docs/security/network-policy.md": ["NetworkPolicy", "production"],
  "docs/security/admission-control.md": ["admission", "production"],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing production handoff files:");
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
  console.error("Production handoff content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM production handoff validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
