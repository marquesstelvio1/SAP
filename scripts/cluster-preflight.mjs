import { execFileSync } from "node:child_process";

const scope = process.env.SAPTM_PREFLIGHT_SCOPE ?? "app";
const ingressNamespace = process.env.SAPTM_INGRESS_NAMESPACE ?? "ingress-nginx";
const certManagerNamespace = process.env.SAPTM_CERT_MANAGER_NAMESPACE ?? "cert-manager";
const externalSecretsNamespace = process.env.SAPTM_EXTERNAL_SECRETS_NAMESPACE ?? "external-secrets";
const metricsServerNamespace = process.env.SAPTM_METRICS_SERVER_NAMESPACE ?? "kube-system";

const baseChecks = [
  () => runKubectl(["version", "--client=true"], "kubectl client is available"),
  () => runKubectl(["get", "--raw", "/readyz"], "Kubernetes API readyz is reachable"),
  () => requireApiResource("", "resourcequotas", "ResourceQuota API"),
  () => requireApiResource("", "limitranges", "LimitRange API"),
  () => requireApiResource("networking.k8s.io", "networkpolicies", "NetworkPolicy API"),
  () => requireApiResource("autoscaling", "horizontalpodautoscalers", "HPA API"),
  () => requireApiResource("policy", "poddisruptionbudgets", "PDB API"),
];

const clusterChecks = [
  () => requireApiResource("cert-manager.io", "clusterissuers", "cert-manager ClusterIssuer API"),
  () =>
    requireApiResource("external-secrets.io", "externalsecrets", "External Secrets Operator API"),
  () =>
    requireApiResource(
      "admissionregistration.k8s.io",
      "validatingadmissionpolicies",
      "ValidatingAdmissionPolicy API",
    ),
  () => requireNamespaceWithDeployments(ingressNamespace, "ingress controller namespace"),
  () => requireNamespaceWithDeployments(certManagerNamespace, "cert-manager namespace"),
  () => requireNamespaceWithDeployments(externalSecretsNamespace, "external-secrets namespace"),
  () =>
    runKubectl(
      ["get", "deployment", "metrics-server", "-n", metricsServerNamespace],
      "metrics-server deployment exists",
    ),
];

const appChecks = [
  ...clusterChecks,
  () =>
    runKubectl(
      ["get", "validatingadmissionpolicy", "saptm-deployment-security"],
      "SAPTM deployment admission policy exists",
    ),
  () =>
    runKubectl(
      ["get", "validatingadmissionpolicy", "saptm-service-exposure"],
      "SAPTM service exposure admission policy exists",
    ),
];

const observabilityChecks = [
  () => requireNamespaceWithDeployments(ingressNamespace, "ingress controller namespace"),
];

const checksByScope = {
  app: [...baseChecks, ...appChecks],
  cluster: [...baseChecks, ...clusterChecks],
  observability: [...baseChecks, ...observabilityChecks],
};

const checks = checksByScope[scope];

if (!checks) {
  console.error(`Unsupported SAPTM_PREFLIGHT_SCOPE: ${scope}`);
  process.exit(1);
}

for (const check of checks) {
  check();
}

console.log(`SAPTM cluster preflight passed for scope: ${scope}.`);

function requireApiResource(apiGroup, resourceName, label) {
  const args =
    apiGroup.length > 0
      ? ["api-resources", `--api-group=${apiGroup}`, "--no-headers"]
      : ["api-resources", "--api-group=", "--no-headers"];
  const output = runKubectl(args, `${label} is discoverable`);

  if (!output.includes(resourceName)) {
    throwPreflightFailure(`${label} missing from api-resources output.`);
  }
}

function requireNamespaceWithDeployments(namespace, label) {
  runKubectl(["get", "namespace", namespace], `${label} exists`);
  const output = runKubectl(
    ["get", "deployment", "-n", namespace, "-o", "name"],
    `${label} has deployments`,
  );

  if (output.trim().length === 0) {
    throwPreflightFailure(`${label} has no deployments.`);
  }
}

function runKubectl(args, label) {
  try {
    const output = execFileSync("kubectl", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(`OK: ${label}`);
    return output;
  } catch (error) {
    const stderr = error?.stderr?.toString?.() ?? "";
    const stdout = error?.stdout?.toString?.() ?? "";
    throwPreflightFailure(`${label} failed.\n${stderr}${stdout}`);
  }
}

function throwPreflightFailure(message) {
  console.error(`Cluster preflight failed: ${message}`);
  process.exit(1);
}
