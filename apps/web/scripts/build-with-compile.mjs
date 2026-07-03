import { execSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..");

console.log("Building in compile mode (skipping prerender)...");
try {
  execSync("pnpm next build --webpack --experimental-build-mode compile", {
    cwd: projectRoot,
    stdio: "inherit",
  });
} catch {
  console.error("Compile phase failed.");
  process.exit(1);
}

const standaloneDir = join(projectRoot, ".next", "standalone", "apps", "web");
const staticSource = join(projectRoot, ".next", "static");
const staticTarget = join(standaloneDir, ".next", "static");

if (!existsSync(standaloneDir)) {
  console.error("Standalone dir not found:", standaloneDir);
  process.exit(1);
}

if (!existsSync(staticSource)) {
  console.error("Static source not found:", staticSource);
  process.exit(1);
}

cpSync(staticSource, staticTarget, { recursive: true });
console.log(`Static files copied to ${staticTarget}`);
