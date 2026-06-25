import type { AuditJsonValue, PrismaTx } from "@saptm/database";

import type {
  TariffCargoRecord,
  TariffQuoteStatusGroup,
  TariffQuoteWithCargoRateCard,
  TariffRateCardRecord,
  TariffRateRuleRecord,
  TariffRateRuleWithRateCard,
} from "./tariff.dto.js";

export const TARIFF_REPOSITORY = Symbol("TariffRepository");

// Prisma input types

export type PrismaTariffRateCardCreateInput = {
  organizationId: string;
  rateCardCode: string;
  rateCardName: string;
  status: string;
  currencyCode: string;
  validFrom: Date;
  validUntil: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string;
};

export type PrismaTariffRateRuleCreateInput = {
  organizationId: string;
  rateCardId: string;
  ruleCode: string;
  chargeName: string;
  chargeType: string;
  calculationBasis: string;
  unitRate: unknown | null;
  flatAmount: unknown | null;
  percentageRate: unknown | null;
  minimumCharge: unknown | null;
  originName: string | null;
  destinationName: string | null;
  cargoType: string | null;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string;
};

export type PrismaTariffQuoteCreateInput = {
  organizationId: string;
  cargoId: string;
  rateCardId: string;
  quoteReference: string;
  status: string;
  currencyCode: string;
  quotedAmount: unknown;
  calculationPayload: unknown;
  calculatedByName: string;
  calculatedAt: Date;
  sourceSystem: string;
  calculateIdempotencyKey: string;
};

export type PrismaTariffQuoteUpdateInput = {
  status: string;
  approvedByName: string;
  approvalReference: string;
  approvalNotes: string;
  approvedAt: Date;
  sourceSystem: string;
  approveIdempotencyKey: string;
};

export type PrismaAuditRecordCreateInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  severity: string;
  before?: AuditJsonValue;
  after?: AuditJsonValue;
  reason: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type PrismaOutboxEventCreateInput = {
  organizationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: AuditJsonValue;
};

export type TariffQuoteCreateIncludeResult = TariffQuoteWithCargoRateCard;

export type TariffRateRuleCreateIncludeResult = TariffRateRuleWithRateCard;

export type TariffQuoteUpdateIncludeResult = TariffQuoteWithCargoRateCard;

export interface TariffRepository {
  // Overview (read-only, no tx)
  countRateCards(organizationId: string): Promise<number>;
  countActiveRateCards(organizationId: string): Promise<number>;
  countRateRules(organizationId: string): Promise<number>;
  groupQuoteStatuses(organizationId: string): Promise<TariffQuoteStatusGroup[]>;
  findActiveRateCards(organizationId: string, limit: number): Promise<TariffRateCardRecord[]>;
  findRecentQuotes(organizationId: string, limit: number): Promise<TariffQuoteWithCargoRateCard[]>;

  // Read methods (with tx)
  findRateCardByRecordIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffRateCardRecord | null>;
  findRateCardByCode(
    tx: PrismaTx,
    organizationId: string,
    rateCardCode: string,
  ): Promise<TariffRateCardRecord | null>;
  findRateCardById(
    tx: PrismaTx,
    organizationId: string,
    rateCardId: string,
  ): Promise<TariffRateCardRecord | null>;
  findRateRuleByRecordIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffRateRuleWithRateCard | null>;
  findRateRuleByCode(
    tx: PrismaTx,
    organizationId: string,
    rateCardId: string,
    ruleCode: string,
  ): Promise<TariffRateRuleWithRateCard | null>;
  findRateRulesByRateCard(
    tx: PrismaTx,
    organizationId: string,
    rateCardId: string,
  ): Promise<TariffRateRuleRecord[]>;
  findCargoById(
    tx: PrismaTx,
    organizationId: string,
    cargoId: string,
  ): Promise<TariffCargoRecord | null>;
  findQuoteByCalculateIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffQuoteWithCargoRateCard | null>;
  findQuoteByApproveIdempotencyKey(
    tx: PrismaTx,
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffQuoteWithCargoRateCard | null>;
  findQuoteByReference(
    tx: PrismaTx,
    organizationId: string,
    quoteReference: string,
  ): Promise<TariffQuoteWithCargoRateCard | null>;
  findQuoteById(
    tx: PrismaTx,
    organizationId: string,
    quoteId: string,
  ): Promise<TariffQuoteWithCargoRateCard | null>;

  // Write methods (with tx)
  createRateCard(
    tx: PrismaTx,
    input: PrismaTariffRateCardCreateInput,
  ): Promise<TariffRateCardRecord>;
  createRateRule(
    tx: PrismaTx,
    input: PrismaTariffRateRuleCreateInput,
  ): Promise<TariffRateRuleCreateIncludeResult>;
  createQuote(
    tx: PrismaTx,
    input: PrismaTariffQuoteCreateInput,
  ): Promise<TariffQuoteCreateIncludeResult>;
  updateQuote(
    tx: PrismaTx,
    quoteId: string,
    input: PrismaTariffQuoteUpdateInput,
  ): Promise<TariffQuoteUpdateIncludeResult>;

  // Audit + outbox writes
  createAuditRecord(tx: PrismaTx, input: PrismaAuditRecordCreateInput): Promise<void>;
  createOutboxEvent(tx: PrismaTx, input: PrismaOutboxEventCreateInput): Promise<void>;
}
