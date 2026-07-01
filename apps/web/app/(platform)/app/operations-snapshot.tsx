"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { useTrackingOverview } from "../../../hooks/use-tracking-overview";

type BadgeVariant = "info" | "success" | "warning" | "destructive" | "outline" | "secondary";

function StatusTile({
  label,
  value,
  badge,
  variant,
}: {
  label: string;
  value: string;
  badge: string;
  variant: BadgeVariant;
}) {
  return (
    <Card className="p-4 shadow-none">
      <span className="text-muted-foreground text-xs uppercase tracking-uppercase">{label}</span>
      <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
        <span className="truncate font-semibold">{value}</span>
        <Badge variant={variant}>{badge}</Badge>
      </div>
    </Card>
  );
}

export function OperationsSnapshot({ canReadTracking }: { canReadTracking: boolean }) {
  if (!canReadTracking) {
    return (
      <Card id="operations">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Indisponivel</Badge>
            <Badge variant="outline">Tracking</Badge>
          </div>
          <CardTitle>Resumo operacional indisponivel</CardTitle>
          <CardDescription>
            O utilizador autenticado nao tem acesso ao modulo de tracking. Contacte o gestor de
            operacoes para solicitacao de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Os dados operacionais so sao apresentados a utilizadores autorizados.
        </CardContent>
      </Card>
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
        <CardContent className="text-muted-foreground text-sm">
          Aguarde enquanto os dados operacionais sao carregados.
        </CardContent>
      </Card>
    );
  }

  if (overviewQuery.isError) {
    return (
      <Card id="operations">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Erro</Badge>
            <Badge variant="outline">Tracking</Badge>
          </div>
          <CardTitle>Resumo operacional indisponivel</CardTitle>
          <CardDescription>
            {overviewQuery.error instanceof Error
              ? overviewQuery.error.message
              : "Erro ao carregar dados de tracking."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <StatusTile
            label="Leitura"
            value="Nao autorizada"
            badge="Indisponivel"
            variant="warning"
          />
          <StatusTile label="API" value="Erro" badge="Verificar" variant="warning" />
          <StatusTile label="Fallback" value="Sem dados falsos" badge="Seguro" variant="info" />
        </CardContent>
      </Card>
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
          <Badge variant="success">Dados reais</Badge>
          <Badge variant="outline">Tracking</Badge>
        </div>
        <CardTitle>Resumo operacional</CardTitle>
        <CardDescription>
          Dados de tracking operacional actualizados em tempo real. Servem como entrada para
          decisoes de gestao de cargas e excepcoes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <StatusTile
          label="Cargas"
          value={overview.totals.shipments.toString()}
          badge="Total"
          variant="info"
        />
        <StatusTile
          label="Ativas"
          value={overview.totals.activeShipments.toString()}
          badge="Operacao"
          variant="success"
        />
        <StatusTile
          label="Atrasos"
          value={overview.totals.delayedShipments.toString()}
          badge="SLA"
          variant={overview.totals.delayedShipments > 0 ? "warning" : "success"}
        />
        <StatusTile
          label="Excecoes"
          value={overview.totals.exceptionShipments.toString()}
          badge="Risco"
          variant={overview.totals.exceptionShipments > 0 ? "destructive" : "success"}
        />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Actualizado em {overview.generatedAt}</span>
        <Button asChild size="sm" variant="outline">
          <Link href={"/app/tracking" as Route}>Ver movimentos</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
