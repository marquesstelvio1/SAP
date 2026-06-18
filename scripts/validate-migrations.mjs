import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const prismaRoot = join(root, "packages/database/prisma");
const schemaPath = join(prismaRoot, "schema.prisma");
const migrationsRoot = join(prismaRoot, "migrations");
const lockPath = join(migrationsRoot, "migration_lock.toml");
const baselineMigrationPath = join(
  migrationsRoot,
  "20260602160000_initial_foundation",
  "migration.sql",
);

const requiredPaths = [schemaPath, migrationsRoot, lockPath, baselineMigrationPath];
const missing = requiredPaths.filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error("Missing migration baseline files:");
  for (const path of missing) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

const schema = readFileSync(schemaPath, "utf8");
const migrations = readMigrationSqlFiles();
const migration = migrations.join("\n\n");
const lock = readFileSync(lockPath, "utf8");
const models = extractPrismaDeclarations(schema, "model");
const enums = extractPrismaDeclarations(schema, "enum");
const missingTables = models.filter((model) => !migration.includes(`CREATE TABLE "${model}"`));
const missingEnums = enums.filter((enumName) => !migration.includes(`CREATE TYPE "${enumName}"`));
const destructiveStatements = [
  ...migration.matchAll(/\bDROP\s+(TABLE|TYPE|SCHEMA|DATABASE)\b/gi),
].map((match) => match[0]);

if (!lock.includes('provider = "postgresql"')) {
  console.error('Prisma migration lock must declare provider = "postgresql".');
  process.exit(1);
}

if (migration.charCodeAt(0) === 0xfeff) {
  console.error("Initial migration baseline must not include a UTF-8 BOM.");
  process.exit(1);
}

if (missingTables.length > 0 || missingEnums.length > 0) {
  console.error("Migration baseline does not cover the current Prisma schema:");

  for (const table of missingTables) {
    console.error(`- missing table: ${table}`);
  }

  for (const enumName of missingEnums) {
    console.error(`- missing enum: ${enumName}`);
  }

  process.exit(1);
}

if (destructiveStatements.length > 0) {
  console.error("Initial migration baseline must not contain destructive statements:");

  for (const statement of destructiveStatements) {
    console.error(`- ${statement}`);
  }

  process.exit(1);
}

console.log(
  `SAPTM migration validation passed: ${models.length} models and ${enums.length} enums covered by ${migrations.length} migrations.`,
);

function readMigrationSqlFiles() {
  return readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(migrationsRoot, entry.name, "migration.sql"))
    .filter((path) => existsSync(path))
    .sort()
    .map((path) => readFileSync(path, "utf8"));
}

function extractPrismaDeclarations(source, declarationType) {
  return [...source.matchAll(new RegExp(`^${declarationType} ([A-Za-z0-9_]+) \\{`, "gm"))]
    .map((match) => match[1])
    .sort();
}
