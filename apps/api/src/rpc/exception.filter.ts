import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { TraceContext } from "@saptm/observability";
import {
  createRpcErrorEnvelope,
  getHttpStatusFromRpcErrorCode,
  mapHttpStatusToRpcErrorCode,
  type RpcErrorCode,
} from "@saptm/rpc";
import { ZodError } from "zod";

type PrismaClientKnownRequestError = {
  code: string;
  meta?: Record<string, unknown>;
  message?: string;
};

function isPrismaClientKnownRequestError(error: unknown): error is PrismaClientKnownRequestError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as Record<string, unknown>;

  if (typeof candidate.code !== "string") {
    return false;
  }

  return candidate.code.startsWith("P");
}

function mapPrismaCodeToErrorCode(prismaCode: string): RpcErrorCode {
  switch (prismaCode) {
    case "P2002":
    case "P2003":
      return "CONFLICT";
    case "P2025":
      return "NOT_FOUND";
    case "P1000":
    case "P1001":
    case "P1002":
    case "P1003":
    case "P1008":
      return "DEPENDENCY_FAILURE";
    case "P2010":
    case "P2011":
    case "P2012":
    case "P2015":
    case "P2016":
      return "VALIDATION_ERROR";
    default:
      return "INTERNAL_ERROR";
  }
}

function getTraceContext(host: ArgumentsHost): TraceContext | undefined {
  try {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Record<string, unknown>>();
    const traceContext = request.traceContext;

    if (traceContext !== undefined && typeof traceContext === "object" && traceContext !== null) {
      return traceContext as TraceContext;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    try {
      this.handleException(exception, host);
    } catch (sendError) {
      this.logger.error(
        "Failed to send RPC error response",
        sendError instanceof Error ? sendError.stack : undefined,
      );
    }
  }

  private handleException(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Record<string, unknown>>();
    const traceContext = getTraceContext(host);
    const traceId = traceContext?.traceId;
    const requestId = traceContext?.requestId;

    // Check if headers are already sent to avoid double-send crash
    const res = response as { headersSent?: boolean };
    if (res.headersSent === true) {
      this.logger.warn("RPC exception after headers sent — skipping response");
      return;
    }

    // Handle Prisma client known request errors
    if (isPrismaClientKnownRequestError(exception)) {
      const prismaCode = exception.code;
      const errorCode = mapPrismaCodeToErrorCode(prismaCode);
      const httpStatus = getHttpStatusFromRpcErrorCode(errorCode);

      this.logger.warn(`Prisma error [${prismaCode}]: ${exception.message ?? "Database error"}`);

      const envelope = createRpcErrorEnvelope({
        code: errorCode,
        message:
          errorCode === "INTERNAL_ERROR"
            ? "A database error occurred."
            : (exception.message ?? "A database error occurred."),
        ...(traceId !== undefined ? { traceId } : {}),
        ...(requestId !== undefined ? { requestId } : {}),
      });

      sendJsonResponse(response, httpStatus, envelope);
      return;
    }

    // Handle Zod validation errors
    if (exception instanceof ZodError) {
      this.logger.warn(`Zod validation error: ${exception.message}`);

      const envelope = createRpcErrorEnvelope({
        code: "VALIDATION_ERROR",
        message: "The request payload failed schema validation.",
        details: exception.issues,
        ...(traceId !== undefined ? { traceId } : {}),
        ...(requestId !== undefined ? { requestId } : {}),
      });

      sendJsonResponse(response, HttpStatus.BAD_REQUEST, envelope);
      return;
    }

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorCode = mapHttpStatusToRpcErrorCode(status);
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
        ...(traceId !== undefined ? { traceId } : {}),
        ...(requestId !== undefined ? { requestId } : {}),
        ...(details !== undefined ? { details } : {}),
      });

      sendJsonResponse(response, status, envelope);
      return;
    }

    this.logger.error(
      "Unhandled exception",
      exception instanceof Error ? exception.stack : undefined,
    );

    const envelope = createRpcErrorEnvelope({
      code: "INTERNAL_ERROR",
      message: "An unexpected internal error occurred.",
      ...(traceId !== undefined ? { traceId } : {}),
      ...(requestId !== undefined ? { requestId } : {}),
    });

    sendJsonResponse(response, HttpStatus.INTERNAL_SERVER_ERROR, envelope);
  }
}

function sendJsonResponse(
  response: Record<string, unknown>,
  status: number,
  data: Record<string, unknown>,
): void {
  const res = response as {
    status: (code: number) => { json: (body: Record<string, unknown>) => void };
    headersSent?: boolean;
  };

  if (res.headersSent) {
    return;
  }

  res.status(status).json(data);
}
