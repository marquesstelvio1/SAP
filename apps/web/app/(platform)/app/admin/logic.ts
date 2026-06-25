export const membershipStatusLabels = {
  active: "Ativo",
  invited: "Convidado",
  removed: "Removido",
  suspended: "Suspenso",
} as const;

export const organizationStatusLabels = {
  active: "Ativa",
  archived: "Arquivada",
  suspended: "Suspensa",
} as const;

export function resolveMembershipStatusVariant(
  status: keyof typeof membershipStatusLabels,
): "outline" | "success" | "warning" | "destructive" {
  if (status === "active") return "success";
  if (status === "suspended" || status === "removed") return "destructive";
  return "warning";
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
