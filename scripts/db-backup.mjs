#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, "..", "backups");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:25432/saptm";

function parseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error("Invalid DATABASE_URL");
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
}

async function backup() {
  const db = parseUrl(DB_URL);
  mkdirSync(BACKUP_DIR, { recursive: true });
  const filename = `saptm-${TIMESTAMP}.dump`;
  const filepath = join(BACKUP_DIR, filename);

  console.log(`Backing up ${db.database} to ${filepath}...`);

  try {
    execSync(
      `pg_dump -Fc -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -f ${filepath}`,
      { env: { ...process.env, PGPASSWORD: db.password }, stdio: "inherit" },
    );
    console.log(`Backup complete: ${filepath}`);

    // Keep only last 30 backups
    const { readdirSync, unlinkSync } = await import("node:fs");
    const backups = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("saptm-") && f.endsWith(".dump"))
      .sort()
      .reverse();

    if (backups.length > 30) {
      for (const old of backups.slice(30)) {
        unlinkSync(join(BACKUP_DIR, old));
        console.log(`Removed old backup: ${old}`);
      }
    }

    return filepath;
  } catch (err) {
    console.error("Backup failed:", err.message);
    process.exit(1);
  }
}

backup();
