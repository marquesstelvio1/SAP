import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "deploy/kubernetes/base/api-deployment.yaml",
  "deploy/kubernetes/base/api-hpa.yaml",
  "deploy/kubernetes/base/api-pdb.yaml",
  "deploy/kubernetes/base/kustomization.yaml",
  "deploy/kubernetes/base/web-deployment.yaml",
  "deploy/kubernetes/base/web-hpa.yaml",
  "deploy/kubernetes/base/web-pdb.yaml",
  "deploy/kubernetes/overlays/production/api-hpa-patch.yaml",
  "deploy/kubernetes/overlays/production/api-pdb-patch.yaml",
  "deploy/kubernetes/overlays/production/kustomization.yaml",
  "deploy/kubernetes/overlays/production/web-hpa-patch.yaml",
  "deploy/kubernetes/overlays/production/web-pdb-patch.yaml",
  "deploy/kubernetes/overlays/staging/api-hpa-patch.yaml",
  "deploy/kubernetes/overlays/staging/kustomization.yaml",
  "deploy/kubernetes/overlays/staging/web-hpa-patch.yaml",
  "docs/devops/runtime-resilience.md",
];

const requiredContent = {
  "deploy/kubernetes/base/kustomization.yaml": [
    "api-hpa.yaml",
    "api-pdb.yaml",
    "web-hpa.yaml",
    "web-pdb.yaml",
  ],
  "deploy/kubernetes/base/api-deployment.yaml": [
    "topologySpreadConstraints:",
    "kubernetes.io/hostname",
    "app.kubernetes.io/component: api",
    "maxUnavailable: 0",
  ],
  "deploy/kubernetes/base/web-deployment.yaml": [
    "topologySpreadConstraints:",
    "kubernetes.io/hostname",
    "app.kubernetes.io/component: web",
    "maxUnavailable: 0",
  ],
  "deploy/kubernetes/base/api-hpa.yaml": [
    "kind: HorizontalPodAutoscaler",
    "name: saptm-api",
    "minReplicas: 2",
    "maxReplicas: 6",
    "averageUtilization: 70",
    "averageUtilization: 80",
  ],
  "deploy/kubernetes/base/web-hpa.yaml": [
    "kind: HorizontalPodAutoscaler",
    "name: saptm-web",
    "minReplicas: 2",
    "maxReplicas: 6",
    "averageUtilization: 70",
    "averageUtilization: 80",
  ],
  "deploy/kubernetes/base/api-pdb.yaml": [
    "kind: PodDisruptionBudget",
    "name: saptm-api",
    "minAvailable: 1",
  ],
  "deploy/kubernetes/base/web-pdb.yaml": [
    "kind: PodDisruptionBudget",
    "name: saptm-web",
    "minAvailable: 1",
  ],
  "deploy/kubernetes/overlays/staging/kustomization.yaml": [
    "api-hpa-patch.yaml",
    "web-hpa-patch.yaml",
  ],
  "deploy/kubernetes/overlays/production/kustomization.yaml": [
    "api-hpa-patch.yaml",
    "web-hpa-patch.yaml",
    "api-pdb-patch.yaml",
    "web-pdb-patch.yaml",
  ],
  "deploy/kubernetes/overlays/production/api-hpa-patch.yaml": ["minReplicas: 3", "maxReplicas: 10"],
  "deploy/kubernetes/overlays/production/web-hpa-patch.yaml": ["minReplicas: 3", "maxReplicas: 10"],
  "deploy/kubernetes/overlays/production/api-pdb-patch.yaml": ["minAvailable: 2"],
  "deploy/kubernetes/overlays/production/web-pdb-patch.yaml": ["minAvailable: 2"],
  "docs/devops/runtime-resilience.md": ["Runtime Resilience", "HPA", "PDB", "Acceptance Criteria"],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing resilience foundation files:");
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
  console.error("Resilience foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM resilience validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
