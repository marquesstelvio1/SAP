import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [distFile, ...specifiers] = process.argv.slice(2);

if (distFile === undefined || specifiers.length === 0) {
  console.error("Usage: node scripts/patch-esm-dist-extensions.mjs <dist-file> <specifier...>");
  process.exit(1);
}

const filePath = resolve(process.cwd(), distFile);
let source = readFileSync(filePath, "utf8");

for (const specifier of specifiers) {
  source = source
    .replaceAll(`from "./${specifier}";`, `from "./${specifier}.js";`)
    .replaceAll(`from './${specifier}';`, `from './${specifier}.js';`);
}

writeFileSync(filePath, source);
