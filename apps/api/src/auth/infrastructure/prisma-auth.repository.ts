import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import type { ApiKeyWithServiceAccount, AuthRepository } from "../domain/auth.repository.js";

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async findApiKeyWithServiceAccount(
    keyHash: string,
    tx?: PrismaTx,
  ): Promise<ApiKeyWithServiceAccount | null> {
    const client = tx ?? this.database;

    const record = await client.apiKey.findUnique({
      where: { keyHash },
      include: {
        serviceAccount: true,
      },
    });

    return record as unknown as ApiKeyWithServiceAccount | null;
  }
}
