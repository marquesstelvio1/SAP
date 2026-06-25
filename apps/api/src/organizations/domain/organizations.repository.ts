export const ORGANIZATIONS_REPOSITORY = Symbol("OrganizationsRepository");

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateOrganizationStatusInput = {
  status: "active" | "suspended" | "archived";
};

export interface OrganizationsRepository {
  findById(organizationId: string): Promise<OrganizationRecord | null>;
  countMembers(organizationId: string): Promise<number>;
  updateStatus(
    organizationId: string,
    input: UpdateOrganizationStatusInput,
  ): Promise<OrganizationRecord>;
}
