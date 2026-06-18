import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/cluster-baseline.yml",
  ".github/workflows/environment-deploy.yml",
  ".github/workflows/environment-rollback.yml",
  "deploy/kubernetes/base/kustomization.yaml",
  "deploy/kubernetes/base/runtime-config.yaml",
  "deploy/kubernetes/base/resource-quota.yaml",
  "deploy/kubernetes/base/limit-range.yaml",
  "deploy/kubernetes/base/api-deployment.yaml",
  "deploy/kubernetes/base/api-service.yaml",
  "deploy/kubernetes/base/api-hpa.yaml",
  "deploy/kubernetes/base/api-pdb.yaml",
  "deploy/kubernetes/base/web-deployment.yaml",
  "deploy/kubernetes/base/web-service.yaml",
  "deploy/kubernetes/base/web-hpa.yaml",
  "deploy/kubernetes/base/web-pdb.yaml",
  "deploy/kubernetes/base/ingress.yaml",
  "deploy/kubernetes/overlays/staging/kustomization.yaml",
  "deploy/kubernetes/overlays/staging/runtime-config-patch.yaml",
  "deploy/kubernetes/overlays/staging/resource-quota-patch.yaml",
  "deploy/kubernetes/overlays/staging/ingress-patch.yaml",
  "deploy/kubernetes/overlays/staging/api-deployment-patch.yaml",
  "deploy/kubernetes/overlays/staging/web-deployment-patch.yaml",
  "deploy/kubernetes/overlays/staging/api-hpa-patch.yaml",
  "deploy/kubernetes/overlays/staging/web-hpa-patch.yaml",
  "deploy/kubernetes/overlays/production/kustomization.yaml",
  "deploy/kubernetes/overlays/production/runtime-config-patch.yaml",
  "deploy/kubernetes/overlays/production/resource-quota-patch.yaml",
  "deploy/kubernetes/overlays/production/ingress-patch.yaml",
  "deploy/kubernetes/overlays/production/api-deployment-patch.yaml",
  "deploy/kubernetes/overlays/production/web-deployment-patch.yaml",
  "deploy/kubernetes/overlays/production/api-hpa-patch.yaml",
  "deploy/kubernetes/overlays/production/web-hpa-patch.yaml",
  "deploy/kubernetes/overlays/production/api-pdb-patch.yaml",
  "deploy/kubernetes/overlays/production/web-pdb-patch.yaml",
  "docs/devops/environment-strategy.md",
  "docs/devops/secrets-strategy.md",
  "docs/devops/smoke-test-strategy.md",
  "docs/runbooks/rollback-runbook.md",
  "scripts/render-kubernetes-environment.mjs",
  "scripts/smoke-runtime.mjs",
  "scripts/cluster-preflight.mjs",
];

const requiredContent = {
  ".github/workflows/environment-deploy.yml": [
    "workflow_dispatch:",
    "environment: $" + "{{ inputs.environment }}",
    "KUBE_CONFIG_B64",
    "Run cluster preflight",
    "SAPTM_PREFLIGHT_SCOPE: app",
    "node scripts/cluster-preflight.mjs",
    "Render environment Kubernetes overlay",
    "node scripts/render-kubernetes-environment.mjs",
    "pnpm db:migrate:deploy",
    "kubectl apply -k deploy/kubernetes/overlays/$" + "{{ inputs.environment }}",
    "Verify required runtime secret",
    "kubectl get secret saptm-runtime-secrets",
    "kubectl set image deployment/saptm-api",
    "kubectl rollout status deployment/saptm-web",
    "node scripts/smoke-runtime.mjs",
    "Capture rollout state on failure",
  ],
  ".github/workflows/environment-rollback.yml": [
    "workflow_dispatch:",
    "kubectl rollout undo",
    "kubectl rollout status",
    "target_revision",
  ],
  ".github/workflows/cluster-baseline.yml": [
    "workflow_dispatch:",
    "SAPTM_PREFLIGHT_SCOPE: cluster",
    "deploy/kubernetes/cluster/admission-policies.yaml",
  ],
  "scripts/smoke-runtime.mjs": [
    "/health/live",
    "/health/ready",
    "/metrics",
    "/api/health",
    "process_uptime_seconds",
  ],
  "scripts/render-kubernetes-environment.mjs": [
    "DEPLOY_ENVIRONMENT",
    "SAPTM_WEB_URL",
    "SAPTM_API_URL",
    "example.com",
    "replaceAll",
  ],
  "deploy/kubernetes/base/api-deployment.yaml": [
    "ghcr.io/example/saptm/api:sha-placeholder",
    "readinessProbe:",
    "path: /health/ready",
    "secretRef:",
    "name: saptm-runtime-secrets",
    "readOnlyRootFilesystem: true",
    "topologySpreadConstraints:",
  ],
  "deploy/kubernetes/base/web-deployment.yaml": [
    "ghcr.io/example/saptm/web:sha-placeholder",
    "path: /api/health",
    "secretRef:",
    "name: saptm-runtime-secrets",
    "readOnlyRootFilesystem: true",
    "topologySpreadConstraints:",
  ],
  "deploy/kubernetes/base/kustomization.yaml": [
    "resource-quota.yaml",
    "limit-range.yaml",
    "api-hpa.yaml",
    "api-pdb.yaml",
    "web-hpa.yaml",
    "web-pdb.yaml",
  ],
  "deploy/kubernetes/base/resource-quota.yaml": [
    "kind: ResourceQuota",
    "requests.cpu",
    "limits.memory",
    "requests.storage",
  ],
  "deploy/kubernetes/base/limit-range.yaml": [
    "kind: LimitRange",
    "defaultRequest:",
    "maxLimitRequestRatio:",
  ],
  "deploy/kubernetes/overlays/staging/kustomization.yaml": [
    "namespace: saptm-staging",
    "resource-quota-patch.yaml",
    "newTag: sha-placeholder",
  ],
  "deploy/kubernetes/overlays/production/kustomization.yaml": [
    "namespace: saptm-production",
    "resource-quota-patch.yaml",
    "newTag: sha-placeholder",
  ],
  "deploy/kubernetes/overlays/staging/resource-quota-patch.yaml": [
    'requests.cpu: "2"',
    'pods: "10"',
  ],
  "deploy/kubernetes/overlays/production/resource-quota-patch.yaml": [
    'requests.cpu: "8"',
    'pods: "40"',
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing deployment foundation files:");
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
  console.error("Deployment foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM deployment validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
