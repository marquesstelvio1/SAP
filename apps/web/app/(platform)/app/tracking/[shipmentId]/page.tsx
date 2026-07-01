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
import type { Metadata, Route } from "next";
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

export const metadata: Metadata = {
  title: "Detalhe de Tracking",
  description: "Eventos operacionais, exceções e timeline detalhada de uma remessa de carga.",
};

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
          badgeLabel="Tracking"
          description="O utilizador autenticado nao tem acesso ao detalhe de tracking."
          role="alert"
          title="Detalhe de tracking bloqueado"
          variant="blocked"
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
          badgeLabel="Tracking"
          description={result.message}
          role="alert"
          title="Detalhe de tracking indisponível"
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
      <div className="flex items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/app/tracking">Voltar ao tracking</Link>
        </Button>
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
                <CardTitle as="h1" className="text-3xl">
                  {shipment.cargoDescription}
                </CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7">
                  Eventos da remessa por ordem cronológica com origem, localização e estado
                  operacional.
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
                value={shipment.lastKnownLocation ?? "Não informado"}
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
                <Badge variant="destructive">Vinculo operacional</Badge>
                <Badge variant="outline">Tracking · Carga</Badge>
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">Exceção operacional vinculada a carga</CardTitle>
                <CardDescription className="text-sm leading-6">
                  Exceções no tracking podem refletir problemas na entrega da carga. Consulte o
                  módulo Cargo para verificar exceções de delivery, compliance ou documentação
                  pendente.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Link
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-3 py-1.5 text-xs font-medium underline-offset-4 outline-none hover:bg-muted/40 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href={"/app/cargo" as Route}
              >
                Modulo Cargo
              </Link>
              {hasCustomsException ? (
                <Link
                  className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-3 py-1.5 text-xs font-medium underline-offset-4 outline-none hover:bg-muted/40 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  href={"/app/cargo#cargo-compliance-evidence" as Route}
                >
                  Compliance aduaneiro
                </Link>
              ) : null}
              <Link
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-3 py-1.5 text-xs font-medium underline-offset-4 outline-none hover:bg-muted/40 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href={
                  `/app/audit?subjectType=tracking.shipment&subjectId=${shipment.id}&limit=25` as Route
                }
              >
                Auditoria de exceções
              </Link>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Exceções</Badge>
              <Badge variant={canManageExceptions ? "warning" : "outline"}>
                {canManageExceptions ? "Pode gerir" : "Somente leitura"}
              </Badge>
              <Badge variant={canResolveExceptions && isResolutionAllowed ? "success" : "outline"}>
                {canResolveExceptions && isResolutionAllowed
                  ? "Pode resolver"
                  : "Resolucao bloqueada"}
              </Badge>
            </div>
            <CardTitle>Resolucao de excecoes</CardTitle>
            <CardDescription>
              Excecoes operacionais alteram o estado da remessa. A resolucao exige aprovacao e
              registo de auditoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <ContextRow label="Status atual" value={statusLabels[shipment.status]} />
            <ContextRow label="Resolucao permitida" value={isResolutionAllowed ? "Sim" : "Nao"} />
            <ContextRow label="Evidencia" value="Operador + referencia + resumo" />
            <ContextRow label="Aprovacao" value="Obrigatoria para resolver" />
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
            <CardTitle>Informacao da remessa</CardTitle>
            <CardDescription>Referencias e dados complementares do envio.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow label="Referencia" value={shipment.referenceCode} />
            <ContextRow
              label="Referencia externa"
              value={shipment.externalReference ?? "Não informada"}
            />
            <ContextRow label="Ultima actualizacao" value={formatDateTime(detail.generatedAt)} />
            <Separator />
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-2xs text-muted-foreground underline-offset-4 outline-none hover:bg-muted/40 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href={
                  `/app/audit?subjectType=tracking.shipment&subjectId=${shipment.id}&limit=25` as Route
                }
              >
                Auditoria
              </Link>
              <Link
                className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-2xs text-muted-foreground underline-offset-4 outline-none hover:bg-muted/40 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            </div>
            {event.payload !== null ? (
              <pre className="mt-2 max-h-20 overflow-auto rounded-md border bg-muted/30 p-2 text-2xs">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            ) : null}
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
