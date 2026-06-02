import type {
  AuthorizationMode,
  AuthActorType,
  PlatformPermission,
} from "@saptm/auth";
import type { TelemetrySignal } from "@saptm/observability";
import { telemetrySignals } from "@saptm/observability";

export const rpcOperationKinds = ["query", "mutation", "subscription"] as const;
export const rpcAuthModes = ["public", "session", "service"] as const;
export const rpcAuditClassifications = ["none", "standard", "sensitive", "critical"] as const;
export const rpcIdempotencyModes = ["none", "required", "recommended"] as const;
export const rpcOperationCriticalities = ["low", "medium", "high", "critical"] as const;

export type RpcOperationKind = (typeof rpcOperationKinds)[number];
export type RpcAuthMode = (typeof rpcAuthModes)[number];
export type RpcAuditClassification = (typeof rpcAuditClassifications)[number];
export type RpcIdempotencyMode = (typeof rpcIdempotencyModes)[number];
export type RpcOperationCriticality = (typeof rpcOperationCriticalities)[number];

export type RpcObservabilityMetadata = {
  operationName: string;
  spanName: string;
  metricName: string;
  criticality: RpcOperationCriticality;
  signals: readonly TelemetrySignal[];
};

export type RpcOperationMetadata = {
  name: string;
  version: number;
  kind: RpcOperationKind;
  auth: RpcAuthMode;
  permissions: readonly PlatformPermission[];
  permissionMode: AuthorizationMode;
  actorTypes?: readonly AuthActorType[];
  organizationRequired: boolean;
  organizationId?: string;
  audit: RpcAuditClassification;
  idempotency: RpcIdempotencyMode;
  observability: RpcObservabilityMetadata;
};

export type CreateRpcOperationMetadataInput = {
  name: string;
  version?: number;
  kind?: RpcOperationKind;
  auth?: RpcAuthMode;
  permissions?: readonly PlatformPermission[];
  permissionMode?: AuthorizationMode;
  actorTypes?: readonly AuthActorType[];
  organizationRequired?: boolean;
  organizationId?: string;
  audit?: RpcAuditClassification;
  idempotency?: RpcIdempotencyMode;
  criticality?: RpcOperationCriticality;
  signals?: readonly TelemetrySignal[];
};

export function createRpcOperationMetadata(
  input: CreateRpcOperationMetadataInput,
): RpcOperationMetadata {
  const operationName = input.name.trim();
  const auth = input.auth ?? "session";
  const kind = input.kind ?? "query";
  const audit = input.audit ?? "standard";
  const metadata: RpcOperationMetadata = {
    name: operationName,
    version: input.version ?? 1,
    kind,
    auth,
    permissions: input.permissions ?? [],
    permissionMode: input.permissionMode ?? "all",
    ...(input.actorTypes === undefined ? {} : { actorTypes: input.actorTypes }),
    organizationRequired: input.organizationRequired ?? false,
    ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
    audit,
    idempotency: input.idempotency ?? "none",
    observability: {
      operationName,
      spanName: `rpc.${operationName}`,
      metricName: `rpc.${operationName}.duration_ms`,
      criticality: input.criticality ?? "medium",
      signals: input.signals ?? [...telemetrySignals],
    },
  };

  validateRpcOperationMetadata(metadata, {
    authWasExplicit: input.auth !== undefined,
  });

  return metadata;
}

type ValidateRpcOperationMetadataOptions = {
  authWasExplicit: boolean;
};

function validateRpcOperationMetadata(
  metadata: RpcOperationMetadata,
  options: ValidateRpcOperationMetadataOptions,
): void {
  if (metadata.name.length === 0) {
    throw new Error("rpc.metadata.name_required");
  }

  if (!Number.isInteger(metadata.version) || metadata.version < 1) {
    throw new Error("rpc.metadata.invalid_version");
  }

  if (metadata.kind === "mutation" && !options.authWasExplicit) {
    throw new Error("rpc.metadata.mutation_auth_required");
  }

  if (metadata.auth === "public" && metadata.permissions.length > 0) {
    throw new Error("rpc.metadata.public_permissions_forbidden");
  }

  if (metadata.auth === "public" && metadata.organizationRequired) {
    throw new Error("rpc.metadata.public_organization_scope_forbidden");
  }

  if (metadata.audit === "critical" && metadata.observability.criticality === "low") {
    throw new Error("rpc.metadata.critical_audit_low_criticality_forbidden");
  }
}
