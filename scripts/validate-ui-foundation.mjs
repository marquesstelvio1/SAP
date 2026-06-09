import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/frontend/app-shell-foundation.md",
  "packages/auth/src/user-authorization.ts",
  "apps/api/src/auth/user-authorization.service.ts",
  "apps/web/lib/auth-client.ts",
  "apps/web/lib/auth-session.ts",
  "apps/web/lib/platform-navigation.ts",
  "apps/web/components/platform-shell.tsx",
  "apps/web/app/page.tsx",
  "apps/web/app/sign-in/page.tsx",
  "apps/web/app/sign-in/sign-in-form.tsx",
  "apps/web/app/(platform)/layout.tsx",
  "apps/web/app/(platform)/app/page.tsx",
];

const requiredSnippets = [
  {
    file: "apps/web/lib/auth-session.ts",
    snippets: ["createSaptmAuthFromEnv", "auth.api.getSession", "resolveDefaultUserAuthorization"],
  },
  {
    file: "apps/web/app/(platform)/layout.tsx",
    snippets: ["getCurrentPlatformSession", "PlatformShell", "resolvePlatformNavigation"],
  },
  {
    file: "apps/web/app/sign-in/sign-in-form.tsx",
    snippets: ["authClient.signIn.email", "callbackURL", "rememberMe"],
  },
  {
    file: "apps/web/lib/platform-navigation.ts",
    snippets: ["requiredPermissions", "hasRequiredNavigationPermissions"],
  },
  {
    file: "packages/auth/src/user-authorization.ts",
    snippets: ["membership.findMany", "filterPlatformPermissions", "uniquePlatformPermissions"],
  },
];

const forbiddenBusinessRoutes = [
  "apps/web/app/(platform)/cargo",
  "apps/web/app/(platform)/cargas",
  "apps/web/app/(platform)/ports",
  "apps/web/app/(platform)/portos",
  "apps/web/app/(platform)/rail",
  "apps/web/app/(platform)/ferrovia",
  "apps/web/app/(platform)/analytics",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Missing UI foundation files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

for (const route of forbiddenBusinessRoutes) {
  if (existsSync(join(root, route))) {
    console.error(`Business route exists before UI/Auth foundation is closed: ${route}`);
    process.exit(1);
  }
}

for (const assertion of requiredSnippets) {
  const source = readFileSync(join(root, assertion.file), "utf8");

  for (const snippet of assertion.snippets) {
    if (!source.includes(snippet)) {
      console.error(`Missing snippet "${snippet}" in ${assertion.file}`);
      process.exit(1);
    }
  }
}

console.log(`SAPTM UI foundation validation passed: ${requiredFiles.length} files present.`);
