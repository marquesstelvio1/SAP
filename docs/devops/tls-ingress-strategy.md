# TLS and Ingress Strategy

## Purpose

TLS strategy ensures SAPTM is never promoted to production over plaintext HTTP.

## Ingress Contract

| Environment | Hosts | TLS Secret | Issuer |
| --- | --- | --- | --- |
| Staging | `staging.saptm.example.com`, `api.staging.saptm.example.com` | `saptm-staging-tls` | `letsencrypt-staging` |
| Production | `app.saptm.example.com`, `api.saptm.example.com` | `saptm-production-tls` | `letsencrypt-production` |

Base ingress enables SSL redirect. Environment overlays define safe placeholder hosts and
cert-manager issuer annotations. During deployment, `scripts/render-kubernetes-environment.mjs`
replaces placeholder hosts and runtime URLs from GitHub environment URL variables before
`kubectl apply -k`.

## Environment URL Variables

| GitHub Environment Variable | Rendered Into |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Web ingress host, CORS origin, Better Auth URL, Web runtime URL |
| `NEXT_PUBLIC_API_URL` | API ingress host and API runtime URL |

The renderer rejects `example.com`, localhost, non-HTTPS URLs, paths, queries, and fragments.

## Cluster Prerequisites

- NGINX Ingress Controller is installed.
- cert-manager is installed.
- `deploy/kubernetes/cluster/cert-manager-staging-issuer.yaml` is applied before staging TLS.
- `deploy/kubernetes/cluster/cert-manager-production-issuer.yaml` is applied before production TLS.
- `SAPTM_ACME_EMAIL` is configured in the GitHub environment.
- `scripts/render-cluster-baseline.mjs` replaces placeholder ClusterIssuer email values before apply.

## Rules

- Production ingress must not be accepted without a TLS block.
- Production ingress must be rendered from real environment URL variables before apply.
- ClusterIssuer email must be rendered from `SAPTM_ACME_EMAIL`, not committed placeholders.
- Production release gate must verify the certificate is issued and not expired.
- HTTP traffic must redirect to HTTPS.
- Wildcard certificates require security approval.

## Acceptance Criteria

- Staging and production overlays include TLS hosts and secret names.
- Ingress has SSL redirect enabled.
- Deployment workflow renders placeholder hosts from environment URL variables.
- ClusterIssuer manifests exist for staging and production.
- Cluster baseline workflow renders ClusterIssuer email from `SAPTM_ACME_EMAIL`.
