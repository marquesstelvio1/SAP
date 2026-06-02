# Service Accounts And API Keys

## Purpose

Define machine-to-machine identity for integrations, automation, and operational systems.

Service accounts are separate from Better Auth browser sessions. API keys must never create or impersonate human sessions.

## Credential Model

| Field | Rule |
| --- | --- |
| `ServiceAccount.organizationId` | Required tenant scope |
| `ServiceAccount.scopes` | Server-defined permission scopes |
| `ServiceAccount.active` | Must be true |
| `ApiKey.keyHash` | SHA-256 hash of the full API key |
| `ApiKey.prefix` | Non-secret lookup/display prefix |
| `ApiKey.expiresAt` | Optional expiration boundary |
| `ApiKey.revokedAt` | Revoked credentials must fail closed |

## Runtime Flow

1. `AuthContextMiddleware` checks for an API key before browser session resolution.
2. `ServiceAccountAuthService` accepts `x-api-key` or `Authorization: Bearer`.
3. The raw key is hashed with `@saptm/auth.hashApiKey`.
4. Prisma finds the matching `ApiKey` and related `ServiceAccount`.
5. Inactive, expired, revoked, or unknown credentials fail closed.
6. Valid credentials become `AuthContext` with `actorType: "service_account"`.
7. Service account scopes are filtered into platform permissions.

## Security Rules

- API keys are generated once and only the hash is stored.
- API keys must be rotated, revocable, and optionally expirable.
- API keys must not be logged, traced, audited as raw values, or returned after creation.
- API key prefix is safe for display and lookup, but not for authentication.
- Machine identity must use `serviceAccountId` and `apiKeyId` in `AuthContext`.
- Service scopes must still pass `AuthorizationGuard` metadata.
- Service accounts must not use Better Auth cookies.

## Audit Requirements

Audit these events:

- API key created.
- API key rotated.
- API key revoked.
- API key authentication failed.
- Service account activated or deactivated.
- Service account scope changed.

Runtime authorization denial is already recorded by the authorization observability contract.
