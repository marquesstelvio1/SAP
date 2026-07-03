"use client";

import {
  AccessState,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  MetricTile,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { formatDateTime } from "@/lib/format";
import { useTrackingOverview } from "../../../hooks/use-tracking-overview";
import { RpcError } from "../../../lib/rpc-client";

export function OperationsSnapshot({ canReadTracking }: { canReadTracking: boolean }) {
  if (!canReadTracking) {
    return (
      <AccessState
        badgeLabel="Tracking"
        description="O utilizador autenticado não tem acesso ao módulo de tracking. Contacte o gestor de operações para solicitação de acesso."
        title="Resumo operacional indisponível"
        variant="blocked"
      />
    );
  }

  const overviewQuery = useTrackingOverview();

  if (overviewQuery.isLoading) {
    return (
      <Card id="operations">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Tracking</Badge>
          </div>
          <CardTitle>Resumo operacional</CardTitle>
          <CardDescription>A carregar dados de tracking...</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex animate-pulse flex-col gap-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-6 w-24 rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (overviewQuery.isError) {
    const error = overviewQuery.error;

    if (error instanceof RpcError && error.status === "unauthorized") {
      return (
        <AccessState
          badgeLabel="Sessão expirada"
          description="A sua sessão expirou ou é inválida. Re-autentique para continuar."
          role="alert"
          title="Sessão expirada"
          variant="error"
        >
          <Button asChild size="sm" variant="outline">
            <Link href={"/sign-in?reason=session_expired" as Route}>Re-autenticar</Link>
          </Button>
        </AccessState>
      );
    }

    if (error instanceof RpcError && error.status === "forbidden") {
      return (
        <AccessState
          badgeLabel="Tracking"
          description="Sessão sem permissão para ler tracking operacional."
          title="Resumo operacional bloqueado"
          variant="blocked"
        />
      );
    }

    return (
      <AccessState
        badgeLabel="Tracking"
        description="Não foi possível carregar os dados operacionais. Tente novamente."
        role="alert"
        title="Resumo operacional indisponível"
        variant="error"
      />
    );
  }

  const overview = overviewQuery.data;

  if (!overview) {
    return null;
  }

  return (
    <Card id="operations">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Tracking</Badge>
        </div>
        <CardTitle>Resumo operacional</CardTitle>
        <CardDescription>
          Cargas em curso, atrasos e exceções reportadas em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <MetricTile
          badge="Total"
          label="Cargas"
          value={overview.totals.shipments.toString()}
          variant="default"
        />
        <MetricTile
          badge="Operação"
          label="Ativas"
          value={overview.totals.activeShipments.toString()}
          variant="success"
        />
        <MetricTile
          badge="SLA"
          label="Atrasos"
          value={overview.totals.delayedShipments.toString()}
          variant={overview.totals.delayedShipments > 0 ? "warning" : "success"}
        />
        <MetricTile
          badge="Risco"
          label="Exceções"
          value={overview.totals.exceptionShipments.toString()}
          variant={overview.totals.exceptionShipments > 0 ? "destructive" : "success"}
        />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Actualizado em {formatDateTime(overview.generatedAt)}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={"/app/tracking" as Route}>Ver movimentos</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
