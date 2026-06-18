export type TariffRateCardRegisterFormState = {
  status: "idle" | "success" | "error";
  message: string;
  rateCardId?: string;
  rateCardCode?: string;
  idempotencyKey?: string;
  rateCardAccepted?: boolean;
};

export type TariffRateRuleAddFormState = {
  status: "idle" | "success" | "error";
  message: string;
  rateCardId?: string;
  ruleId?: string;
  ruleCode?: string;
  idempotencyKey?: string;
  ruleAccepted?: boolean;
};

export type TariffQuoteCalculateFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  rateCardId?: string;
  quoteId?: string;
  quoteReference?: string;
  taxableAmount?: number;
  taxRatePercentage?: number;
  taxAmount?: number;
  quotedAmount?: number;
  idempotencyKey?: string;
  quoteCalculated?: boolean;
};

export type TariffQuoteApproveFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  quoteId?: string;
  approvalReference?: string;
  idempotencyKey?: string;
  approvalAllowed?: boolean;
};

export const initialTariffRateCardRegisterFormState: TariffRateCardRegisterFormState = {
  status: "idle",
  message: "Rate card ainda nao submetido.",
};

export const initialTariffRateRuleAddFormState: TariffRateRuleAddFormState = {
  status: "idle",
  message: "Regra tarifaria ainda nao submetida.",
};

export const initialTariffQuoteCalculateFormState: TariffQuoteCalculateFormState = {
  status: "idle",
  message: "Cotacao ainda nao calculada.",
};

export const initialTariffQuoteApproveFormState: TariffQuoteApproveFormState = {
  status: "idle",
  message: "Aprovacao ainda nao submetida.",
};
