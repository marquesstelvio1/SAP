import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });

import { randomInt } from "node:crypto";
import { getPrismaClient, seedRbacBootstrap } from "@saptm/database";
import { hashPassword } from "better-auth/crypto";

const localAdminDefaults = {
  email: "admin@saptm.local",
  name: "SAPTM Local Admin",
  organizationName: "SAPTM Local",
  organizationSlug: "saptm-local",
  password: undefined as string | undefined,
  roleKey: "tenant.admin",
} as const;

const database = getPrismaClient();

try {
  assertLocalOnly();

  const email = readEnv("SAPTM_LOCAL_ADMIN_EMAIL", localAdminDefaults.email).toLowerCase();
  const name = readEnv("SAPTM_LOCAL_ADMIN_NAME", localAdminDefaults.name);
  const password = readRequiredPassword();
  const organizationName = readEnv(
    "SAPTM_LOCAL_ORGANIZATION_NAME",
    localAdminDefaults.organizationName,
  );
  const organizationSlug = readEnv(
    "SAPTM_LOCAL_ORGANIZATION_SLUG",
    localAdminDefaults.organizationSlug,
  );

  assertPasswordPolicy(password);

  const organization = await database.organization.upsert({
    where: {
      slug: organizationSlug,
    },
    update: {
      name: organizationName,
      status: "active",
    },
    create: {
      name: organizationName,
      slug: organizationSlug,
      status: "active",
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const rbacResult = await seedRbacBootstrap({
    database,
    organizationId: organization.id,
  });
  const user = await database.user.upsert({
    where: {
      email,
    },
    update: {
      emailVerified: true,
      name,
    },
    create: {
      id: `local_admin_${crypto.randomUUID()}`,
      email,
      emailVerified: true,
      name,
    },
    select: {
      id: true,
      email: true,
    },
  });
  const passwordHash = await hashPassword(password);
  const credentialAccount = await database.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
    select: {
      id: true,
    },
  });

  if (credentialAccount === null) {
    await database.account.create({
      data: {
        id: `local_credential_${crypto.randomUUID()}`,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
  } else {
    await database.account.update({
      where: {
        id: credentialAccount.id,
      },
      data: {
        accountId: user.id,
        password: passwordHash,
      },
    });
  }

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
    select: {
      id: true,
    },
  });
  const adminRole = await database.role.findUniqueOrThrow({
    where: {
      organizationId_key: {
        organizationId: organization.id,
        key: localAdminDefaults.roleKey,
      },
    },
    select: {
      id: true,
      key: true,
    },
  });

  await database.membershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      membershipId: membership.id,
      roleId: adminRole.id,
    },
  });

  console.log(
    [
      "SAPTM local admin seed completed.",
      `email=${user.email}`,
      `organization=${organization.slug}`,
      `role=${adminRole.key}`,
      `permissions=${rbacResult.permissionsSeeded}`,
      `rolePermissionLinks=${rbacResult.rolePermissionLinksSeeded}`,
    ].join(" "),
  );
} finally {
  await database.$disconnect();
}

function assertLocalOnly(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("local-admin-seed.refuses_production");
  }
}

function assertPasswordPolicy(password: string): void {
  if (password.length < 12 || password.length > 128) {
    throw new Error("local-admin-seed.password_must_be_12_to_128_chars");
  }
}

function readEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value === undefined || value.length === 0 ? fallback : value;
}

function readRequiredPassword(): string {
  const envValue = process.env.SAPTM_LOCAL_ADMIN_PASSWORD?.trim();
  if (envValue !== undefined && envValue.length > 0) {
    return envValue;
  }
  const generated = generateSecurePassword();
  console.log(
    `[WARN] SAPTM_LOCAL_ADMIN_PASSWORD not set. Generated temporary password: ${generated}`,
  );
  return generated;
}

function generateSecurePassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  for (let i = 0; i < 24; i++) {
    password += chars[randomInt(0, chars.length)];
  }
  return password;
}
