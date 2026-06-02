import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { type AuthorizationRequirement, evaluateAuthorization } from "@saptm/auth";

import { ObservabilityService } from "../observability/observability.service.js";
import type { RequestWithAuthContext } from "./auth-context.js";
import { authorizationRequirementMetadataKey } from "./authorization.decorator.js";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(ObservabilityService) private readonly observability: ObservabilityService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<AuthorizationRequirement>(
      authorizationRequirementMetadataKey,
      [context.getHandler(), context.getClass()],
    );

    if (requirement === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuthContext>();

    if (request.authResolutionError) {
      throw new UnauthorizedException("Authenticated request context could not be resolved.");
    }

    if (!request.authContext) {
      throw new UnauthorizedException("Authenticated request context is required.");
    }

    const decision = evaluateAuthorization(request.authContext, requirement);

    this.observability.recordAuthorizationDecision({
      request,
      authContext: request.authContext,
      decision,
      requirement,
    });

    if (!decision.allowed) {
      throw new ForbiddenException("Request is not authorized for this operation.");
    }

    return true;
  }
}
