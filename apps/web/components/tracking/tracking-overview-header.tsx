import {
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
} from "@saptm/ui";

export type TrackingOverviewHeaderProps = {
  totals: {
    shipments: number;
    activeShipments: number;
    delayedShipments: number;
    exceptionShipments: number;
  };
  organizationId: string;
  sessionId: string;
  generatedAt: string;
};

export function TrackingOverviewHeader({
  totals,
  organizationId,
  sessionId,
  generatedAt,
}: TrackingOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <BadgeGroup
            items={[
              { label: "Primeira feature", variant: "success" },
              { label: "Operational Tracking", variant: "outline" },
            ]}
          />
          <div className="flex flex-col gap-2">
            <CardTitle className="text-3xl">Tracking operacional de cargas</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Visao governada de movimentos ferroviarios, portuarios e logisticos por tenant. Esta
              etapa entrega leitura operacional segura antes de qualquer CRUD.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Cargas" value={totals.shipments.toString()} />
          <MetricTile label="Ativas" value={totals.activeShipments.toString()} />
          <MetricTile label="Atrasos" value={totals.delayedShipments.toString()} />
          <MetricTile label="Excecoes" value={totals.exceptionShipments.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contexto auditavel</CardTitle>
          <CardDescription>Escopo resolvido por Better Auth, RBAC e organizacao.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ContextRow label="Organization" value={organizationId} />
          <ContextRow label="Session" value={sessionId} />
          <ContextRow label="Gerado em" value={generatedAt} />
        </CardContent>
      </Card>
    </section>
  );
}
