import {
  BadgeGroup,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export type CapacityOverviewHeaderProps = {
  totals: {
    resources: number;
    openSlots: number;
    blockedSlots: number;
    closedSlots: number;
    activeReservations: number;
  };
};

export function CapacityOverviewHeader({ totals }: CapacityOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <BadgeGroup
            items={[
              { label: "Capacidade", variant: "success" },
              { label: "Slots e reservas", variant: "outline" },
            ]}
          />
          <div className="flex flex-col gap-2">
            <CardTitle as="h1" className="text-3xl">
              Capacidade operacional
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Recursos, janelas e reservas de capacidade para ferrovia, porto e logística.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Recursos" value={totals.resources.toString()} />
          <MetricTile label="Slots abertos" value={totals.openSlots.toString()} />
          <MetricTile label="Bloqueados" value={totals.blockedSlots.toString()} />
          <MetricTile label="Fechados" value={totals.closedSlots.toString()} />
          <MetricTile label="Reservas ativas" value={totals.activeReservations.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservas e slots</CardTitle>
          <CardDescription>Total de reservas ativas e capacidade disponível.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ContextRow label="Total de reservas" value={totals.activeReservations.toString()} />
          <ContextRow label="Slots abertos" value={totals.openSlots.toString()} />
          <ContextRow label="Slots bloqueados" value={totals.blockedSlots.toString()} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" variant="outline">
              <Link href={"/app/audit?subjectType=capacity&limit=25" as Route}>Auditoria</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={"/app/reports" as Route}>Reports</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
