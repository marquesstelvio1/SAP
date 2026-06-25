import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { TraceContext } from "@saptm/observability";
import { createRpcErrorEnvelope, type RpcErrorCode } from "@saptm/rpc";

type PrismaClientError = {
  code: string;
  meta?: Record<string, unknown>;
  message?: string;
};

function isPrismaError(error: unknown): error is PrismaClientError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as PrismaClientError).code === "string" &&
    ((error as PrismaClientError).code?.startsWith("P") ?? false)
  );
}

function mapHttpStatusToErrorCode(status: number): RpcErrorCode {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHENTICATED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.BAD_REQUEST:
      return "VALIDATION_ERROR";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "RATE_LIMITED";
    case HttpStatus.BAD_GATEWAY:
      return "INTEGRATION_ERROR";
    default:
      return "INTERNAL_ERROR";
  }
}

function mapPrismaCodeToErrorCode(prismaCode: string): RpcErrorCode {
  switch (prismaCode) {
    case "P2002":
    case "P2003":
      return "CONFLICT";
    case "P2025":
      return "NOT_FOUND";
    default:
      return "INTERNAL_ERROR";
  }
}

function mapPrismaCodeToHttpStatus(prismaCode: string): number {
  switch (prismaCode) {
    case "P2002":
    case "P2003":
      return HttpStatus.CONFLICT;
    case "P2025":
      return HttpStatus.NOT_FOUND;
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

function getTraceContext(host: ArgumentsHost): TraceContext | undefined {
  try {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Record<string, unknown>>();
    return request.traceContext as TraceContext | undefined;
  } catch {
    return undefined;
  }
}

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response: Record<string, unknown> = ctx.getResponse();
    const traceContext = getTraceContext(host);
    const traceId = traceContext?.traceId;
    const requestId = traceContext?.requestId;

    if (isPrismaError(exception)) {
      const prismaCode = exception.code;
      const errorCode = mapPrismaCodeToErrorCode(prismaCode);
      const httpStatus = mapPrismaCodeToHttpStatus(prismaCode);

      this.logger.warn(`Prisma error [${prismaCode}]: ${exception.message}`);

      const envelope = createRpcErrorEnvelope({
        code: errorCode,
        message:
          errorCode === "INTERNAL_ERROR"
            ? "A database error occurred."
            : (exception.message ?? "A database error occurred."),
        ...(traceId ? { traceId } : {}),
        ...(requestId ? { requestId } : {}),
        ...(exception.meta ? { details: exception.meta } : {}),
      });

      (response as { status: (code: number) => { json: (data: unknown) => void } })
        .status(httpStatus)
        .json({ json: envelope });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorCode = mapHttpStatusToErrorCode(status);
      const exceptionResponse = exception.getResponse();
      const details =
        typeof exceptionResponse === "object" && exceptionResponse !== null
          ? exceptionResponse
          : undefined;

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`HTTP ${status} error: ${exception.message}`, exception.stack);
      }

      const message =
        status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? "An internal server error occurred."
          : exception.message;

      const envelope = createRpcErrorEnvelope({
        code: errorCode,
        message,
        ...(traceId ? { traceId } : {}),
        ...(requestId ? { requestId } : {}),
        ...(details ? { details } : {}),
      });

      (response as { status: (code: number) => { json: (data: unknown) => void } })
        .status(status)
        .json({ json: envelope });
      return;
    }

    this.logger.error(
      "Unhandled exception",
      exception instanceof Error ? exception.stack : undefined,
    );

    const envelope = createRpcErrorEnvelope({
      code: "INTERNAL_ERROR",
      message: "An unexpected internal error occurred.",
      ...(traceId ? { traceId } : {}),
      ...(requestId ? { requestId } : {}),
    });

    (response as { status: (code: number) => { json: (data: unknown) => void } })
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ json: envelope });
  }
}
