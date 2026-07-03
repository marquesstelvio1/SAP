import { ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import {
  createRpcAuthorizationRequirement,
  evaluateRpcAuthorization,
  type RpcOperationMetadata,
} from "@saptm/rpc";

import { AuthContextService } from "../auth/auth-context.service.js";
import { ObservabilityService } from "../observability/observability.service.js";
import type { AuthorizedRpcContext, RpcRequestWithAuthContext } from "./rpc-context.js";

@Injectable()
export class RpcContextService {
  constructor(
    @Inject(AuthContextService)
    private readonly authContextService: AuthContextService,
    @Inject(ObservabilityService)
    private readonly observability: ObservabilityService,
  ) {}

  async authorizeRequest(
    request: RpcRequestWithAuthContext,
    metadata: RpcOperationMetadata,
  ): Promise<AuthorizedRpcContext> {
    if (request.authResolutionError !== undefined) {
      const causeMessage =
        request.authResolutionError instanceof Error
          ? `${request.authResolutionError.constructor.name}: ${request.authResolutionError.message}`
          : String(request.authResolutionError);
      throw new UnauthorizedException(`rpc.auth_resolution_failed (${causeMessage})`);
    }

    const authContext =
      request.authContext ?? (await this.authContextService.resolveRequestContext(request));
    const decision = evaluateRpcAuthorization(authContext, metadata);
    const requirement = createRpcAuthorizationRequirement(metadata);

    if (authContext !== undefined && requirement !== undefined) {
      this.observability.recordRpcAuthorizationDecision({
        request,
        authContext,
        decision,
        requirement,
        metadata,
      });
    }

    if (!decision.allowed) {
      if (decision.reason === "rpc.authorization.unauthenticated") {
        throw new UnauthorizedException(decision.reason);
      }

      throw new ForbiddenException(decision.reason);
    }

    return {
      metadata,
      ...(authContext === undefined ? {} : { authContext }),
    };
  }
}
