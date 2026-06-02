export {
  type ApiKeyMaterial,
  type ApiKeyValidationDecision,
  apiKeyHashAlgorithm,
  apiKeyPrefix,
  apiKeyStoragePrefixLength,
  type CreateServiceAccountAuthContextInput,
  createApiKeyMaterial,
  createApiKeyStoragePrefix,
  createServiceAccountAuthContext,
  extractApiKeyFromHeaders,
  filterPlatformPermissions,
  hashApiKey,
  type ServiceAccountCredential,
  validateApiKeyCredential,
} from "./api-key.js";
export {
  type AuthActorType,
  type AuthContext,
  authActorTypes,
  authActorTypeToTelemetryActorType,
  type CreateAuthContextInput,
  createAuthContext,
  enrichTraceContextWithAuth,
  hasPlatformPermission,
} from "./context.js";
export { type PlatformPermission, platformPermissions } from "./permissions.js";
export {
  type AuthorizationDecision,
  type AuthorizationMode,
  type AuthorizationRequirement,
  authorizationModes,
  evaluateAuthorization,
} from "./policy.js";
export {
  type BetterAuthSessionRecord,
  type BetterAuthSessionResult,
  type BetterAuthSessionUser,
  type GetBetterAuthSession,
  type GetBetterAuthSessionInput,
  type ResolveAuthContextFromSessionInput,
  resolveAuthContextFromBetterAuthSession,
} from "./session.js";
