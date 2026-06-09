import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".github/workflows/observability-deploy.yml",
  "apps/api/src/observability/metrics.controller.ts",
  "deploy/observability/alertmanager/alertmanager.yml",
  "deploy/observability/grafana/dashboards/saptm-runtime.json",
  "deploy/observability/grafana/provisioning/dashboards/dashboards.yml",
  "deploy/observability/grafana/provisioning/datasources/datasources.yml",
  "deploy/observability/otel-collector/config.yaml",
  "deploy/observability/prometheus/prometheus.yml",
  "deploy/observability/prometheus/rules/saptm-alerts.yml",
  "deploy/kubernetes/base/api-service.yaml",
  "deploy/kubernetes/base/runtime-config.yaml",
  "deploy/kubernetes/external-secrets/alertmanager-config.external-secret.example.yaml",
  "deploy/kubernetes/observability/alertmanager-deployment.yaml",
  "deploy/kubernetes/observability/alertmanager-pvc.yaml",
  "deploy/kubernetes/observability/alertmanager-service.yaml",
  "deploy/kubernetes/observability/grafana-config.yaml",
  "deploy/kubernetes/observability/grafana-deployment.yaml",
  "deploy/kubernetes/observability/grafana-pvc.yaml",
  "deploy/kubernetes/observability/grafana-service.yaml",
  "deploy/kubernetes/observability/kustomization.yaml",
  "deploy/kubernetes/observability/resource-quota.yaml",
  "deploy/kubernetes/observability/limit-range.yaml",
  "deploy/kubernetes/observability/namespace.yaml",
  "deploy/kubernetes/observability/otel-collector-config.yaml",
  "deploy/kubernetes/observability/otel-collector-deployment.yaml",
  "deploy/kubernetes/observability/otel-collector-service.yaml",
  "deploy/kubernetes/observability/prometheus-config.yaml",
  "deploy/kubernetes/observability/prometheus-deployment.yaml",
  "deploy/kubernetes/observability/prometheus-pvc.yaml",
  "deploy/kubernetes/observability/prometheus-rbac.yaml",
  "deploy/kubernetes/observability/prometheus-service.yaml",
  "docs/observability/observability-strategy.md",
  "docs/runbooks/observability-runbook.md",
  "packages/observability/src/prometheus.ts",
];

const requiredContent = {
  ".github/workflows/observability-deploy.yml": [
    "Setup Node.js",
    "SAPTM_PREFLIGHT_SCOPE: observability",
    "node scripts/cluster-preflight.mjs",
    "KUBE_CONFIG_B64 secret is required.",
    "kubectl apply -k deploy/kubernetes/observability",
    "saptm-observability-secrets",
    "saptm-alertmanager-config",
    "deployment/saptm-prometheus",
    "deployment/saptm-grafana",
  ],
  "apps/api/src/observability/metrics.controller.ts": [
    '@Get("metrics")',
    "prometheusContentType",
    "renderPrometheusMetrics",
  ],
  "apps/api/src/observability/observability.service.ts": [
    "createPrometheusRegistry",
    "http.server.duration_ms",
    "authorization.decisions",
    "rpc.authorization.decisions",
    "process.uptime_seconds",
  ],
  "compose.yaml": [
    "otel-collector:",
    "prometheus:",
    "alertmanager:",
    "grafana:",
    "deploy/observability/prometheus/prometheus.yml",
  ],
  "deploy/kubernetes/base/api-service.yaml": [
    "prometheus.io/scrape",
    "prometheus.io/path: /metrics",
  ],
  "deploy/kubernetes/base/runtime-config.yaml": ["OTEL_EXPORTER_OTLP_ENDPOINT"],
  "deploy/kubernetes/observability/kustomization.yaml": [
    "saptm-observability",
    "resource-quota.yaml",
    "limit-range.yaml",
    "prometheus-rbac.yaml",
    "grafana-pvc.yaml",
  ],
  "deploy/kubernetes/external-secrets/alertmanager-config.external-secret.example.yaml": [
    "kind: ExternalSecret",
    "saptm-alertmanager-config",
    "INCIDENT_WEBHOOK_URL",
    "alertmanager.yml",
  ],
  "deploy/kubernetes/observability/resource-quota.yaml": [
    "kind: ResourceQuota",
    "name: saptm-observability-quota",
    "requests.storage",
  ],
  "deploy/kubernetes/observability/limit-range.yaml": [
    "kind: LimitRange",
    "name: saptm-observability-limits",
    "defaultRequest:",
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
    "secretName: saptm-alertmanager-config",
    "key: alertmanager.yml",
    "readOnlyRootFilesystem: true",
    "mountPath: /tmp",
  ],
  "deploy/kubernetes/observability/prometheus-config.yaml": [
    "kubernetes_sd_configs",
    "saptm-api-kubernetes",
    "SAPTMApiHighErrorRate",
    "SAPTMAuthorizationDenialSpike",
  ],
  "deploy/observability/prometheus/rules/saptm-alerts.yml": [
    "SAPTMApiTargetDown",
    "SAPTMApiHighLatencyP95",
    "docs/runbooks/observability-runbook.md",
  ],
  "packages/observability/src/prometheus.ts": [
    "InMemoryPrometheusRegistry",
    "normalizeMetricName",
    "prometheusContentType",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing observability foundation files:");
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
  console.error("Observability foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM observability validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
