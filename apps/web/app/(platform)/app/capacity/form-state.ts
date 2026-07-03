export type CapacityResourceRegisterFormState = {
  status: "idle" | "success" | "error";
  message: string;
  resourceId?: string;
  resourceCode?: string;
  idempotencyKey?: string;
  resourceAccepted?: boolean;
};

export const initialCapacityResourceRegisterFormState: CapacityResourceRegisterFormState = {
  status: "idle",
  message: "Registe recursos operacionais antes de abrir slots de capacidade P9.",
};

export type CapacitySlotOpenFormState = {
  status: "idle" | "success" | "error";
  message: string;
  resourceId?: string;
  slotId?: string;
  slotReference?: string;
  idempotencyKey?: string;
  slotOpened?: boolean;
  capacityWithinResourceLimit?: boolean;
};

export const initialCapacitySlotOpenFormState: CapacitySlotOpenFormState = {
  status: "idle",
  message: "Abra janelas de capacidade com limites por recurso e auditoria.",
};

export type CapacitySlotReserveFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  slotId?: string;
  reservationId?: string;
  reservationReference?: string;
  idempotencyKey?: string;
  reservationAllowed?: boolean;
  capacityAvailable?: boolean;
};

export const initialCapacitySlotReserveFormState: CapacitySlotReserveFormState = {
  status: "idle",
  message: "Reserve unidades de slot para carga elegível sem overbooking.",
};

export type CapacitySlotCancelFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  slotId?: string;
  reservationId?: string;
  cancellationReference?: string;
  idempotencyKey?: string;
  cancellationAllowed?: boolean;
};

export const initialCapacitySlotCancelFormState: CapacitySlotCancelFormState = {
  status: "idle",
  message: "Cancele reserva ativa para libertar capacidade com trilha auditável.",
};

export type CapacityAdvisoryDecisionFormState = {
  status: "idle" | "success" | "error";
  message: string;
  decisionId?: string;
  recommendationId?: string;
  decisionStatus?: "approved" | "rejected";
  idempotencyKey?: string;
  decisionAccepted?: boolean;
};

export const initialCapacityAdvisoryDecisionFormState: CapacityAdvisoryDecisionFormState = {
  status: "idle",
  message: "Registe decisão humana sobre recomendações sem executar automação.",
};
