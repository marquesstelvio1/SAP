import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const prismaClientDir = resolve(process.cwd(), "node_modules/@prisma/client/.prisma/client");
const relativeTarget = "../../../../generated/prisma/client";

mkdirSync(prismaClientDir, { recursive: true });

writeFileSync(
  resolve(prismaClientDir, "default.d.ts"),
  `// auto-generated shim — re-exports from @saptm/database generated client
export * from "${relativeTarget}";
`,
);

writeFileSync(
  resolve(prismaClientDir, "default.js"),
  `// auto-generated shim — re-exports from @saptm/database generated client
module.exports = require("${relativeTarget}");
`,
);

console.log("Created Prisma shim at", prismaClientDir);
