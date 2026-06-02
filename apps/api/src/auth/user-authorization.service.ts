import { Injectable } from "@nestjs/common";
import { filterPlatformPermissions, type PlatformPermission } from "@saptm/auth";
import { getPrismaClient } from "@saptm/database";

export type ResolvedUserAuthorization = {
  organizationId?: string;
  permissions: readonly PlatformPermission[];
};

@Injectable()
export class UserAuthorizationService {
  private readonly database = getPrismaClient();

  async resolveDefaultUserAuthorization(userId: string): Promise<ResolvedUserAuthorization> {
    const memberships = await this.database.membership.findMany({
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
      permissions: uniquePermissions(
        filterPlatformPermissions(
          membership.roles.flatMap((membershipRole) =>
            membershipRole.role.permissions.map((rolePermission) => rolePermission.permission.key),
          ),
        ),
      ),
    };
  }
}

function uniquePermissions(permissions: readonly PlatformPermission[]): PlatformPermission[] {
  return Array.from(new Set(permissions));
}
