"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export const cargoStatusLabels = {
  registered: "Registada",
  ready_for_transport: "Pronta",
  in_transport: "Em transporte",
  held: "Bloqueada",
  delivered: "Entregue",
  cancelled: "Cancelada",
} as const;

export const cargoTypeLabels = {
  container: "Contentor",
  bulk: "Granel",
  break_bulk: "Carga solta",
  liquid_bulk: "Granel liquido",
  refrigerated: "Refrigerada",
  hazardous: "Perigosa",
  vehicle: "Veiculo",
  other: "Outra",
} as const;

export const customsStatusLabels = {
  not_required: "Não requerido",
  pending: "Pendente",
  cleared: "Liberada",
  held: "Retida",
} as const;

export function resolveCargoStatusVariant(
  status: keyof typeof cargoStatusLabels,
): "info" | "success" | "warning" | "destructive" | "outline" {
  if (status === "held") return "warning";
  if (status === "delivered") return "success";
  if (status === "cancelled") return "destructive";
  if (status === "registered" || status === "ready_for_transport" || status === "in_transport")
    return "info";
  return "outline";
}

export type NextAction = {
  label: string;
  href: Route | null;
  blocked: boolean;
  blockedReason: string | null;
};

export function computeNextCargoAction(cargo: {
  status: string;
  customsStatus: string;
  conditionStatus: string;
  hazardous: boolean;
  requiresInspection: boolean;
  id: string;
}): NextAction {
  if (cargo.status === "cancelled") {
    return { label: "Cancelada", href: null, blocked: true, blockedReason: "Carga foi cancelada." };
  }
  if (cargo.status === "delivered") {
    return { label: "Entregue", href: null, blocked: false, blockedReason: null };
  }
  if (cargo.status === "held") {
    return {
      label: "Resolver excecao",
      href: "/app/cargo#cargo-delivery-exception" as Route,
      blocked: false,
      blockedReason: null,
    };
  }
  if (cargo.status === "in_transport") {
    return {
      label: "Confirmar chegada",
      href: "/app/cargo#cargo-transport-arrive" as Route,
      blocked: false,
      blockedReason: null,
    };
  }
  if (cargo.status === "ready_for_transport") {
    return {
      label: "Criar tracking",
      href: "/app/cargo#cargo-transport-plan" as Route,
      blocked: false,
      blockedReason: null,
    };
  }
  if (cargo.status === "registered") {
    const blocked = cargo.customsStatus === "held" || cargo.requiresInspection;
    const reasons: string[] = [];
    if (cargo.customsStatus === "held") reasons.push("Status aduaneiro retido");
    if (cargo.requiresInspection) reasons.push("Requer inspecao");
    return {
      label: blocked ? "Bloqueada" : "Liberar carga",
      href: blocked ? null : ("/app/cargo#cargo-release" as Route),
      blocked,
      blockedReason: blocked ? reasons.join("; ") : null,
    };
  }
  return { label: "---", href: null, blocked: false, blockedReason: null };
}

export function NextActionCell({ action }: { action: NextAction }) {
  if (action.blocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-2xs text-warning">
              <span>Bloqueado</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{action.blockedReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (action.href === null) {
    return <span className="text-muted-foreground text-xs">{action.label}</span>;
  }

  return (
    <Link
      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-2xs text-primary underline-offset-4 outline-none hover:bg-primary/20 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      href={action.href}
    >
      {action.label}
    </Link>
  );
}
