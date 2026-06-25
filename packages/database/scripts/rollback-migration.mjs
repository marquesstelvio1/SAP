#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsRoot = join(__dirname, "../prisma/migrations");
const prismaRoot = join(migrationsRoot, "..");

function showHelp() {
  console.log(`
Usage: node rollback-migration.mjs [options]

Rollback a Prisma migration by executing optional rollback SQL and
marking the migration as rolled back in Prisma's migration tracking.

Options:
  --name=<migration_name>  Rollback a specific migration by directory name
  --last                   Rollback the last applied migration (alphabetically)
  --dry-run                Show what would be done without executing anything
  --help                   Show this help message

Examples:
  node rollback-migration.mjs --last
  node rollback-migration.mjs --last --dry-run
  node rollback-migration.mjs --name=20260604220000_tariff_pricing_foundation
`);
}

function getLastMigration() {
  const dirs = readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (dirs.length === 0) {
    console.error("No migration directories found.");
    process.exit(1);
  }

  return dirs[dirs.length - 1];
}

function maskDatabaseUrl(url) {
  try {
    return url.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
  } catch {
    return "(invalid url)";
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    showHelp();
    process.exit(0);
  }

  let migrationName = null;
  let dryRun = false;

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--last") {
      migrationName = getLastMigration();
      continue;
    }

    const match = arg.match(/^--name=(.+)$/);
    if (match) {
      migrationName = match[1];
    }
  }

  if (!migrationName) {
    console.error("Error: No migration name provided. Use --name=<name> or --last.");
    process.exit(1);
  }

  const migrationDir = join(migrationsRoot, migrationName);

  if (!existsSync(migrationDir)) {
    console.error(`Error: Migration directory not found: ${migrationDir}`);
    process.exit(1);
  }

  const migrationFile = join(migrationDir, "migration.sql");

  if (!existsSync(migrationFile)) {
    console.error(`Error: migration.sql not found in ${migrationDir}`);
    process.exit(1);
  }

  const rollbackFile = join(migrationDir, "rollback.sql");
  const hasRollbackSql = existsSync(rollbackFile);

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl && !dryRun) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  console.log(`Migration: ${migrationName}`);
  console.log(`Database: ${databaseUrl ? maskDatabaseUrl(databaseUrl) : "(not set, dry-run)"}`);
  console.log(`Dry run: ${dryRun ? "yes" : "no"}`);
  console.log(`Rollback SQL: ${hasRollbackSql ? "found" : "not found"}`);

  if (hasRollbackSql) {
    const rollbackSql = readFileSync(rollbackFile, "utf8").trim();

    if (rollbackSql.length === 0) {
      console.warn("Warning: rollback.sql is empty. Skipping SQL execution.");
    } else if (dryRun) {
      console.log("\n[DRY RUN] Would execute rollback.sql:");
      console.log(rollbackSql);
    } else {
      console.log("\nExecuting rollback.sql against the database...");

      try {
        execSync(`psql "${databaseUrl}" -f "${rollbackFile}"`, {
          stdio: "inherit",
          env: { ...process.env },
        });
        console.log("Rollback SQL executed successfully.");
      } catch (error) {
        console.error(`Error executing rollback.sql: ${error.message}`);
        process.exit(1);
      }
    }
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] Would run: prisma migrate resolve --rolled-back "${migrationName}"`);
  } else {
    console.log("\nMarking migration as rolled back in Prisma migration tracking...");

    try {
      execSync(`prisma migrate resolve --rolled-back "${migrationName}"`, {
        cwd: prismaRoot,
        stdio: "inherit",
        env: { ...process.env },
      });
      console.log(`Migration "${migrationName}" marked as rolled back.`);
    } catch (error) {
      console.error(`Error marking migration as rolled back: ${error.message}`);
      process.exit(1);
    }
  }

  console.log("\nRollback completed successfully.");
}

main();
