import { Inject, Injectable, type NestMiddleware } from "@nestjs/common";

import type { RequestWithAuthContext } from "./auth-context.js";
import { AuthContextService } from "./auth-context.service.js";

type NextFunction = () => void;

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(@Inject(AuthContextService) private readonly authContext: AuthContextService) {}

  async use(
    request: RequestWithAuthContext,
    _response: unknown,
    next: NextFunction,
  ): Promise<void> {
    try {
      await this.authContext.resolveRequestContext(request);
      this.authContext.synchronizeTraceContext(request);
    } catch (error) {
      console.error("[AUTH] auth resolution failed", {
        path: request.url,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      request.authResolutionError = error;
    }

    next();
  }
}
