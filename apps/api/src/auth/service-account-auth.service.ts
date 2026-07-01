import { Inject, Injectable } from "@nestjs/common";
import {
  createServiceAccountAuthContext,
  extractApiKeyFromHeaders,
  hashApiKey,
  validateApiKeyCredential,
} from "@saptm/auth";

import type { RequestWithAuthContext } from "./auth-context.js";
import { AUTH_REPOSITORY, type AuthRepository } from "./domain/auth.repository.js";

@Injectable()
export class ServiceAccountAuthService {
  constructor(@Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepository) {}

  async resolveContext(request: RequestWithAuthContext) {
    if (!request.traceContext) {
      return undefined;
    }

    const apiKey = extractApiKeyFromHeaders(createHeaders(request.headers));

    if (apiKey === undefined) {
      return undefined;
    }

    const keyHash = await hashApiKey(apiKey);
    const apiKeyRecord = await this.authRepo.findApiKeyWithServiceAccount(keyHash);

    if (apiKeyRecord === null) {
      throw new Error("api_key.not_found");
    }

    const decision = validateApiKeyCredential({
      active: apiKeyRecord.serviceAccount.active,
      expiresAt: apiKeyRecord.expiresAt,
      revokedAt: apiKeyRecord.revokedAt,
    });

    if (!decision.valid) {
      throw new Error(decision.reason);
    }

    return createServiceAccountAuthContext({
      credential: {
        serviceAccountId: apiKeyRecord.serviceAccount.id,
        apiKeyId: apiKeyRecord.id,
        organizationId: apiKeyRecord.serviceAccount.organizationId,
        scopes: apiKeyRecord.serviceAccount.scopes,
        active: apiKeyRecord.serviceAccount.active,
        expiresAt: apiKeyRecord.expiresAt,
        revokedAt: apiKeyRecord.revokedAt,
      },
      traceContext: request.traceContext,
      authenticatedAt: new Date(),
    });
  }
}

function createHeaders(headers: RequestWithAuthContext["headers"]): Headers {
  const result = new Headers();

  for (const [name, value] of Object.entries(headers ?? {})) {
    const headerValue = Array.isArray(value) ? value.at(0) : value;

    if (headerValue !== undefined) {
      result.set(name, headerValue);
    }
  }

  return result;
}
