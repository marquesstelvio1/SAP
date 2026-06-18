export type TransportOrderConfirmFormState = {
  status: "idle" | "success" | "error";
  message: string;
  orderId?: string;
  orderReference?: string;
  cargoId?: string;
  idempotencyKey?: string;
  orderConfirmed?: boolean;
};

export const initialTransportOrderConfirmFormState: TransportOrderConfirmFormState = {
  status: "idle",
  message: "Confirme uma transport order somente apos carga, rota, timing e responsabilidade.",
};

export type TransportOrderCancelFormState = {
  status: "idle" | "success" | "error";
  message: string;
  orderId?: string;
  orderReference?: string;
  cargoId?: string;
  idempotencyKey?: string;
  orderCancelled?: boolean;
};

export const initialTransportOrderCancelFormState: TransportOrderCancelFormState = {
  status: "idle",
  message:
    "Cancele uma transport order confirmada somente antes da partida, com motivo e audit trail.",
};

export type TransportOrderRescheduleFormState = {
  status: "idle" | "success" | "error";
  message: string;
  orderId?: string;
  orderReference?: string;
  cargoId?: string;
  revisionId?: string;
  revisionReference?: string;
  idempotencyKey?: string;
  orderRescheduled?: boolean;
};

export const initialTransportOrderRescheduleFormState: TransportOrderRescheduleFormState = {
  status: "idle",
  message:
    "Replaneie uma transport order confirmada antes da partida, mantendo audit trail e outbox.",
};

export type TransportOrderDispatchFormState = {
  status: "idle" | "success" | "error";
  message: string;
  orderId?: string;
  orderReference?: string;
  cargoId?: string;
  dispatchId?: string;
  dispatchReference?: string;
  idempotencyKey?: string;
  orderDispatched?: boolean;
};

export const initialTransportOrderDispatchFormState: TransportOrderDispatchFormState = {
  status: "idle",
  message:
    "Despache uma transport order confirmada para execucao antes da partida, com instrucoes auditaveis.",
};
