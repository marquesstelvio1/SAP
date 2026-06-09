# Production Inputs

## Purpose

Production inputs define the environment-owned values that must be real before SAPTM can deploy to
staging or production. Repository manifests may keep safe placeholders, but deployment must render
runtime overlays from approved environment variables.

## Required GitHub Environment Variables

| Variable | Used For | Rule |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Web ingress host, Better Auth URL, CORS origin, smoke checks | Must be HTTPS and non-placeholder |
| `NEXT_PUBLIC_API_URL` | API ingress host, Web API URL, smoke checks | Must be HTTPS and non-placeholder |
| `GHCR_IMAGE_NAMESPACE` | API and Web image repository namespace | Must point to the approved GHCR owner/repository |

## Render Contract

`.github/workflows/environment-deploy.yml` runs `scripts/render-kubernetes-environment.mjs` before
`kubectl apply -k`.

The renderer:

- reads `DEPLOY_ENVIRONMENT`, `SAPTM_WEB_URL`, and `SAPTM_API_URL`;
- rejects `example.com`, localhost, non-HTTPS, paths, queries, and fragments;
- replaces ingress hosts in `ingress-patch.yaml`;
- replaces runtime URLs in `runtime-config-patch.yaml`;
- fails before cluster mutation if any required value is invalid.

## Production Rules

- Do not deploy staging or production with repository placeholder hosts.
- Do not use HTTP for public runtime URLs.
- Do not use the same host for API and Web until an explicit routing design is approved.
- Keep DNS, certificate, and smoke-check URLs aligned in the same GitHub environment.

## Acceptance Criteria

- Deploy workflow renders environment overlays before applying manifests.
- Production input validation exists in Platform CI.
- TLS strategy documents placeholder replacement.
- Release gate requires target DNS and URL evidence.
