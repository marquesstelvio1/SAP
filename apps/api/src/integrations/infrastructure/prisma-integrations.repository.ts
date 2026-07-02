import { Injectable, NotFoundException } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";
import type { IntegrationEventRecord, ServiceAccountRecord } from "../domain/integrations.dto.js";
import type {
  IntegrationsRepository,
  PrismaApiKeyCreateInput,
  PrismaAuditRecordCreateInput,
  PrismaIntegrationEventCreateInput,
  PrismaOutboxEventCreateInput,
  PrismaServiceAccountCreateInput,
  PrismaTrackingEventCreateInput,
  PrismaTrackingShipmentUpdateInput,
  TrackingEventWithShipment,
  TrackingShipmentLookup,
} from "../domain/integrations.repository.js";

const serviceAccountInclude = {
  apiKeys: {
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 5,
  },
} as const;

const trackingEventInclude = {
  shipment: {
    select: {
      id: true,
      referenceCode: true,
      status: true,
    },
  },
} as const;

@Injectable()
export class PrismaIntegrationsRepository implements IntegrationsRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  async assertOrganizationExists(tx: PrismaTx, organizationId: string): Promise<void> {
    const organization = await tx.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (organization === null) {
      throw new NotFoundException("integration.organization_not_found");
    }
  }

  async countServiceAccounts(organizationId: string): Promise<number> {
    return this.database.serviceAccount.count({
      where: { organizationId },
    });
  }

  async countActiveServiceAccounts(organizationId: string): Promise<number> {
    return this.database.serviceAccount.count({
      where: { organizationId, active: true },
    });
  }

  async countActiveApiKeys(organizationId: string): Promise<number> {
    return this.database.apiKey.count({
      where: {
        revokedAt: null,
        serviceAccount: {
          organizationId,
          active: true,
        },
      },
    });
  }

  async countIntegrationEvents(organizationId: string): Promise<number> {
    return this.database.integrationEvent.count({
      where: { organizationId },
    });
  }

  async countProcessedIntegrationEvents(organizationId: string): Promise<number> {
    return this.database.integrationEvent.count({
      where: {
        organizationId,
        processedAt: { not: null },
      },
    });
  }

  async findRecentServiceAccounts(
    organizationId: string,
    limit: number,
  ): Promise<ServiceAccountRecord[]> {
    const records = await this.database.serviceAccount.findMany({
      where: { organizationId },
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      take: limit,
      include: serviceAccountInclude,
    });

    return records as unknown as ServiceAccountRecord[];
  }

  async findRecentIntegrationEvents(
    organizationId: string,
    limit: number,
  ): Promise<IntegrationEventRecord[]> {
    const records = await this.database.integrationEvent.findMany({
      where: { organizationId },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });

    return records as unknown as IntegrationEventRecord[];
  }

  async findServiceAccountByIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<ServiceAccountRecord | null> {
    const record = await tx.serviceAccount.findUnique({
      where: {
        organizationId_provisionIdempotencyKey: {
          organizationId,
          provisionIdempotencyKey: idempotencyKey,
        },
      },
      include: serviceAccountInclude,
    });

    return record as unknown as ServiceAccountRecord | null;
  }

  async findServiceAccountByName(
    tx: PrismaTx,
    organizationId: string,
    name: string,
  ): Promise<{ id: string } | null> {
    return tx.serviceAccount.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name,
        },
      },
      select: {
        id: true,
      },
    });
  }

  async findServiceAccountById(
    tx: PrismaTx,
    serviceAccountId: string,
  ): Promise<ServiceAccountRecord | null> {
    const record = await tx.serviceAccount.findUnique({
      where: { id: serviceAccountId },
      include: serviceAccountInclude,
    });

    return record as unknown as ServiceAccountRecord | null;
  }

  async findActiveServiceAccountWithScopes(
    tx: PrismaTx,
    serviceAccountId: string,
    organizationId: string,
  ): Promise<{ id: string; scopes: string[] } | null> {
    return tx.serviceAccount.findFirst({
      where: {
        id: serviceAccountId,
        organizationId,
        active: true,
      },
      select: {
        id: true,
        scopes: true,
      },
    });
  }

  async findIntegrationEventByIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    sourceSystem: string,
    externalId: string,
  ): Promise<IntegrationEventRecord | null> {
    const record = await tx.integrationEvent.findUnique({
      where: {
        organizationId_sourceSystem_externalId: {
          organizationId,
          sourceSystem,
          externalId,
        },
      },
    });

    return record as unknown as IntegrationEventRecord | null;
  }

  async findTrackingShipmentByReference(
    tx: PrismaTx,
    organizationId: string,
    shipmentReference: string,
  ): Promise<TrackingShipmentLookup | null> {
    return tx.trackingShipment.findFirst({
      where: {
        organizationId,
        OR: [{ referenceCode: shipmentReference }, { externalReference: shipmentReference }],
      },
      select: {
        id: true,
        referenceCode: true,
        status: true,
      },
    });
  }

  async findTrackingEventByIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TrackingEventWithShipment | null> {
    const record = await tx.trackingEvent.findFirst({
      where: {
        organizationId,
        idempotencyKey,
      },
      include: trackingEventInclude,
    });

    return record as unknown as TrackingEventWithShipment | null;
  }

  async createServiceAccount(
    tx: PrismaTx,
    input: PrismaServiceAccountCreateInput,
  ): Promise<{ id: string }> {
    return tx.serviceAccount.create({
      data: input,
      select: { id: true },
    });
  }

  async createApiKey(tx: PrismaTx, input: PrismaApiKeyCreateInput): Promise<void> {
    await tx.apiKey.create({ data: input });
  }

  async createIntegrationEvent(
    tx: PrismaTx,
    input: PrismaIntegrationEventCreateInput,
  ): Promise<{ id: string }> {
    return tx.integrationEvent.create({
      data: input,
      select: { id: true },
    });
  }

  async updateIntegrationEventProcessedAt(
    tx: PrismaTx,
    id: string,
    processedAt: Date,
  ): Promise<void> {
    await tx.integrationEvent.update({
      where: { id },
      data: { processedAt },
    });
  }

  async createTrackingEvent(
    tx: PrismaTx,
    input: PrismaTrackingEventCreateInput,
  ): Promise<TrackingEventWithShipment> {
    const record = await tx.trackingEvent.create({
      data: input as never,
      include: trackingEventInclude,
    });

    return record as unknown as TrackingEventWithShipment;
  }

  async updateTrackingShipment(
    tx: PrismaTx,
    shipmentId: string,
    input: PrismaTrackingShipmentUpdateInput,
  ): Promise<TrackingShipmentLookup> {
    return tx.trackingShipment.update({
      where: { id: shipmentId },
      data: input as never,
      select: {
        id: true,
        referenceCode: true,
        status: true,
      },
    });
  }

  async createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void> {
    await tx.auditRecord.create({ data: input as never });
  }

  async createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void> {
    await tx.outboxEvent.create({ data: input as never });
  }

  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.database.$transaction(fn) as Promise<T>;
  }
}
