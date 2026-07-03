export type CargoRegisterFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  cargoReference?: string;
  idempotencyKey?: string;
  movementBlocked?: boolean;
  inspectionRequired?: boolean;
  /** Status da operação de libertação quando feita apos registo. */
  releaseStatus?: string;
  /** Cargo ID retornado pela libertação (igual ao do registo). */
  releaseCargoId?: string;
};

export const initialCargoRegisterFormState: CargoRegisterFormState = {
  status: "idle",
  message: "Preencha os dados da carga para iniciar o registo operacional.",
};

export type CargoReleaseFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  cargoReference?: string;
  idempotencyKey?: string;
  releaseAllowed?: boolean;
  movementBlocked?: boolean;
};

export const initialCargoReleaseFormState: CargoReleaseFormState = {
  status: "idle",
  message: "Informe a carga e a evidência de liberação para aplicar as regras P1.",
};

export type CargoTransportPlanFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  cargoReference?: string;
  shipmentId?: string;
  shipmentReferenceCode?: string;
  idempotencyKey?: string;
  planningAllowed?: boolean;
  trackingLinked?: boolean;
};

export const initialCargoTransportPlanFormState: CargoTransportPlanFormState = {
  status: "idle",
  message: "Informe a carga liberada e o plano operacional para criar o tracking.",
};

export type CargoTransportDepartFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  cargoReference?: string;
  shipmentId?: string;
  eventId?: string;
  idempotencyKey?: string;
  departureAllowed?: boolean;
  approvedComplianceEvidencePresent?: boolean;
};

export const initialCargoTransportDepartFormState: CargoTransportDepartFormState = {
  status: "idle",
  message: "Informe a carga planeada e a evidencia aprovada para iniciar a partida P4.",
};

export type CargoTransportArriveFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  cargoReference?: string;
  shipmentId?: string;
  eventId?: string;
  idempotencyKey?: string;
  arrivalAllowed?: boolean;
  trackingShipmentInTransit?: boolean;
};

export const initialCargoTransportArriveFormState: CargoTransportArriveFormState = {
  status: "idle",
  message: "Informe a carga em transporte para confirmar a chegada operacional P5.",
};

export type CargoDeliveryCompleteFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  cargoReference?: string;
  shipmentId?: string;
  eventId?: string;
  idempotencyKey?: string;
  deliveryAllowed?: boolean;
  deliveryConditionAccepted?: boolean;
};

export const initialCargoDeliveryCompleteFormState: CargoDeliveryCompleteFormState = {
  status: "idle",
  message: "Informe a carga chegada para concluir a entrega.",
};

export type CargoDeliveryExceptionRecordFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  exceptionId?: string;
  shipmentId?: string;
  eventId?: string;
  idempotencyKey?: string;
  exceptionAccepted?: boolean;
};

export const initialCargoDeliveryExceptionRecordFormState: CargoDeliveryExceptionRecordFormState = {
  status: "idle",
  message: "Registe uma exceção de entrega quando a condicao final não e sound.",
};

export type CargoDeliveryExceptionResolveFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  exceptionId?: string;
  shipmentId?: string;
  eventId?: string;
  idempotencyKey?: string;
  resolutionAllowed?: boolean;
};

export const initialCargoDeliveryExceptionResolveFormState: CargoDeliveryExceptionResolveFormState =
  {
    status: "idle",
    message: "Resolva a exceção para restaurar a carga e permitir a entrega final.",
  };

export type CargoOperationalHandoffRecordFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  cargoReference?: string;
  handoffId?: string;
  shipmentId?: string;
  eventId?: string;
  idempotencyKey?: string;
  handoffAllowed?: boolean;
  custodyChanged?: boolean;
};

export const initialCargoOperationalHandoffRecordFormState: CargoOperationalHandoffRecordFormState =
  {
    status: "idle",
    message: "Registe a transferência operacional de custodia porto/ferrovia/terminal P7.",
  };

export type CargoClaimSettlementRecordFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  exceptionId?: string;
  settlementId?: string;
  settlementReference?: string;
  idempotencyKey?: string;
  settlementAllowed?: boolean;
  claimReferenceMatched?: boolean;
};

export const initialCargoClaimSettlementRecordFormState: CargoClaimSettlementRecordFormState = {
  status: "idle",
  message: "Registe a liquidação contabilística de uma claim aceite e resolvida P8.",
};

export type CargoComplianceEvidenceRecordFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  evidenceId?: string;
  evidenceType?: string;
  documentReference?: string;
  idempotencyKey?: string;
  reviewRequired?: boolean;
};

export const initialCargoComplianceEvidenceRecordFormState: CargoComplianceEvidenceRecordFormState =
  {
    status: "idle",
    message: "Registe evidencia documental antes da verificação.",
  };

export type CargoComplianceEvidenceVerifyFormState = {
  status: "idle" | "success" | "error";
  message: string;
  cargoId?: string;
  evidenceId?: string;
  statusValue?: string;
  idempotencyKey?: string;
  evidenceApproved?: boolean;
  evidenceRejected?: boolean;
};

export const initialCargoComplianceEvidenceVerifyFormState: CargoComplianceEvidenceVerifyFormState =
  {
    status: "idle",
    message: "Revise evidencia pendente para aprovar ou rejeitar com trilha auditável.",
  };
