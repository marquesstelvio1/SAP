import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
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
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
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
      select: { id: true, name: true, slug: true },
    });

    if (existing === null) {
      throw new NotFoundException("settings.organization_not_found");
    }

    const updated = await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      const result = await tx.organization.update({
        where: { id: input.organizationId },
        data: {
          name: input.name,
          slug: input.slug,
        },
      });

      await tx.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "settings.organization_updated",
          subjectType: "organization",
          subjectId: result.id,
          severity: "medium",
          before: { name: existing.name, slug: existing.slug },
          after: { name: result.name, slug: result.slug },
          reason: "Organization settings updated.",
          correlationId: input.correlationId,
        } as never,
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "settings.organization_updated",
          aggregateType: "organization",
          aggregateId: result.id,
          payload: { organizationId: input.organizationId },
        } as never,
      });

      return result;
    });

    return {
      organizationId: updated.id,
      updatedAt: updated.updatedAt.toISOString(),
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "settings.organization_updated",
        subjectType: "organization",
        subjectId: updated.id,
      },
      outbox: {
        eventType: "settings.organization_updated",
        aggregateType: "organization",
        aggregateId: updated.id,
      },
    };
  }
}
