import { Injectable } from "@nestjs/common";
import { getPrismaClient } from "@saptm/database";

import type {
  OrganizationRecord,
  OrganizationsRepository,
  UpdateOrganizationStatusInput,
} from "../domain/organizations.repository.js";

@Injectable()
export class PrismaOrganizationsRepository implements OrganizationsRepository {
  private readonly database = getPrismaClient();

  async findById(organizationId: string): Promise<OrganizationRecord | null> {
    const org = await this.database.organization.findUnique({
      where: { id: organizationId },
    });

    if (org === null) return null;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status as OrganizationRecord["status"],
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async countMembers(organizationId: string): Promise<number> {
    return this.database.membership.count({
      where: { organizationId, status: "active" },
    });
  }

  async updateStatus(
    organizationId: string,
    input: UpdateOrganizationStatusInput,
  ): Promise<OrganizationRecord> {
    const org = await this.database.organization.update({
      where: { id: organizationId },
      data: { status: input.status },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status as OrganizationRecord["status"],
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}
