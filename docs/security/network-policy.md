# Kubernetes Network Policy

## Purpose

Network policy limits which in-cluster actors can reach SAPTM workloads. It is part of the
security baseline before any business endpoint or page is implemented.

## Applied Baseline

The base Kubernetes overlay applies ingress policies for API and Web pods:

| Workload | Allowed Source | Port | Reason |
| --- | --- | --- | --- |
| API | `ingress-nginx` namespace | `4000` | Public API ingress |
| API | `saptm-observability` namespace | `4000` | Prometheus metrics scrape |
| API | Web pods in the same namespace | `4000` | Server-side app/API communication |
| Web | `ingress-nginx` namespace | `3000` | Public Web ingress |

The baseline intentionally does not apply default-deny egress yet because production database,
secret-store, identity-provider, and telemetry endpoints are environment-specific.

## Restricted Egress Template

`deploy/kubernetes/networking/restricted-egress-policy.example.yaml` defines the required shape for
production egress hardening:

- DNS to `kube-dns`.
- Telemetry to the observability namespace.
- PostgreSQL to the approved database CIDR.
- Secret manager access to the approved secret-store CIDR.

Replace `DATABASE_HOST_CIDR` and `EXTERNAL_SECRET_STORE_CIDR` with real CIDRs before applying this
template in production.

## Production Rules

- Do not expose API or Web pods directly through `LoadBalancer` services.
- Do not route traffic around the ingress controller.
- Do not apply restricted egress until database, secret manager, identity provider, and telemetry
  destinations are known.
- Treat network policy changes as release-gated security changes.
- Validate policies in staging before production.

## Acceptance Criteria

- API and Web ingress is constrained by Kubernetes `NetworkPolicy`.
- Prometheus can still scrape `/metrics`.
- The Web service can still reach the API when server-side calls are introduced.
- Egress restriction has a production-ready template and documented placeholders.
- Production release gate requires network policy evidence.
