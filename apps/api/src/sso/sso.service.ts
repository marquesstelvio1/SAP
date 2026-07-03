import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseActorType } from "@saptm/database";
import type {
  GetSsoConfigInput,
  GetSsoConfigOutput,
  TestSsoConfigInput,
  TestSsoConfigOutput,
  UpdateSsoConfigInput,
  UpdateSsoConfigOutput,
} from "@saptm/rpc";

import { SSO_REPOSITORY, type SsoRepository } from "./domain/sso.repository.js";

export type GetSsoConfigServiceInput = GetSsoConfigInput & {
  organizationId: string;
};

export type UpdateSsoConfigServiceInput = UpdateSsoConfigInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
};

export type TestSsoConfigServiceInput = TestSsoConfigInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
};

function toSsoConfigOutput(record: {
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
}) {
  return {
    id: record.id,
    organizationId: record.organizationId,
    domain: record.domain,
    idpMetadataUrl: record.idpMetadataUrl,
    idpEntityId: record.idpEntityId,
    idpSsoUrl: record.idpSsoUrl,
    idpCertificate: record.idpCertificate,
    jitProvisioning: record.jitProvisioning,
    jitDefaultRoleId: record.jitDefaultRoleId,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class SsoService {
  constructor(
    @Inject(SSO_REPOSITORY)
    private readonly ssoRepo: SsoRepository,
  ) {}

  async getSsoConfig(input: GetSsoConfigServiceInput): Promise<GetSsoConfigOutput> {
    const config = await this.ssoRepo.findByOrganizationId(input.organizationId);

    return {
      config: config !== null ? toSsoConfigOutput(config) : null,
    };
  }

  async updateSsoConfig(input: UpdateSsoConfigServiceInput): Promise<UpdateSsoConfigOutput> {
    const updateData: Record<string, unknown> = {};

    if (input.domain !== undefined) {
      updateData.domain = input.domain;
    }
    if (input.idpMetadataUrl !== undefined) {
      updateData.idpMetadataUrl = input.idpMetadataUrl;
    }
    if (input.idpEntityId !== undefined) {
      updateData.idpEntityId = input.idpEntityId;
    }
    if (input.idpSsoUrl !== undefined) {
      updateData.idpSsoUrl = input.idpSsoUrl;
    }
    if (input.idpCertificate !== undefined) {
      updateData.idpCertificate = input.idpCertificate;
    }
    if (input.jitProvisioning !== undefined) {
      updateData.jitProvisioning = input.jitProvisioning;
    }
    if (input.jitDefaultRoleId !== undefined) {
      updateData.jitDefaultRoleId = input.jitDefaultRoleId;
    }
    if (input.active !== undefined) {
      updateData.active = input.active;
    }

    const config = await this.ssoRepo.upsert(
      input.organizationId,
      updateData as Parameters<SsoRepository["upsert"]>[1],
    );

    return {
      config: toSsoConfigOutput(config),
      idempotency: { key: input.idempotencyKey, replayed: false },
      audit: {
        action: "sso.config.updated",
        subjectType: "sso_config",
        subjectId: config.id,
      },
      outbox: {
        eventType: "sso.config.updated",
        aggregateType: "sso_config",
        aggregateId: config.id,
      },
    };
  }

  async testSsoConfig(input: TestSsoConfigServiceInput): Promise<TestSsoConfigOutput> {
    const config = await this.ssoRepo.findByOrganizationId(input.organizationId);

    if (config === null) {
      throw new NotFoundException("sso.config_not_found");
    }

    if (!config.active) {
      return {
        success: false,
        message: "SSO configuracao esta desativada. Ative antes de testar.",
      };
    }

    if (input.idpSsoUrl !== config.idpSsoUrl || input.idpEntityId !== config.idpEntityId) {
      return {
        success: false,
        message: "As credenciais fornecidas nao correspondem a configuracao ativa.",
      };
    }

    return {
      success: true,
      message: "Teste de configuracao SSO bem-sucedido.",
      details: {
        domain: config.domain,
        idpEntityId: config.idpEntityId,
        jitProvisioning: config.jitProvisioning,
      },
    };
  }
}
