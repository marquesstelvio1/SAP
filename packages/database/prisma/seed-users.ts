import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });

import { getPrismaClient } from "../src/index.js";
import { rbacBootstrapPermissions, rbacBootstrapRoleTemplates } from "../src/rbac-bootstrap.js";

const database = getPrismaClient();

type Profile = {
  email: string;
  name: string;
  roleKey: string;
  description: string;
};

const PASSWORD = "LocalAdmin!2026";
const ORG_SLUG = process.env.SAPTM_LOCAL_ORGANIZATION_SLUG ?? "saptm-local";

const PROFILES: Profile[] = [
  {
    email: "admin@saptm.local",
    name: "Admin SAPTM",
    roleKey: "tenant.admin",
    description: "Administrador com acesso total à plataforma",
  },
  {
    email: "gestora@saptm.local",
    name: "Gestora Operacional",
    roleKey: "tenant.operations_manager",
    description: "Gestão operacional de carga, tracking, capacidade e planeamento",
  },
  {
    email: "operador@saptm.local",
    name: "Operador de Carga",
    roleKey: "tenant.cargo_operator",
    description: "Operações de registo, liberação, transporte e entrega de carga",
  },
  {
    email: "integradora@saptm.local",
    name: "Integradora de Sistemas",
    roleKey: "tenant.integration_operator",
    description: "Ingestão de eventos externos e operações de tracking",
  },
];

try {
  console.log("A iniciar seed de utilizadores...");

  const organization = await database.organization.findUniqueOrThrow({
    where: { slug: ORG_SLUG },
  });

  console.log(`Organização encontrada: ${organization.name} (${organization.slug})`);

  // 1. Seed permissions
  console.log("A semear permissões...");
  const permissionIds = new Map<string, string>();
  for (const perm of rbacBootstrapPermissions) {
    const record = await database.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: {
        key: perm.key,
        description: perm.description,
      },
    });
    permissionIds.set(perm.key, record.id);
  }
  console.log(`  ${permissionIds.size} permissões sincronizadas.`);

  // 2. Seed roles + role-permission assignments
  console.log("A semear cargos...");
  const roleIds = new Map<string, string>();

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
    roleIds.set(tmpl.key, role.id);

    // Sync role permissions
    const currentPerms = await database.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const currentPermIds = new Set(currentPerms.map((p) => p.permissionId));

    const wantedPermIds = tmpl.permissions
      .map((k) => permissionIds.get(k))
      .filter(Boolean) as string[];

    const wantedSet = new Set(wantedPermIds);
    const toRemove = [...currentPermIds].filter((id: string) => !wantedSet.has(id));
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
  console.log(`  ${roleIds.size} cargos sincronizados.`);

  // 3. Import hashPassword
  const { hashPassword } = await import("better-auth/crypto");

  for (const profile of PROFILES) {
    // Upsert user
    const user = await database.user.upsert({
      where: { email: profile.email },
      update: { name: profile.name },
      create: {
        email: profile.email,
        name: profile.name,
        emailVerified: true,
      },
    });

    // Upsert account (email/password)
    const hashed = await hashPassword(PASSWORD);
    await database.account.upsert({
      where: {
        id: `${user.id}-email`,
      },
      update: {
        password: hashed,
      },
      create: {
        id: `${user.id}-email`,
        userId: user.id,
        providerId: "email",
        accountId: profile.email,
        password: hashed,
      },
    });

    // Upsert membership
    const membership = await database.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: {
        status: "active",
      },
      create: {
        organizationId: organization.id,
        userId: user.id,
        status: "active",
      },
    });

    // Assign role to membership
    const roleId = roleIds.get(profile.roleKey);
    if (roleId) {
      await database.membershipRole.upsert({
        where: {
          membershipId_roleId: {
            membershipId: membership.id,
            roleId,
          },
        },
        update: {},
        create: {
          membershipId: membership.id,
          roleId,
        },
      });
    }

    console.log(`  ${profile.email} → ${profile.roleKey}`);
  }

  console.log("\n✅ Seed de utilizadores concluído com sucesso.");
  console.log(`   Password comum: "${PASSWORD}"`);
} finally {
  await database.$disconnect();
}
