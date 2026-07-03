"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { type CargoJourneyState, computeStages, type StageInfo } from "../../lib/journey-stages";

export type { CargoJourneyState } from "../../lib/journey-stages";

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
            Estado atual e proximas ações validas por modulo.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {currentStage !== undefined ? (
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
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
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary text-sm font-medium underline-offset-4 outline-none hover:bg-primary/20 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href={currentStage.actionHref}
              >
                {currentStage.actionLabel}
              </Link>
            ) : (
              <span className="mt-2 block text-muted-foreground text-xs">
                Nenhuma acao disponível neste estado.
              </span>
            )}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
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
            <span className="text-xs uppercase tracking-uppercase text-muted-foreground">
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

function StageStep({ stage, index }: { stage: StageInfo; index: number }) {
  const variantMap = {
    complete: "success",
    current: "info",
    blocked: "warning",
    pending: "outline",
  } as const;

  return (
    <div className="relative flex items-center gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variantMap[stage.status]} className="cursor-default text-2xs">
              <span>{index + 1}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{stage.stage}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
      className="inline-flex items-center rounded-md border bg-muted/20 px-2 py-1 text-2xs text-muted-foreground underline-offset-4 outline-none hover:bg-muted/40 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
