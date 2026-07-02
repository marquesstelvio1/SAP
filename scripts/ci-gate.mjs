#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const FULL = process.argv.includes("--full");

const steps = FULL
  ? [
    { cmd: "pnpm install --frozen-lockfile", label: "pnpm install" },
    { cmd: "pnpm biome check .", label: "biome check" },
    { cmd: "pnpm lint", label: "pnpm lint" },
    { cmd: "pnpm typecheck", label: "pnpm typecheck" },
    { cmd: "pnpm --filter @saptm/database db:generate", label: "prisma generate" },
    { cmd: "pnpm test", label: "pnpm test" },
    { cmd: "pnpm --filter @saptm/web build", label: "next build (web)" },
    { cmd: "pnpm --filter @saptm/api build", label: "nest build (api)" },
  ]
  : [
    { cmd: "pnpm install --frozen-lockfile", label: "pnpm install" },
    { cmd: "pnpm biome check .", label: "biome check" },
    { cmd: "pnpm lint", label: "pnpm lint" },
    { cmd: "pnpm typecheck", label: "pnpm typecheck" },
    { cmd: "pnpm --filter @saptm/database db:generate", label: "prisma generate" },
    { cmd: "pnpm test", label: "pnpm test" },
  ];

const failed = [];

for (const step of steps) {
  process.stdout.write(`\n\x1b[36m\u2501 [ci:gate] ${step.label}\x1b[0m\n`);

  try {
    execSync(step.cmd, {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
      timeout: 600_000,
    });
    process.stdout.write(`  \x1b[32m\u2713 ${step.label}\x1b[0m\n`);
  } catch (err) {
    process.stdout.write(`  \x1b[31m\u2717 ${step.label} (exit ${err.status ?? 1})\x1b[0m\n`);
    failed.push(step.label);
  }
}

process.stdout.write("\n\x1b[36m\u2501 [ci:gate] RESULTADO\x1b[0m\n");

if (failed.length === 0) {
  process.stdout.write(`  \x1b[32m\u2713 Todas as etapas passaram.\x1b[0m\n`);
  process.exit(0);
}

process.stdout.write(`  \x1b[31m\u2717 ${failed.length} etapa(s) falhou(ram):\x1b[0m\n`);
for (const f of failed) process.stdout.write(`    \x1b[31m- ${f}\x1b[0m\n`);
process.exit(1);
