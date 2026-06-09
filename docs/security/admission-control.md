# Admission Control

## Purpose

Admission control prevents unsafe Kubernetes objects from entering SAPTM namespaces. It protects the
runtime baseline even when a workflow or manifest is changed incorrectly.

## Policies

`deploy/kubernetes/cluster/admission-policies.yaml` defines native Kubernetes
`ValidatingAdmissionPolicy` resources.

| Policy | Scope | Enforcement |
| --- | --- | --- |
| `saptm-deployment-security` | Deployments in namespaces starting with `saptm-` | Deny mutable images and unsafe container security context |
| `saptm-service-exposure` | Services in namespaces starting with `saptm-` | Deny direct `LoadBalancer` exposure |

## Deployment Security Requirements

SAPTM deployment containers must:

- Use `sha-*` image tags or image digests.
- Run as non-root workloads.
- Disable privilege escalation.
- Use read-only root filesystems.
- Drop all Linux capabilities.

## Exposure Requirements

SAPTM services must stay internal `ClusterIP` services. Public traffic must enter through the
approved ingress controller and TLS policy.

## Production Rules

- Do not deploy application workloads before admission policies are installed.
- Do not bypass admission policies with direct cluster-admin changes.
- Treat policy failures as release blockers.
- Update admission rules only through reviewed platform changes.
- Confirm admission policies are enforced in staging before production promotion.

## Acceptance Criteria

- Native `ValidatingAdmissionPolicy` resources exist.
- Workload security policy denies unsafe SAPTM deployments.
- Service exposure policy denies direct SAPTM load balancers.
- Deployment workflow preflight verifies required admission policies.
