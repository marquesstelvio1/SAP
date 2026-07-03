export const rpcErrorCodes = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "CONFLICT",
  "NOT_FOUND",
  "RATE_LIMITED",
  "PAYLOAD_TOO_LARGE",
  "TIMEOUT",
  "DEPENDENCY_FAILURE",
  "INTEGRATION_ERROR",
  "INTERNAL_ERROR",
] as const;

export type RpcErrorCode = (typeof rpcErrorCodes)[number];

export type RpcErrorDefinition = {
  code: RpcErrorCode;
  statusCode: number;
  message: string;
  retryable: boolean;
};

export type RpcErrorEnvelope = {
  code: RpcErrorCode;
  message: string;
  traceId?: string;
  requestId?: string;
  details?: unknown;
};

export const rpcErrorCatalog = {
  UNAUTHENTICATED: {
    code: "UNAUTHENTICATED",
    statusCode: 401,
    message: "Authentication is required.",
    retryable: false,
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    statusCode: 403,
    message: "The authenticated actor is not allowed to perform this operation.",
    retryable: false,
  },
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    statusCode: 400,
    message: "The request payload is invalid.",
    retryable: false,
  },
  CONFLICT: {
    code: "CONFLICT",
    statusCode: 409,
    message: "The operation conflicts with the current resource state.",
    retryable: false,
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    statusCode: 404,
    message: "The requested resource was not found.",
    retryable: false,
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    statusCode: 429,
    message: "The operation exceeded an applicable rate limit.",
    retryable: true,
  },
  PAYLOAD_TOO_LARGE: {
    code: "PAYLOAD_TOO_LARGE",
    statusCode: 413,
    message: "The request payload exceeds the maximum allowed size.",
    retryable: false,
  },
  TIMEOUT: {
    code: "TIMEOUT",
    statusCode: 504,
    message: "The operation timed out.",
    retryable: true,
  },
  DEPENDENCY_FAILURE: {
    code: "DEPENDENCY_FAILURE",
    statusCode: 424,
    message:
      "The operation depends on a downstream resource that is unavailable or in an invalid state.",
    retryable: true,
  },
  INTEGRATION_ERROR: {
    code: "INTEGRATION_ERROR",
    statusCode: 502,
    message: "An external integration failed.",
    retryable: true,
  },
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    statusCode: 500,
    message: "An unexpected internal error occurred.",
    retryable: true,
  },
} satisfies Record<RpcErrorCode, RpcErrorDefinition>;

export function getRpcErrorDefinition(code: RpcErrorCode): RpcErrorDefinition {
  return rpcErrorCatalog[code];
}

export type CreateRpcErrorEnvelopeInput = {
  code: RpcErrorCode;
  message?: string;
  traceId?: string;
  requestId?: string;
  details?: unknown;
};

const httpStatusToRpcErrorCodeMap: Record<number, RpcErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "TIMEOUT",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  422: "VALIDATION_ERROR",
  424: "DEPENDENCY_FAILURE",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
  502: "INTEGRATION_ERROR",
  503: "INTERNAL_ERROR",
  504: "TIMEOUT",
};

export function mapHttpStatusToRpcErrorCode(status: number): RpcErrorCode {
  return httpStatusToRpcErrorCodeMap[status] ?? "INTERNAL_ERROR";
}

export function getHttpStatusFromRpcErrorCode(code: RpcErrorCode): number {
  return rpcErrorCatalog[code].statusCode;
}

export function createRpcErrorEnvelope(input: CreateRpcErrorEnvelopeInput): RpcErrorEnvelope {
  const definition = getRpcErrorDefinition(input.code);

  return {
    code: input.code,
    message: input.message ?? definition.message,
    ...(input.traceId === undefined ? {} : { traceId: input.traceId }),
    ...(input.requestId === undefined ? {} : { requestId: input.requestId }),
    ...(input.details === undefined ? {} : { details: input.details }),
  };
}
