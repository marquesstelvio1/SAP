import type { PlatformPermission } from "@saptm/auth";
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
  ContextRow,
  MetricTile,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import type { PlatformSession } from "../../../lib/auth-session";
import { requirePlatformSession } from "../../../lib/auth-session";
import { platformPermissionCatalog } from "../../../lib/platform-navigation";
import { OperationsSnapshot } from "./operations-snapshot";

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

export default async function PlatformAppPage() {
  const platformSession = await requirePlatformSession("/app");
  const viewerPermissions = platformSession.viewer.permissions;
  const canReadTracking = viewerPermissions.includes(readTrackingPermission);
  const writeGateGrantCount = controlledWritePermissions.filter((permission) =>
    viewerPermissions.includes(permission),
  ).length;
  const readinessItems = createReadinessItems(
    platformSession,
    canReadTracking,
    writeGateGrantCount,
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">P1 local em fecho</Badge>
              <Badge variant="info">Tracking integrado</Badge>
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
            <MetricTile label="Sessao" value="Better Auth" badge="Ativa" variant="success" />
            <MetricTile
              label="Permissoes"
              value={`${viewerPermissions.length} grants`}
              badge={viewerPermissions.length > 0 ? "RBAC" : "Sem grants"}
              variant={viewerPermissions.length > 0 ? "success" : "warning"}
            />
            <MetricTile
              label="Tracking API"
              value={canReadTracking ? "Autorizado" : "Bloqueado"}
              badge={canReadTracking ? "Dados reais" : "RBAC"}
              variant={canReadTracking ? "success" : "warning"}
            />
            <MetricTile
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
              {canReadTracking
                ? "Primeira feature ligada ao backend real. Proxima fatia permitida: evidencia e aprovacao de operador."
                : "Tracking nao e consultado sem permissao explicita de leitura."}
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

      <OperationsSnapshot canReadTracking={canReadTracking} />

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
                        <AccessState granted={granted} />
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
          <MetricTile
            label="Session ID"
            value={platformSession.sessionId}
            badge="Contexto"
            variant="info"
          />
          <MetricTile
            label="Organization"
            value={platformSession.viewer.organizationId ?? "Nao resolvida"}
            badge={platformSession.viewer.organizationId ? "Tenant" : "Pendente"}
            variant={platformSession.viewer.organizationId ? "success" : "warning"}
          />
          <MetricTile
            label="Email"
            value={platformSession.viewer.emailVerified ? "Verificado" : "Nao verificado"}
            badge="Identidade"
            variant={platformSession.viewer.emailVerified ? "success" : "warning"}
          />
          <MetricTile
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

function createReadinessItems(
  platformSession: PlatformSession,
  canReadTracking: boolean,
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
      evidence: canReadTracking
        ? "Tracking autorizado; dados carregados via hook no cliente"
        : "Sem tracking.shipment.read; dados de negocio nao sao consultados",
      status: canReadTracking ? "Fechado" : "Bloqueado",
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

function resolveReadinessVariant(
  status: DashboardReadinessStatus,
): "info" | "success" | "warning" | "destructive" | "outline" | "secondary" {
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
