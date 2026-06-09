export type TrackingEventRecordFormState = {
  status: "idle" | "success" | "error";
  message: string;
  eventId?: string;
  idempotencyKey?: string;
};

export const initialTrackingEventRecordFormState: TrackingEventRecordFormState = {
  status: "idle",
  message: "Preencha o evento operacional para gravar uma movimentacao auditavel.",
};

export type TrackingExceptionManageFormState = {
  status: "idle" | "success" | "error";
  message: string;
  eventId?: string;
  idempotencyKey?: string;
  currentStatus?: string;
  evidenceReference?: string;
  approvalStatus?: string;
  workflowState?: string;
};

export const initialTrackingExceptionManageFormState: TrackingExceptionManageFormState = {
  status: "idle",
  message: "Preencha a excecao operacional para acionar audit, outbox e plano de recuperacao.",
};

export type TrackingExceptionResolveFormState = {
  status: "idle" | "success" | "error";
  message: string;
  eventId?: string;
  idempotencyKey?: string;
  currentStatus?: string;
  evidenceReference?: string;
  approvalStatus?: string;
  workflowState?: string;
};

export const initialTrackingExceptionResolveFormState: TrackingExceptionResolveFormState = {
  status: "idle",
  message: "Preencha a resolucao para libertar uma carga de atraso ou excecao operacional.",
};
