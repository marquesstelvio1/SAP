# Release Runbook

## Flow

1. Validate AI OS structure.
2. Confirm task and PR evidence.
3. Generate changelog.
4. Generate or retrieve `saptm-release-evidence` artifact.
5. Run release gate checklist.
6. Run `pnpm validate:production-handoff` and attach Production cutover handoff evidence.
7. Build immutable API and Web images through Container CI.
8. Record API and Web `sha-<commit>` image tags.
9. Confirm `SAPTM_ACME_EMAIL` is real and ClusterIssuers render before baseline apply.
10. Confirm SBOM, provenance, Trivy scan report, and Cosign signature evidence.
11. Confirm `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` are real HTTPS environment URLs.
12. Confirm environment secrets and Kubernetes runtime secret exist.
13. Confirm External Secrets Operator generated expected runtime secrets.
14. Confirm observability secrets and stack rollout exist.
15. Confirm `saptm-alertmanager-config` exists and routes a test alert to incident tooling.
16. Confirm NetworkPolicy allows only approved ingress paths.
17. Confirm HPA, PDB, and capacity status.
18. Confirm ResourceQuota and LimitRange status for target namespaces.
19. Confirm cluster preflight and admission policies.
20. Confirm latest successful database backup or run a manual backup.
21. Deploy database migrations with `pnpm db:migrate:deploy`.
22. Deploy through approved pipeline.
23. Confirm `/health/live`, `/health/ready`, `/api/health`, and `/metrics` before traffic cutover.
24. Run or verify `scripts/smoke-runtime.mjs`.
25. Confirm TLS certificate status and HTTPS redirect.
26. Confirm API and Web security headers.
27. Confirm Prometheus target, baseline alerts, and Grafana runtime dashboard.
28. Monitor telemetry and create stabilization tasks.

## Command

```bash
node ./scripts/invoke-ai-workflow.mjs --workflow release --release-name release-candidate
```
