import {
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricTile,
} from "@saptm/ui";

export type TariffTotals = {
  rateCards: number;
  activeRateCards: number;
  rules: number;
  calculatedQuotes: number;
  approvedQuotes: number;
};

export type TariffOverviewHeaderProps = {
  totals: TariffTotals;
};

export function TariffOverviewHeader({ totals }: TariffOverviewHeaderProps) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <BadgeGroup
          items={[
            { label: "Tarifário", variant: "success" },
            { label: "Pricing operacional", variant: "outline" },
          ]}
        />
        <div className="flex flex-col gap-2">
          <CardTitle as="h1" className="text-3xl">
            Pricing operacional
          </CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7">
            Rate cards, regras tarifárias, cotações e aprovação financeira para cargas ferroviárias,
            portuárias e logísticas.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-5">
        <MetricTile label="Rate cards" value={totals.rateCards.toString()} />
        <MetricTile label="Ativos" value={totals.activeRateCards.toString()} />
        <MetricTile label="Regras" value={totals.rules.toString()} />
        <MetricTile label="Calculadas" value={totals.calculatedQuotes.toString()} />
        <MetricTile label="Aprovadas" value={totals.approvedQuotes.toString()} />
      </CardContent>
    </Card>
  );
}
