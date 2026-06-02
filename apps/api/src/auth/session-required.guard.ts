import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import type { RequestWithAuthContext } from "./auth-context.js";

@Injectable()
export class SessionRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuthContext>();

    if (request.authResolutionError) {
      throw new UnauthorizedException("Authenticated request context could not be resolved.");
    }

    if (!request.authContext) {
      throw new UnauthorizedException("Authenticated request context is required.");
    }

    return true;
  }
}
