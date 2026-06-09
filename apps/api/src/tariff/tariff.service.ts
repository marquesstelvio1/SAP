import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type AuditJsonValue,
  type DatabaseActorType,
  getPrismaClient,
  type SaptmPrismaClient,
} from "@saptm/database";
import type {
  cargoStatuses,
  cargoTypes,
  TariffOverviewOutput,
  TariffQuoteApproveInput,
  TariffQuoteApproveOutput,
  TariffQuoteCalculateInput,
  TariffQuoteCalculateOutput,
  TariffRateCardRegisterInput,
  TariffRateCardRegisterOutput,
  TariffRateRuleAddInput,
  TariffRateRuleAddOutput,
  tariffCalculationBases,
  tariffChargeTypes,
  tariffQuoteStatuses,
  tariffRateCardStatuses,
} from "@saptm/rpc";

export type GetTariffOverviewInput = {
  organizationId: string;
  limit?: number;
  generatedAt?: Date;
};

export type RegisterTariffRateCardInput = TariffRateCardRegisterInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AddTariffRateRuleInput = TariffRateRuleAddInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CalculateTariffQuoteInput = TariffQuoteCalculateInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ApproveTariffQuoteInput = TariffQuoteApproveInput & {
  organizationId: string;
  actorType: DatabaseActorType;
  actorId: string;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
};

type CargoStatus = (typeof cargoStatuses)[number];
type CargoType = (typeof cargoTypes)[number];
type TariffRateCardStatus = (typeof tariffRateCardStatuses)[number];
type TariffChargeType = (typeof tariffChargeTypes)[number];
type TariffCalculationBasis = (typeof tariffCalculationBases)[number];
type TariffQuoteStatus = (typeof tariffQuoteStatuses)[number];

type TariffRateCardRecord = {
  id: string;
  organizationId: string;
  rateCardCode: string;
  rateCardName: string;
  status: TariffRateCardStatus;
  currencyCode: string;
  validFrom: Date;
  validUntil: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TariffRateRuleRecord = {
  id: string;
  organizationId: string;
  rateCardId: string;
  ruleCode: string;
  chargeName: string;
  chargeType: TariffChargeType;
  calculationBasis: TariffCalculationBasis;
  unitRate: unknown | null;
  flatAmount: unknown | null;
  percentageRate: unknown | null;
  minimumCharge: unknown | null;
  originName: string | null;
  destinationName: string | null;
  cargoType: CargoType | null;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  sourceSystem: string;
  recordIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TariffRateRuleWithRateCard = TariffRateRuleRecord & {
  rateCard: TariffRateCardRecord;
};

type TariffCargoRecord = {
  id: string;
  organizationId: string;
  cargoReference: string;
  cargoDescription: string;
  cargoType: CargoType;
  status: CargoStatus;
  grossWeightKg: unknown;
  packageCount: number;
  volumeM3: unknown | null;
  originName: string;
  destinationName: string;
};

type TariffQuoteRecord = {
  id: string;
  organizationId: string;
  cargoId: string;
  rateCardId: string;
  quoteReference: string;
  status: TariffQuoteStatus;
  currencyCode: string;
  quotedAmount: unknown;
  calculationPayload: unknown;
  calculatedByName: string;
  calculatedAt: Date;
  approvedByName: string | null;
  approvalReference: string | null;
  approvalNotes: string | null;
  approvedAt: Date | null;
  sourceSystem: string;
  calculateIdempotencyKey: string | null;
  approveIdempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TariffQuoteWithCargoRateCard = TariffQuoteRecord & {
  cargo: TariffCargoRecord;
  rateCard: TariffRateCardRecord;
};

type TariffQuoteStatusGroup = {
  status: TariffQuoteStatus;
  _count: {
    _all: number;
  };
};

type TariffQuoteLineItem = TariffQuoteCalculateOutput["lineItems"][number];

type TariffCalculationTax = {
  taxableAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
};

type TariffCalculationResult = {
  lineItems: TariffQuoteLineItem[];
  tax: TariffCalculationTax;
  quotedAmount: number;
  requiredMetricsAvailable: boolean;
};

@Injectable()
export class TariffService {
  private readonly database: SaptmPrismaClient = getPrismaClient();

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
      this.database.tariffRateCard.count({
        where: {
          organizationId: input.organizationId,
        },
      }),
      this.database.tariffRateCard.count({
        where: {
          organizationId: input.organizationId,
          status: "active",
        },
      }),
      this.database.tariffRateRule.count({
        where: {
          organizationId: input.organizationId,
        },
      }),
      this.database.tariffQuote.groupBy({
        by: ["status"],
        where: {
          organizationId: input.organizationId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.tariffRateCard.findMany({
        where: {
          organizationId: input.organizationId,
          status: "active",
        },
        orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      this.database.tariffQuote.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          cargo: {
            select: tariffCargoSelect,
          },
          rateCard: true,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
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
    const replayedRateCard = await this.findRateCardByRecordIdempotencyKey(
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

    const duplicateRateCard = await this.findRateCardByCode(input.organizationId, rateCardCode);
    const businessRules = resolveTariffRateCardRegisterBusinessRules({
      input,
      duplicateRateCard,
      currencyCode,
    });

    if (!businessRules.rateCardAccepted) {
      throw new BadRequestException("tariff.rate_card_register_blocked");
    }

    const rateCard = await this.database.$transaction(async (transaction) => {
      const createdRateCard = await transaction.tariffRateCard.create({
        data: {
          organizationId: input.organizationId,
          rateCardCode,
          rateCardName: input.rateCardName.trim(),
          status: input.status,
          currencyCode,
          validFrom: new Date(input.validFrom),
          validUntil: input.validUntil === undefined ? null : new Date(input.validUntil),
          sourceSystem: input.sourceSystem,
          recordIdempotencyKey: input.idempotencyKey,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "tariff.rate_card.registered",
          subjectType: "tariff_rate_card",
          subjectId: createdRateCard.id,
          severity: "high",
          after: createTariffRateCardRegisterAuditAfter({
            rateCard: createdRateCard,
            businessRules,
          }),
          reason: "Governed tariff rate card registration.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "tariff.rate_card.registered",
          aggregateType: "tariff",
          aggregateId: createdRateCard.id,
          payload: createTariffRateCardRegisterAuditAfter({
            rateCard: createdRateCard,
            businessRules,
          }),
        },
      });

      return createdRateCard;
    });

    return createTariffRateCardRegisterOutput({
      organizationId: input.organizationId,
      rateCard,
      replayed: false,
      businessRules,
    });
  }

  async addRateRule(input: AddTariffRateRuleInput): Promise<TariffRateRuleAddOutput> {
    const ruleCode = normalizeTariffCode(input.ruleCode);
    const replayedRule = await this.findRateRuleByRecordIdempotencyKey(
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

    const rateCard = await this.findRateCardById(input.organizationId, input.rateCardId);

    if (rateCard === null) {
      throw new NotFoundException("tariff.rate_card_not_found");
    }

    const duplicateRule = await this.findRateRuleByCode(
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
    const rule = await this.database.$transaction(async (transaction) => {
      const createdRule = await transaction.tariffRateRule.create({
        data: {
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
          effectiveUntil:
            input.effectiveUntil === undefined ? null : new Date(input.effectiveUntil),
          sourceSystem: input.sourceSystem,
          recordIdempotencyKey: input.idempotencyKey,
        },
        include: {
          rateCard: true,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "tariff.rate_rule.added",
          subjectType: "tariff_rate_rule",
          subjectId: createdRule.id,
          severity: "high",
          before: auditBefore,
          after: createTariffRateRuleAddAuditAfter({
            rule: createdRule,
            businessRules,
          }),
          reason: "Governed tariff rate rule addition.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "tariff.rate_rule.added",
          aggregateType: "tariff",
          aggregateId: createdRule.id,
          payload: createTariffRateRuleAddAuditAfter({
            rule: createdRule,
            businessRules,
          }),
        },
      });

      return createdRule;
    });

    return createTariffRateRuleAddOutput({
      organizationId: input.organizationId,
      rule,
      replayed: false,
      businessRules,
    });
  }

  async calculateQuote(input: CalculateTariffQuoteInput): Promise<TariffQuoteCalculateOutput> {
    const quoteReference = normalizeTariffCode(input.quoteReference);
    const replayedQuote = await this.findQuoteByCalculateIdempotencyKey(
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

    const [cargo, rateCard, duplicateQuote, rateRules] = await Promise.all([
      this.findCargoById(input.organizationId, input.cargoId),
      this.findRateCardById(input.organizationId, input.rateCardId),
      this.findQuoteByReference(input.organizationId, quoteReference),
      this.findRateRulesByRateCard(input.organizationId, input.rateCardId),
    ]);

    if (cargo === null) {
      throw new NotFoundException("tariff.cargo_not_found");
    }

    if (rateCard === null) {
      throw new NotFoundException("tariff.rate_card_not_found");
    }

    const calculatedAt = new Date(input.calculatedAt);
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
      ...createOptionalDistance(input.distanceKm),
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
    const quote = await this.database.$transaction(async (transaction) => {
      const createdQuote = await transaction.tariffQuote.create({
        data: {
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
        },
        include: {
          cargo: {
            select: tariffCargoSelect,
          },
          rateCard: true,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "tariff.quote.calculated",
          subjectType: "tariff_quote",
          subjectId: createdQuote.id,
          severity: "high",
          before: auditBefore,
          after: createTariffQuoteCalculateAuditAfter({
            quote: createdQuote,
            lineItems: calculation.lineItems,
            businessRules,
          }),
          reason: "Governed tariff quote calculation.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "tariff.quote.calculated",
          aggregateType: "tariff",
          aggregateId: createdQuote.id,
          payload: createTariffQuoteCalculateAuditAfter({
            quote: createdQuote,
            lineItems: calculation.lineItems,
            businessRules,
          }),
        },
      });

      return createdQuote;
    });

    return createTariffQuoteCalculateOutput({
      organizationId: input.organizationId,
      quote,
      lineItems: calculation.lineItems,
      replayed: false,
      businessRules,
    });
  }

  async approveQuote(input: ApproveTariffQuoteInput): Promise<TariffQuoteApproveOutput> {
    const replayedQuote = await this.findQuoteByApproveIdempotencyKey(
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

    const quote = await this.findQuoteById(input.organizationId, input.quoteId);

    if (quote === null) {
      throw new NotFoundException("tariff.quote_not_found");
    }

    const approvedAt = new Date(input.approvedAt);
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
    const approvedQuote = await this.database.$transaction(async (transaction) => {
      const updatedQuote = await transaction.tariffQuote.update({
        where: {
          id: quote.id,
        },
        data: {
          status: "approved",
          approvedByName: input.approvedByName.trim(),
          approvalReference: normalizeTariffCode(input.approvalReference),
          approvalNotes: input.approvalNotes.trim(),
          approvedAt,
          sourceSystem: input.sourceSystem,
          approveIdempotencyKey: input.idempotencyKey,
        },
        include: {
          cargo: {
            select: tariffCargoSelect,
          },
          rateCard: true,
        },
      });

      await transaction.auditRecord.create({
        data: {
          organizationId: input.organizationId,
          actorType: input.actorType,
          actorId: input.actorId,
          action: "tariff.quote.approved",
          subjectType: "tariff_quote",
          subjectId: updatedQuote.id,
          severity: "critical",
          before: auditBefore,
          after: createTariffQuoteApproveAuditAfter({
            quote: updatedQuote,
            businessRules,
          }),
          reason: "Governed tariff quote approval.",
          correlationId: input.correlationId,
          ...createAuditRequestMetadata(input),
        },
      });

      await transaction.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          eventType: "tariff.quote.approved",
          aggregateType: "tariff",
          aggregateId: updatedQuote.id,
          payload: createTariffQuoteApproveAuditAfter({
            quote: updatedQuote,
            businessRules,
          }),
        },
      });

      return updatedQuote;
    });

    return createTariffQuoteApproveOutput({
      organizationId: input.organizationId,
      quote: approvedQuote,
      replayed: false,
      businessRules,
    });
  }

  private async findRateCardByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffRateCardRecord | null> {
    return this.database.tariffRateCard.findUnique({
      where: {
        organizationId_recordIdempotencyKey: {
          organizationId,
          recordIdempotencyKey: idempotencyKey,
        },
      },
    });
  }

  private async findRateRuleByRecordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffRateRuleWithRateCard | null> {
    return this.database.tariffRateRule.findUnique({
      where: {
        organizationId_recordIdempotencyKey: {
          organizationId,
          recordIdempotencyKey: idempotencyKey,
        },
      },
      include: {
        rateCard: true,
      },
    });
  }

  private async findQuoteByCalculateIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    return this.database.tariffQuote.findUnique({
      where: {
        organizationId_calculateIdempotencyKey: {
          organizationId,
          calculateIdempotencyKey: idempotencyKey,
        },
      },
      include: {
        cargo: {
          select: tariffCargoSelect,
        },
        rateCard: true,
      },
    });
  }

  private async findQuoteByApproveIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    return this.database.tariffQuote.findUnique({
      where: {
        organizationId_approveIdempotencyKey: {
          organizationId,
          approveIdempotencyKey: idempotencyKey,
        },
      },
      include: {
        cargo: {
          select: tariffCargoSelect,
        },
        rateCard: true,
      },
    });
  }

  private async findRateCardByCode(
    organizationId: string,
    rateCardCode: string,
  ): Promise<TariffRateCardRecord | null> {
    return this.database.tariffRateCard.findUnique({
      where: {
        organizationId_rateCardCode: {
          organizationId,
          rateCardCode,
        },
      },
    });
  }

  private async findRateCardById(
    organizationId: string,
    rateCardId: string,
  ): Promise<TariffRateCardRecord | null> {
    return this.database.tariffRateCard.findFirst({
      where: {
        id: rateCardId,
        organizationId,
      },
    });
  }

  private async findRateRuleByCode(
    organizationId: string,
    rateCardId: string,
    ruleCode: string,
  ): Promise<TariffRateRuleWithRateCard | null> {
    return this.database.tariffRateRule.findUnique({
      where: {
        organizationId_rateCardId_ruleCode: {
          organizationId,
          rateCardId,
          ruleCode,
        },
      },
      include: {
        rateCard: true,
      },
    });
  }

  private async findRateRulesByRateCard(
    organizationId: string,
    rateCardId: string,
  ): Promise<TariffRateRuleRecord[]> {
    return this.database.tariffRateRule.findMany({
      where: {
        organizationId,
        rateCardId,
      },
      orderBy: [{ chargeType: "asc" }, { createdAt: "asc" }],
    });
  }

  private async findCargoById(
    organizationId: string,
    cargoId: string,
  ): Promise<TariffCargoRecord | null> {
    return this.database.cargo.findFirst({
      where: {
        id: cargoId,
        organizationId,
      },
      select: tariffCargoSelect,
    });
  }

  private async findQuoteByReference(
    organizationId: string,
    quoteReference: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    return this.database.tariffQuote.findUnique({
      where: {
        organizationId_quoteReference: {
          organizationId,
          quoteReference,
        },
      },
      include: {
        cargo: {
          select: tariffCargoSelect,
        },
        rateCard: true,
      },
    });
  }

  private async findQuoteById(
    organizationId: string,
    quoteId: string,
  ): Promise<TariffQuoteWithCargoRateCard | null> {
    return this.database.tariffQuote.findFirst({
      where: {
        id: quoteId,
        organizationId,
      },
      include: {
        cargo: {
          select: tariffCargoSelect,
        },
        rateCard: true,
      },
    });
  }
}

const tariffCargoSelect = {
  id: true,
  organizationId: true,
  cargoReference: true,
  cargoDescription: true,
  cargoType: true,
  status: true,
  grossWeightKg: true,
  packageCount: true,
  volumeM3: true,
  originName: true,
  destinationName: true,
} as const;

function resolveTariffRateCardRegisterBusinessRules(input: {
  input: RegisterTariffRateCardInput;
  duplicateRateCard: TariffRateCardRecord | null;
  currencyCode: string;
}): TariffRateCardRegisterOutput["businessRules"] {
  const validityWindowValid =
    input.input.validUntil === undefined ||
    Date.parse(input.input.validUntil) > Date.parse(input.input.validFrom);
  const uniqueRateCardCode = input.duplicateRateCard === null;
  const currencyNormalized = /^[A-Z]{3}$/.test(input.currencyCode);
  const rateCardAccepted = validityWindowValid && uniqueRateCardCode && currencyNormalized;

  return {
    rateCardAccepted,
    uniqueRateCardCode,
    validityWindowValid,
    currencyNormalized,
    appliedRules: [
      "TARIFF_RATE_CARD_UNIQUE_CODE",
      "TARIFF_RATE_CARD_VALIDITY_WINDOW",
      "TARIFF_RATE_CARD_CURRENCY_NORMALIZED",
    ],
  };
}

function resolveTariffRateRuleAddBusinessRules(input: {
  input: AddTariffRateRuleInput;
  rateCard: TariffRateCardRecord;
  duplicateRule: TariffRateRuleWithRateCard | null;
}): TariffRateRuleAddOutput["businessRules"] {
  const effectiveFrom = new Date(input.input.effectiveFrom);
  const effectiveUntil =
    input.input.effectiveUntil === undefined ? null : new Date(input.input.effectiveUntil);
  const rateCardUsable = input.rateCard.status !== "retired";
  const effectiveWindowValid =
    effectiveFrom >= input.rateCard.validFrom &&
    (input.rateCard.validUntil === null || effectiveFrom <= input.rateCard.validUntil) &&
    (effectiveUntil === null || effectiveUntil > effectiveFrom) &&
    (effectiveUntil === null ||
      input.rateCard.validUntil === null ||
      effectiveUntil <= input.rateCard.validUntil);
  const rateBasisValid = isRateBasisValid(input.input);
  const duplicateRuleBlocked = input.duplicateRule === null;
  const ruleAccepted =
    rateCardUsable && effectiveWindowValid && rateBasisValid && duplicateRuleBlocked;

  return {
    ruleAccepted,
    rateCardUsable,
    effectiveWindowValid,
    rateBasisValid,
    duplicateRuleBlocked,
    appliedRules: [
      "TARIFF_RATE_RULE_RATE_CARD_USABLE",
      "TARIFF_RATE_RULE_EFFECTIVE_WINDOW_WITHIN_RATE_CARD",
      "TARIFF_RATE_RULE_BASIS_VALID",
      "TARIFF_RATE_RULE_DUPLICATE_BLOCKED",
    ],
  };
}

function resolveTariffQuoteCalculateBusinessRules(input: {
  cargo: TariffCargoRecord;
  rateCard: TariffRateCardRecord;
  calculatedAt: Date;
  applicableRules: TariffRateRuleRecord[];
  calculation: TariffCalculationResult;
  duplicateQuote: TariffQuoteWithCargoRateCard | null;
}): TariffQuoteCalculateOutput["businessRules"] {
  const cargoEligible = !["cancelled", "delivered"].includes(input.cargo.status);
  const rateCardActive = input.rateCard.status === "active";
  const rateCardValidAtCalculation =
    input.calculatedAt >= input.rateCard.validFrom &&
    (input.rateCard.validUntil === null || input.calculatedAt <= input.rateCard.validUntil);
  const applicableRulesFound = input.applicableRules.length > 0;
  const requiredMetricsAvailable = input.calculation.requiredMetricsAvailable;
  const amountPositive = input.calculation.quotedAmount > 0;
  const taxModelValid =
    input.calculation.tax.taxRatePercentage >= 0 &&
    input.calculation.tax.taxRatePercentage <= 100 &&
    input.calculation.tax.taxAmount >= 0 &&
    input.calculation.quotedAmount ===
      roundMoney(input.calculation.tax.taxableAmount + input.calculation.tax.taxAmount);
  const quoteCalculated =
    cargoEligible &&
    rateCardActive &&
    rateCardValidAtCalculation &&
    applicableRulesFound &&
    requiredMetricsAvailable &&
    amountPositive &&
    taxModelValid &&
    input.duplicateQuote === null;

  return {
    quoteCalculated,
    cargoEligible,
    rateCardActive,
    rateCardValidAtCalculation,
    applicableRulesFound,
    requiredMetricsAvailable,
    amountPositive,
    taxModelValid,
    appliedRules: [
      "TARIFF_QUOTE_REQUIRES_ELIGIBLE_CARGO",
      "TARIFF_QUOTE_REQUIRES_ACTIVE_RATE_CARD",
      "TARIFF_QUOTE_REQUIRES_APPLICABLE_RULES",
      "TARIFF_QUOTE_REQUIRES_REQUIRED_METRICS",
      "TARIFF_QUOTE_AMOUNT_POSITIVE",
      "TARIFF_QUOTE_TAX_MODEL_VALID",
      "TARIFF_QUOTE_DUPLICATE_REFERENCE_BLOCKED",
    ],
  };
}

function resolveTariffQuoteApproveBusinessRules(input: {
  quote: TariffQuoteWithCargoRateCard;
  input: ApproveTariffQuoteInput;
  approvedAt: Date;
}): TariffQuoteApproveOutput["businessRules"] {
  const quoteCalculated = input.quote.status === "calculated";
  const approvalAfterCalculation = input.approvedAt >= input.quote.calculatedAt;
  const approvalReferencePresent = input.input.approvalReference.trim().length >= 3;
  const approvalAllowed = quoteCalculated && approvalAfterCalculation && approvalReferencePresent;

  return {
    approvalAllowed,
    quoteCalculated,
    approvalAfterCalculation,
    approvalReferencePresent,
    appliedRules: [
      "TARIFF_QUOTE_APPROVAL_REQUIRES_CALCULATED_STATE",
      "TARIFF_QUOTE_APPROVAL_AFTER_CALCULATION",
      "TARIFF_QUOTE_APPROVAL_REFERENCE_REQUIRED",
    ],
  };
}

function calculateTariffQuoteAmount(input: {
  cargo: TariffCargoRecord;
  rules: TariffRateRuleRecord[];
  distanceKm?: number;
  taxRatePercentage: number;
}): TariffCalculationResult {
  const lineItems: TariffQuoteLineItem[] = [];
  let subtotal = 0;
  let requiredMetricsAvailable = true;
  const nonPercentageRules = input.rules.filter((rule) => rule.calculationBasis !== "percentage");
  const percentageRules = input.rules.filter((rule) => rule.calculationBasis === "percentage");

  for (const rule of nonPercentageRules) {
    const lineItem = calculateTariffLineItem({
      cargo: input.cargo,
      rule,
      subtotal,
      ...createOptionalDistance(input.distanceKm),
    });

    if (lineItem === null) {
      requiredMetricsAvailable = false;
      continue;
    }

    lineItems.push(lineItem);
    subtotal += lineItem.amount;
  }

  for (const rule of percentageRules) {
    const lineItem = calculateTariffLineItem({
      cargo: input.cargo,
      rule,
      subtotal,
      ...createOptionalDistance(input.distanceKm),
    });

    if (lineItem === null) {
      requiredMetricsAvailable = false;
      continue;
    }

    lineItems.push(lineItem);
    subtotal += lineItem.amount;
  }

  const taxableAmount = roundMoney(subtotal);
  const taxRatePercentage = input.taxRatePercentage;
  const taxAmount = roundMoney((taxableAmount * taxRatePercentage) / 100);

  return {
    lineItems,
    tax: {
      taxableAmount,
      taxRatePercentage,
      taxAmount,
    },
    quotedAmount: roundMoney(taxableAmount + taxAmount),
    requiredMetricsAvailable,
  };
}

function calculateTariffLineItem(input: {
  cargo: TariffCargoRecord;
  rule: TariffRateRuleRecord;
  distanceKm?: number;
  subtotal: number;
}): TariffQuoteLineItem | null {
  const rate = resolveTariffRate(input.rule);
  const quantity = resolveTariffQuantity({
    cargo: input.cargo,
    rule: input.rule,
    subtotal: input.subtotal,
    ...createOptionalDistance(input.distanceKm),
  });

  if (rate === null || quantity === null) {
    return null;
  }

  const rawAmount = input.rule.calculationBasis === "flat" ? rate : roundMoney(quantity * rate);
  const signedAmount = input.rule.chargeType === "discount" ? -Math.abs(rawAmount) : rawAmount;
  const minimumCharge = toNullableNumber(input.rule.minimumCharge);
  const minimumApplied =
    input.rule.chargeType !== "discount" && minimumCharge !== null && signedAmount < minimumCharge;
  const amount = minimumApplied ? minimumCharge : signedAmount;

  return {
    ruleId: input.rule.id,
    ruleCode: input.rule.ruleCode,
    chargeName: input.rule.chargeName,
    chargeType: input.rule.chargeType,
    calculationBasis: input.rule.calculationBasis,
    quantity,
    rate,
    amount: roundMoney(amount),
    minimumApplied,
  };
}

function resolveTariffRate(rule: TariffRateRuleRecord): number | null {
  if (rule.calculationBasis === "flat") {
    return toNullableNumber(rule.flatAmount);
  }

  if (rule.calculationBasis === "percentage") {
    const percentageRate = toNullableNumber(rule.percentageRate);

    return percentageRate === null ? null : percentageRate / 100;
  }

  return toNullableNumber(rule.unitRate);
}

function resolveTariffQuantity(input: {
  cargo: TariffCargoRecord;
  rule: TariffRateRuleRecord;
  distanceKm?: number;
  subtotal: number;
}): number | null {
  if (input.rule.calculationBasis === "flat") {
    return 1;
  }

  if (input.rule.calculationBasis === "per_unit") {
    return input.cargo.packageCount;
  }

  if (input.rule.calculationBasis === "per_weight_kg") {
    return Number(input.cargo.grossWeightKg);
  }

  if (input.rule.calculationBasis === "per_volume_m3") {
    return input.cargo.volumeM3 === null ? null : Number(input.cargo.volumeM3);
  }

  if (input.rule.calculationBasis === "per_distance_km") {
    return input.distanceKm ?? null;
  }

  if (input.rule.calculationBasis === "percentage") {
    return input.subtotal > 0 ? input.subtotal : null;
  }

  return null;
}

function isTariffRateRuleApplicable(input: {
  rule: TariffRateRuleRecord;
  cargo: TariffCargoRecord;
  calculatedAt: Date;
}): boolean {
  if (input.calculatedAt < input.rule.effectiveFrom) {
    return false;
  }

  if (input.rule.effectiveUntil !== null && input.calculatedAt > input.rule.effectiveUntil) {
    return false;
  }

  if (input.rule.cargoType !== null && input.rule.cargoType !== input.cargo.cargoType) {
    return false;
  }

  if (
    input.rule.originName !== null &&
    normalizeText(input.rule.originName) !== normalizeText(input.cargo.originName)
  ) {
    return false;
  }

  if (
    input.rule.destinationName !== null &&
    normalizeText(input.rule.destinationName) !== normalizeText(input.cargo.destinationName)
  ) {
    return false;
  }

  return true;
}

function isRateBasisValid(input: AddTariffRateRuleInput): boolean {
  if (input.calculationBasis === "flat") {
    return (input.flatAmount ?? 0) > 0;
  }

  if (input.calculationBasis === "percentage") {
    return (input.percentageRate ?? 0) > 0;
  }

  return (input.unitRate ?? 0) > 0;
}

function createTariffRateCardRegisterOutput(input: {
  organizationId: string;
  rateCard: TariffRateCardRecord;
  replayed: boolean;
  businessRules?: TariffRateCardRegisterOutput["businessRules"];
}): TariffRateCardRegisterOutput {
  const businessRules =
    input.businessRules ??
    ({
      rateCardAccepted: true,
      uniqueRateCardCode: true,
      validityWindowValid: true,
      currencyNormalized: true,
      appliedRules: [
        "TARIFF_RATE_CARD_UNIQUE_CODE",
        "TARIFF_RATE_CARD_VALIDITY_WINDOW",
        "TARIFF_RATE_CARD_CURRENCY_NORMALIZED",
      ],
    } satisfies TariffRateCardRegisterOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    rateCardId: input.rateCard.id,
    rateCard: createTariffRateCardSummary(input.rateCard),
    businessRules,
    idempotency: {
      key: toRequiredString(input.rateCard.recordIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.rate_card.registered",
      subjectType: "tariff_rate_card",
      subjectId: input.rateCard.id,
    },
    outbox: {
      eventType: "tariff.rate_card.registered",
      aggregateType: "tariff",
      aggregateId: input.rateCard.id,
    },
  };
}

function createTariffRateRuleAddOutput(input: {
  organizationId: string;
  rule: TariffRateRuleWithRateCard;
  replayed: boolean;
  businessRules?: TariffRateRuleAddOutput["businessRules"];
}): TariffRateRuleAddOutput {
  const businessRules =
    input.businessRules ??
    ({
      ruleAccepted: true,
      rateCardUsable: input.rule.rateCard.status !== "retired",
      effectiveWindowValid: true,
      rateBasisValid: true,
      duplicateRuleBlocked: true,
      appliedRules: [
        "TARIFF_RATE_RULE_RATE_CARD_USABLE",
        "TARIFF_RATE_RULE_EFFECTIVE_WINDOW_WITHIN_RATE_CARD",
        "TARIFF_RATE_RULE_BASIS_VALID",
        "TARIFF_RATE_RULE_DUPLICATE_BLOCKED",
      ],
    } satisfies TariffRateRuleAddOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    rateCardId: input.rule.rateCardId,
    ruleId: input.rule.id,
    rateCard: createTariffRateCardSummary(input.rule.rateCard),
    rule: createTariffRateRuleSummary(input.rule),
    businessRules,
    idempotency: {
      key: toRequiredString(input.rule.recordIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.rate_rule.added",
      subjectType: "tariff_rate_rule",
      subjectId: input.rule.id,
    },
    outbox: {
      eventType: "tariff.rate_rule.added",
      aggregateType: "tariff",
      aggregateId: input.rule.id,
    },
  };
}

function createTariffQuoteCalculateOutput(input: {
  organizationId: string;
  quote: TariffQuoteWithCargoRateCard;
  lineItems: TariffQuoteLineItem[];
  replayed: boolean;
  businessRules?: TariffQuoteCalculateOutput["businessRules"];
}): TariffQuoteCalculateOutput {
  const businessRules =
    input.businessRules ??
    ({
      quoteCalculated: true,
      cargoEligible: true,
      rateCardActive: input.quote.rateCard.status === "active",
      rateCardValidAtCalculation: true,
      applicableRulesFound: input.lineItems.length > 0,
      requiredMetricsAvailable: true,
      amountPositive: Number(input.quote.quotedAmount) > 0,
      taxModelValid: true,
      appliedRules: [
        "TARIFF_QUOTE_REQUIRES_ELIGIBLE_CARGO",
        "TARIFF_QUOTE_REQUIRES_ACTIVE_RATE_CARD",
        "TARIFF_QUOTE_REQUIRES_APPLICABLE_RULES",
        "TARIFF_QUOTE_REQUIRES_REQUIRED_METRICS",
        "TARIFF_QUOTE_AMOUNT_POSITIVE",
        "TARIFF_QUOTE_TAX_MODEL_VALID",
        "TARIFF_QUOTE_DUPLICATE_REFERENCE_BLOCKED",
      ],
    } satisfies TariffQuoteCalculateOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    cargoId: input.quote.cargoId,
    rateCardId: input.quote.rateCardId,
    quoteId: input.quote.id,
    cargo: createTariffCargoSummary(input.quote.cargo),
    rateCard: createTariffRateCardSummary(input.quote.rateCard),
    quote: createTariffQuoteSummary(input.quote),
    lineItems: input.lineItems,
    businessRules,
    idempotency: {
      key: toRequiredString(input.quote.calculateIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.quote.calculated",
      subjectType: "tariff_quote",
      subjectId: input.quote.id,
    },
    outbox: {
      eventType: "tariff.quote.calculated",
      aggregateType: "tariff",
      aggregateId: input.quote.id,
    },
  };
}

function createTariffQuoteApproveOutput(input: {
  organizationId: string;
  quote: TariffQuoteWithCargoRateCard;
  replayed: boolean;
  businessRules?: TariffQuoteApproveOutput["businessRules"];
}): TariffQuoteApproveOutput {
  const businessRules =
    input.businessRules ??
    ({
      approvalAllowed: input.quote.status === "approved",
      quoteCalculated: true,
      approvalAfterCalculation: true,
      approvalReferencePresent: input.quote.approvalReference !== null,
      appliedRules: [
        "TARIFF_QUOTE_APPROVAL_REQUIRES_CALCULATED_STATE",
        "TARIFF_QUOTE_APPROVAL_AFTER_CALCULATION",
        "TARIFF_QUOTE_APPROVAL_REFERENCE_REQUIRED",
      ],
    } satisfies TariffQuoteApproveOutput["businessRules"]);

  return {
    organizationId: input.organizationId,
    cargoId: input.quote.cargoId,
    quoteId: input.quote.id,
    cargo: createTariffCargoSummary(input.quote.cargo),
    rateCard: createTariffRateCardSummary(input.quote.rateCard),
    quote: createTariffQuoteSummary(input.quote),
    businessRules,
    idempotency: {
      key: toRequiredString(input.quote.approveIdempotencyKey),
      replayed: input.replayed,
    },
    audit: {
      action: "tariff.quote.approved",
      subjectType: "tariff_quote",
      subjectId: input.quote.id,
    },
    outbox: {
      eventType: "tariff.quote.approved",
      aggregateType: "tariff",
      aggregateId: input.quote.id,
    },
  };
}

function createTariffRateCardSummary(
  rateCard: TariffRateCardRecord,
): TariffRateCardRegisterOutput["rateCard"] {
  return {
    id: rateCard.id,
    rateCardCode: rateCard.rateCardCode,
    rateCardName: rateCard.rateCardName,
    status: rateCard.status,
    currencyCode: rateCard.currencyCode,
    validFrom: rateCard.validFrom.toISOString(),
    validUntil: toIsoStringOrNull(rateCard.validUntil),
    sourceSystem: rateCard.sourceSystem,
    createdAt: rateCard.createdAt.toISOString(),
    updatedAt: rateCard.updatedAt.toISOString(),
  };
}

function createTariffRateRuleSummary(rule: TariffRateRuleRecord): TariffRateRuleAddOutput["rule"] {
  return {
    id: rule.id,
    rateCardId: rule.rateCardId,
    ruleCode: rule.ruleCode,
    chargeName: rule.chargeName,
    chargeType: rule.chargeType,
    calculationBasis: rule.calculationBasis,
    unitRate: toNullableNumber(rule.unitRate),
    flatAmount: toNullableNumber(rule.flatAmount),
    percentageRate: toNullableNumber(rule.percentageRate),
    minimumCharge: toNullableNumber(rule.minimumCharge),
    originName: rule.originName,
    destinationName: rule.destinationName,
    cargoType: rule.cargoType,
    effectiveFrom: rule.effectiveFrom.toISOString(),
    effectiveUntil: toIsoStringOrNull(rule.effectiveUntil),
    sourceSystem: rule.sourceSystem,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

function createTariffCargoSummary(cargo: TariffCargoRecord): TariffQuoteCalculateOutput["cargo"] {
  return {
    id: cargo.id,
    cargoReference: cargo.cargoReference,
    cargoDescription: cargo.cargoDescription,
    cargoType: cargo.cargoType,
    status: cargo.status,
    grossWeightKg: Number(cargo.grossWeightKg),
    packageCount: cargo.packageCount,
    volumeM3: cargo.volumeM3 === null ? null : Number(cargo.volumeM3),
    originName: cargo.originName,
    destinationName: cargo.destinationName,
  };
}

function createTariffQuoteSummary(
  quote: TariffQuoteWithCargoRateCard,
): TariffOverviewOutput["recentQuotes"][number] {
  const quotedAmount = Number(quote.quotedAmount);
  const tax = readTaxFromPayload(quote.calculationPayload, quotedAmount);

  return {
    id: quote.id,
    cargoId: quote.cargoId,
    cargoReference: quote.cargo.cargoReference,
    rateCardId: quote.rateCardId,
    rateCardCode: quote.rateCard.rateCardCode,
    quoteReference: quote.quoteReference,
    status: quote.status,
    currencyCode: quote.currencyCode,
    taxableAmount: tax.taxableAmount,
    taxRatePercentage: tax.taxRatePercentage,
    taxAmount: tax.taxAmount,
    quotedAmount,
    calculatedByName: quote.calculatedByName,
    calculatedAt: quote.calculatedAt.toISOString(),
    approvedByName: quote.approvedByName,
    approvalReference: quote.approvalReference,
    approvalNotes: quote.approvalNotes,
    approvedAt: toIsoStringOrNull(quote.approvedAt),
    sourceSystem: quote.sourceSystem,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
  };
}

function createTariffQuoteStatusCounts(groups: TariffQuoteStatusGroup[]) {
  const counts = {
    calculated: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  };

  for (const group of groups) {
    counts[group.status] = group._count._all;
  }

  return counts;
}

function createTariffRateCardRegisterAuditAfter(input: {
  rateCard: TariffRateCardRecord;
  businessRules: TariffRateCardRegisterOutput["businessRules"];
}): AuditJsonValue {
  return {
    rateCardId: input.rateCard.id,
    rateCardCode: input.rateCard.rateCardCode,
    rateCardName: input.rateCard.rateCardName,
    status: input.rateCard.status,
    currencyCode: input.rateCard.currencyCode,
    validFrom: input.rateCard.validFrom.toISOString(),
    validUntil: toIsoStringOrNull(input.rateCard.validUntil),
    rateCardAccepted: input.businessRules.rateCardAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.rateCard.recordIdempotencyKey,
    sourceSystem: input.rateCard.sourceSystem,
  };
}

function createTariffRateRuleAddAuditBefore(input: {
  rateCard: TariffRateCardRecord;
  duplicateRule: TariffRateRuleWithRateCard | null;
  businessRules: TariffRateRuleAddOutput["businessRules"];
}): AuditJsonValue {
  return {
    rateCardId: input.rateCard.id,
    rateCardCode: input.rateCard.rateCardCode,
    rateCardStatus: input.rateCard.status,
    duplicateRuleId: input.duplicateRule?.id ?? null,
    ruleAccepted: input.businessRules.ruleAccepted,
    rateBasisValid: input.businessRules.rateBasisValid,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createTariffRateRuleAddAuditAfter(input: {
  rule: TariffRateRuleWithRateCard;
  businessRules: TariffRateRuleAddOutput["businessRules"];
}): AuditJsonValue {
  return {
    ruleId: input.rule.id,
    rateCardId: input.rule.rateCardId,
    ruleCode: input.rule.ruleCode,
    chargeName: input.rule.chargeName,
    chargeType: input.rule.chargeType,
    calculationBasis: input.rule.calculationBasis,
    unitRate: toNullableNumber(input.rule.unitRate),
    flatAmount: toNullableNumber(input.rule.flatAmount),
    percentageRate: toNullableNumber(input.rule.percentageRate),
    minimumCharge: toNullableNumber(input.rule.minimumCharge),
    ruleAccepted: input.businessRules.ruleAccepted,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.rule.recordIdempotencyKey,
    sourceSystem: input.rule.sourceSystem,
  };
}

function createTariffQuoteCalculateAuditBefore(input: {
  cargo: TariffCargoRecord;
  rateCard: TariffRateCardRecord;
  duplicateQuote: TariffQuoteWithCargoRateCard | null;
  applicableRules: TariffRateRuleRecord[];
  businessRules: TariffQuoteCalculateOutput["businessRules"];
}): AuditJsonValue {
  return {
    cargoId: input.cargo.id,
    cargoReference: input.cargo.cargoReference,
    cargoStatus: input.cargo.status,
    rateCardId: input.rateCard.id,
    rateCardCode: input.rateCard.rateCardCode,
    duplicateQuoteId: input.duplicateQuote?.id ?? null,
    applicableRuleCount: input.applicableRules.length,
    quoteCalculated: input.businessRules.quoteCalculated,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createTariffQuoteCalculateAuditAfter(input: {
  quote: TariffQuoteWithCargoRateCard;
  lineItems: TariffQuoteLineItem[];
  businessRules: TariffQuoteCalculateOutput["businessRules"];
}): AuditJsonValue {
  const quotedAmount = Number(input.quote.quotedAmount);
  const tax = readTaxFromPayload(input.quote.calculationPayload, quotedAmount);

  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    cargoId: input.quote.cargoId,
    cargoReference: input.quote.cargo.cargoReference,
    rateCardId: input.quote.rateCardId,
    rateCardCode: input.quote.rateCard.rateCardCode,
    currencyCode: input.quote.currencyCode,
    taxableAmount: tax.taxableAmount,
    taxRatePercentage: tax.taxRatePercentage,
    taxAmount: tax.taxAmount,
    quotedAmount,
    lineItems: input.lineItems,
    quoteCalculated: input.businessRules.quoteCalculated,
    taxModelValid: input.businessRules.taxModelValid,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.quote.calculateIdempotencyKey,
    sourceSystem: input.quote.sourceSystem,
  };
}

function createTariffQuoteApproveAuditBefore(input: {
  quote: TariffQuoteWithCargoRateCard;
  businessRules: TariffQuoteApproveOutput["businessRules"];
}): AuditJsonValue {
  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    status: input.quote.status,
    calculatedAt: input.quote.calculatedAt.toISOString(),
    approvalAllowed: input.businessRules.approvalAllowed,
    appliedRules: input.businessRules.appliedRules,
  };
}

function createTariffQuoteApproveAuditAfter(input: {
  quote: TariffQuoteWithCargoRateCard;
  businessRules: TariffQuoteApproveOutput["businessRules"];
}): AuditJsonValue {
  return {
    quoteId: input.quote.id,
    quoteReference: input.quote.quoteReference,
    status: input.quote.status,
    approvalReference: input.quote.approvalReference,
    approvedByName: input.quote.approvedByName,
    approvedAt: toIsoStringOrNull(input.quote.approvedAt),
    approvalAllowed: input.businessRules.approvalAllowed,
    appliedRules: input.businessRules.appliedRules,
    idempotencyKey: input.quote.approveIdempotencyKey,
    sourceSystem: input.quote.sourceSystem,
  };
}

function readLineItemsFromPayload(payload: unknown): TariffQuoteLineItem[] {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "lineItems" in payload &&
    Array.isArray(payload.lineItems)
  ) {
    return payload.lineItems.filter(isTariffQuoteLineItem);
  }

  return [];
}

function readTaxFromPayload(payload: unknown, quotedAmount: number): TariffCalculationTax {
  const taxableAmount = readNumberFromPayload(payload, "taxableAmount");
  const taxRatePercentage = readNumberFromPayload(payload, "taxRatePercentage");
  const taxAmount = readNumberFromPayload(payload, "taxAmount");

  if (taxableAmount === null || taxRatePercentage === null || taxAmount === null) {
    return {
      taxableAmount: quotedAmount,
      taxRatePercentage: 0,
      taxAmount: 0,
    };
  }

  return {
    taxableAmount,
    taxRatePercentage,
    taxAmount,
  };
}

function readNumberFromPayload(payload: unknown, key: string): number | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const value = (payload as Record<string, unknown>)[key];
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function isTariffQuoteLineItem(value: unknown): value is TariffQuoteLineItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "ruleId" in value &&
    "ruleCode" in value &&
    "amount" in value
  );
}

function normalizeTariffCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeText(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

function createOptionalDistance(distanceKm: number | undefined): { distanceKm?: number } {
  return distanceKm === undefined ? {} : { distanceKm };
}

function createAuditRequestMetadata(input: { ipAddress?: string; userAgent?: string }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toNullableNumber(value: unknown | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function toIsoStringOrNull(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

function toRequiredString(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    throw new Error("required_string_missing");
  }

  return value;
}
