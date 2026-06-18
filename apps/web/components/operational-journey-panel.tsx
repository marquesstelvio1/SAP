"use client";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export type CargoJourneyState = {
  cargoId: string;
  cargoReference: string;
  status:
    | "registered"
    | "ready_for_transport"
    | "in_transport"
    | "held"
    | "delivered"
    | "cancelled";
  customsStatus: "not_required" | "pending" | "cleared" | "held";
  conditionStatus: "sound" | "damaged" | "requires_inspection";
  hazardous: boolean;
  requiresInspection: boolean;
  hasTrackingShipment: boolean;
  hasActiveReservation: boolean;
};

type StageInfo = {
  module: "Cargo" | "Tracking" | "Planning" | "Capacity";
  stage: string;
  status: "complete" | "current" | "blocked" | "pending";
  actionLabel: string | null;
  actionHref: Route | null;
  blockedReason: string | null;
};

const _STATUS_STAGE_MAP: Record<
  string,
  {
    stage: string;
    module: "Cargo" | "Tracking" | "Planning" | "Capacity";
    completedStatuses: string[];
    currentStatuses: string[];
  }
> = {
  registration: {
    stage: "Registo",
    module: "Cargo",
    completedStatuses: ["registered", "ready_for_transport", "in_transport", "held", "delivered"],
    currentStatuses: [],
  },
  compliance: {
    stage: "Compliance",
    module: "Cargo",
    completedStatuses: [],
    currentStatuses: [],
  },
  release: {
    stage: "Liberacao",
    module: "Cargo",
    completedStatuses: ["ready_for_transport", "in_transport", "delivered"],
    currentStatuses: [],
  },
  planning: {
    stage: "Planeamento",
    module: "Tracking",
    completedStatuses: ["in_transport", "delivered"],
    currentStatuses: [],
  },
  departure: {
    stage: "Partida",
    module: "Tracking",
    completedStatuses: ["in_transport", "delivered"],
    currentStatuses: [],
  },
  arrival: {
    stage: "Chegada",
    module: "Tracking",
    completedStatuses: ["delivered"],
    currentStatuses: [],
  },
  delivery: {
    stage: "Entrega",
    module: "Cargo",
    completedStatuses: ["delivered"],
    currentStatuses: [],
  },
};

export function OperationalJourneyPanel({
  cargo,
  hasReservation,
}: {
  cargo: CargoJourneyState;
  hasReservation: boolean;
}) {
  const stages = computeStages(cargo, hasReservation);
  const currentStage = stages.find((s) => s.status === "current" || s.status === "blocked");
  const blockedStages = stages.filter((s) => s.status === "blocked");

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Jornada operacional</Badge>
          <Badge variant={cargo.status === "delivered" ? "success" : "info"}>
            {getStatusLabel(cargo.status)}
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg">{cargo.cargoReference}</CardTitle>
          <CardDescription className="leading-6">
            Estado atual e proximas acoes validas por modulo.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {currentStage !== undefined ? (
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Proxima acao
              </span>
              <ModuleBadge module={currentStage.module} />
            </div>
            {currentStage.status === "blocked" ? (
              <div className="mt-2 flex flex-col gap-2">
                <span className="flex items-center gap-2 font-medium text-sm">
                  <span className="flex size-5 items-center justify-center rounded-full bg-warning/20 text-warning text-xs">
                    !
                  </span>
                  Bloqueado: {currentStage.stage}
                </span>
                {currentStage.blockedReason !== null ? (
                  <span className="text-muted-foreground text-xs">
                    {currentStage.blockedReason}
                  </span>
                ) : null}
              </div>
            ) : currentStage.actionLabel !== null && currentStage.actionHref !== null ? (
              <Link
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary text-sm font-medium underline-offset-4 hover:bg-primary/20 hover:underline"
                href={currentStage.actionHref}
              >
                {currentStage.actionLabel}
              </Link>
            ) : (
              <span className="mt-2 block text-muted-foreground text-xs">
                Nenhuma acao disponivel neste estado.
              </span>
            )}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Progresso
          </span>
          <div className="flex flex-wrap gap-2">
            {stages.map((stage, index) => (
              <StageStep key={index} stage={stage} index={index} />
            ))}
          </div>
        </div>

        {blockedStages.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Bloqueios ativos
            </span>
            {blockedStages.map((stage, index) => (
              <div
                className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2 text-xs"
                key={index}
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-warning/30 text-warning">
                  !
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {stage.module}/{stage.stage}
                  </span>
                  {stage.blockedReason !== null ? (
                    <span className="text-muted-foreground">{stage.blockedReason}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1">
          <ModuleLink module="Cargo" />
          <ModuleLink module="Tracking" />
          <ModuleLink module="Capacity" />
          <ModuleLink module="Planning" />
        </div>
      </CardContent>
    </Card>
  );
}

function computeStages(cargo: CargoJourneyState, hasReservation: boolean): StageInfo[] {
  const stages: StageInfo[] = [];

  // Registration stage
  if (cargo.status === "cancelled") {
    stages.push({
      module: "Cargo",
      stage: "Registo",
      status: "blocked",
      actionLabel: "Carga cancelada",
      actionHref: null,
      blockedReason: "Carga foi cancelada. Nao e possivel avancar.",
    });
    return stages;
  }

  // Registration
  stages.push({
    module: "Cargo",
    stage: "Registo",
    status: "complete",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  // Compliance
  const needsCompliance =
    cargo.hazardous ||
    cargo.requiresInspection ||
    cargo.customsStatus === "pending" ||
    cargo.customsStatus === "held";
  const complianceComplete =
    cargo.customsStatus === "cleared" || cargo.customsStatus === "not_required";
  stages.push({
    module: "Cargo",
    stage: "Compliance",
    status:
      cargo.status === "delivered"
        ? "complete"
        : !complianceComplete && needsCompliance
          ? "blocked"
          : cargo.status === "ready_for_transport" || cargo.status === "in_transport"
            ? "complete"
            : "current",
    actionLabel: complianceComplete ? null : "Resolver compliance",
    actionHref: complianceComplete ? null : ("/app/cargo#cargo-compliance-evidence" as Route),
    blockedReason:
      !complianceComplete && needsCompliance
        ? "Documentacao de compliance pendente ou retida."
        : null,
  });

  // Release
  const releaseBlocked =
    cargo.customsStatus === "held" ||
    cargo.requiresInspection ||
    (cargo.hazardous && cargo.conditionStatus !== "sound");
  stages.push({
    module: "Cargo",
    stage: "Liberacao",
    status:
      cargo.status === "delivered" || cargo.status === "in_transport"
        ? "complete"
        : cargo.status === "ready_for_transport"
          ? "complete"
          : releaseBlocked
            ? "blocked"
            : "current",
    actionLabel:
      cargo.status === "ready_for_transport" ||
      cargo.status === "in_transport" ||
      cargo.status === "delivered"
        ? null
        : "Liberar carga",
    actionHref:
      cargo.status === "ready_for_transport" ||
      cargo.status === "in_transport" ||
      cargo.status === "delivered"
        ? null
        : ("/app/cargo#cargo-release" as Route),
    blockedReason: releaseBlocked
      ? "Carga bloqueada: compliance pendente, inspecao requerida ou status aduaneiro retido."
      : null,
  });

  // Planning (Tracking)
  stages.push({
    module: "Tracking",
    stage: "Planeamento",
    status:
      cargo.status === "in_transport" || cargo.status === "delivered"
        ? "complete"
        : cargo.hasTrackingShipment
          ? "complete"
          : cargo.status === "ready_for_transport"
            ? "current"
            : "pending",
    actionLabel:
      cargo.hasTrackingShipment || cargo.status === "in_transport" || cargo.status === "delivered"
        ? null
        : "Criar tracking",
    actionHref:
      cargo.hasTrackingShipment || cargo.status === "in_transport" || cargo.status === "delivered"
        ? null
        : ("/app/cargo#cargo-transport-plan" as Route),
    blockedReason: null,
  });

  // Capacity Reservation
  stages.push({
    module: "Capacity",
    stage: "Reserva",
    status: hasReservation
      ? "complete"
      : cargo.status === "ready_for_transport" || cargo.status === "in_transport"
        ? "current"
        : "pending",
    actionLabel: hasReservation ? null : "Reservar slot",
    actionHref: hasReservation ? null : ("/app/capacity" as Route),
    blockedReason: null,
  });

  // Departure
  stages.push({
    module: "Tracking",
    stage: "Partida",
    status:
      cargo.status === "in_transport" || cargo.status === "delivered" ? "complete" : "pending",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  // Arrival
  stages.push({
    module: "Tracking",
    stage: "Chegada",
    status:
      cargo.status === "delivered"
        ? "complete"
        : cargo.status === "in_transport"
          ? "current"
          : "pending",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  // Delivery
  stages.push({
    module: "Cargo",
    stage: "Entrega",
    status: cargo.status === "delivered" ? "complete" : "pending",
    actionLabel: null,
    actionHref: null,
    blockedReason: null,
  });

  return stages;
}

function StageStep({ stage, index }: { stage: StageInfo; index: number }) {
  const variantMap = {
    complete: "success",
    current: "info",
    blocked: "warning",
    pending: "outline",
  } as const;

  return (
    <div className="group relative flex items-center gap-1.5">
      <Badge variant={variantMap[stage.status]} className="cursor-default text-[0.65rem]">
        <span className="flex items-center gap-1">
          <span>{index + 1}</span>
          <span className="hidden group-hover:inline">{stage.stage}</span>
        </span>
      </Badge>
      {stage.status === "blocked" ? (
        <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-warning text-[0.5rem] text-warning-foreground">
          !
        </span>
      ) : null}
    </div>
  );
}

function ModuleBadge({ module }: { module: StageInfo["module"] }) {
  const variantMap = {
    Cargo: "info",
    Tracking: "secondary",
    Planning: "success",
    Capacity: "warning",
  } as const;

  return <Badge variant={variantMap[module]}>{module}</Badge>;
}

function ModuleLink({ module }: { module: string }) {
  const hrefMap: Record<string, Route> = {
    Cargo: `/app/cargo` as Route,
    Tracking: `/app/tracking` as Route,
    Capacity: `/app/capacity` as Route,
    Planning: `/app/planning` as Route,
  };

  const href = hrefMap[module];
  if (href === undefined) return null;

  return (
    <Link
      className="inline-flex items-center rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
      href={href}
    >
      {module}
    </Link>
  );
}

function getStatusLabel(status: CargoJourneyState["status"]): string {
  const labels: Record<string, string> = {
    registered: "Registada",
    ready_for_transport: "Pronta",
    in_transport: "Em transporte",
    held: "Bloqueada",
    delivered: "Entregue",
    cancelled: "Cancelada",
  };
  return labels[status] ?? status;
}
