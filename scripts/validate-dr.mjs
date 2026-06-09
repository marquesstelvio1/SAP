import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "deploy/kubernetes/base/database-backup-cronjob.yaml",
  "deploy/kubernetes/base/database-backup-pvc.yaml",
  "deploy/kubernetes/base/kustomization.yaml",
  "deploy/kubernetes/base/runtime-config.yaml",
  "deploy/kubernetes/jobs/database-restore-job.example.yaml",
  "deploy/kubernetes/overlays/production/runtime-config-patch.yaml",
  "deploy/kubernetes/overlays/staging/runtime-config-patch.yaml",
  "docs/database/backup-restore-runbook.md",
  "docs/database/database-strategy.md",
  "docs/devops/disaster-recovery-strategy.md",
  "docs/runbooks/release-runbook.md",
];

const requiredContent = {
  "deploy/kubernetes/base/kustomization.yaml": [
    "database-backup-pvc.yaml",
    "database-backup-cronjob.yaml",
  ],
  "deploy/kubernetes/base/database-backup-cronjob.yaml": [
    "kind: CronJob",
    "saptm-database-backup",
    "concurrencyPolicy: Forbid",
    "pg_dump",
    "DATABASE_URL",
    "DATABASE_BACKUP_RETENTION_DAYS",
    "readOnlyRootFilesystem: true",
  ],
  "deploy/kubernetes/base/database-backup-pvc.yaml": [
    "kind: PersistentVolumeClaim",
    "saptm-database-backups",
  ],
  "deploy/kubernetes/jobs/database-restore-job.example.yaml": [
    "suspend: true",
    "RESTORE_BACKUP_FILE",
    "pg_restore",
    "manual-only",
  ],
  "docs/devops/disaster-recovery-strategy.md": ["RPO", "RTO", "DR Drill"],
  "docs/database/backup-restore-runbook.md": [
    "Manual Backup",
    "Restore Procedure",
    "Never apply the restore example directly",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing DR foundation files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const missingNeedles = [];

for (const [file, needles] of Object.entries(requiredContent)) {
  const source = readFileSync(join(root, file), "utf8");

  for (const needle of needles) {
    if (!source.includes(needle)) {
      missingNeedles.push(`${file}: ${needle}`);
    }
  }
}

if (missingNeedles.length > 0) {
  console.error("DR foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM DR validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
