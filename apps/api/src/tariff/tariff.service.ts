import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuditJsonValue } from "@saptm/database";
import type {
  TariffOverviewOutput,
  TariffQuoteApproveOutput,
  TariffQuoteCalculateOutput,
  TariffRateCardRegisterOutput,
  TariffRateRuleAddOutput,
} from "@saptm/rpc";
import type { OutboxEventBusAdapter } from "../event-bus/outbox-event-bus.adapter.js";
import {
  createTariffQuoteApproveAuditAfter,
  createTariffQuoteApproveAuditBefore,
  createTariffQuoteCalculateAuditAfter,
  createTariffQuoteCalculateAuditBefore,
  createTariffRateCardRegisterAuditAfter,
  createTariffRateRuleAddAuditAfter,
  createTariffRateRuleAddAuditBefore,
} from "./domain/tariff.audit-trail.js";
import {
  calculateTariffQuoteAmount,
  isTariffRateRuleApplicable,
  resolveTariffQuoteApproveBusinessRules,
  resolveTariffQuoteCalculateBusinessRules,
  resolveTariffRateCardRegisterBusinessRules,
  resolveTariffRateRuleAddBusinessRules,
} from "./domain/tariff.business-rules.js";
import type {
  AddTariffRateRuleInput,
  ApproveTariffQuoteInput,
  CalculateTariffQuoteInput,
  GetTariffOverviewInput,
  RegisterTariffRateCardInput,
} from "./domain/tariff.dto.js";
import {
  createRequestMetadata,
  createTariffQuoteApproveOutput,
  createTariffQuoteCalculateOutput,
  createTariffQuoteStatusCounts,
  createTariffQuoteSummary,
  createTariffRateCardRegisterOutput,
  createTariffRateCardSummary,
  createTariffRateRuleAddOutput,
  normalizeCurrencyCode,
  normalizeLimit,
  normalizeTariffCode,
  readLineItemsFromPayload,
} from "./domain/tariff.dto.js";
import { TARIFF_REPOSITORY, type TariffRepository } from "./domain/tariff.repository.js";

@Injectable()
export class TariffService {
  constructor(
    @Inject(TARIFF_REPOSITORY)
    private readonly tariffRepo: TariffRepository,
    private readonly eventBus: OutboxEventBusAdapter,
  ) {}

  async getOverview(input: GetTariffOverviewInput): Promise<TariffOverviewOutput> {
    const limit = normalizeLimit(input.limit);
    const [
      rateCards,
      activeRateCardsCount,
      rules,
      quoteStatusGroups,
      activeRateCards,
      recentQuotes,
    ] = await Promise.all([
      this.tariffRepo.countRateCards(input.organizationId),
      this.tariffRepo.countActiveRateCards(input.organizationId),
      this.tariffRepo.countRateRules(input.organizationId),
      this.tariffRepo.groupQuoteStatuses(input.organizationId),
      this.tariffRepo.findActiveRateCards(input.organizationId, limit),
      this.tariffRepo.findRecentQuotes(input.organizationId, limit),
    ]);
    const quoteStatusCounts = createTariffQuoteStatusCounts(quoteStatusGroups);

    return {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      organizationId: input.organizationId,
      totals: {
        rateCards,
        activeRateCards: activeRateCardsCount,
        rules,
        calculatedQuotes: quoteStatusCounts.calculated,
        approvedQuotes: quoteStatusCounts.approved,
      },
      activeRateCards: activeRateCards.map(createTariffRateCardSummary),
      recentQuotes: recentQuotes.map(createTariffQuoteSummary),
    };
  }

  async registerRateCard(
    input: RegisterTariffRateCardInput,
  ): Promise<TariffRateCardRegisterOutput> {
    const rateCardCode = normalizeTariffCode(input.rateCardCode);
    const currencyCode = normalizeCurrencyCode(input.currencyCode);

    return this.databaseTransaction(async (transaction) => {
      const replayedRateCard = await this.tariffRepo.findRateCardByRecordIdempotencyKey(
        transaction,
        input.organizationId,
        input.idempotencyKey,
      );

      if (replayedRateCard !== null) {
        if (replayedRateCard.rateCardCode !== rateCardCode) {
          throw new BadRequestException("tariff.rate_card_register_idempotency_conflict");
        }

        return createTariffRateCardRegisterOutput({
          organizationId: input.organizationId,
          rateCard: replayedRateCard,
          replayed: true,
        });
      }

      const duplicateRateCard = await this.tariffRepo.findRateCardByCode(
        transaction,
        input.organizationId,
        rateCardCode,
      );
      const businessRules = resolveTariffRateCardRegisterBusinessRules({
        input,
        duplicateRateCard,
        currencyCode,
      });

      if (!businessRules.rateCardAccepted) {
        throw new BadRequestException("tariff.rate_card_register_blocked");
      }

      const rateCard = await this.tariffRepo.createRateCard(transaction, {
        organizationId: input.organizationId,
        rateCardCode,
        rateCardName: input.rateCardName.trim(),
        status: input.status,
        currencyCode,
        validFrom: new Date(input.validFrom),
        validUntil: input.validUntil === undefined ? null : new Date(input.validUntil),
        sourceSystem: input.sourceSystem,
        recordIdempotencyKey: input.idempotencyKey,
      });

      await this.tariffRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "tariff.rate_card.registered",
        subjectType: "tariff_rate_card",
        subjectId: rateCard.id,
        severity: "high",
        after: createTariffRateCardRegisterAuditAfter({
          rateCard,
          businessRules,
        }) as AuditJsonValue,
        reason: "Governed tariff rate card registration.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "tariff.rate_card.registered",
        aggregateType: "tariff",
        aggregateId: rateCard.id,
        payload: createTariffRateCardRegisterAuditAfter({
          rateCard,
          businessRules,
        }) as AuditJsonValue,
      });

      return createTariffRateCardRegisterOutput({
        organizationId: input.organizationId,
        rateCard,
        replayed: false,
        businessRules,
      });
    });
  }

  async addRateRule(input: AddTariffRateRuleInput): Promise<TariffRateRuleAddOutput> {
    const ruleCode = normalizeTariffCode(input.ruleCode);

    return this.databaseTransaction(async (transaction) => {
      const replayedRule = await this.tariffRepo.findRateRuleByRecordIdempotencyKey(
        transaction,
        input.organizationId,
        input.idempotencyKey,
      );

      if (replayedRule !== null) {
        if (replayedRule.ruleCode !== ruleCode || replayedRule.rateCardId !== input.rateCardId) {
          throw new BadRequestException("tariff.rate_rule_add_idempotency_conflict");
        }

        return createTariffRateRuleAddOutput({
          organizationId: input.organizationId,
          rule: replayedRule,
          replayed: true,
        });
      }

      const rateCard = await this.tariffRepo.findRateCardById(
        transaction,
        input.organizationId,
        input.rateCardId,
      );

      if (rateCard === null) {
        throw new NotFoundException("tariff.rate_card_not_found");
      }

      const duplicateRule = await this.tariffRepo.findRateRuleByCode(
        transaction,
        input.organizationId,
        input.rateCardId,
        ruleCode,
      );
      const businessRules = resolveTariffRateRuleAddBusinessRules({
        input,
        rateCard,
        duplicateRule,
      });

      if (!businessRules.ruleAccepted) {
        throw new BadRequestException("tariff.rate_rule_add_blocked");
      }

      const auditBefore = createTariffRateRuleAddAuditBefore({
        rateCard,
        duplicateRule,
        businessRules,
      });
      const rule = await this.tariffRepo.createRateRule(transaction, {
        organizationId: input.organizationId,
        rateCardId: input.rateCardId,
        ruleCode,
        chargeName: input.chargeName.trim(),
        chargeType: input.chargeType,
        calculationBasis: input.calculationBasis,
        unitRate: input.unitRate ?? null,
        flatAmount: input.flatAmount ?? null,
        percentageRate: input.percentageRate ?? null,
        minimumCharge: input.minimumCharge ?? null,
        originName: input.originName?.trim() ?? null,
        destinationName: input.destinationName?.trim() ?? null,
        cargoType: input.cargoType ?? null,
        effectiveFrom: new Date(input.effectiveFrom),
        effectiveUntil: input.effectiveUntil === undefined ? null : new Date(input.effectiveUntil),
        sourceSystem: input.sourceSystem,
        recordIdempotencyKey: input.idempotencyKey,
      });

      await this.tariffRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "tariff.rate_rule.added",
        subjectType: "tariff_rate_rule",
        subjectId: rule.id,
        severity: "high",
        before: auditBefore as AuditJsonValue,
        after: createTariffRateRuleAddAuditAfter({
          rule,
          businessRules,
        }) as AuditJsonValue,
        reason: "Governed tariff rate rule addition.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "tariff.rate_rule.added",
        aggregateType: "tariff",
        aggregateId: rule.id,
        payload: createTariffRateRuleAddAuditAfter({
          rule,
          businessRules,
        }) as AuditJsonValue,
      });

      return createTariffRateRuleAddOutput({
        organizationId: input.organizationId,
        rule,
        replayed: false,
        businessRules,
      });
    });
  }

  async calculateQuote(input: CalculateTariffQuoteInput): Promise<TariffQuoteCalculateOutput> {
    const quoteReference = normalizeTariffCode(input.quoteReference);
    const calculatedAt = new Date(input.calculatedAt);

    return this.databaseTransaction(async (transaction) => {
      const replayedQuote = await this.tariffRepo.findQuoteByCalculateIdempotencyKey(
        transaction,
        input.organizationId,
        input.idempotencyKey,
      );

      if (replayedQuote !== null) {
        if (replayedQuote.quoteReference !== quoteReference) {
          throw new BadRequestException("tariff.quote_calculate_idempotency_conflict");
        }

        return createTariffQuoteCalculateOutput({
          organizationId: input.organizationId,
          quote: replayedQuote,
          lineItems: readLineItemsFromPayload(replayedQuote.calculationPayload),
          replayed: true,
        });
      }

      const cargo = await this.tariffRepo.findCargoById(
        transaction,
        input.organizationId,
        input.cargoId,
      );

      if (cargo === null) {
        throw new NotFoundException("tariff.cargo_not_found");
      }

      const rateCard = await this.tariffRepo.findRateCardById(
        transaction,
        input.organizationId,
        input.rateCardId,
      );

      if (rateCard === null) {
        throw new NotFoundException("tariff.rate_card_not_found");
      }

      const [duplicateQuote, rateRules] = await Promise.all([
        this.tariffRepo.findQuoteByReference(transaction, input.organizationId, quoteReference),
        this.tariffRepo.findRateRulesByRateCard(
          transaction,
          input.organizationId,
          input.rateCardId,
        ),
      ]);

      const applicableRules = rateRules.filter((rule) =>
        isTariffRateRuleApplicable({
          rule,
          cargo,
          calculatedAt,
        }),
      );
      const calculation = calculateTariffQuoteAmount({
        cargo,
        rules: applicableRules,
        taxRatePercentage: input.taxRatePercentage,
        ...(input.distanceKm === undefined ? {} : { distanceKm: input.distanceKm }),
      });
      const businessRules = resolveTariffQuoteCalculateBusinessRules({
        cargo,
        rateCard,
        calculatedAt,
        applicableRules,
        calculation,
        duplicateQuote,
      });

      if (!businessRules.quoteCalculated) {
        throw new BadRequestException("tariff.quote_calculate_blocked");
      }

      const auditBefore = createTariffQuoteCalculateAuditBefore({
        cargo,
        rateCard,
        duplicateQuote,
        applicableRules,
        businessRules,
      });
      const quote = await this.tariffRepo.createQuote(transaction, {
        organizationId: input.organizationId,
        cargoId: input.cargoId,
        rateCardId: input.rateCardId,
        quoteReference,
        status: "calculated",
        currencyCode: rateCard.currencyCode,
        quotedAmount: calculation.quotedAmount,
        calculationPayload: {
          distanceKm: input.distanceKm ?? null,
          lineItems: calculation.lineItems,
          taxableAmount: calculation.tax.taxableAmount,
          taxRatePercentage: calculation.tax.taxRatePercentage,
          taxAmount: calculation.tax.taxAmount,
          quotedAmount: calculation.quotedAmount,
          appliedRules: businessRules.appliedRules,
        },
        calculatedByName: input.calculatedByName.trim(),
        calculatedAt,
        sourceSystem: input.sourceSystem,
        calculateIdempotencyKey: input.idempotencyKey,
      });

      await this.tariffRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "tariff.quote.calculated",
        subjectType: "tariff_quote",
        subjectId: quote.id,
        severity: "high",
        before: auditBefore as AuditJsonValue,
        after: createTariffQuoteCalculateAuditAfter({
          quote,
          lineItems: calculation.lineItems,
          businessRules,
        }) as AuditJsonValue,
        reason: "Governed tariff quote calculation.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "tariff.quote.calculated",
        aggregateType: "tariff",
        aggregateId: quote.id,
        payload: createTariffQuoteCalculateAuditAfter({
          quote,
          lineItems: calculation.lineItems,
          businessRules,
        }) as AuditJsonValue,
      });

      return createTariffQuoteCalculateOutput({
        organizationId: input.organizationId,
        quote,
        lineItems: calculation.lineItems,
        replayed: false,
        businessRules,
      });
    });
  }

  async approveQuote(input: ApproveTariffQuoteInput): Promise<TariffQuoteApproveOutput> {
    const approvedAt = new Date(input.approvedAt);

    return this.databaseTransaction(async (transaction) => {
      const replayedQuote = await this.tariffRepo.findQuoteByApproveIdempotencyKey(
        transaction,
        input.organizationId,
        input.idempotencyKey,
      );

      if (replayedQuote !== null) {
        if (replayedQuote.id !== input.quoteId) {
          throw new BadRequestException("tariff.quote_approve_idempotency_conflict");
        }

        return createTariffQuoteApproveOutput({
          organizationId: input.organizationId,
          quote: replayedQuote,
          replayed: true,
        });
      }

      const quote = await this.tariffRepo.findQuoteById(
        transaction,
        input.organizationId,
        input.quoteId,
      );

      if (quote === null) {
        throw new NotFoundException("tariff.quote_not_found");
      }

      const businessRules = resolveTariffQuoteApproveBusinessRules({
        quote,
        input,
        approvedAt,
      });

      if (!businessRules.approvalAllowed) {
        throw new BadRequestException("tariff.quote_approve_blocked");
      }

      const auditBefore = createTariffQuoteApproveAuditBefore({
        quote,
        businessRules,
      });
      const approvedQuote = await this.tariffRepo.updateQuote(transaction, quote.id, {
        status: "approved",
        approvedByName: input.approvedByName.trim(),
        approvalReference: normalizeTariffCode(input.approvalReference),
        approvalNotes: input.approvalNotes.trim(),
        approvedAt,
        sourceSystem: input.sourceSystem,
        approveIdempotencyKey: input.idempotencyKey,
      });

      await this.tariffRepo.createAuditRecord(transaction, {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: "tariff.quote.approved",
        subjectType: "tariff_quote",
        subjectId: approvedQuote.id,
        severity: "critical",
        before: auditBefore as AuditJsonValue,
        after: createTariffQuoteApproveAuditAfter({
          quote: approvedQuote,
          businessRules,
        }) as AuditJsonValue,
        reason: "Governed tariff quote approval.",
        correlationId: input.correlationId,
        ...createRequestMetadata(input),
      });

      await this.eventBus.publish(transaction, {
        organizationId: input.organizationId,
        eventType: "tariff.quote.approved",
        aggregateType: "tariff",
        aggregateId: approvedQuote.id,
        payload: createTariffQuoteApproveAuditAfter({
          quote: approvedQuote,
          businessRules,
        }) as AuditJsonValue,
      });

      return createTariffQuoteApproveOutput({
        organizationId: input.organizationId,
        quote: approvedQuote,
        replayed: false,
        businessRules,
      });
    });
  }

  private async databaseTransaction<T>(fn: (tx: never) => Promise<T>): Promise<T> {
    const { getPrismaClient } = await import("@saptm/database");
    const database = getPrismaClient();

    return database.$transaction(fn);
  }
}
