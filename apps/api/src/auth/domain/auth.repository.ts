import type { PrismaTx } from "@saptm/database";

export const AUTH_REPOSITORY = Symbol("AuthRepository");

export type ApiKeyWithServiceAccount = {
  id: string;
  serviceAccountId: string;
  keyHash: string;
  prefix: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  serviceAccount: {
    id: string;
    organizationId: string;
    name: string;
    scopes: string[];
    active: boolean;
    createdByActorId: string | null;
    provisionIdempotencyKey: string | null;
    lastRotatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

export interface AuthRepository {
  findApiKeyWithServiceAccount(
    keyHash: string,
    tx?: PrismaTx,
  ): Promise<ApiKeyWithServiceAccount | null>;
}
