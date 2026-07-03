import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });

import { getPrismaClient } from "../src/index.js";
import { rbacBootstrapPermissions, rbacBootstrapRoleTemplates } from "../src/rbac-bootstrap.js";

const database = getPrismaClient();

const ORG_SLUG = process.env.SAPTM_BOOTSTRAP_ORGANIZATION_SLUG ?? "saptm-local";
const ORG_NAME = process.env.SAPTM_BOOTSTRAP_ORGANIZATION_NAME ?? "SAPTM";

async function main() {
  console.log("[RBAC] Starting RBAC bootstrap...");

  // 1. Upsert organization (idempotent — safe for any environment)
  const organization = await database.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: {
      name: ORG_NAME,
      slug: ORG_SLUG,
      status: "active",
    },
  });
  console.log(`[RBAC] Organization: ${organization.name} (${organization.slug})`);

  // 2. Upsert permissions (idempotent by key; updates description to keep in sync)
  const permissionIds = new Map<string, string>();
  for (const perm of rbacBootstrapPermissions) {
    const record = await database.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: {
        key: perm.key,
        description: perm.description,
      },
    });
    permissionIds.set(perm.key, record.id);
  }
  console.log(`[RBAC] ${permissionIds.size} permissions synced`);

  // 3. Upsert roles + sync role-permission assignments
  for (const tmpl of rbacBootstrapRoleTemplates) {
    const role = await database.role.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: tmpl.key,
        },
      },
      update: {
        name: tmpl.name,
        description: tmpl.description,
      },
      create: {
        organizationId: organization.id,
        key: tmpl.key,
        name: tmpl.name,
        description: tmpl.description,
      },
    });

    // Sync role permissions: add missing, remove extra
    const currentPerms = await database.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const currentPermIds = new Set(currentPerms.map((p) => p.permissionId));
    const wantedPermIds = tmpl.permissions
      .map((k) => permissionIds.get(k))
      .filter(Boolean) as string[];

    const toRemove = [...currentPermIds].filter((id) => !wantedPermIds.includes(id));
    const toAdd = wantedPermIds.filter((id) => !currentPermIds.has(id));

    if (toRemove.length > 0) {
      await database.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { in: toRemove } },
      });
    }
    if (toAdd.length > 0) {
      await database.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`[RBAC] ${rbacBootstrapRoleTemplates.length} roles synced`);
  console.log("[RBAC] Bootstrap complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => database.$disconnect());
