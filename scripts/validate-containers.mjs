import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".dockerignore",
  ".github/workflows/container-ci.yml",
  "apps/api/Dockerfile",
  "apps/web/Dockerfile",
  "apps/web/app/api/health/route.ts",
  "compose.yaml",
  "docs/devops/container-registry.md",
  "docs/devops/deployment-strategy.md",
];

const requiredContent = {
  ".github/workflows/container-ci.yml": [
    "ghcr.io/$" + "{{ steps.image.outputs.namespace }}/$" + "{{ matrix.image_suffix }}",
    "docker/build-push-action@v6",
    "docker/metadata-action@v5",
    "type=sha,prefix=sha-",
    "provenance: true",
    "sbom: true",
    "aquasecurity/trivy-action@0.28.0",
    "sigstore/cosign-installer@v3",
    "cosign sign --yes",
    "cosign verify",
  ],
  "apps/api/Dockerfile": [
    "corepack prepare pnpm@10.12.1 --activate",
    "pnpm fetch --frozen-lockfile --store-dir /pnpm/store",
    "pnpm install --frozen-lockfile --offline --store-dir /pnpm/store",
    "sharing=shared",
    "pnpm --filter @saptm/api... build",
    "COPY --from=builder /app/apps/api/dist ./apps/api/dist",
    "COPY --from=builder /app/packages/rpc/dist ./packages/rpc/dist",
    "COPY --from=builder /app/packages/rpc/node_modules ./packages/rpc/node_modules",
    "COPY --from=builder /app/packages/database/dist ./packages/database/dist",
    "COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules",
    ".prisma/client",
    "HEALTHCHECK",
    'CMD ["node", "dist/main.js"]',
  ],
  "apps/web/Dockerfile": [
    "corepack prepare pnpm@10.12.1 --activate",
    "pnpm fetch --frozen-lockfile --store-dir /pnpm/store",
    "pnpm install --frozen-lockfile --offline --store-dir /pnpm/store",
    "sharing=shared",
    "pnpm --filter @saptm/web... build",
    "apps/web/.next/standalone",
    "HEALTHCHECK",
    'CMD ["node", "apps/web/server.js"]',
  ],
  "compose.yaml": [
    "api:",
    "web:",
    "redis:",
    "image: saptm-api:local",
    "image: saptm-web:local",
    "condition: service_healthy",
    '"25432:5432"',
    '"26379:6379"',
    "postgresql://postgres:postgres@postgres:5432/saptm",
    "redis://redis:6379",
  ],
};

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing container foundation files:");
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
  console.error("Container foundation content mismatch:");
  for (const entry of missingNeedles) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(
  `SAPTM container validation passed: ${requiredFiles.length} files and ${
    Object.values(requiredContent).flat().length
  } content rules covered.`,
);
