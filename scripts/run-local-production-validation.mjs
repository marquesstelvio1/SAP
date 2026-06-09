import { spawn } from "node:child_process";

const commands = [
  ["validate:foundation"],
  ["validate:ui-foundation"],
  ["validate:tracking-foundation"],
  ["validate:cargo-foundation"],
  ["validate:capacity-foundation"],
  ["validate:capacity-advisory"],
  ["validate:tariff-foundation"],
  ["validate:env"],
  ["validate:migrations"],
  ["validate:containers"],
  ["validate:deploy"],
  ["validate:production-inputs"],
  ["validate:production-handoff"],
  ["validate:observability"],
  ["validate:alert-routing"],
  ["validate:dr"],
  ["validate:tls"],
  ["validate:security-runtime"],
  ["validate:secrets-network"],
  ["validate:supply-chain"],
  ["validate:resilience"],
  ["validate:resource-governance"],
  ["validate:cluster"],
  ["validate:cluster-baseline-inputs"],
  ["validate:local-readiness"],
  ["validate:evidence"],
];

for (const args of commands) {
  const exitCode = await runPnpm(args);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

console.log(`SAPTM local production validation passed: ${commands.length} gates completed.`);

function runPnpm(args) {
  const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const command = [executable, ...args].join(" ");
  const { spawnArgs, spawnCommand } = createPnpmCommand(args);

  console.log(`\n> ${command}`);

  return new Promise((resolveExitCode) => {
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: process.cwd(),
      stdio: "inherit",
      windowsVerbatimArguments: process.platform === "win32",
      windowsHide: true,
    });

    child.once("error", (error) => {
      console.error(error);
      resolveExitCode(1);
    });
    child.once("close", (exitCode, signal) => {
      if (signal !== null) {
        console.error(`${command} exited with signal ${signal}`);
        resolveExitCode(1);
        return;
      }

      resolveExitCode(exitCode ?? 1);
    });
  });
}

function createPnpmCommand(args) {
  if (process.platform !== "win32") {
    return {
      spawnArgs: args,
      spawnCommand: "pnpm",
    };
  }

  return {
    spawnArgs: ["/d", "/c", `call pnpm.cmd ${args.join(" ")}`],
    spawnCommand: "cmd.exe",
  };
}
