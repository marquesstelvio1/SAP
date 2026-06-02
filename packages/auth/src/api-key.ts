import type { TraceContext } from "@saptm/observability";

import { type AuthContext, createAuthContext } from "./context.js";
import { type PlatformPermission, platformPermissions } from "./permissions.js";

export const apiKeyPrefix = "saptm_sk";
export const apiKeyHashAlgorithm = "SHA-256";
export const apiKeyStoragePrefixLength = 24;

export type ApiKeyMaterial = {
  apiKey: string;
  prefix: string;
};

export type ServiceAccountCredential = {
  serviceAccountId: string;
  apiKeyId: string;
  organizationId: string;
  scopes: readonly string[];
  active: boolean;
  expiresAt?: Date | string | null;
  revokedAt?: Date | string | null;
};

export type ApiKeyValidationDecision = {
  valid: boolean;
  reason: "api_key.valid" | "api_key.inactive" | "api_key.expired" | "api_key.revoked";
};

export type CreateServiceAccountAuthContextInput = {
  credential: ServiceAccountCredential;
  traceContext: Pick<TraceContext, "correlationId" | "requestId">;
  authenticatedAt?: Date;
};

export function createApiKeyMaterial(byteLength = 32): ApiKeyMaterial {
  const secretBytes = new Uint8Array(byteLength);

  globalThis.crypto.getRandomValues(secretBytes);

  const apiKey = `${apiKeyPrefix}_${toHex(secretBytes)}`;

  return {
    apiKey,
    prefix: createApiKeyStoragePrefix(apiKey),
  };
}

export async function hashApiKey(apiKey: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    apiKeyHashAlgorithm,
    new TextEncoder().encode(apiKey),
  );

  return toHex(new Uint8Array(digest));
}

export function createApiKeyStoragePrefix(apiKey: string): string {
  return apiKey.slice(0, apiKeyStoragePrefixLength);
}

export function extractApiKeyFromHeaders(headers: Pick<Headers, "get">): string | undefined {
  const directApiKey = headers.get("x-api-key")?.trim();

  if (directApiKey) {
    return directApiKey;
  }

  const authorization = headers.get("authorization")?.trim();
  const bearerMatch =
    authorization === undefined ? undefined : /^Bearer\s+(.+)$/i.exec(authorization);
  const bearerToken = bearerMatch?.at(1)?.trim();

  return bearerToken === "" ? undefined : bearerToken;
}

export function validateApiKeyCredential(
  credential: Pick<ServiceAccountCredential, "active" | "expiresAt" | "revokedAt">,
  now = new Date(),
): ApiKeyValidationDecision {
  if (!credential.active) {
    return {
      valid: false,
      reason: "api_key.inactive",
    };
  }

  if (credential.revokedAt !== undefined && credential.revokedAt !== null) {
    return {
      valid: false,
      reason: "api_key.revoked",
    };
  }

  if (isExpired(credential.expiresAt, now)) {
    return {
      valid: false,
      reason: "api_key.expired",
    };
  }

  return {
    valid: true,
    reason: "api_key.valid",
  };
}

export function createServiceAccountAuthContext(
  input: CreateServiceAccountAuthContextInput,
): AuthContext {
  return createAuthContext({
    actorId: input.credential.serviceAccountId,
    actorType: "service_account",
    organizationId: input.credential.organizationId,
    permissions: filterPlatformPermissions(input.credential.scopes),
    traceContext: input.traceContext,
    serviceAccountId: input.credential.serviceAccountId,
    apiKeyId: input.credential.apiKeyId,
    ...(input.authenticatedAt === undefined ? {} : { authenticatedAt: input.authenticatedAt }),
    ...(input.credential.expiresAt === undefined || input.credential.expiresAt === null
      ? {}
      : { expiresAt: normalizeDate(input.credential.expiresAt) }),
  });
}

export function filterPlatformPermissions(scopes: readonly string[]): PlatformPermission[] {
  return scopes.filter((scope): scope is PlatformPermission =>
    platformPermissions.includes(scope as PlatformPermission),
  );
}

function isExpired(expiresAt: Date | string | null | undefined, now: Date): boolean {
  if (expiresAt === undefined || expiresAt === null) {
    return false;
  }

  return normalizeDate(expiresAt).getTime() <= now.getTime();
}

function normalizeDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
