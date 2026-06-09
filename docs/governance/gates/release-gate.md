# Release Gate

## Purpose

Protect production through explicit release readiness.

## Required evidence

- CI status
- test evidence
- local readiness gate evidence
- changelog
- generated release evidence artifact
- business module release evidence artifact
- ACME account email and rendered ClusterIssuer evidence
- rollout and rollback
- monitoring plan
- liveness/readiness evidence
- metrics scrape and dashboard evidence
- Alertmanager config secret and test route evidence
- smoke test evidence
- foundation oRPC transport evidence
- TLS certificate and HTTPS redirect evidence
- target DNS, environment URL variables, and rendered ingress evidence
- HTTP security headers evidence
- runtime secret preflight evidence
- Kubernetes NetworkPolicy evidence
- HPA, PDB, and capacity evidence
- ResourceQuota and LimitRange evidence
- cluster preflight and admission policy evidence
- SBOM, provenance, vulnerability scan, and image signature evidence
- immutable container image tags
- environment-scoped secret evidence
- latest database backup evidence before migration
- accepted residual risks

## Fail conditions

- unresolved critical risk
- missing local readiness gate evidence
- missing rollback
- missing generated release evidence artifact
- missing first business module release evidence
- missing ACME account email or rendered ClusterIssuer evidence
- missing monitoring for critical path
- `/health/live`, `/health/ready`, or `/api/health` fails before traffic cutover
- `/metrics` scrape, Prometheus target, or critical alert routing is not validated
- Alertmanager config secret or test route evidence is missing
- runtime smoke checks fail
- foundation oRPC transport is missing or returns an invalid health contract
- TLS certificate is missing, expired, or HTTP does not redirect to HTTPS
- rendered ingress still references placeholder, local, or non-HTTPS URLs
- required API or Web security headers are missing
- required runtime secrets are missing or sourced outside the approved secret manager
- API or Web pods are reachable outside approved NetworkPolicy paths
- HPA, PDB, readiness, or minimum capacity evidence is missing
- ResourceQuota or LimitRange evidence is missing for target namespaces
- cluster preflight or admission policy evidence is missing
- image scan, SBOM/provenance, signature, or signature verification evidence is missing
- production deployment references mutable image tags
- production secret or kubeconfig evidence is missing
- production migration is requested without current backup evidence
