import type { IncomingMessage, ServerResponse } from "node:http";
import { HttpException, Inject, Injectable, type NestMiddleware } from "@nestjs/common";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/node";
import { mapHttpStatusToRpcErrorCode, type RpcErrorCode } from "@saptm/rpc";
import { PlatformRpcProvider } from "./platform-rpc.provider.js";
import type { PlatformRpcContext } from "./platform-rpc.router.js";
import type { RpcRequestWithAuthContext } from "./rpc-context.js";

/**
 * Creates a platform RPC context from a raw Node.js IncomingMessage.
 * The request may optionally carry auth context set by upstream NestJS middleware.
 */
function createPlatformContext(request: IncomingMessage): PlatformRpcContext {
  return {
    request: request as IncomingMessage & RpcRequestWithAuthContext,
    authContext: undefined,
    organizationId: undefined,
    actorId: undefined,
    actorType: undefined,
    correlationId: undefined,
    userAgent: undefined,
    ipAddress: undefined,
  };
}

function castNestHttpExceptionToOrpcError(error: HttpException): ORPCError<RpcErrorCode, unknown> {
  const httpStatus = error.getStatus();
  const code = mapHttpStatusToRpcErrorCode(httpStatus);

  return new ORPCError<RpcErrorCode, unknown>(code, {
    message: error.message,
    cause: error,
    status: httpStatus,
  });
}

@Injectable()
export class RpcHttpMiddleware implements NestMiddleware {
  private readonly handler: RPCHandler<PlatformRpcContext>;

  constructor(
    @Inject(PlatformRpcProvider)
    platformRpcProvider: PlatformRpcProvider,
  ) {
    this.handler = new RPCHandler(platformRpcProvider.router, {
      interceptors: [
        async (options) => {
          try {
            return await options.next();
          } catch (error) {
            if (error instanceof HttpException) {
              throw castNestHttpExceptionToOrpcError(error);
            }

            throw error;
          }
        },
      ],
    });
  }

  async use(
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ): Promise<void> {
    try {
      const prefixes = ["/v1/rpc", "/rpc"] as const;

      for (const prefix of prefixes) {
        const result = await this.handler.handle(request, response, {
          prefix,
          context: createPlatformContext(request),
        });

        if (result.matched) {
          return;
        }
      }

      next();
    } catch (error) {
      // If oRPC already sent an error response, do not try to send another
      if (response.headersSent) {
        return;
      }
      next(error);
    }
  }
}
