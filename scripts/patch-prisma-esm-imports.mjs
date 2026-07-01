import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const prismaDir = resolve(process.cwd(), "dist/generated/prisma");

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      patchFile(fullPath);
    }
  }
}

function patchFile(filePath) {
  let source = readFileSync(filePath, "utf8");
  const original = source;

  source = source.replace(/from\s+"\.\/([^"]+?(?<!\.js))"/g, (_match, specifier) => {
    return `from "./${specifier}.js"`;
  });
  source = source.replace(/from\s+'\.\/([^']+?(?<!\.js))'/g, (_match, specifier) => {
    return `from './${specifier}.js'`;
  });

  if (source !== original) {
    writeFileSync(filePath, source);
    console.log(`Patched: ${filePath}`);
  }
}

walk(prismaDir);
console.log("Done patching Prisma ESM imports.");
