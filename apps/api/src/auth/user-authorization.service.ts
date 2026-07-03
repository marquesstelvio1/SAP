import { Injectable } from "@nestjs/common";
import {
  type ResolvedUserAuthorization,
  resolveDefaultUserAuthorization as resolveUserAuthorization,
  resolveOrganizationAuthorization as resolveOrgAuthorization,
  verifyUserOrganizationAccess as verifyOrgAccess,
} from "@saptm/auth/server";

@Injectable()
export class UserAuthorizationService {
  async resolveDefaultUserAuthorization(userId: string): Promise<ResolvedUserAuthorization> {
    return resolveUserAuthorization(userId);
  }

  async resolveOrganizationAuthorization(
    userId: string,
    organizationId: string,
  ): Promise<ResolvedUserAuthorization> {
    return resolveOrgAuthorization(userId, organizationId);
  }

  async verifyUserOrganizationAccess(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    return verifyOrgAccess(userId, organizationId);
  }
}
