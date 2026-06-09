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

  if (memberships.length !== 1) {
    return {
      permissions: [],
    };
  }

  const membership = memberships[0];

  if (membership === undefined) {
    return {
      permissions: [],
    };
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

export function uniquePlatformPermissions(
  permissions: readonly PlatformPermission[],
): PlatformPermission[] {
  return Array.from(new Set(permissions));
}
