import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/observability-deploy.yml",
  "deploy/kubernetes/external-secrets/alertmanager-config.external-secret.example.yaml",
  "deploy/kubernetes/observability/alertmanager-deployment.yaml",
  "deploy/kubernetes/observability/kustomization.yaml",
  "docs/observability/alert-routing.md",
  "docs/runbooks/observability-runbook.md",
];

const forbiddenContent = {
  "deploy/kubernetes/observability/kustomization.yaml": ["alertmanager-config.yaml"],
  "deploy/kubernetes/observability/alertmanager-deployment.yaml": ["configMap:"],
};

const requiredContent = {
  ".github/workflows/observability-deploy.yml": [
    "Verify required Alertmanager config",
    "kubectl get secret saptm-alertmanager-config",
    "jsonpath='{.data.alertmanager\\.yml}'",
  ],
  "deploy/kubernetes/external-secrets/alertmanager-config.external-secret.example.yaml": [
    "kind: ExternalSecret",
    "saptm-alertmanager-config",
    "alertmanager.yml",
    "INCIDENT_WEBHOOK_URL",
    "incident-webhook",
    "send_resolved: true",
  ],
  "deploy/kubernetes/observability/alertmanager-deployment.yaml": [
    "secretName: saptm-alertmanager-config",
    "key: alertmanager.yml",
    "path: alertmanager.yml",
    "readOnlyRootFilesystem: true",
  ],
  "docs/observability/alert-routing.md": [
    "Alert Routing",
    "saptm-alertmanager-config",
    "INCIDENT_WEBHOOK_URL",
    "Acceptance Criteria",
  ],
  "docs/runbooks/observability-runbook.md": ["saptm-alertmanager-config", "INCIDENT_WEBHOOK_URL"],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing alert routing foundation files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const mismatches = [];

for (const [file, needles] of Object.entries(requiredContent)) {
  const source = readFileSync(join(root, file), "utf8");

  for (const needle of needles) {
    if (!source.includes(needle)) {
      mismatches.push(`${file}: missing ${needle}`);
    }
  }
}

for (const [file, needles] of Object.entries(forbiddenContent)) {
  const source = readFileSync(join(root, file), "utf8");

  for (const needle of needles) {
    if (source.includes(needle)) {
      mismatches.push(`${file}: forbidden ${needle}`);
    }
  }
}

if (mismatches.length > 0) {
  console.error("Alert routing foundation content mismatch:");
  for (const entry of mismatches) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM alert routing validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length + Object.values(forbiddenContent).flat().length
  } content rules covered.`,
);
