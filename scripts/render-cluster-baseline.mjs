import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const acmeEmail = process.env.SAPTM_ACME_EMAIL;

if (acmeEmail === undefined || acmeEmail.trim() === "") {
  console.error("SAPTM_ACME_EMAIL is required before applying ClusterIssuers.");
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(acmeEmail)) {
  console.error("SAPTM_ACME_EMAIL must be a valid email address.");
  process.exit(1);
}

if (acmeEmail.includes("example.com") || acmeEmail === "platform@example.com") {
  console.error("SAPTM_ACME_EMAIL must not use a placeholder domain.");
  process.exit(1);
}

for (const file of [
  "deploy/kubernetes/cluster/cert-manager-staging-issuer.yaml",
  "deploy/kubernetes/cluster/cert-manager-production-issuer.yaml",
]) {
  const path = join(root, file);
  const source = readFileSync(path, "utf8");
  const rendered = source.replace(/email:\s*.+/g, `email: ${acmeEmail}`);
  writeFileSync(path, rendered);
}

console.log(`Rendered cert-manager ClusterIssuers with SAPTM_ACME_EMAIL=${acmeEmail}.`);
