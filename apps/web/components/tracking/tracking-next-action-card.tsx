"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

type ShipmentStatus =
  | "planned"
  | "in_transit"
  | "delayed"
  | "exception"
  | "arrived"
  | "completed"
  | "cancelled";

export type TrackingNextActionCardProps = {
  shipmentId: string;
  shipmentStatus: ShipmentStatus;
  referenceCode: string;
  canManageExceptions: boolean;
  canResolveExceptions: boolean;
  hasOpenExceptions: boolean;
};

type NextAction = {
  label: string;
  href: Route | null;
  variant: "info" | "success" | "warning" | "destructive" | "outline";
  description: string;
};

const actionByStatus = {
  planned: {
    label: "Iniciar transporte",
    variant: "info" as const,
    description:
      "Registre a partida para iniciar o transporte. Apos isso, eventos serao recebidos em tempo real.",
  },
  in_transit: {
    label: "Monitorizar trajeto",
    variant: "success" as const,
    description:
      "Carga em transito. Acompanhe eventos de localizacao e esteja atento a possiveis excecoes.",
  },
  delayed: {
    label: "Resolver atraso",
    variant: "warning" as const,
    description:
      "O transporte esta atrasado. Abra ou resolva uma excecao para regularizar o status.",
  },
  exception: {
    label: "Resolver excecao",
    variant: "destructive" as const,
    description: "Excecao operacional ativa. Resolva o problema para retomar o fluxo normal.",
  },
  arrived: {
    label: "Concluir entrega",
    variant: "success" as const,
    description: "A carga chegou ao destino. Confirme a conclusao para encerrar o tracking.",
  },
  completed: {
    label: "Concluido",
    href: null,
    variant: "outline" as const,
    description: "O transporte foi concluido. Nenhuma acao adicional necessaria no tracking.",
  },
  cancelled: {
    label: "Cancelado",
    href: null,
    variant: "outline" as const,
    description: "O transporte foi cancelado. Verifique o status da carga no modulo Cargo.",
  },
} as const;

function computeNextAction(props: TrackingNextActionCardProps): NextAction {
  const { shipmentStatus, canManageExceptions, canResolveExceptions, shipmentId } = props;

  switch (shipmentStatus) {
    case "planned":
      return {
        ...actionByStatus.planned,
        href: "#" as Route,
      };

    case "in_transit":
      return {
        ...actionByStatus.in_transit,
        href: `/app/tracking/${shipmentId}` as Route,
      };

    case "delayed":
      if (canResolveExceptions) {
        return {
          ...actionByStatus.delayed,
          href: "#tracking-exception-resolve" as Route,
        };
      }
      if (canManageExceptions) {
        return {
          ...actionByStatus.delayed,
          href: "#tracking-exception-manage" as Route,
        };
      }
      return {
        ...actionByStatus.delayed,
        href: null,
      };

    case "exception":
      if (canResolveExceptions) {
        return {
          ...actionByStatus.exception,
          href: "#tracking-exception-resolve" as Route,
        };
      }
      return {
        ...actionByStatus.exception,
        href: null,
        description:
          "Excecao ativa. Solicite a permissao tracking.exception.resolve para resolver.",
      };

    case "arrived":
      return {
        ...actionByStatus.arrived,
        href: `/app/tracking/${shipmentId}?action=complete` as Route,
      };

    case "completed":
      return actionByStatus.completed;

    case "cancelled":
      return actionByStatus.cancelled;
  }
}

export function TrackingNextActionCard(props: TrackingNextActionCardProps) {
  const nextAction = useMemo(() => computeNextAction(props), [props]);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={nextAction.variant}>Proxima acao</Badge>
          <Badge variant="outline">tracking.shipment.detail</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg">{nextAction.label}</CardTitle>
          <CardDescription className="text-sm leading-6">{nextAction.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {nextAction.href !== null ? (
          <Button asChild className="w-full">
            <Link href={nextAction.href}>{nextAction.label}</Link>
          </Button>
        ) : (
          <Button className="w-full" disabled>
            {props.canManageExceptions || props.canResolveExceptions
              ? "Sem permissoes suficientes"
              : nextAction.label}
          </Button>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
            href={`/app/tracking/${props.shipmentId}` as Route}
          >
            Recarregar detalhe
          </Link>
          <Link
            className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
            href={
              `/app/audit?subjectType=tracking.shipment&subjectId=${props.shipmentId}&limit=25` as Route
            }
          >
            Auditoria
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
