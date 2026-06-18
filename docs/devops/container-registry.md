# Container Registry

## Purpose

Container registry governance defines how SAPTM API and Web images are built, tagged, published,
and promoted. This foundation exists before production features so releases remain traceable to a
specific commit and build workflow.

## Registry

| Field | Value |
| --- | --- |
| Registry | GitHub Container Registry |
| API image | `ghcr.io/<owner>/<repo>/api` |
| Web image | `ghcr.io/<owner>/<repo>/web` |
| Publisher | `.github/workflows/container-ci.yml` |
| Source | `apps/api/Dockerfile`, `apps/web/Dockerfile` |

## Tagging Policy

| Tag | Source | Mutability | Use |
| --- | --- | --- | --- |
| `sha-<commit>` | Git commit SHA | Immutable | Production deployments and rollback |
| `<branch>` | Branch ref | Mutable | Preview and branch diagnostics |
| `pr-<number>` | Pull request ref | Ephemeral | Pull request image validation |
| `latest` | Default branch | Mutable | Local smoke testing only |

Production and staging must deploy `sha-<commit>` tags. Mutable tags must not be used as release
identifiers.

## Build Policy

- Pull requests build images but do not push to GHCR.
- Pushes to `main` build and push API and Web images.
- Dockerfiles copy workspace manifests before source files so dependency cache is not invalidated by
  normal source changes.
- Buildx uses a PNPM store cache and `pnpm fetch` before offline install.
- API runtime images use `pnpm deploy --prod` before copying runtime artifacts.
- Images publish OCI labels from `docker/metadata-action`.
- Builds request provenance and SBOM generation.
- Images are scanned with Trivy for `CRITICAL` and `HIGH` vulnerabilities.
- Published images are signed and verified with Cosign keyless signing.
- Runtime healthchecks map to application health endpoints.
- API deploy images must include the generated Prisma Client `.prisma/client` artifact.

## Promotion Policy

1. Platform CI passes.
2. Container CI builds API and Web images for the same commit.
3. Database migration gate passes.
4. Release gate accepts rollback, monitoring, and readiness evidence.
5. Staging deploys `sha-<commit>`.
6. Production promotes the same `sha-<commit>` after staging acceptance.

## Required Secrets And Variables

| Name | Type | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | GitHub secret | Push package images to GHCR |
| `NEXT_PUBLIC_APP_URL` | GitHub Actions variable | Web build-time public app URL |
| `NEXT_PUBLIC_API_URL` | GitHub Actions variable | Web build-time public API URL |

Environment-specific runtime secrets remain outside image builds and must be injected by the
deployment platform.

## Supply Chain Controls

Detailed scan, attestation, signing, and verification rules are defined in
`docs/devops/supply-chain-security.md`.

## Acceptance Criteria

- API and Web images are built from the same commit.
- Pull requests validate image builds without publishing.
- Main branch pushes immutable SHA tags.
- Release promotion uses immutable tags only.
- SBOM/provenance are requested by the build workflow.
- Vulnerability scan reports are produced by Container CI.
- Published image digests are signed and verified before release promotion.
