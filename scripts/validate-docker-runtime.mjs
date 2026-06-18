import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const dockerConfigDir = resolve(process.cwd(), ".docker");
mkdirSync(dockerConfigDir, { recursive: true });
const dockerEnv = {
  ...process.env,
  DOCKER_CONFIG: dockerConfigDir,
};

const checks = [
  () => runDocker(["version"], "Docker client and server API are reachable"),
  () => runDocker(["compose", "version"], "Docker Compose plugin is available"),
  () => runDocker(["buildx", "ls"], "Docker Buildx/BuildKit is available"),
  () => runDocker(["compose", "config", "--quiet"], "compose.yaml is parseable"),
];

for (const check of checks) {
  check();
}

console.log(
  "SAPTM Docker runtime validation passed: Docker, Compose, Buildx, and compose.yaml are ready.",
);

function runDocker(args, label) {
  try {
    execFileSync("docker", args, {
      encoding: "utf8",
      env: dockerEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(`OK: ${label}`);
  } catch (error) {
    const stderr = error?.stderr?.toString?.() ?? "";
    const stdout = error?.stdout?.toString?.() ?? "";

    console.error(`Docker runtime validation failed: ${label}.`);
    console.error(`${stderr}${stdout}`.trim());
    process.exit(1);
  }
}
