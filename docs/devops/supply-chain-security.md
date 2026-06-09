# Supply Chain Security

## Purpose

Supply chain security ensures every deployable SAPTM artifact is traceable, scanned, attested, and
signed before it can be promoted to staging or production.

## Container Artifact Contract

| Control | Implementation |
| --- | --- |
| Immutable tags | Container CI publishes `sha-<commit>` image tags |
| Provenance | Docker Buildx requests provenance attestations |
| SBOM | Docker Buildx requests SBOM attestations |
| Vulnerability scan | Trivy scans API and Web images for `CRITICAL` and `HIGH` findings |
| Signature | Cosign keyless signing signs pushed image digests |
| Verification | Cosign verifies the published digest against GitHub OIDC identity |

## Vulnerability Policy

- Pull requests must build and scan images without publishing them.
- Main branch pushes must build, scan, publish, sign, and verify images.
- `CRITICAL` and `HIGH` fixed vulnerabilities fail Container CI.
- Unfixed vulnerabilities are ignored only until a fix is available upstream.
- Scan reports are uploaded as workflow artifacts for release evidence.

## Signing Policy

- Signing uses GitHub OIDC and Sigstore keyless certificates.
- Signing is performed only after images are pushed and a digest exists.
- Production deploys must reference the signed immutable digest or the matching `sha-<commit>` tag.
- Release evidence must include the signing workflow run and digest.

## Acceptance Criteria

- Container CI requests SBOM and provenance attestations.
- Container CI scans both API and Web images.
- Container CI uploads vulnerability scan reports.
- Published images are signed with Cosign.
- Published signatures are verified before the workflow completes.
