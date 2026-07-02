export const SSO_REPOSITORY = Symbol("SsoRepository");

export type SsoConfigRecord = {
  id: string;
  organizationId: string;
  domain: string | null;
  idpMetadataUrl: string | null;
  idpEntityId: string | null;
  idpSsoUrl: string | null;
  idpCertificate: string | null;
  jitProvisioning: boolean;
  jitDefaultRoleId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type UpdateSsoConfigData = {
  domain?: string | null;
  idpMetadataUrl?: string | null;
  idpEntityId?: string | null;
  idpSsoUrl?: string | null;
  idpCertificate?: string | null;
  jitProvisioning?: boolean;
  jitDefaultRoleId?: string | null;
  active?: boolean;
};

export interface SsoRepository {
  findByOrganizationId(organizationId: string): Promise<SsoConfigRecord | null>;
  upsert(organizationId: string, data: UpdateSsoConfigData): Promise<SsoConfigRecord>;
}
