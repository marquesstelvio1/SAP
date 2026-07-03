import { Injectable } from "@nestjs/common";
import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";

import type {
  SsoConfigRecord,
  SsoRepository,
  UpdateSsoConfigData,
} from "../domain/sso.repository.js";

@Injectable()
export class PrismaSsoRepository implements SsoRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async findByOrganizationId(organizationId: string): Promise<SsoConfigRecord | null> {
    const record = await this.database.ssoConfig.findUnique({
      where: { organizationId },
    });

    return record as unknown as SsoConfigRecord | null;
  }

  async upsert(organizationId: string, data: UpdateSsoConfigData): Promise<SsoConfigRecord> {
    const record = await this.database.ssoConfig.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });

    return record as unknown as SsoConfigRecord;
  }
}
