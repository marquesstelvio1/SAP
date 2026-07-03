export type IntegrationServiceAccountCreateFormState = {
  status: "idle" | "success" | "error";
  message: string;
  serviceAccountId?: string;
  apiKeyPrefix?: string;
  plaintextApiKey?: string | null;
  replayed?: boolean;
};

export const initialIntegrationServiceAccountCreateFormState: IntegrationServiceAccountCreateFormState =
  {
    status: "idle",
    message: "Crie contas de servico com permissões mínimas e chave de API.",
  };

export type IntegrationEventRecordFormState = {
  status: "idle" | "success" | "error";
  message: string;
  eventId?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialIntegrationEventRecordFormState: IntegrationEventRecordFormState = {
  status: "idle",
  message: "Registe eventos externos por sistema de origem e identificador único.",
};

export type IntegrationPortTosMovementFormState = {
  status: "idle" | "success" | "error";
  message: string;
  integrationEventId?: string;
  trackingEventId?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialIntegrationPortTosMovementFormState: IntegrationPortTosMovementFormState = {
  status: "idle",
  message: "Processe movimentos Port TOS locais em eventos de tracking.",
};

export type IntegrationRailTmsMovementFormState = {
  status: "idle" | "success" | "error";
  message: string;
  integrationEventId?: string;
  trackingEventId?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialIntegrationRailTmsMovementFormState: IntegrationRailTmsMovementFormState = {
  status: "idle",
  message: "Processe movimentos Rail TMS locais em eventos de tracking.",
};

export type IntegrationCarrierTmsMovementFormState = {
  status: "idle" | "success" | "error";
  message: string;
  integrationEventId?: string;
  trackingEventId?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialIntegrationCarrierTmsMovementFormState: IntegrationCarrierTmsMovementFormState =
  {
    status: "idle",
    message: "Processe movimentos Carrier TMS locais em eventos de tracking.",
  };

export type IntegrationTelematicsGpsPositionFormState = {
  status: "idle" | "success" | "error";
  message: string;
  integrationEventId?: string;
  trackingEventId?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialIntegrationTelematicsGpsPositionFormState: IntegrationTelematicsGpsPositionFormState =
  {
    status: "idle",
    message: "Processe posições Telematics/GPS locais em eventos de tracking.",
  };

export type IntegrationCustomsErpStatusFormState = {
  status: "idle" | "success" | "error";
  message: string;
  integrationEventId?: string;
  trackingEventId?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialIntegrationCustomsErpStatusFormState: IntegrationCustomsErpStatusFormState = {
  status: "idle",
  message: "Processe estados Customs/ERP locais em eventos de tracking.",
};

export type IntegrationWarehouseWmsActivityFormState = {
  status: "idle" | "success" | "error";
  message: string;
  integrationEventId?: string;
  trackingEventId?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialIntegrationWarehouseWmsActivityFormState: IntegrationWarehouseWmsActivityFormState =
  {
    status: "idle",
    message: "Processe atividades Warehouse/WMS locais em eventos de tracking.",
  };
