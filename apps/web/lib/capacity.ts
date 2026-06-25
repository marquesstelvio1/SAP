export const resourceTypeLabels = {
  terminal: "Terminal",
  gate: "Gate",
  berth: "Berth / cais",
  rail_track: "Linha ferroviaria",
  yard: "Patio",
  carrier_slot: "Slot transportador",
} as const;

export const slotStatusLabels = {
  open: "Aberto",
  blocked: "Bloqueado",
  closed: "Fechado",
} as const;

export const reservationPurposeLabels = {
  handoff: "Handoff",
  departure: "Partida",
  arrival: "Chegada",
  delivery: "Entrega",
  storage: "Armazenagem",
  other: "Outro",
} as const;

export const advisoryTypeLabels = {
  slot_saturation: "Saturacao",
  expiring_slot: "Janela a expirar",
  unused_capacity: "Baixa utilizacao",
  reservation_imbalance: "Desequilibrio",
  cancellation_review: "Cancelamentos",
} as const;

export const advisoryDecisionStatusLabels = {
  approved: "Aprovada",
  rejected: "Rejeitada",
} as const;

export function resolveSlotStatusVariant(
  status: keyof typeof slotStatusLabels,
): "success" | "warning" | "outline" {
  if (status === "open") {
    return "success";
  }

  if (status === "blocked") {
    return "warning";
  }

  return "outline";
}

export function resolveAdvisorySeverityVariant(
  severity: "low" | "medium" | "high" | "critical",
): "success" | "warning" | "destructive" | "outline" {
  if (severity === "critical" || severity === "high") {
    return "destructive";
  }

  if (severity === "medium") {
    return "warning";
  }

  if (severity === "low") {
    return "success";
  }

  return "outline";
}
