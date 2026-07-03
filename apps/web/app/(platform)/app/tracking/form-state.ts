export type TrackingEventRecordFormState = {
  status: "idle" | "success" | "error";
  message: string;
  eventId?: string;
  idempotencyKey?: string;
};

export const initialTrackingEventRecordFormState: TrackingEventRecordFormState = {
  status: "idle",
  message: "Preencha o evento para gravar a movimentacao operacional.",
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
  message: "Preencha a exceção operacional para acionar notificacao e plano de recuperação.",
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
  message: "Preencha a resolução para libertar uma carga de atraso ou exceção operacional.",
};
