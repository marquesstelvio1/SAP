# Cluster Readiness

## Purpose

Cluster readiness defines the Kubernetes prerequisites that must exist before SAPTM workloads are
deployed to staging or production.

## Required Cluster Capabilities

| Capability | Required For |
| --- | --- |
| `v1/ResourceQuota` | Namespace capacity budgets |
| `v1/LimitRange` | Default requests, limits, and PVC bounds |
| `networking.k8s.io/NetworkPolicy` | API and Web ingress isolation |
| `autoscaling/v2/HorizontalPodAutoscaler` | Runtime autoscaling |
| `policy/v1/PodDisruptionBudget` | Controlled node maintenance |
| `cert-manager.io/ClusterIssuer` | TLS certificate automation |
| `external-secrets.io/ExternalSecret` | Runtime secret materialization |
| `admissionregistration.k8s.io/ValidatingAdmissionPolicy` | Native admission guardrails |

## Required Controllers

| Controller | Default Namespace | Purpose |
| --- | --- | --- |
| Ingress NGINX | `ingress-nginx` | HTTP ingress and TLS redirect |
| cert-manager | `cert-manager` | ACME certificates and ClusterIssuers |
| External Secrets Operator | `external-secrets` | Kubernetes Secret generation |
| metrics-server | `kube-system` | HPA resource metrics |

Namespace names can be overridden for preflight execution with:

- `SAPTM_INGRESS_NAMESPACE`
- `SAPTM_CERT_MANAGER_NAMESPACE`
- `SAPTM_EXTERNAL_SECRETS_NAMESPACE`
- `SAPTM_METRICS_SERVER_NAMESPACE`

## Cluster Baseline Inputs

The `Render cluster baseline` workflow step requires the GitHub environment variable `SAPTM_ACME_EMAIL`.
`scripts/render-cluster-baseline.mjs` renders both cert-manager `ClusterIssuer` manifests before
they are applied. The renderer rejects missing, invalid, or placeholder email domains.

## Workflows

| Workflow | Purpose |
| --- | --- |
| `.github/workflows/cluster-baseline.yml` | Renders ClusterIssuers, applies ClusterIssuers, and applies admission policies |
| `.github/workflows/environment-deploy.yml` | Runs application cluster preflight before workload rollout |
| `.github/workflows/observability-deploy.yml` | Runs observability cluster preflight before monitoring rollout |

## Preflight Scopes

`scripts/cluster-preflight.mjs` supports:

- `cluster`: validates core APIs and required controllers before cluster baseline.
- `app`: validates cluster APIs, controllers, and required SAPTM admission policies.
- `observability`: validates base APIs and ingress controller for monitoring rollout.

## Acceptance Criteria

- Cluster baseline workflow exists and requires environment approval.
- Cluster baseline workflow renders ClusterIssuers with `SAPTM_ACME_EMAIL`.
- Application deployment runs cluster preflight before namespace and workload changes.
- Observability deployment runs cluster preflight before stack changes.
- Admission policies are installed before production app deployment.
- Preflight failures block deployment.
