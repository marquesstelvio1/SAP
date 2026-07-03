import {
  Badge,
  BadgeGroup,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
  Separator,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export type CargoOverviewHeaderProps = {
  totals: {
    cargo: number;
    activeCargo: number;
    heldCargo: number;
    hazardousCargo: number;
    inspectionRequiredCargo: number;
  };
};

export function CargoOverviewHeader({ totals }: CargoOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <BadgeGroup
            items={[
              { label: "Activo", variant: "success" },
              { label: "Gestão de Cargas", variant: "outline" },
            ]}
          />
          <div className="flex flex-col gap-2">
            <CardTitle as="h1" className="text-2xl">
              Cargas
            </CardTitle>
            <CardDescription className="max-w-3xl leading-6">
              Registo, liberação, transporte e entrega de cargas ferroviárias e portuárias.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Total" value={totals.cargo.toString()} />
          <MetricTile label="Em transito" value={totals.activeCargo.toString()} />
          <MetricTile label="Bloqueadas" value={totals.heldCargo.toString()} />
          <MetricTile
            label="Perigosas"
            value={totals.hazardousCargo.toString()}
            variant={totals.hazardousCargo > 0 ? "warning" : "default"}
            {...(totals.hazardousCargo > 0 ? { badge: "Atenção" } : {})}
          />
          <MetricTile
            label="Inspecao"
            value={totals.inspectionRequiredCargo.toString()}
            variant={totals.inspectionRequiredCargo > 0 ? "warning" : "default"}
            {...(totals.inspectionRequiredCargo > 0 ? { badge: "Pendente" } : {})}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Resumo</Badge>
          </div>
          <CardTitle>Contexto operacional</CardTitle>
          <CardDescription>Indicadores rapidos do estado actual das cargas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <ContextRow
            label="Taxa de actividade"
            value={
              totals.cargo > 0 ? `${Math.round((totals.activeCargo / totals.cargo) * 100)}%` : "—"
            }
          />
          <ContextRow
            label="Bloqueadas"
            value={
              <span className={totals.heldCargo > 0 ? "text-destructive" : ""}>
                {totals.heldCargo} {totals.heldCargo === 1 ? "carga" : "cargas"}
              </span>
            }
          />
          <ContextRow
            label="Inspeccao pendente"
            value={
              <span className={totals.inspectionRequiredCargo > 0 ? "text-warning" : ""}>
                {totals.inspectionRequiredCargo}
              </span>
            }
          />
          <ContextRow
            label="Mercadorias perigosas"
            value={
              <span className={totals.hazardousCargo > 0 ? "text-risk" : ""}>
                {totals.hazardousCargo}
              </span>
            }
          />
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={"/app/audit" as Route}>Auditoria</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={"/app/reports" as Route}>Relatorios</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
