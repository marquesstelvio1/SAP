import type { PlatformPermission } from "@saptm/auth";
import type { TrackingShipmentDetailOutput } from "@saptm/rpc";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { TrackingExceptionManageForm } from "../../../../../components/tracking-exception-manage-form";
import { TrackingExceptionResolveForm } from "../../../../../components/tracking-exception-resolve-form";
import { TrackingNextActionCard } from "../../../../../components/tracking-next-action-card";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { getTrackingShipmentDetail } from "../../../../../lib/tracking-shipment-detail";
import { manageTrackingExceptionAction, resolveTrackingExceptionAction } from "../actions";
import {
  initialTrackingExceptionManageFormState,
  initialTrackingExceptionResolveFormState,
} from "../form-state";

export const dynamic = "force-dynamic";

const readTrackingPermission: PlatformPermission = "tracking.shipment.read";
const manageTrackingExceptionPermission: PlatformPermission = "tracking.exception.manage";
const resolveTrackingExceptionPermission: PlatformPermission = "tracking.exception.resolve";

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

const eventLabels = {
  created: "Criado",
  departed: "Partida",
  arrived: "Chegada",
  delayed: "Atraso",
  exception: "Excecao",
  location_updated: "Local atualizado",
  handover_completed: "Handover concluido",
  customs_hold: "Retencao alfandegaria",
  released: "Liberacao",
} as const;

const workflowStateLabels = {
  exception_opened: "Excecao aberta",
  pending_review: "Pendente revisao",
  approved_for_resolution: "Aprovada para resolucao",
  closed: "Fechado",
} as const;

type TrackingShipmentDetailPageProps = {
  params: Promise<{
    shipmentId: string;
  }>;
};

export default async function TrackingShipmentDetailPage({
  params,
}: TrackingShipmentDetailPageProps) {
  const { shipmentId } = await params;
  const platformSession = await requirePlatformSession(`/app/tracking/${shipmentId}`);
  const viewerPermissions = platformSession.viewer.permissions;

  if (!viewerPermissions.includes(readTrackingPermission)) {
    return (
      <TrackingDetailState
        message="A sessao esta autenticada, mas falta a permissao tracking.shipment.read para abrir o detalhe."
        status="Sem grant"
        title="Detalhe de tracking bloqueado"
      />
    );
  }

  const result = await getTrackingShipmentDetail(shipmentId);

  if (result.status !== "ok") {
    return (
      <TrackingDetailState
        message={result.message}
        status={result.status}
        title="Detalhe de tracking indisponivel"
      />
    );
  }

  const { detail } = result;
  const { shipment } = detail;
  const canManageExceptions = viewerPermissions.includes(manageTrackingExceptionPermission);
  const canResolveExceptions = viewerPermissions.includes(resolveTrackingExceptionPermission);
  const isResolutionAllowed = shipment.status === "exception" || shipment.status === "delayed";
  const hasOpenExceptions = detail.timeline.some(
    (event) =>
      (event.eventType === "exception" ||
        event.eventType === "customs_hold" ||
        event.eventType === "delayed") &&
      event.workflowState !== null &&
      event.workflowState !== "closed",
  );
  const hasCustomsException = detail.timeline.some(
    (event) =>
      event.eventType === "customs_hold" &&
      event.workflowState !== null &&
      event.workflowState !== "closed",
  );
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/app/tracking">Voltar ao tracking</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">tracking.shipment.detail.read</Badge>
          <Badge variant={canManageExceptions ? "warning" : "outline"}>
            tracking.exception.manage
          </Badge>
          <Badge variant={canResolveExceptions ? "success" : "outline"}>
            tracking.exception.resolve
          </Badge>
          <Badge variant="success">Leitura governada</Badge>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <TrackingNextActionCard
          canManageExceptions={canManageExceptions}
          canResolveExceptions={canResolveExceptions}
          hasOpenExceptions={hasOpenExceptions}
          referenceCode={shipment.referenceCode}
          shipmentId={shipment.id}
          shipmentStatus={shipment.status}
        />
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={resolveStatusVariant(shipment.status)}>
                  {statusLabels[shipment.status]}
                </Badge>
                <Badge variant="secondary">{modeLabels[shipment.transportMode]}</Badge>
                <Badge variant="outline">{shipment.referenceCode}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-3xl">{shipment.cargoDescription}</CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7">
                  Timeline operacional isolada por organizacao. Eventos exibem origem, local,
                  correlacao e payload para rastreabilidade sem abrir CRUD generico.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <MetricTile label="Prioridade" value={shipment.priority.toString()} />
              <MetricTile label="Eventos" value={shipment.eventCount.toString()} />
              <MetricTile
                label="Ultimo evento"
                value={resolveNullable(eventLabels, shipment.lastEventType)}
              />
              <MetricTile
                label="Local atual"
                value={shipment.lastKnownLocation ?? "Nao informado"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rota operacional</CardTitle>
              <CardDescription>Origem, destino e janelas usadas para SLA.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <ContextRow label="Origem" value={shipment.originName} />
              <ContextRow label="Destino" value={shipment.destinationName} />
              <ContextRow
                label="Partida planeada"
                value={formatNullableDateTime(shipment.plannedDepartureAt)}
              />
              <ContextRow label="ETA" value={formatNullableDateTime(shipment.estimatedArrivalAt)} />
              <ContextRow
                label="Chegada real"
                value={formatNullableDateTime(shipment.actualArrivalAt)}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TrackingExceptionManageForm
          action={manageTrackingExceptionAction}
          canManageExceptions={canManageExceptions}
          initialState={initialTrackingExceptionManageFormState}
          shipment={{
            id: shipment.id,
            referenceCode: shipment.referenceCode,
            cargoDescription: shipment.cargoDescription,
            status: statusLabels[shipment.status],
          }}
        />

        <TrackingExceptionResolveForm
          action={resolveTrackingExceptionAction}
          canResolveExceptions={canResolveExceptions}
          initialState={initialTrackingExceptionResolveFormState}
          isResolutionAllowed={isResolutionAllowed}
          shipment={{
            id: shipment.id,
            referenceCode: shipment.referenceCode,
            cargoDescription: shipment.cargoDescription,
            status: statusLabels[shipment.status],
          }}
        />
      </section>

      {hasOpenExceptions ? (
        <section>
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="destructive">Cross-link P1</Badge>
                <Badge variant="outline">Tracking → Cargo</Badge>
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">Excecao operacional vinculada a carga</CardTitle>
                <CardDescription className="text-sm leading-6">
                  Excecoes no tracking podem refletir problemas na entrega da carga. Consulte o
                  modulo Cargo para verificar excecoes de delivery, compliance ou documentacao
                  pendente.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Link
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-3 py-1.5 text-xs font-medium underline-offset-4 hover:bg-muted/40 hover:underline"
                href={"/app/cargo" as Route}
              >
                Modulo Cargo
              </Link>
              {hasCustomsException ? (
                <Link
                  className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-3 py-1.5 text-xs font-medium underline-offset-4 hover:bg-muted/40 hover:underline"
                  href={"/app/cargo#cargo-compliance-evidence" as Route}
                >
                  Compliance aduaneiro
                </Link>
              ) : null}
              <Link
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-3 py-1.5 text-xs font-medium underline-offset-4 hover:bg-muted/40 hover:underline"
                href={
                  `/app/audit?subjectType=tracking.shipment&subjectId=${shipment.id}&limit=25` as Route
                }
              >
                Auditoria de excecoes
              </Link>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Excecoes</Badge>
              <Badge variant={canManageExceptions ? "warning" : "outline"}>
                {canManageExceptions ? "Pode gerir" : "Somente leitura"}
              </Badge>
              <Badge variant={canResolveExceptions && isResolutionAllowed ? "success" : "outline"}>
                {canResolveExceptions && isResolutionAllowed
                  ? "Pode resolver"
                  : "Resolucao bloqueada"}
              </Badge>
            </div>
            <CardTitle>Protocolo de recuperacao e resolucao</CardTitle>
            <CardDescription>
              Excecoes alteram estado operacional e sempre passam por permissao, idempotencia, audit
              trail e outbox antes de aparecerem na timeline. Resolucao so e aceite para cargas em
              atraso ou excecao e exige aprovacao explicita.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <ContextRow label="Permissao abrir" value={manageTrackingExceptionPermission} />
            <ContextRow label="Permissao resolver" value={resolveTrackingExceptionPermission} />
            <ContextRow label="Operacao abrir" value="tracking.exception.manage" />
            <ContextRow label="Operacao resolver" value="tracking.exception.resolve" />
            <ContextRow label="Transporte abrir" value="POST /rpc/tracking/exceptions" />
            <ContextRow
              label="Transporte resolver"
              value="POST /rpc/tracking/exceptionResolution"
            />
            <ContextRow label="Status atual" value={statusLabels[shipment.status]} />
            <ContextRow label="Resolucao permitida" value={isResolutionAllowed ? "Sim" : "Nao"} />
            <ContextRow label="Evidencia" value="Operador + referencia + resumo" />
            <ContextRow label="Aprovacao" value="Obrigatoria para resolver" />
            <ContextRow label="Workflow final" value="closed apos release aprovado" />
            <div className="md:col-span-2">
              <Separator />
            </div>
            <ContextRow label="Sem CRUD" value="Comandos governados" />
            <ContextRow label="Efeito" value="Evento, status, audit e outbox" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline de eventos</CardTitle>
            <CardDescription>
              Ultimos {detail.timeline.length} eventos recebidos por fonte operacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrackingTimeline detail={detail} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Governanca do detalhe</CardTitle>
            <CardDescription>
              A rota usa a sessao Better Auth e o backend filtra por organizacao antes de retornar
              qualquer dado operacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow label="Organization" value={detail.organizationId} />
            <ContextRow label="Session" value={platformSession.sessionId} />
            <ContextRow label="Permissao" value={readTrackingPermission} />
            <ContextRow label="Operacao" value="tracking.shipment.detail.read" />
            <ContextRow label="Transporte" value="GET /rpc/tracking/shipmentDetail" />
            <Separator />
            <ContextRow label="Gerado em" value={formatDateTime(detail.generatedAt)} />
            <ContextRow label="Shipment ID" value={shipment.id} />
            <ContextRow
              label="Referencia externa"
              value={shipment.externalReference ?? "Nao informada"}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
                href={
                  `/app/audit?subjectType=tracking.shipment&subjectId=${shipment.id}&limit=25` as Route
                }
              >
                Auditoria do shipment
              </Link>
              <Link
                className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
                href={"/app/reports" as Route}
              >
                Reports
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function TrackingTimeline({ detail }: { detail: TrackingShipmentDetailOutput }) {
  if (detail.timeline.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-muted-foreground text-sm">
        Nenhum evento operacional registado para esta carga.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evento</TableHead>
          <TableHead>Ocorrido em</TableHead>
          <TableHead>Local</TableHead>
          <TableHead>Workflow</TableHead>
          <TableHead>Fonte</TableHead>
          <TableHead>Payload</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {detail.timeline.map((event) => (
          <TableRow key={event.id}>
            <TableCell className="font-medium">
              <div className="flex flex-col gap-1">
                <span>{eventLabels[event.eventType]}</span>
                <span className="text-muted-foreground text-xs">{event.id}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(event.occurredAt)}
            </TableCell>
            <TableCell>{event.locationName ?? "Nao informado"}</TableCell>
            <TableCell>
              {event.workflowState === null ? (
                <Badge variant="outline">N/A</Badge>
              ) : (
                <Badge variant={resolveWorkflowStateVariant(event.workflowState)}>
                  {workflowStateLabels[event.workflowState]}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Badge variant="outline">{event.sourceSystem}</Badge>
                <span className="text-muted-foreground text-xs">{event.correlationId}</span>
              </div>
            </TableCell>
            <TableCell className="max-w-72">
              {event.payload === null ? (
                <span className="text-muted-foreground text-xs">Sem payload</span>
              ) : (
                <pre className="max-h-28 overflow-auto rounded-md border bg-muted/30 p-2 text-xs">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TrackingDetailState({
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
      <Button asChild variant="outline">
        <Link href="/app/tracking">Voltar ao tracking</Link>
      </Button>
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
          Modelo de seguranca aplicado: detalhe exige sessao, organizacao resolvida e permissao de
          leitura.
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

function resolveWorkflowStateVariant(
  state: keyof typeof workflowStateLabels,
): "success" | "warning" | "info" | "outline" {
  if (state === "closed") {
    return "success";
  }

  if (state === "approved_for_resolution") {
    return "info";
  }

  if (state === "pending_review") {
    return "warning";
  }

  return "outline";
}

function resolveNullable<T extends string>(labels: Record<T, string>, value: T | null): string {
  return value === null ? "Sem evento" : labels[value];
}

function formatNullableDateTime(value: string | null): string {
  return value === null ? "Nao informado" : formatDateTime(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
