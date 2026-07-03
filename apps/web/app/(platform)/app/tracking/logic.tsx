import type { Route } from "next";

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

export const eventTypeLabels = {
  created: "Criado",
  departed: "Partiu",
  arrived: "Chegou",
  delayed: "Atrasado",
  exception: "Exceção",
  location_updated: "Localizacao",
  handover_completed: "Handover",
  customs_hold: "Retencao aduaneira",
  released: "Liberado",
} as const;

export const workflowStateLabels = {
  exception_opened: "Exceção aberta",
  pending_review: "Em revisao",
  approved_for_resolution: "Aprovado",
  closed: "Fechado",
} as const;

export const advisoryTypeLabels = {
  sla_risk: "Risco SLA",
  exception_recovery: "Recuperacao",
  priority_review: "Prioridade",
  workflow_review: "Workflow",
} as const;

export function createTrackingShipmentRoute(shipmentId: string): Route {
  return `/app/tracking/${shipmentId}` as Route;
}

export function resolveStatusVariant(
  status: keyof typeof statusLabels,
): "info" | "success" | "warning" | "destructive" | "outline" {
  if (status === "exception") return "destructive";
  if (status === "delayed") return "warning";
  if (status === "completed" || status === "arrived") return "success";
  if (status === "cancelled") return "outline";
  return "info";
}

export function resolveAdvisorySeverityVariant(
  severity: "medium" | "high" | "critical",
): "warning" | "destructive" | "secondary" {
  if (severity === "critical") return "destructive";
  if (severity === "high") return "warning";
  return "secondary";
}
