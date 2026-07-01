import {
  Badge,
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
} from "@saptm/ui";

export type PlanningTotals = {
  transportOrders: number;
  confirmed: number;
  cancelled: number;
  upcomingDepartures: number;
  linkedCapacityReservations: number;
  linkedTrackingShipments: number;
  dispatched: number;
};

export type PlanningOverviewHeaderProps = {
  totals: PlanningTotals;
  confirmRate: string;
  dispatchRate: string;
};

export function PlanningOverviewHeader({
  totals,
  confirmRate,
  dispatchRate,
}: PlanningOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <BadgeGroup
            items={[
              { label: "Activo", variant: "success" },
              { label: "Planeamento", variant: "outline" },
            ]}
          />
          <div className="flex flex-col gap-2">
            <CardTitle as="h1" className="text-2xl">
              Planeamento
            </CardTitle>
            <CardDescription className="max-w-3xl leading-6">
              Confirmação, dispatch e replaneamento de ordens de transporte.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <MetricTile label="Ordens" value={totals.transportOrders.toString()} />
          <MetricTile label="Confirmadas" value={totals.confirmed.toString()} />
          <MetricTile label="Canceladas" value={totals.cancelled.toString()} />
          <MetricTile label="Partidas futuras" value={totals.upcomingDepartures.toString()} />
          <MetricTile label="Com capacidade" value={totals.linkedCapacityReservations.toString()} />
          <MetricTile label="Com tracking" value={totals.linkedTrackingShipments.toString()} />
          <MetricTile label="Despachadas" value={totals.dispatched.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="secondary">Resumo</Badge>
          <CardTitle>Estado das ordens</CardTitle>
          <CardDescription>Distribuicao e indicadores do planeamento.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <ContextRow label="Taxa de confirmação" value={confirmRate} />
          <ContextRow label="Taxa de dispatch" value={dispatchRate} />
          <ContextRow
            label="Canceladas"
            value={
              <span className={totals.cancelled > 0 ? "text-destructive" : ""}>
                {totals.cancelled}
              </span>
            }
          />
          <ContextRow label="Partidas futuras" value={totals.upcomingDepartures} />
        </CardContent>
      </Card>
    </section>
  );
}
