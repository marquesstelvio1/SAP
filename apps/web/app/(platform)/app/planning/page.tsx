import type { PlatformPermission } from "@saptm/auth";
import {
  AccessState,
  Badge,
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
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
import { TransportOrderCancelForm } from "../../../../components/planning/transport-order-cancel-form";
import { TransportOrderConfirmForm } from "../../../../components/planning/transport-order-confirm-form";
import { TransportOrderDispatchForm } from "../../../../components/planning/transport-order-dispatch-form";
import { TransportOrderRescheduleForm } from "../../../../components/planning/transport-order-reschedule-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getPlanningOverview } from "../../../../lib/planning-overview";
import {
  cancelTransportOrderAction,
  confirmTransportOrderAction,
  dispatchTransportOrderAction,
  rescheduleTransportOrderAction,
} from "./actions";
import {
  initialTransportOrderCancelFormState,
  initialTransportOrderConfirmFormState,
  initialTransportOrderDispatchFormState,
  initialTransportOrderRescheduleFormState,
} from "./form-state";

export const dynamic = "force-dynamic";

const readPlanningPermission: PlatformPermission = "planning.order.read";
const confirmPlanningPermission: PlatformPermission = "planning.order.confirm";
const cancelPlanningPermission: PlatformPermission = "planning.order.cancel";
const reschedulePlanningPermission: PlatformPermission = "planning.order.reschedule";
const dispatchPlanningPermission: PlatformPermission = "planning.order.dispatch";

const transportModeLabels = {
  rail: "Ferrovia",
  road: "Rodoviario",
  sea: "Maritimo",
  barge: "Barca",
  multimodal: "Multimodal",
} as const;

const transportOrderStatusLabels = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
} as const;

export default async function PlanningOverviewPage() {
  const platformSession = await requirePlatformSession("/app/planning");
  const viewerPermissions = platformSession.viewer.permissions;
  const canConfirmTransportOrder = viewerPermissions.includes(confirmPlanningPermission);
  const canCancelTransportOrder = viewerPermissions.includes(cancelPlanningPermission);
  const canRescheduleTransportOrder = viewerPermissions.includes(reschedulePlanningPermission);
  const canDispatchTransportOrder = viewerPermissions.includes(dispatchPlanningPermission);

  if (!viewerPermissions.includes(readPlanningPermission)) {
    return (
      <AccessState
        badgeLabel="Transport Planning"
        message="A sessao esta autenticada, mas falta a permissao planning.order.read para abrir o modulo."
        role="alert"
        status="Sem grant"
        title="Planeamento operacional bloqueado"
        variant="empty"
      />
    );
  }

  const result = await getPlanningOverview(10);

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Transport Planning"
        message={result.message}
        role="alert"
        status={result.status}
        title="Planeamento operacional indisponivel"
        variant="empty"
      />
    );
  }

  const { overview } = result;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <BadgeGroup
              items={[
                { label: "Business P26", variant: "success" },
                { label: "P26 Pos-dispatch guard", variant: "success" },
                { label: "Transport Planning", variant: "outline" },
              ]}
            />
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Planeamento de transporte governado</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Transport orders confirmadas a partir de cargas prontas, com rota, timing,
                responsavel, carrier, links opcionais de tracking/capacidade, idempotencia,
                auditoria, outbox, replaneamento, dispatch e cancelamento governados, bloqueando
                replaneamento e cancelamento depois do dispatch.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <MetricTile label="Ordens" value={overview.totals.transportOrders.toString()} />
            <MetricTile label="Confirmadas" value={overview.totals.confirmed.toString()} />
            <MetricTile label="Canceladas" value={overview.totals.cancelled.toString()} />
            <MetricTile
              label="Partidas futuras"
              value={overview.totals.upcomingDepartures.toString()}
            />
            <MetricTile
              label="Com capacidade"
              value={overview.totals.linkedCapacityReservations.toString()}
            />
            <MetricTile
              label="Com tracking"
              value={overview.totals.linkedTrackingShipments.toString()}
            />
            <MetricTile label="Despachadas" value={overview.totals.dispatched.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexto de seguranca</CardTitle>
            <CardDescription>Escopo resolvido por Better Auth, RBAC e organizacao.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow label="Organization" value={overview.organizationId} />
            <ContextRow label="Session" value={platformSession.sessionId} />
            <ContextRow label="Leitura" value={readPlanningPermission} />
            <ContextRow label="Confirmacao" value={confirmPlanningPermission} />
            <ContextRow label="Replaneamento" value={reschedulePlanningPermission} />
            <ContextRow label="Dispatch" value={dispatchPlanningPermission} />
            <ContextRow label="Cancelamento" value={cancelPlanningPermission} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Transport orders recentes</CardTitle>
            <CardDescription>
              Ordens tenant-scoped com carga, tracking, capacidade e janela operacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Transport orders recentes">
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Carga</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Janela</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={5} role="status">
                      Sem transport orders confirmadas neste tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{order.orderReference}</span>
                          <span className="text-muted-foreground text-xs">
                            {transportModeLabels[order.mode]} · {order.carrierName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{order.cargoReference}</span>
                          <span className="text-muted-foreground text-xs">{order.cargoId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex max-w-72 flex-col gap-1">
                          <span>
                            {order.originName} → {order.destinationName}
                          </span>
                          <span className="truncate text-xs">{order.routeSummary}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>Partida: {formatOperationalDate(order.plannedDepartureAt)}</span>
                          <span>Chegada: {formatOperationalDate(order.plannedArrivalAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant={order.status === "confirmed" ? "success" : "warning"}>
                            {transportOrderStatusLabels[order.status]}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {order.capacityReservationReference ?? "Sem capacidade"} ·{" "}
                            {order.trackingReferenceCode ?? "Sem tracking"}
                          </span>
                          {order.status === "cancelled" ? (
                            <span className="text-muted-foreground text-xs">
                              {order.cancellationReference ?? "Sem referencia de cancelamento"}
                            </span>
                          ) : null}
                          {order.scheduleRevisionCount > 0 ? (
                            <span className="text-muted-foreground text-xs">
                              Revisoes: {order.scheduleRevisionCount} ·{" "}
                              {order.lastScheduleRevisionReference ?? "sem referencia"}
                            </span>
                          ) : null}
                          {order.dispatchCount > 0 ? (
                            <span className="text-muted-foreground text-xs">
                              Dispatches: {order.dispatchCount} Â·{" "}
                              {order.lastDispatchReference ?? "sem referencia"}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="min-w-52" id="planning-post-dispatch-rules">
          <CardHeader>
            <CardTitle>Regras aplicadas</CardTitle>
            <CardDescription>
              O backend bloqueia confirmacao quando qualquer regra critica falha.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <ContextRow label="Carga elegivel" value="ready_for_transport, customs ok e sound" />
            <ContextRow label="Rota definida" value="origem/destino distintos e resumo minimo" />
            <ContextRow
              label="Timing valido"
              value="confirmado antes da partida e chegada posterior"
            />
            <ContextRow
              label="Capacidade"
              value="reserva ativa e alinhada a janela quando informada"
            />
            <ContextRow
              label="Tracking"
              value="shipment tenant-scoped vinculado a carga quando informado"
            />
            <ContextRow label="Idempotencia" value="ordem unica por cargo, referencia e chave" />
            <ContextRow
              label="Replaneamento"
              value="somente ordem confirmada, sem dispatch, mudanca real, janela valida e revisao unica"
            />
            <ContextRow
              label="Dispatch"
              value="somente ordem confirmada, apos ultimo replaneamento, antes da partida e sem duplicidade"
            />
            <ContextRow
              label="Cancelamento"
              value="somente ordem confirmada, sem dispatch, antes da partida, com motivo e referencia unica"
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <TransportOrderConfirmForm
          action={confirmTransportOrderAction}
          canConfirmTransportOrder={canConfirmTransportOrder}
          initialState={initialTransportOrderConfirmFormState}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <TransportOrderRescheduleForm
            action={rescheduleTransportOrderAction}
            canRescheduleTransportOrder={canRescheduleTransportOrder}
            initialState={initialTransportOrderRescheduleFormState}
          />
          <TransportOrderDispatchForm
            action={dispatchTransportOrderAction}
            canDispatchTransportOrder={canDispatchTransportOrder}
            initialState={initialTransportOrderDispatchFormState}
          />
          <TransportOrderCancelForm
            action={cancelTransportOrderAction}
            canCancelTransportOrder={canCancelTransportOrder}
            initialState={initialTransportOrderCancelFormState}
          />
        </div>
      </section>
    </div>
  );
}

function formatOperationalDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
