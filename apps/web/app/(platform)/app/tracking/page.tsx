import type { PlatformPermission } from "@saptm/auth";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
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

import { TrackingEventRecordForm } from "../../../../components/tracking-event-record-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getTrackingAdvisory } from "../../../../lib/tracking-advisory";
import { getTrackingAnalytics } from "../../../../lib/tracking-analytics";
import { getTrackingOverview } from "../../../../lib/tracking-overview";
import { recordTrackingEventAction } from "./actions";
import { initialTrackingEventRecordFormState } from "./form-state";

export const dynamic = "force-dynamic";

const readTrackingPermission: PlatformPermission = "tracking.shipment.read";
const recordTrackingPermission: PlatformPermission = "tracking.event.record";

const statusLabels = {
  planned: "Planeado",
  in_transit: "Em transito",
  delayed: "Atrasado",
  exception: "Excecao",
  arrived: "Chegou",
  completed: "Concluido",
  cancelled: "Cancelado",
} as const;

const modeLabels = {
  rail: "Ferrovia",
  port: "Porto",
  road: "Rodovia",
  multimodal: "Multimodal",
} as const;

const eventTypeLabels = {
  created: "Criado",
  departed: "Partiu",
  arrived: "Chegou",
  delayed: "Atrasado",
  exception: "Excecao",
  location_updated: "Localizacao",
  handover_completed: "Handover",
  customs_hold: "Retencao aduaneira",
  released: "Liberado",
} as const;

const workflowStateLabels = {
  exception_opened: "Excecao aberta",
  pending_review: "Em revisao",
  approved_for_resolution: "Aprovado",
  closed: "Fechado",
} as const;

const advisoryTypeLabels = {
  sla_risk: "Risco SLA",
  exception_recovery: "Recuperacao",
  priority_review: "Prioridade",
  workflow_review: "Workflow",
} as const;

export default async function TrackingOverviewPage() {
  const platformSession = await requirePlatformSession("/app/tracking");
  const viewerPermissions = platformSession.viewer.permissions;
  const canRecordEvents = viewerPermissions.includes(recordTrackingPermission);

  if (!viewerPermissions.includes(readTrackingPermission)) {
    return (
      <TrackingAccessState
        title="Tracking operacional bloqueado"
        status="Sem grant"
        message="A sessao esta autenticada, mas falta a permissao tracking.shipment.read para abrir o modulo."
      />
    );
  }

  const [overviewResult, analyticsResult, advisoryResult] = await Promise.all([
    getTrackingOverview(),
    getTrackingAnalytics(),
    getTrackingAdvisory(),
  ]);

  if (overviewResult.status !== "ok") {
    return (
      <TrackingAccessState
        title="Tracking operacional indisponivel"
        status={overviewResult.status}
        message={overviewResult.message}
      />
    );
  }

  if (analyticsResult.status !== "ok") {
    return (
      <TrackingAccessState
        title="Analytics operacional indisponivel"
        status={analyticsResult.status}
        message={analyticsResult.message}
      />
    );
  }

  if (advisoryResult.status !== "ok") {
    return (
      <TrackingAccessState
        title="Advisory operacional indisponivel"
        status={advisoryResult.status}
        message={advisoryResult.message}
      />
    );
  }

  const { overview } = overviewResult;
  const { analytics } = analyticsResult;
  const { advisory } = advisoryResult;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Primeira feature</Badge>
              <Badge variant="outline">Operational Tracking</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Tracking operacional de cargas</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Visao governada de movimentos ferroviarios, portuarios e logisticos por tenant. Esta
                etapa entrega leitura operacional segura antes de qualquer CRUD.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <MetricTile label="Cargas" value={overview.totals.shipments.toString()} />
            <MetricTile label="Ativas" value={overview.totals.activeShipments.toString()} />
            <MetricTile label="Atrasos" value={overview.totals.delayedShipments.toString()} />
            <MetricTile label="Excecoes" value={overview.totals.exceptionShipments.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexto auditavel</CardTitle>
            <CardDescription>Escopo resolvido por Better Auth, RBAC e organizacao.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow label="Organization" value={overview.organizationId} />
            <ContextRow label="Session" value={platformSession.sessionId} />
            <ContextRow label="Gerado em" value={overview.generatedAt} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Analytics operacional</Badge>
              <Badge variant="outline">{analytics.window.lookbackDays} dias</Badge>
            </div>
            <CardTitle>Agregados de risco e SLA</CardTitle>
            <CardDescription>
              Leitura tenant-scoped para operacao, atraso, excecao, prioridade e risco de ETA.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <MetricTile
              label="Taxa atraso"
              value={`${analytics.kpis.delayRatePercent.toFixed(1)}%`}
            />
            <MetricTile
              label="Taxa excecao"
              value={`${analytics.kpis.exceptionRatePercent.toFixed(1)}%`}
            />
            <MetricTile label="Eventos" value={analytics.kpis.eventsInWindow.toString()} />
            <MetricTile
              label="Alta prioridade"
              value={analytics.kpis.highPriorityActiveShipments.toString()}
            />
            <MetricTile label="ETA vencido" value={analytics.slaRisk.overdueShipments.toString()} />
            <MetricTile label="ETA 24h" value={analytics.slaRisk.dueWithin24Hours.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuicao por modal</CardTitle>
            <CardDescription>
              Volume ativo, atrasado e em excecao por ferrovia, porto, rodovia e multimodal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ativas</TableHead>
                  <TableHead>Atrasos</TableHead>
                  <TableHead>Excecoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.modeDistribution.map((item) => (
                  <TableRow key={item.transportMode}>
                    <TableCell className="font-medium">{modeLabels[item.transportMode]}</TableCell>
                    <TableCell>{item.shipments}</TableCell>
                    <TableCell>{item.activeShipments}</TableCell>
                    <TableCell>
                      <Badge variant={item.delayedShipments > 0 ? "warning" : "outline"}>
                        {item.delayedShipments}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.exceptionShipments > 0 ? "destructive" : "outline"}>
                        {item.exceptionShipments}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">IA advisory</Badge>
              <Badge variant="outline">Sem automacao direta</Badge>
            </div>
            <CardTitle>Recomendacoes operacionais assistidas</CardTitle>
            <CardDescription>
              Recomenda risco, recuperacao e prioridade com regras locais. Qualquer mudanca exige
              fluxo humano aprovado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {advisory.recommendations.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 p-4 text-muted-foreground text-sm">
                Sem recomendacoes operacionais para a janela atual.
              </div>
            ) : (
              advisory.recommendations.map((recommendation) => (
                <div
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4"
                  key={recommendation.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={resolveAdvisorySeverityVariant(recommendation.severity)}>
                      {recommendation.severity}
                    </Badge>
                    <Badge variant="outline">{advisoryTypeLabels[recommendation.type]}</Badge>
                    <Badge variant="secondary">
                      {(recommendation.confidenceScore * 100).toFixed(0)}% confianca
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{recommendation.title}</h3>
                    <p className="text-muted-foreground text-sm">{recommendation.rationale}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-sm">
                    {recommendation.recommendedAction}
                  </div>
                  {recommendation.shipment === null ? null : (
                    <ContextRow
                      label={recommendation.shipment.referenceCode}
                      value={`${modeLabels[recommendation.shipment.transportMode]} · ${
                        statusLabels[recommendation.shipment.status]
                      }`}
                    />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Politica de automacao</CardTitle>
            <CardDescription>
              A IA local e consultiva; eventos, excecoes e releases continuam protegidos por RBAC,
              idempotencia, audit trail e aprovacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow
              label="Automacao"
              value={advisory.policy.automationAllowed ? "Permitida" : "Bloqueada"}
            />
            <ContextRow
              label="Aprovacao humana"
              value={advisory.policy.humanApprovalRequired ? "Obrigatoria" : "Nao exigida"}
            />
            <ContextRow label="Fonte" value={advisory.policy.source} />
            <ContextRow label="Operacao" value="tracking.ai.advisory.read" />
            <ContextRow label="Transporte" value="GET /rpc/tracking/advisory" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Eventos por janela</CardTitle>
            <CardDescription>
              Frequencia de eventos operacionais no periodo analisado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Ultima ocorrencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.eventTypeCounts.map((item) => (
                  <TableRow key={item.eventType}>
                    <TableCell className="font-medium">{eventTypeLabels[item.eventType]}</TableCell>
                    <TableCell>
                      <Badge variant={item.count > 0 ? "secondary" : "outline"}>{item.count}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.latestOccurredAt ?? "Sem ocorrencia"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow de excecoes</CardTitle>
            <CardDescription>
              Estados extraidos dos eventos de excecao e release para suporte a auditoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {analytics.workflowStateCounts.map((item) => (
              <ContextRow
                key={item.state}
                label={workflowStateLabels[item.state]}
                value={item.count.toString()}
              />
            ))}
            <ContextRow
              label="Sem ETA ativo"
              value={analytics.slaRisk.unscheduledActiveShipments.toString()}
            />
            <ContextRow
              label="Janela"
              value={`${analytics.window.startedAt} -> ${analytics.window.endedAt}`}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Distribuicao por status</CardTitle>
            <CardDescription>Base para SLA, excecoes e alertas operacionais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.statusCounts.map((item) => (
                  <TableRow key={item.status}>
                    <TableCell className="font-medium">{statusLabels[item.status]}</TableCell>
                    <TableCell>
                      <Badge variant={item.count > 0 ? "secondary" : "outline"}>{item.count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimentos recentes</CardTitle>
            <CardDescription>
              Ultimas cargas atualizadas no tenant. Eventos sao registados pelo comando auditavel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Carga</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ultimo evento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentShipments.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={5}>
                      Sem cargas rastreadas neste tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.recentShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <Link
                            className="underline-offset-4 hover:underline"
                            href={createTrackingShipmentRoute(shipment.id)}
                          >
                            {shipment.referenceCode}
                          </Link>
                          <span className="text-muted-foreground text-xs">
                            {modeLabels[shipment.transportMode]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{shipment.cargoDescription}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {shipment.originName} -&gt; {shipment.destinationName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={resolveStatusVariant(shipment.status)}>
                          {statusLabels[shipment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {shipment.lastEventType ?? "Sem evento"} ·{" "}
                        {shipment.lastKnownLocation ?? "Local nao informado"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TrackingEventRecordForm
          action={recordTrackingEventAction}
          canRecordEvents={canRecordEvents}
          initialState={initialTrackingEventRecordFormState}
          shipments={overview.recentShipments.map((shipment) => ({
            id: shipment.id,
            referenceCode: shipment.referenceCode,
            cargoDescription: shipment.cargoDescription,
            originName: shipment.originName,
            destinationName: shipment.destinationName,
          }))}
        />

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Governanca</Badge>
              <Badge variant={canRecordEvents ? "success" : "warning"}>
                {canRecordEvents ? "Pode gravar" : "Somente leitura"}
              </Badge>
            </div>
            <CardTitle>Controle da escrita operacional</CardTitle>
            <CardDescription>
              A UI nao grava diretamente no banco. Ela chama o contrato RPC seguro e o backend
              aplica sessao, organizacao, RBAC, idempotencia, audit trail e outbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow label="Permissao leitura" value={readTrackingPermission} />
            <ContextRow label="Permissao escrita" value={recordTrackingPermission} />
            <ContextRow label="Operacao" value="tracking.event.record" />
            <ContextRow label="Transporte" value="POST /rpc/tracking/events" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function createTrackingShipmentRoute(shipmentId: string): Route {
  return `/app/tracking/${shipmentId}` as Route;
}

function TrackingAccessState({
  title,
  status,
  message,
}: {
  title: string;
  status: string;
  message: string;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">{status}</Badge>
            <Badge variant="outline">Operational Tracking</Badge>
          </div>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-base leading-7">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Modelo de seguranca aplicado: a feature existe, mas o acesso depende de sessao,
          organizacao resolvida e permissao explicita.
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4">
      <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</span>
      <span className="truncate text-2xl font-semibold">{value}</span>
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

function resolveStatusVariant(
  status: keyof typeof statusLabels,
): "info" | "success" | "warning" | "destructive" | "outline" {
  if (status === "exception") {
    return "destructive";
  }

  if (status === "delayed") {
    return "warning";
  }

  if (status === "completed" || status === "arrived") {
    return "success";
  }

  if (status === "cancelled") {
    return "outline";
  }

  return "info";
}

function resolveAdvisorySeverityVariant(
  severity: "medium" | "high" | "critical",
): "warning" | "destructive" | "secondary" {
  if (severity === "critical") {
    return "destructive";
  }

  if (severity === "high") {
    return "warning";
  }

  return "secondary";
}
