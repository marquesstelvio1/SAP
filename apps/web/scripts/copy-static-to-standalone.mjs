import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const standaloneDir = join(projectRoot, ".next", "standalone", "apps", "web");
const staticSource = join(projectRoot, ".next", "static");
const staticTarget = join(standaloneDir, ".next", "static");

if (!existsSync(standaloneDir)) {
  console.error("Standalone dir not found:", standaloneDir);
  console.error("Expected at:", join(projectRoot, ".next", "standalone"));
  process.exit(1);
}

if (!existsSync(staticSource)) {
  console.error("Static source not found:", staticSource);
  console.error("Run 'next build' first.");
  process.exit(1);
}

cpSync(staticSource, staticTarget, { recursive: true });
console.log(`Static files copied to ${staticTarget}`);
