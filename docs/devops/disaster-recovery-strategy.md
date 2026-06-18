# Disaster Recovery Strategy

## Purpose

Disaster recovery defines how SAPTM protects runtime availability and PostgreSQL data before any
business module writes production data.

## Recovery Objectives

| Environment | RPO | RTO | Notes |
| --- | --- | --- | --- |
| Staging | 24h | 4h | Validation environment, lower retention |
| Production | 24h baseline | 2h baseline | Must be tightened before regulated cargo workloads |

## Baseline Controls

| Control | Implementation |
| --- | --- |
| Logical backup | `saptm-database-backup` Kubernetes CronJob |
| Backup storage | `saptm-database-backups` PVC per namespace |
| Retention | `DATABASE_BACKUP_RETENTION_DAYS` in runtime config |
| Restore template | `deploy/kubernetes/jobs/database-restore-job.example.yaml` |
| Migration safety | `docs/database/migration-runbook.md` |
| Rollback | `.github/workflows/environment-rollback.yml` |
| Smoke validation | `scripts/smoke-runtime.mjs` |

## Production Requirements

- PVC backups must be replicated or snapshotted to offsite object storage by the platform provider.
- Restore must be tested in staging before production data exists.
- Production migration approval must include the latest successful backup evidence.
- Backup failure must become an alert before the first business module writes production data.
- RPO/RTO must be revisited when cargo, operations, billing, and compliance data go live.

## DR Drill

1. Confirm latest backup job status.
2. Restore into an isolated staging namespace or database.
3. Run `pnpm db:migrate:status`.
4. Run `scripts/smoke-runtime.mjs`.
5. Confirm Prometheus target and critical alerts.
6. Record elapsed recovery time and data loss window.

## Acceptance Criteria

- Backup CronJob is deployed with the application namespace.
- Restore job template is suspended by default.
- Release gate requires backup evidence before migrations.
- DR runbook exists before business data is created.
