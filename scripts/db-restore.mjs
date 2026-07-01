#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, "..", "backups");
const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:25432/saptm";

function parseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error("Invalid DATABASE_URL");
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
}

async function restore() {
  const args = process.argv.slice(2);
  const backupFile = args[0];

  if (!backupFile) {
    // List available backups
    if (!existsSync(BACKUP_DIR)) {
      console.error("No backups directory found");
      process.exit(1);
    }
    const backups = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("saptm-") && f.endsWith(".dump"))
      .sort()
      .reverse();

    if (backups.length === 0) {
      console.error("No backups found in", BACKUP_DIR);
      process.exit(1);
    }

    console.log("Available backups:");
    for (const [i, b] of backups.entries()) console.log(`  [${i}] ${b}`);
    console.log(`\nUsage: node scripts/db-restore.mjs [filename | index]`);
    process.exit(0);
  }

  // Resolve index to filename
  let filepath;
  if (/^\d+$/.test(backupFile)) {
    const backups = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("saptm-") && f.endsWith(".dump"))
      .sort()
      .reverse();
    filepath = join(BACKUP_DIR, backups[parseInt(backupFile, 10)]);
  } else {
    filepath = join(BACKUP_DIR, backupFile);
  }

  if (!existsSync(filepath)) {
    console.error(`Backup not found: ${filepath}`);
    process.exit(1);
  }

  const db = parseUrl(DB_URL);

  console.log(`Restoring ${db.database} from ${filepath}...`);
  console.log("WARNING: This will DROP the existing database!");

  // Confirmation
  const confirm = process.env.FORCE !== "true";
  if (confirm) {
    console.log("Set FORCE=true environment variable to proceed.");
    process.exit(0);
  }

  try {
    // Terminate connections and drop/recreate
    execSync(
      `psql -h ${db.host} -p ${db.port} -U ${db.user} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${db.database}' AND pid <> pg_backend_pid();"`,
      { env: { ...process.env, PGPASSWORD: db.password }, stdio: "inherit" },
    );
    execSync(`dropdb -h ${db.host} -p ${db.port} -U ${db.user} ${db.database}`, {
      env: { ...process.env, PGPASSWORD: db.password },
      stdio: "inherit",
    });
    execSync(`createdb -h ${db.host} -p ${db.port} -U ${db.user} ${db.database}`, {
      env: { ...process.env, PGPASSWORD: db.password },
      stdio: "inherit",
    });
    execSync(
      `pg_restore -Fc -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} ${filepath}`,
      { env: { ...process.env, PGPASSWORD: db.password }, stdio: "inherit" },
    );
    console.log("Restore complete!");
  } catch (err) {
    console.error("Restore failed:", err.message);
    process.exit(1);
  }
}

restore();
