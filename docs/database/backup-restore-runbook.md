# Database Backup and Restore Runbook

## Purpose

This runbook defines how to verify PostgreSQL backups and perform controlled restores for SAPTM.

## Backup Verification

Check the CronJob:

```bash
kubectl get cronjob saptm-database-backup -n saptm-production
```

Check recent jobs:

```bash
kubectl get jobs -n saptm-production -l app.kubernetes.io/component=database-backup
```

Inspect backup files:

```bash
kubectl exec -n saptm-production job/<backup-job-name> -- ls -lh /backups
```

## Manual Backup

Create an immediate backup from the CronJob:

```bash
kubectl create job --from=cronjob/saptm-database-backup saptm-database-backup-manual -n saptm-production
kubectl wait --for=condition=complete job/saptm-database-backup-manual -n saptm-production --timeout=1800s
```

## Restore Procedure

1. Stop traffic to the target environment.
2. Confirm restore approval and expected backup filename.
3. Copy `deploy/kubernetes/jobs/database-restore-job.example.yaml` to a temporary reviewed manifest.
4. Patch `RESTORE_BACKUP_FILE`.
5. Set `spec.suspend=false`.
6. Apply the manifest to the target namespace.
7. Wait for job completion.
8. Run migration status and runtime smoke checks.

## Rules

- Never apply the restore example directly without patching and approval.
- Never restore production from staging data.
- Never restore after destructive migrations without a separate data recovery plan.
- Always record backup filename, restore operator, reason, and approval trail.

## Acceptance Criteria

- Latest backup exists before production migration.
- Restore is tested in staging before production launch.
- Restore job template remains suspended by default.
