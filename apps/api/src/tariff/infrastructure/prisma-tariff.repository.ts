import { Injectable } from "@nestjs/common";
import { getPrismaClient, type PrismaTx, type SaptmPrismaClient } from "@saptm/database";

import {
  type TariffCargoRecord,
  type TariffQuoteStatusGroup,
  type TariffQuoteWithCargoRateCard,
  type TariffRateCardRecord,
  type TariffRateRuleRecord,
  type TariffRateRuleWithRateCard,
  tariffCargoSelect,
} from "../domain/tariff.dto.js";
import type {
  PrismaAuditRecordCreateInput,
  PrismaOutboxEventCreateInput,
  PrismaTariffQuoteCreateInput,
  PrismaTariffQuoteUpdateInput,
  PrismaTariffRateCardCreateInput,
  PrismaTariffRateRuleCreateInput,
  TariffQuoteCreateIncludeResult,
  TariffQuoteUpdateIncludeResult,
  TariffRateRuleCreateIncludeResult,
  TariffRepository,
} from "../domain/tariff.repository.js";

@Injectable()
export class PrismaTariffRepository implements TariffRepository {
  private readonly database: SaptmPrismaClient = getPrismaClient();

  // Overview (read-only, no tx)

  async countRateCards(organizationId: string): Promise<number> {
    return this.database.tariffRateCard.count({
      where: { organizationId },
    });
  }

  async countActiveRateCards(organizationId: string): Promise<number> {
    return this.database.tariffRateCard.count({
      where: { organizationId, status: "active" },
    });
  }

  async countRateRules(organizationId: string): Promise<number> {
    return this.database.tariffRateRule.count({
      where: { organizationId },
    });
  }

  async groupQuoteStatuses(organizationId: string): Promise<TariffQuoteStatusGroup[]> {
    const groups = await this.database.tariffQuote.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    });

    return groups as unknown as TariffQuoteStatusGroup[];
  }

  async findActiveRateCards(
    organizationId: string,
    limit: number,
  ): Promise<TariffRateCardRecord[]> {
    const records = await this.database.tariffRateCard.findMany({
      where: { organizationId, status: "active" },
      orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return records as unknown as TariffRateCardRecord[];
  }

  async findRecentQuotes(
    organizationId: string,
    limit: number,
  ): Promise<TariffQuoteWithCargoRateCard[]> {
    const records = await this.database.tariffQuote.findMany({
      where: { organizationId },
      include: {
        cargo: { select: tariffCargoSelect },
        rateCard: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return records as unknown as TariffQuoteWithCargoRateCard[];
  }

  // Read methods (with tx)

  async findRateCardByRecordIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffRateCardRecord | null> {
    const record = await tx.tariffRateCard.findUnique({
      where: {
        organizationId_recordIdempotencyKey: {
          organizationId,
          recordIdempotencyKey: idempotencyKey,
        },
      },
    });

    return record as unknown as TariffRateCardRecord | null;
  }

  async findRateCardByCode(
    tx: PrismaTx,
    organizationId: string,
    rateCardCode: string,
  ): Promise<TariffRateCardRecord | null> {
    const record = await tx.tariffRateCard.findUnique({
      where: {
        organizationId_rateCardCode: {
          organizationId,
          rateCardCode,
        },
      },
    });

    return record as unknown as TariffRateCardRecord | null;
  }

  async findRateCardById(
    tx: PrismaTx,
    organizationId: string,
    rateCardId: string,
  ): Promise<TariffRateCardRecord | null> {
    const record = await tx.tariffRateCard.findFirst({
      where: { id: rateCardId, organizationId },
    });

    return record as unknown as TariffRateCardRecord | null;
  }

  async findRateRuleByRecordIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffRateRuleWithRateCard | null> {
    const record = await tx.tariffRateRule.findUnique({
      where: {
        organizationId_recordIdempotencyKey: {
          organizationId,
          recordIdempotencyKey: idempotencyKey,
        },
      },
      include: { rateCard: true },
    });

    return record as unknown as TariffRateRuleWithRateCard | null;
  }

  async findRateRuleByCode(
    tx: PrismaTx,
    organizationId: string,
    rateCardId: string,
    ruleCode: string,
  ): Promise<TariffRateRuleWithRateCard | null> {
    const record = await tx.tariffRateRule.findUnique({
      where: {
        organizationId_rateCardId_ruleCode: {
          organizationId,
          rateCardId,
          ruleCode,
        },
      },
      include: { rateCard: true },
    });

    return record as unknown as TariffRateRuleWithRateCard | null;
  }

  async findRateRulesByRateCard(
    tx: PrismaTx,
    organizationId: string,
    rateCardId: string,
  ): Promise<TariffRateRuleRecord[]> {
    const records = await tx.tariffRateRule.findMany({
      where: { organizationId, rateCardId },
      orderBy: [{ chargeType: "asc" }, { createdAt: "asc" }],
    });

    return records as unknown as TariffRateRuleRecord[];
  }

  async findCargoById(
    tx: PrismaTx,
    organizationId: string,
    cargoId: string,
  ): Promise<TariffCargoRecord | null> {
    const record = await tx.cargo.findFirst({
      where: { id: cargoId, organizationId },
      select: tariffCargoSelect,
    });

    return record as unknown as TariffCargoRecord | null;
  }

  async findQuoteByCalculateIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    const record = await tx.tariffQuote.findUnique({
      where: {
        organizationId_calculateIdempotencyKey: {
          organizationId,
          calculateIdempotencyKey: idempotencyKey,
        },
      },
      include: {
        cargo: { select: tariffCargoSelect },
        rateCard: true,
      },
    });

    return record as unknown as TariffQuoteWithCargoRateCard | null;
  }

  async findQuoteByApproveIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    const record = await tx.tariffQuote.findUnique({
      where: {
        organizationId_approveIdempotencyKey: {
          organizationId,
          approveIdempotencyKey: idempotencyKey,
        },
      },
      include: {
        cargo: { select: tariffCargoSelect },
        rateCard: true,
      },
    });

    return record as unknown as TariffQuoteWithCargoRateCard | null;
  }

  async findQuoteByReference(
    tx: PrismaTx,
    organizationId: string,
    quoteReference: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    const record = await tx.tariffQuote.findUnique({
      where: {
        organizationId_quoteReference: {
          organizationId,
          quoteReference,
        },
      },
      include: {
        cargo: { select: tariffCargoSelect },
        rateCard: true,
      },
    });

    return record as unknown as TariffQuoteWithCargoRateCard | null;
  }

  async findQuoteById(
    tx: PrismaTx,
    organizationId: string,
    quoteId: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    const record = await tx.tariffQuote.findFirst({
      where: { id: quoteId, organizationId },
      include: {
        cargo: { select: tariffCargoSelect },
        rateCard: true,
      },
    });

    return record as unknown as TariffQuoteWithCargoRateCard | null;
  }

  // Write methods (with tx)

  async createRateCard(
    tx: PrismaTx,
    input: PrismaTariffRateCardCreateInput,
  ): Promise<TariffRateCardRecord> {
    const record = await tx.tariffRateCard.create({ data: input as never });

    return record as unknown as TariffRateCardRecord;
  }

  async createRateRule(
    tx: PrismaTx,
    input: PrismaTariffRateRuleCreateInput,
  ): Promise<TariffRateRuleCreateIncludeResult> {
    const record = await tx.tariffRateRule.create({
      data: input as never,
      include: { rateCard: true },
    });

    return record as unknown as TariffRateRuleCreateIncludeResult;
  }

  async createQuote(
    tx: PrismaTx,
    input: PrismaTariffQuoteCreateInput,
  ): Promise<TariffQuoteCreateIncludeResult> {
    const record = await tx.tariffQuote.create({
      data: input as never,
      include: {
        cargo: { select: tariffCargoSelect },
        rateCard: true,
      },
    });

    return record as unknown as TariffQuoteCreateIncludeResult;
  }

  async updateQuote(
    tx: PrismaTx,
    quoteId: string,
    input: PrismaTariffQuoteUpdateInput,
  ): Promise<TariffQuoteUpdateIncludeResult> {
    const record = await tx.tariffQuote.update({
      where: { id: quoteId },
      data: input as never,
      include: {
        cargo: { select: tariffCargoSelect },
        rateCard: true,
      },
    });

    return record as unknown as TariffQuoteUpdateIncludeResult;
  }

  async createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void> {
    await tx.auditRecord.create({ data: input as never });
  }

  async createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void> {
    await tx.outboxEvent.create({ data: input as never });
  }
}
