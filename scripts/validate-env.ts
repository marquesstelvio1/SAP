import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parseClientEnv, parseServerEnv } from "../packages/config/src/index.ts";

const root = process.cwd();
const envExamplePath = join(root, ".env.example");

if (!existsSync(envExamplePath)) {
  console.error("Missing .env.example.");
  process.exit(1);
}

const exampleEnv = parseEnvFile(readFileSync(envExamplePath, "utf8"));

parseServerEnv(exampleEnv);
parseClientEnv(exampleEnv);

// Detect known placeholder values that should never reach production
const PLACEHOLDER_PATTERNS = [/^replace-with-/i, /^re_xxxxx$/, /^CHANGE_ME$/i, /^your-/i];

let hasPlaceholderWarning = false;

for (const [key, value] of Object.entries(exampleEnv)) {
  const isPlaceholder = PLACEHOLDER_PATTERNS.some((p) => p.test(value));
  if (isPlaceholder) {
    console.warn(`  ⚠️  ${key} contains placeholder value: "${value}"`);
    console.warn(`     Replace with a real value before deploying to production.`);
    hasPlaceholderWarning = true;
  }
}

if (hasPlaceholderWarning) {
  console.log("");
  console.log(
    "ℹ️  Placeholders are acceptable for local development, but must be replaced for CI/prod.",
  );
}

console.log("SAPTM environment validation passed: .env.example matches runtime schemas.");

function parseEnvFile(source: string): Record<string, string> {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");

        if (separatorIndex === -1) {
          throw new Error(`Invalid env line: ${line}`);
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        return [key, stripOptionalQuotes(value)] as const;
      }),
  );
}

function stripOptionalQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
