import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";

export type TariffRateCard = {
  id: string;
  rateCardCode: string;
  rateCardName: string;
  status: string;
  currencyCode: string;
  validFrom: string;
  validUntil: string | null;
};

export type TariffQuote = {
  id: string;
  quoteReference: string;
  cargoReference: string;
  rateCardCode: string;
  status: string;
  currencyCode: string;
  taxAmount: number;
  quotedAmount: number;
};

export type TariffTablesSectionProps = {
  activeRateCards: TariffRateCard[];
  recentQuotes: TariffQuote[];
};

const rateCardStatusLabels = {
  draft: "Draft",
  active: "Ativo",
  retired: "Retirado",
} as const;

const quoteStatusLabels = {
  calculated: "Calculada",
  approved: "Aprovada",
  rejected: "Rejeitada",
  expired: "Expirada",
} as const;

export function TariffTablesSection({ activeRateCards, recentQuotes }: TariffTablesSectionProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Rate cards ativos</CardTitle>
          <CardDescription>Tabelas tarifarias disponiveis para cotação.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Rate cards ativos">
            <TableHeader>
              <TableRow>
                <TableHead>Rate card</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRateCards.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4} role="status">
                    Sem rate cards ativos registados.
                  </TableCell>
                </TableRow>
              ) : (
                activeRateCards.map((rateCard) => (
                  <TableRow key={rateCard.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{rateCard.rateCardCode}</span>
                        <span className="text-muted-foreground text-xs">
                          {rateCard.rateCardName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{rateCard.currencyCode}</TableCell>
                    <TableCell>
                      {rateCard.validFrom} &rarr; {rateCard.validUntil ?? "sem fim"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rateCard.status === "active" ? "success" : "outline"}>
                        {rateCardStatusLabels[rateCard.status as keyof typeof rateCardStatusLabels]}
                      </Badge>
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
          <CardTitle>Cotações recentes</CardTitle>
          <CardDescription>Historico auditável de calculo e aprovação financeira.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Cotações recentes">
            <TableHeader>
              <TableRow>
                <TableHead>Cotação</TableHead>
                <TableHead>Carga</TableHead>
                <TableHead>Imposto</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQuotes.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5} role="status">
                    Sem cotações registadas.
                  </TableCell>
                </TableRow>
              ) : (
                recentQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{quote.quoteReference}</span>
                        <span className="text-muted-foreground text-xs">{quote.rateCardCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>{quote.cargoReference}</TableCell>
                    <TableCell>
                      {quote.currencyCode} {quote.taxAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {quote.currencyCode} {quote.quotedAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={quote.status === "approved" ? "success" : "outline"}>
                        {quoteStatusLabels[quote.status as keyof typeof quoteStatusLabels]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
