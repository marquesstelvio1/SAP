import {
  Badge,
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricTile,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import {
  advisoryTypeLabels,
  modeLabels,
  resolveAdvisorySeverityVariant,
} from "../../app/(platform)/app/tracking/logic";

export type TrackingAnalyticsSectionProps = {
  analytics: {
    window: { lookbackDays: number; startedAt: string; endedAt: string };
    kpis: {
      delayRatePercent: number;
      exceptionRatePercent: number;
      eventsInWindow: number;
      highPriorityActiveShipments: number;
    };
    slaRisk: {
      overdueShipments: number;
      dueWithin24Hours: number;
      unscheduledActiveShipments: number;
    };
    modeDistribution: Array<{
      transportMode: string;
      shipments: number;
      activeShipments: number;
      delayedShipments: number;
      exceptionShipments: number;
    }>;
    eventTypeCounts: Array<{ eventType: string; count: number; latestOccurredAt: string | null }>;
    workflowStateCounts: Array<{ state: string; count: number }>;
  };
  advisory: {
    recommendations: Array<{
      id: string;
      severity: "medium" | "high" | "critical";
      type: string;
      confidenceScore: number;
      title: string;
      rationale: string;
      recommendedAction: string;
      shipment: { referenceCode: string; transportMode: string; status: string } | null;
    }>;
    policy: {
      automationAllowed: boolean;
      humanApprovalRequired: boolean;
      source: string;
    };
  };
};

export function TrackingAnalyticsSection({ analytics, advisory }: TrackingAnalyticsSectionProps) {
  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <BadgeGroup
              items={[
                { label: "Analytics operacional", variant: "info" },
                { label: `${analytics.window.lookbackDays} dias`, variant: "outline" },
              ]}
            />
            <CardTitle>Agregados de risco e SLA</CardTitle>
            <CardDescription>
              Leitura tenant-scoped para operacao, atraso, excecao, prioridade e risco de ETA.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <MetricTile
              label="Taxa atraso"
              value={`${analytics.kpis.delayRatePercent.toFixed(1)}%`}
            />
            <MetricTile
              label="Taxa excecao"
              value={`${analytics.kpis.exceptionRatePercent.toFixed(1)}%`}
            />
            <MetricTile label="Eventos" value={analytics.kpis.eventsInWindow.toString()} />
            <MetricTile
              label="Alta prioridade"
              value={analytics.kpis.highPriorityActiveShipments.toString()}
            />
            <MetricTile label="ETA vencido" value={analytics.slaRisk.overdueShipments.toString()} />
            <MetricTile label="ETA 24h" value={analytics.slaRisk.dueWithin24Hours.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuicao por modal</CardTitle>
            <CardDescription>
              Volume ativo, atrasado e em excecao por ferrovia, porto, rodovia e multimodal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Distribuicao por modal">
              <TableHeader>
                <TableRow>
                  <TableHead>Modal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ativas</TableHead>
                  <TableHead>Atrasos</TableHead>
                  <TableHead>Excecoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.modeDistribution.map((item) => (
                  <TableRow key={item.transportMode}>
                    <TableCell className="font-medium">
                      {modeLabels[item.transportMode as keyof typeof modeLabels]}
                    </TableCell>
                    <TableCell>{item.shipments}</TableCell>
                    <TableCell>{item.activeShipments}</TableCell>
                    <TableCell>
                      <Badge variant={item.delayedShipments > 0 ? "warning" : "outline"}>
                        {item.delayedShipments}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.exceptionShipments > 0 ? "destructive" : "outline"}>
                        {item.exceptionShipments}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <BadgeGroup
              items={[
                { label: "IA advisory", variant: "warning" },
                { label: "Sem automacao direta", variant: "outline" },
              ]}
            />
            <CardTitle>Recomendacoes operacionais assistidas</CardTitle>
            <CardDescription>
              Recomenda risco, recuperacao e prioridade com regras locais. Qualquer mudanca exige
              fluxo humano aprovado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {advisory.recommendations.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 p-4 text-muted-foreground text-sm">
                Sem recomendacoes operacionais para a janela atual.
              </div>
            ) : (
              advisory.recommendations.map((recommendation) => (
                <Card className="flex flex-col gap-3 p-4 shadow-none" key={recommendation.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={resolveAdvisorySeverityVariant(recommendation.severity)}>
                      {recommendation.severity}
                    </Badge>
                    <Badge variant="outline">
                      {advisoryTypeLabels[recommendation.type as keyof typeof advisoryTypeLabels]}
                    </Badge>
                    <Badge variant="secondary">
                      {(recommendation.confidenceScore * 100).toFixed(0)}% confianca
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{recommendation.title}</h3>
                    <p className="text-muted-foreground text-sm">{recommendation.rationale}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-sm">
                    {recommendation.recommendedAction}
                  </div>
                  {recommendation.shipment === null ? null : (
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {recommendation.shipment.referenceCode}
                      </span>
                      <span className="text-muted-foreground">
                        {
                          modeLabels[
                            recommendation.shipment.transportMode as keyof typeof modeLabels
                          ]
                        }{" "}
                        &middot; {recommendation.shipment.status}
                      </span>
                    </div>
                  )}
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Politica de automacao</CardTitle>
            <CardDescription>
              A IA local e consultiva; eventos, excecoes e releases continuam protegidos por RBAC,
              idempotencia, audit trail e aprovacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Automacao</span>
              <span>{advisory.policy.automationAllowed ? "Permitida" : "Bloqueada"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aprovacao humana</span>
              <span>{advisory.policy.humanApprovalRequired ? "Obrigatoria" : "Nao exigida"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fonte</span>
              <span>{advisory.policy.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operacao</span>
              <span>tracking.ai.advisory.read</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transporte</span>
              <span>GET /rpc/tracking/advisory</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
