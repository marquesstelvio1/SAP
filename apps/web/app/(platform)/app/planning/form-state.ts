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
  message: "Confirme uma ordem de transporte apos validar carga, rota e responsabilidade.",
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
  message: "Cancele uma ordem de transporte confirmada antes da partida.",
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
  message: "Replaneie uma ordem de transporte confirmada antes da partida.",
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
  message: "Despache uma ordem de transporte confirmada para execucao.",
};
