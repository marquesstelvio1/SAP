import type { TraceContext, TraceHeaderMap } from "@saptm/observability";
import { parseTraceHeaders, serializeTraceHeaders } from "@saptm/observability";

export {
  createRpcAuthorizationRequirement,
  evaluateRpcAuthorization,
  isRpcAuthenticationRequired,
} from "./authorization.js";
export { defineRpcContract, defineRpcRouter } from "./contract.js";
export {
  createRpcErrorEnvelope,
  getRpcErrorDefinition,
  type CreateRpcErrorEnvelopeInput,
  type RpcErrorCode,
  rpcErrorCatalog,
  type RpcErrorDefinition,
  type RpcErrorEnvelope,
  rpcErrorCodes,
} from "./errors.js";
export {
  type CreateRpcOperationMetadataInput,
  createRpcOperationMetadata,
  type RpcAuditClassification,
  rpcAuditClassifications,
  type RpcAuthMode,
  rpcAuthModes,
  type RpcIdempotencyMode,
  rpcIdempotencyModes,
  type RpcObservabilityMetadata,
  type RpcOperationCriticality,
  rpcOperationCriticalities,
  type RpcOperationKind,
  rpcOperationKinds,
  type RpcOperationMetadata,
} from "./metadata.js";

export type RpcRequestContext = {
  traceContext: TraceContext;
  metadata: import("./metadata.js").RpcOperationMetadata;
};

export function serializeRpcTraceHeaders(context: TraceContext): TraceHeaderMap {
  return serializeTraceHeaders(context);
}

export function parseRpcTraceHeaders(
  headers: Record<string, string | undefined>,
): Partial<TraceContext> {
  return parseTraceHeaders(headers);
}
