import type { PlatformPermission } from "@saptm/auth";
import type { TrackingShipmentDetailOutput } from "@saptm/rpc/tracking";
import {
  AccessState,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
  Separator,
  Timeline,
  TimelineItem,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { TrackingExceptionManageForm } from "../../../../../components/tracking/tracking-exception-manage-form";
import { TrackingExceptionResolveForm } from "../../../../../components/tracking/tracking-exception-resolve-form";
import { TrackingNextActionCard } from "../../../../../components/tracking/tracking-next-action-card";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { getTrackingShipmentDetail } from "../../../../../lib/tracking-shipment-detail";
import { manageTrackingExceptionAction, resolveTrackingExceptionAction } from "../actions";
import {
  initialTrackingExceptionManageFormState,
  initialTrackingExceptionResolveFormState,
} from "../form-state";
import {
  eventLabels,
  formatDateTime,
  formatNullableDateTime,
  modeLabels,
  resolveNullable,
  resolveStatusVariant,
  resolveWorkflowStateVariant,
  statusLabels,
  workflowStateLabels,
} from "./logic";

export const dynamic = "force-dynamic";

const readTrackingPermission: PlatformPermission = "tracking.shipment.read";
const manageTrackingExceptionPermission: PlatformPermission = "tracking.exception.manage";
const resolveTrackingExceptionPermission: PlatformPermission = "tracking.exception.resolve";

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
      <div className="mx-auto flex max-w-4xl flex-col gap-6" role="alert" aria-live="assertive">
        <Button asChild variant="outline">
          <Link href="/app/tracking">Voltar ao tracking</Link>
        </Button>
        <AccessState
          badgeLabel="Operational Tracking"
          message="A sessao esta autenticada, mas falta a permissao tracking.shipment.read para abrir o detalhe."
          role="alert"
          status="Sem grant"
          title="Detalhe de tracking bloqueado"
          variant="error"
        />
      </div>
    );
  }

  const result = await getTrackingShipmentDetail(shipmentId);

  if (result.status !== "ok") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6" role="alert" aria-live="assertive">
        <Button asChild variant="outline">
          <Link href="/app/tracking">Voltar ao tracking</Link>
        </Button>
        <AccessState
          badgeLabel="Operational Tracking"
          message={result.message}
          role="alert"
          status={result.status}
          title="Detalhe de tracking indisponivel"
          variant="error"
        />
      </div>
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
      <div
        className="rounded-lg border bg-muted/30 p-4 text-muted-foreground text-sm"
        role="status"
      >
        Nenhum evento operacional registado para esta carga.
      </div>
    );
  }

  function resolveTimelineStatus(
    event: TrackingShipmentDetailOutput["timeline"][number],
    index: number,
    events: TrackingShipmentDetailOutput["timeline"],
  ): "completed" | "current" | "pending" | "error" | "warning" {
    if (event.eventType === "delayed") return "warning";
    if (event.eventType === "exception" || event.eventType === "customs_hold") {
      return event.workflowState === "closed" ? "completed" : "error";
    }
    const isLatest = index === events.length - 1;
    return isLatest ? "current" : "completed";
  }

  return (
    <Timeline>
      {detail.timeline.map((event, index, events) => {
        const eventDescription = [event.locationName, event.notes].filter(Boolean).join(" — ");

        return (
          <TimelineItem
            key={event.id}
            status={resolveTimelineStatus(event, index, events)}
            title={eventLabels[event.eventType]}
            {...(eventDescription ? { description: eventDescription } : {})}
            timestamp={formatDateTime(event.occurredAt)}
          >
            <div className="flex flex-wrap items-center gap-2">
              {event.workflowState === null ? (
                <Badge variant="outline">N/A</Badge>
              ) : (
                <Badge variant={resolveWorkflowStateVariant(event.workflowState)}>
                  {workflowStateLabels[event.workflowState]}
                </Badge>
              )}
              <Badge variant="outline">{event.sourceSystem}</Badge>
              <span className="text-muted-foreground text-[0.65rem]">{event.correlationId}</span>
            </div>
            {event.payload !== null ? (
              <pre className="mt-2 max-h-20 overflow-auto rounded-md border bg-muted/30 p-2 text-[0.65rem]">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            ) : null}
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
