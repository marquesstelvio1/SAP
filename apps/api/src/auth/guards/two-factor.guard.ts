import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import type { RequestWithAuthContext } from "../auth-context.js";

@Injectable()
export class TwoFactorGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthContext>();
    const authContext = request.authContext;

    if (!authContext) {
      return false;
    }

    const isAdmin = authContext.permissions.includes("tenant.manage");

    if (!isAdmin) {
      return true;
    }

    if (authContext.twoFactorEnabled !== true) {
      throw new ForbiddenException("Admin users must have two-factor authentication enabled.");
    }

    return true;
  }
}
