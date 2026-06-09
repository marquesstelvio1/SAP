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
