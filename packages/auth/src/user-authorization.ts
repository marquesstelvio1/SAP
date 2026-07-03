import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";

import { filterPlatformPermissions } from "./api-key.js";
import type { PlatformPermission } from "./permissions.js";

export type ResolvedUserAuthorization = {
  organizationId?: string;
  permissions: readonly PlatformPermission[];
};

export type UserAuthorizationClient = Pick<SaptmPrismaClient, "membership">;

export async function resolveDefaultUserAuthorization(
  userId: string,
  database: UserAuthorizationClient = getPrismaClient(),
): Promise<ResolvedUserAuthorization> {
  const memberships = await database.membership.findMany({
    where: {
      userId,
      status: "active",
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // No active memberships — user has no org affiliation, no permissions
  if (memberships.length === 0) {
    return {
      permissions: [],
    };
  }

  // Merge permissions from ALL active memberships and use the first org as default
  const allPermissions = memberships.flatMap((membership) =>
    membership.roles.flatMap((membershipRole) =>
      membershipRole.role.permissions.map((rolePermission) => rolePermission.permission.key),
    ),
  );

  const firstMembership = memberships[0];

  const result: ResolvedUserAuthorization = {
    permissions: uniquePlatformPermissions(filterPlatformPermissions(allPermissions)),
  };

  if (firstMembership?.organizationId) {
    result.organizationId = firstMembership.organizationId;
  }

  return result;
}

export function uniquePlatformPermissions(
  permissions: readonly PlatformPermission[],
): PlatformPermission[] {
  return Array.from(new Set(permissions));
}

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
};

export async function getUserOrganizations(
  userId: string,
  database: UserAuthorizationClient = getPrismaClient(),
): Promise<UserOrganization[]> {
  const memberships = await database.membership.findMany({
    where: {
      userId,
      status: "active",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return memberships.map((m) => m.organization);
}

export async function verifyUserOrganizationAccess(
  userId: string,
  organizationId: string,
  database: UserAuthorizationClient = getPrismaClient(),
): Promise<boolean> {
  const membership = await database.membership.findFirst({
    where: {
      userId,
      organizationId,
      status: "active",
    },
  });

  return membership !== null;
}

export async function resolveOrganizationAuthorization(
  userId: string,
  organizationId: string,
  database: UserAuthorizationClient = getPrismaClient(),
): Promise<ResolvedUserAuthorization> {
  const membership = await database.membership.findFirst({
    where: {
      userId,
      organizationId,
      status: "active",
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return { permissions: [], organizationId };
  }

  return {
    organizationId: membership.organizationId,
    permissions: uniquePlatformPermissions(
      filterPlatformPermissions(
        membership.roles.flatMap((membershipRole) =>
          membershipRole.role.permissions.map((rolePermission) => rolePermission.permission.key),
        ),
      ),
    ),
  };
}
