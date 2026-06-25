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

const readTrackingPermission = "tracking.shipment.read" as const;

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
      <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</span>
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
            <Badge variant="warning">RBAC</Badge>
            <Badge variant="outline">Operational Tracking</Badge>
          </div>
          <CardTitle>Resumo operacional bloqueado</CardTitle>
          <CardDescription>
            A sessao existe, mas o dashboard nao consulta dados de tracking sem
            tracking.shipment.read.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Isto confirma que a UI aplica permissionamento antes de buscar dados de negocio.
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
            <Badge variant="outline">Operational Tracking</Badge>
          </div>
          <CardTitle>Resumo operacional</CardTitle>
          <CardDescription>Carregando dados de tracking...</CardDescription>
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
            <Badge variant="outline">Operational Tracking</Badge>
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
            value={readTrackingPermission}
            badge="Grant"
            variant="success"
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
          <Badge variant="outline">Operational Tracking</Badge>
        </div>
        <CardTitle>Resumo operacional autenticado</CardTitle>
        <CardDescription>
          Snapshot tenant-scoped vindo do RPC de tracking. Serve como entrada segura para a proxima
          fatia de negocio.
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
        <span className="text-muted-foreground">
          Tenant {overview.organizationId} gerado em {overview.generatedAt}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={"/app/tracking" as Route}>Ver movimentos</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
