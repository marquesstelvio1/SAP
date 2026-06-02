import { SetMetadata } from "@nestjs/common";
import type { AuthorizationRequirement, PlatformPermission } from "@saptm/auth";

export const authorizationRequirementMetadataKey = "saptm.authorization.requirement";

export function RequireAuthorization(requirement: AuthorizationRequirement) {
  return SetMetadata(authorizationRequirementMetadataKey, requirement);
}

export function RequirePermissions(...permissions: PlatformPermission[]) {
  return RequireAuthorization({
    permissions,
    permissionMode: "all",
  });
}
