import { Inject, Injectable, type NestMiddleware, UnauthorizedException } from "@nestjs/common";

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.constructor.name : typeof error;
      const correlationId = request.traceContext?.correlationId ?? "unknown";

      console.error("[AUTH] auth resolution failed", {
        correlationId,
        path: request.url,
        errorName,
        error: errorMessage,
        stack: errorStack,
        method: request.method,
        headers: filterSensitiveHeaders(request.headers),
      });
      request.authResolutionError = error;

      // Propagate auth failures as 401 so consumers can handle them.
      // This avoids silent failures where downstream code gets confusing errors.
      // Skip for RPC paths and auth paths (they have their own error handling).
      if (
        request.url !== undefined &&
        !request.url.startsWith("/rpc") &&
        !request.url.startsWith("/api/")
      ) {
        throw new UnauthorizedException("Sessao invalida ou expirada.");
      }
    }

    next();
  }
}

function filterSensitiveHeaders(
  headers: Record<string, string | string[] | undefined> | undefined,
): Record<string, string> | undefined {
  if (headers === undefined) return undefined;

  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key === "cookie" || key === "authorization") {
      filtered[key] = "[REDACTED]";
      continue;
    }
    const val = Array.isArray(value) ? value.at(0) : value;
    filtered[key] = val ?? "";
  }
  return filtered;
}
