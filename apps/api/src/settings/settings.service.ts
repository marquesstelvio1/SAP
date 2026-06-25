import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";
import type {
  SettingsMutationOutput,
  SettingsOrganizationUpdateInput,
  SettingsOverviewOutput,
} from "@saptm/rpc";

export type GetSettingsInput = {
  organizationId: string;
};

export type UpdateSettingsInput = SettingsOrganizationUpdateInput & {
  organizationId: string;
};

@Injectable()
export class SettingsService {
  constructor(
    @Optional()
    private readonly database?: SaptmPrismaClient,
  ) {}

  private getDatabase(): SaptmPrismaClient {
    return this.database ?? getPrismaClient();
  }

  async getSettings(input: GetSettingsInput): Promise<SettingsOverviewOutput> {
    const organization = await this.getDatabase().organization.findUnique({
      where: { id: input.organizationId },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (organization === null) {
      throw new NotFoundException("settings.organization_not_found");
    }

    return {
      organizationId: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: organization.status as SettingsOverviewOutput["status"],
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
      memberCount: organization._count.memberships,
    };
  }

  async updateSettings(input: UpdateSettingsInput): Promise<SettingsMutationOutput> {
    const existing = await this.getDatabase().organization.findUnique({
      where: { id: input.organizationId },
      select: { id: true },
    });

    if (existing === null) {
      throw new NotFoundException("settings.organization_not_found");
    }

    const updated = await this.getDatabase().organization.update({
      where: { id: input.organizationId },
      data: {
        name: input.name,
        slug: input.slug,
      },
    });

    return {
      organizationId: updated.id,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
