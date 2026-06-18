import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "apps/api/src/main.ts",
  "apps/api/src/security/security-headers.ts",
  "apps/web/next.config.ts",
  "docs/security/http-security-headers.md",
];

const requiredContent = {
  "apps/api/src/main.ts": ["app.use(applySecurityHeaders)", "createCorsOptions"],
  "apps/api/src/security/security-headers.ts": [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Permissions-Policy",
    "removeHeader",
  ],
  "apps/web/next.config.ts": [
    "async headers()",
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Permissions-Policy",
  ],
  "docs/security/http-security-headers.md": ["API Headers", "Web Headers", "Acceptance Criteria"],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing security runtime files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const missingNeedles = [];

for (const [file, needles] of Object.entries(requiredContent)) {
  const source = readFileSync(join(root, file), "utf8");

  for (const needle of needles) {
    if (!source.includes(needle)) {
      missingNeedles.push(`${file}: ${needle}`);
    }
  }
}

if (missingNeedles.length > 0) {
  console.error("Security runtime content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM security runtime validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
