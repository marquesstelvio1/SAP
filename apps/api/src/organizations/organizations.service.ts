import { Inject, Injectable, NotFoundException } from "@nestjs/common";
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
};

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepo: OrganizationsRepository,
  ) {}

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

    const updated = await this.organizationsRepo.updateStatus(input.organizationId, {
      status: input.status,
    });

    return {
      organizationId: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
