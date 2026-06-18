import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "deploy/kubernetes/base/resource-quota.yaml",
  "deploy/kubernetes/base/limit-range.yaml",
  "deploy/kubernetes/base/kustomization.yaml",
  "deploy/kubernetes/overlays/staging/resource-quota-patch.yaml",
  "deploy/kubernetes/overlays/staging/kustomization.yaml",
  "deploy/kubernetes/overlays/production/resource-quota-patch.yaml",
  "deploy/kubernetes/overlays/production/kustomization.yaml",
  "deploy/kubernetes/observability/resource-quota.yaml",
  "deploy/kubernetes/observability/limit-range.yaml",
  "deploy/kubernetes/observability/kustomization.yaml",
  "deploy/kubernetes/observability/prometheus-deployment.yaml",
  "deploy/kubernetes/observability/grafana-deployment.yaml",
  "deploy/kubernetes/observability/alertmanager-deployment.yaml",
  "docs/devops/resource-governance.md",
];

const requiredContent = {
  "deploy/kubernetes/base/kustomization.yaml": ["resource-quota.yaml", "limit-range.yaml"],
  "deploy/kubernetes/base/resource-quota.yaml": [
    "kind: ResourceQuota",
    "name: saptm-namespace-quota",
    "requests.cpu",
    "requests.memory",
    "limits.cpu",
    "limits.memory",
    "pods:",
    "persistentvolumeclaims",
    "requests.storage",
    "count/deployments.apps",
  ],
  "deploy/kubernetes/base/limit-range.yaml": [
    "kind: LimitRange",
    "name: saptm-namespace-limits",
    "defaultRequest:",
    "default:",
    "maxLimitRequestRatio:",
    "type: PersistentVolumeClaim",
  ],
  "deploy/kubernetes/overlays/staging/kustomization.yaml": ["resource-quota-patch.yaml"],
  "deploy/kubernetes/overlays/staging/resource-quota-patch.yaml": [
    'requests.cpu: "2"',
    'limits.cpu: "8"',
    'pods: "10"',
    "requests.storage: 40Gi",
  ],
  "deploy/kubernetes/overlays/production/kustomization.yaml": ["resource-quota-patch.yaml"],
  "deploy/kubernetes/overlays/production/resource-quota-patch.yaml": [
    'requests.cpu: "8"',
    'limits.cpu: "32"',
    'pods: "40"',
    "requests.storage: 160Gi",
  ],
  "deploy/kubernetes/observability/kustomization.yaml": ["resource-quota.yaml", "limit-range.yaml"],
  "deploy/kubernetes/observability/resource-quota.yaml": [
    "kind: ResourceQuota",
    "name: saptm-observability-quota",
    "requests.cpu",
    "limits.memory",
    "persistentvolumeclaims",
    "requests.storage",
  ],
  "deploy/kubernetes/observability/limit-range.yaml": [
    "kind: LimitRange",
    "name: saptm-observability-limits",
    "defaultRequest:",
    "type: PersistentVolumeClaim",
  ],
  "deploy/kubernetes/observability/prometheus-deployment.yaml": [
    "readOnlyRootFilesystem: true",
    "mountPath: /tmp",
  ],
  "deploy/kubernetes/observability/grafana-deployment.yaml": [
    "readOnlyRootFilesystem: true",
    "mountPath: /tmp",
  ],
  "deploy/kubernetes/observability/alertmanager-deployment.yaml": [
    "readOnlyRootFilesystem: true",
    "mountPath: /tmp",
  ],
  "docs/devops/resource-governance.md": [
    "Resource Governance",
    "ResourceQuota",
    "LimitRange",
    "Observability Budget",
    "Acceptance Criteria",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing resource governance foundation files:");
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
  console.error("Resource governance foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM resource governance validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
