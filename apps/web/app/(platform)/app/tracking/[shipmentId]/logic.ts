export const statusLabels = {
  planned: "Planeado",
  in_transit: "Em transito",
  delayed: "Atrasado",
  exception: "Exceção",
  arrived: "Chegou",
  completed: "Concluido",
  cancelled: "Cancelado",
} as const;

export const modeLabels = {
  rail: "Ferrovia",
  port: "Porto",
  road: "Rodovia",
  multimodal: "Multimodal",
} as const;

export const eventLabels = {
  created: "Criado",
  departed: "Partida",
  arrived: "Chegada",
  delayed: "Atraso",
  exception: "Exceção",
  location_updated: "Local atualizado",
  handover_completed: "Handover concluido",
  customs_hold: "Retencao alfandegaria",
  released: "Liberação",
} as const;

export const workflowStateLabels = {
  exception_opened: "Exceção aberta",
  pending_review: "Pendente revisao",
  approved_for_resolution: "Aprovada para resolução",
  closed: "Fechado",
} as const;

export function resolveStatusVariant(
  status: keyof typeof statusLabels,
): "info" | "success" | "warning" | "destructive" | "outline" {
  if (status === "exception") return "destructive";
  if (status === "delayed") return "warning";
  if (status === "completed" || status === "arrived") return "success";
  if (status === "cancelled") return "outline";
  return "info";
}

export function resolveWorkflowStateVariant(
  state: keyof typeof workflowStateLabels,
): "success" | "warning" | "info" | "outline" {
  if (state === "closed") return "success";
  if (state === "approved_for_resolution") return "info";
  if (state === "pending_review") return "warning";
  return "outline";
}

export function resolveNullable<T extends string>(
  labels: Record<T, string>,
  value: T | null,
): string {
  return value === null ? "Sem evento" : labels[value];
}

export { formatDateTime, formatNullableDateTime } from "@/lib/format";
