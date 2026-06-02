export const rpcErrorCodes = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "CONFLICT",
  "NOT_FOUND",
  "RATE_LIMITED",
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
