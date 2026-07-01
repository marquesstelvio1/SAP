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

export type CapacityAdvisoryAnalyticsProps = {
  analytics: {
    totals: {
      decisions: number;
      approved: number;
      rejected: number;
      approvalRatePercent: number;
      decisionsWithApprovalReference: number;
    };
    window: {
      windowDays: number;
    };
  };
};

export function CapacityAdvisoryAnalytics({ analytics }: CapacityAdvisoryAnalyticsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card id="capacity-advisory-decision-analytics">
        <CardHeader>
          <BadgeGroup
            items={[
              { label: "Analytics", variant: "info" },
              { label: "Decisoes de advisory", variant: "outline" },
            ]}
          />
          <CardTitle>Analytics de decisoes de advisory</CardTitle>
          <CardDescription>
            Mede aprovacao/rejeicao de recomendacoes gravadas por humanos. Este bloco e apenas
            consultivo e nao executa abertura, reserva ou cancelamento de capacidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Decisoes" value={analytics.totals.decisions.toString()} />
          <MetricTile label="Aprovadas" value={analytics.totals.approved.toString()} />
          <MetricTile label="Rejeitadas" value={analytics.totals.rejected.toString()} />
          <MetricTile
            label="Taxa aprov."
            value={`${analytics.totals.approvalRatePercent.toFixed(1)}%`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Janela de analise</CardTitle>
          <CardDescription>Periodo considerado para as decisoes de advisory.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <ContextRow label="Janela" value={`${analytics.window.windowDays} dias`} />
          <ContextRow
            label="Com aprovacao"
            value={analytics.totals.decisionsWithApprovalReference.toString()}
          />
        </CardContent>
      </Card>
    </section>
  );
}
