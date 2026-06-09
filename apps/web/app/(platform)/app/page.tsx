import type { PlatformPermission } from "@saptm/auth";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { type PlatformSession, requirePlatformSession } from "../../../lib/auth-session";
import { platformPermissionCatalog } from "../../../lib/platform-navigation";
import { getTrackingOverview, type TrackingOverviewResult } from "../../../lib/tracking-overview";

export const dynamic = "force-dynamic";

const readTrackingPermission: PlatformPermission = "tracking.shipment.read";

const controlledWritePermissions = [
  "tracking.event.record",
  "tracking.exception.manage",
  "tracking.exception.resolve",
] as const satisfies readonly PlatformPermission[];

type DashboardReadinessStatus = "Fechado" | "Em execucao" | "Bloqueado" | "Atencao";

type DashboardReadinessItem = {
  label: string;
  evidence: string;
  status: DashboardReadinessStatus;
};

type BadgeVariant = "info" | "success" | "warning" | "destructive" | "outline" | "secondary";

export default async function PlatformAppPage() {
  const platformSession = await requirePlatformSession("/app");
  const viewerPermissions = platformSession.viewer.permissions;
  const canReadTracking = viewerPermissions.includes(readTrackingPermission);
  const trackingOverviewResult = canReadTracking ? await getTrackingOverview() : undefined;
  const operationsState = resolveOperationsState(canReadTracking, trackingOverviewResult);
  const writeGateGrantCount = controlledWritePermissions.filter((permission) =>
    viewerPermissions.includes(permission),
  ).length;
  const readinessItems = createReadinessItems(
    platformSession,
    canReadTracking,
    trackingOverviewResult,
    writeGateGrantCount,
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">P1 local em fecho</Badge>
              <Badge variant={operationsState.variant}>{operationsState.badge}</Badge>
              <Badge variant={platformSession.viewer.organizationId ? "success" : "warning"}>
                {platformSession.viewer.organizationId ? "Tenant resolvido" : "Tenant pendente"}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Foundation Control Center</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Estado real da sessao, RBAC, tenant e primeira feature operacional. O dashboard
                agora usa dados do backend quando a permissao de tracking existe.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <StatusTile label="Sessao" value="Better Auth" badge="Ativa" variant="success" />
            <StatusTile
              label="Permissoes"
              value={`${viewerPermissions.length} grants`}
              badge={viewerPermissions.length > 0 ? "RBAC" : "Sem grants"}
              variant={viewerPermissions.length > 0 ? "success" : "warning"}
            />
            <StatusTile
              label="Tracking API"
              value={operationsState.value}
              badge={operationsState.badge}
              variant={operationsState.variant}
            />
            <StatusTile
              label="Escrita critica"
              value={`${writeGateGrantCount}/${controlledWritePermissions.length} gates`}
              badge={
                writeGateGrantCount === controlledWritePermissions.length ? "Fechada" : "Parcial"
              }
              variant={
                writeGateGrantCount === controlledWritePermissions.length ? "success" : "warning"
              }
            />
          </CardContent>
        </Card>

        <Card id="business-lock">
          <CardHeader>
            <CardTitle>Feature Gate</CardTitle>
            <CardDescription>
              A primeira feature so avanca quando leitura, escrita, auditoria e idempotencia estao
              comprovadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="rounded-lg border border-info/30 bg-info/10 p-3 text-info-foreground">
              {operationsState.message}
            </p>
            <ContextRow label="Proxima fatia" value="Evidencia + aprovacao de operador" />
            <ContextRow label="Bloqueio permanente" value="Sem CRUD generico" />
          </CardContent>
          <CardFooter>
            {canReadTracking ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={"/app/tracking" as Route}>Abrir tracking operacional</Link>
              </Button>
            ) : (
              <Button disabled size="sm" type="button" variant="secondary">
                Tracking bloqueado por RBAC
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>

      <OperationsSnapshot canReadTracking={canReadTracking} result={trackingOverviewResult} />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card id="design-system">
          <CardHeader>
            <CardTitle>Readiness local</CardTitle>
            <CardDescription>
              Checklist dinamico para shell, tenant, RBAC e tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Evidencia</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readinessItems.map((item) => (
                  <TableRow key={item.label}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-muted-foreground">{item.evidence}</TableCell>
                    <TableCell>
                      <Badge variant={resolveReadinessVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card id="permissions">
          <CardHeader>
            <CardTitle>Matriz de permissoes</CardTitle>
            <CardDescription>
              Permissoes resolvidas da sessao atual e refletidas no frontend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permissao</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead>Grant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformPermissionCatalog.map((permission) => {
                  const granted = viewerPermissions.includes(permission.key);

                  return (
                    <TableRow key={permission.key}>
                      <TableCell className="font-medium">{permission.key}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {permission.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={granted ? "success" : "outline"}>
                          {granted ? "Permitido" : "Nao atribuido"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card id="audit">
        <CardHeader>
          <CardTitle>Auditabilidade</CardTitle>
          <CardDescription>
            O shell usa sessao, organizacao, email verificado e permissoes como contexto minimo para
            operacoes criticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <StatusTile
            label="Session ID"
            value={platformSession.sessionId}
            badge="Contexto"
            variant="info"
          />
          <StatusTile
            label="Organization"
            value={platformSession.viewer.organizationId ?? "Nao resolvida"}
            badge={platformSession.viewer.organizationId ? "Tenant" : "Pendente"}
            variant={platformSession.viewer.organizationId ? "success" : "warning"}
          />
          <StatusTile
            label="Email"
            value={platformSession.viewer.emailVerified ? "Verificado" : "Nao verificado"}
            badge="Identidade"
            variant={platformSession.viewer.emailVerified ? "success" : "warning"}
          />
          <StatusTile
            label="Expira em"
            value={platformSession.expiresAt ?? "Nao informado"}
            badge="Sessao"
            variant={platformSession.expiresAt ? "info" : "warning"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OperationsSnapshot({
  canReadTracking,
  result,
}: {
  canReadTracking: boolean;
  result: TrackingOverviewResult | undefined;
}) {
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

  if (result === undefined || result.status !== "ok") {
    const status = result?.status ?? "not_loaded";

    return (
      <Card id="operations">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">{status}</Badge>
            <Badge variant="outline">Operational Tracking</Badge>
          </div>
          <CardTitle>Resumo operacional indisponivel</CardTitle>
          <CardDescription>
            {result?.message ?? "O overview de tracking nao foi carregado nesta requisicao."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <StatusTile
            label="Leitura"
            value={readTrackingPermission}
            badge="Grant"
            variant="success"
          />
          <StatusTile label="API" value={status} badge="Verificar" variant="warning" />
          <StatusTile label="Fallback" value="Sem dados falsos" badge="Seguro" variant="info" />
        </CardContent>
      </Card>
    );
  }

  const { overview } = result;

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
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4">
      <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</span>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="truncate font-semibold">{value}</span>
        <Badge variant={variant}>{badge}</Badge>
      </div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function createReadinessItems(
  platformSession: PlatformSession,
  canReadTracking: boolean,
  trackingOverviewResult: TrackingOverviewResult | undefined,
  writeGateGrantCount: number,
): DashboardReadinessItem[] {
  return [
    {
      label: "App Shell autenticado",
      evidence: "Layout protegido em /(platform) e redirect preserva next path",
      status: "Fechado",
    },
    {
      label: "Tenant resolvido",
      evidence: platformSession.viewer.organizationId ?? "Sem organizacao na sessao",
      status: platformSession.viewer.organizationId ? "Fechado" : "Atencao",
    },
    {
      label: "RBAC ativo",
      evidence: `${platformSession.viewer.permissions.length} permissoes resolvidas`,
      status: platformSession.viewer.permissions.length > 0 ? "Fechado" : "Bloqueado",
    },
    {
      label: "Dashboard operacional",
      evidence: resolveTrackingEvidence(canReadTracking, trackingOverviewResult),
      status: resolveTrackingReadinessStatus(canReadTracking, trackingOverviewResult),
    },
    {
      label: "Escrita governada",
      evidence: `${writeGateGrantCount}/${controlledWritePermissions.length} permissoes criticas concedidas`,
      status: writeGateGrantCount === controlledWritePermissions.length ? "Fechado" : "Em execucao",
    },
    {
      label: "Proxima feature",
      evidence: "Operador, evidencia, aprovacao e audit trail antes de analytics/IA",
      status: "Em execucao",
    },
  ];
}

function resolveOperationsState(
  canReadTracking: boolean,
  trackingOverviewResult: TrackingOverviewResult | undefined,
): {
  badge: string;
  message: string;
  value: string;
  variant: BadgeVariant;
} {
  if (!canReadTracking) {
    return {
      badge: "RBAC bloqueado",
      message: "Tracking nao e consultado sem permissao explicita de leitura.",
      value: "Bloqueado",
      variant: "warning",
    };
  }

  if (trackingOverviewResult?.status === "ok") {
    return {
      badge: "Dados reais",
      message:
        "Primeira feature ligada ao backend real. Proxima fatia permitida: evidencia e aprovacao de operador.",
      value: `${trackingOverviewResult.overview.totals.shipments} cargas`,
      variant: "success",
    };
  }

  return {
    badge: "API pendente",
    message:
      trackingOverviewResult?.message ??
      "Tracking autorizado, mas o overview operacional ainda nao foi carregado.",
    value: trackingOverviewResult?.status ?? "Indisponivel",
    variant: "warning",
  };
}

function resolveTrackingEvidence(
  canReadTracking: boolean,
  trackingOverviewResult: TrackingOverviewResult | undefined,
): string {
  if (!canReadTracking) {
    return "Sem tracking.shipment.read; dados de negocio nao sao consultados";
  }

  if (trackingOverviewResult?.status === "ok") {
    return `${trackingOverviewResult.overview.totals.shipments} cargas carregadas via RPC`;
  }

  return trackingOverviewResult?.message ?? "Overview de tracking nao carregado";
}

function resolveTrackingReadinessStatus(
  canReadTracking: boolean,
  trackingOverviewResult: TrackingOverviewResult | undefined,
): DashboardReadinessStatus {
  if (!canReadTracking) {
    return "Bloqueado";
  }

  if (trackingOverviewResult?.status === "ok") {
    return "Fechado";
  }

  return "Atencao";
}

function resolveReadinessVariant(status: DashboardReadinessStatus): BadgeVariant {
  if (status === "Fechado") {
    return "success";
  }

  if (status === "Bloqueado") {
    return "warning";
  }

  if (status === "Atencao") {
    return "warning";
  }

  return "info";
}
