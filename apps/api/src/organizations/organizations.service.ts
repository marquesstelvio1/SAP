import { Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import {
  type DatabaseActorType,
  getPrismaClient,
  type PrismaTx,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  OrganizationProfileOutput,
  OrganizationStatusUpdateInput,
  OrganizationStatusUpdateOutput,
} from "@saptm/rpc";

import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepository,
} from "./domain/organizations.repository.js";

export type GetOrganizationProfileInput = {
  organizationId: string;
};

export type UpdateOrganizationStatusServiceInput = OrganizationStatusUpdateInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepo: OrganizationsRepository,
    @Optional()
    private readonly database?: SaptmPrismaClient,
  ) {}

  private getDatabase(): SaptmPrismaClient {
    return this.database ?? getPrismaClient();
  }

  async getProfile(input: GetOrganizationProfileInput): Promise<OrganizationProfileOutput> {
    const org = await this.organizationsRepo.findById(input.organizationId);

    if (org === null) {
      throw new NotFoundException("organizations.not_found");
    }

    const memberCount = await this.organizationsRepo.countMembers(input.organizationId);

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      memberCount,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async updateStatus(
    input: UpdateOrganizationStatusServiceInput,
  ): Promise<OrganizationStatusUpdateOutput> {
    const org = await this.organizationsRepo.findById(input.organizationId);

    if (org === null) {
      throw new NotFoundException("organizations.not_found");
    }

    const before = { status: org.status };

    const updated = await this.getDatabase().$transaction(async (tx: PrismaTx) => {
      const result = await this.organizationsRepo.updateStatus(input.organizationId, {
        status: input.status,
      });

      const after = { status: result.status };

      await this.organizationsRepo.createAuditRecord(tx, {
        organizationId: result.id,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "organization.status_updated",
        subjectType: "organization",
        subjectId: result.id,
        severity: "medium",
        before,
        after,
        reason: `Organization status changed from ${org.status} to ${result.status}.`,
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      await this.organizationsRepo.createOutboxEvent(tx, {
        organizationId: result.id,
        eventType: "organization.status_updated",
        aggregateType: "organization",
        aggregateId: result.id,
        payload: {
          organizationId: result.id,
          previousStatus: org.status,
          newStatus: result.status,
          correlationId: input.correlationId,
        },
      });

      return result;
    });

    return {
      organizationId: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "organization.status_updated",
        subjectType: "organization",
        subjectId: updated.id,
      },
      outbox: {
        eventType: "organization.status_updated",
        aggregateType: "organization",
        aggregateId: updated.id,
      },
    };
  }
}
