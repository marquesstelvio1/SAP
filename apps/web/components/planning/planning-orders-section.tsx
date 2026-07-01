import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";

export type PlanningOrder = {
  id: string;
  orderReference: string;
  cargoReference: string;
  cargoId: string;
  mode: string;
  carrierName: string;
  originName: string;
  destinationName: string;
  routeSummary: string;
  plannedDepartureAt: string;
  plannedArrivalAt: string;
  status: string;
  capacityReservationReference: string | null;
  trackingReferenceCode: string | null;
  scheduleRevisionCount: number;
  dispatchCount: number;
};

export type PlanningOrdersSectionProps = {
  recentOrders: PlanningOrder[];
};

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

function formatOperationalDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PlanningOrdersSection({ recentOrders }: PlanningOrdersSectionProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Ordens recentes</CardTitle>
          <CardDescription>
            Ordens de transporte com carga, rota, janela operacional e status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Ordens de transporte recentes">
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
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5} role="status">
                    Nenhuma ordem de transporte encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{order.orderReference}</span>
                        <span className="text-muted-foreground text-xs">
                          {transportModeLabels[order.mode as keyof typeof transportModeLabels]} ·{" "}
                          {order.carrierName}
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
                          {order.originName} &rarr; {order.destinationName}
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
                          {
                            transportOrderStatusLabels[
                              order.status as keyof typeof transportOrderStatusLabels
                            ]
                          }
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {order.capacityReservationReference ?? "Sem capacidade"} ·{" "}
                          {order.trackingReferenceCode ?? "Sem tracking"}
                        </span>
                        {order.scheduleRevisionCount > 0 ? (
                          <span className="text-muted-foreground text-xs">
                            Revisoes: {order.scheduleRevisionCount}
                          </span>
                        ) : null}
                        {order.dispatchCount > 0 ? (
                          <span className="text-muted-foreground text-xs">
                            Dispatches: {order.dispatchCount}
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

      <Card>
        <CardHeader>
          <CardTitle>Regras de negocio</CardTitle>
          <CardDescription>Condições aplicadas a cada operação no planeamento.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <ContextRow label="Confirmacao" value="Carga pronta, rota valida, janela operacional" />
          <ContextRow label="Dispatch" value="Ordem confirmada, sem dispatch previo" />
          <ContextRow label="Replaneamento" value="Ordem confirmada, sem dispatch" />
          <ContextRow label="Cancelamento" value="Ordem confirmada, sem dispatch" />
          <Separator />
          <ContextRow label="Capacidade" value="Reserva activa alinhada a janela" />
          <ContextRow label="Tracking" value="Vinculado a carga quando informado" />
        </CardContent>
      </Card>
    </section>
  );
}
