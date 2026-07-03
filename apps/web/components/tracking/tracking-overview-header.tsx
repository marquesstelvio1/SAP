import {
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
  Separator,
} from "@saptm/ui";

import { formatDateTime } from "../../lib/format";

export type TrackingOverviewHeaderProps = {
  totals: {
    shipments: number;
    activeShipments: number;
    delayedShipments: number;
    exceptionShipments: number;
  };
  generatedAt: string;
};

export function TrackingOverviewHeader({ totals, generatedAt }: TrackingOverviewHeaderProps) {
  const exceptionRate =
    totals.shipments > 0
      ? `${Math.round((totals.exceptionShipments / totals.shipments) * 100)}%`
      : "—";
  const delayRate =
    totals.shipments > 0
      ? `${Math.round((totals.delayedShipments / totals.shipments) * 100)}%`
      : "—";

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <BadgeGroup
            items={[
              { label: "Activo", variant: "success" },
              { label: "Tracking", variant: "outline" },
            ]}
          />
          <div className="flex flex-col gap-2">
            <CardTitle as="h1" className="text-2xl">
              Tracking
            </CardTitle>
            <CardDescription className="max-w-3xl leading-6">
              Acompanhamento de movimentos ferroviários, portuários e logísticos em tempo real.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Remessas" value={totals.shipments.toString()} />
          <MetricTile label="Em transito" value={totals.activeShipments.toString()} />
          <MetricTile
            label="Atrasos"
            value={totals.delayedShipments.toString()}
            variant={totals.delayedShipments > 0 ? "warning" : "default"}
            {...(totals.delayedShipments > 0 ? { badge: delayRate } : {})}
          />
          <MetricTile
            label="Exceções"
            value={totals.exceptionShipments.toString()}
            variant={totals.exceptionShipments > 0 ? "destructive" : "default"}
            {...(totals.exceptionShipments > 0 ? { badge: exceptionRate } : {})}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado operacional</CardTitle>
          <CardDescription>Métricas consolidadas do tracking actual.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <ContextRow
            label="Taxa de exceções"
            value={
              <span className={totals.exceptionShipments > 0 ? "text-destructive" : ""}>
                {exceptionRate}
              </span>
            }
          />
          <ContextRow
            label="Atrasos"
            value={
              <span className={totals.delayedShipments > 0 ? "text-warning" : ""}>{delayRate}</span>
            }
          />
          <ContextRow
            label="Remessas activas"
            value={`${totals.activeShipments}/${totals.shipments}`}
          />
          <Separator />
          <ContextRow label="Actualizado em" value={formatDateTime(generatedAt)} muted={false} />
        </CardContent>
      </Card>
    </section>
  );
}
