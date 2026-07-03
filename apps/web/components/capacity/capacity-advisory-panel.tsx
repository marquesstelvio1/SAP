import {
  Badge,
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
} from "@saptm/ui";
import { advisoryTypeLabels, resolveAdvisorySeverityVariant } from "../../lib/capacity";

export type CapacityAdvisoryRecommendation = {
  id: string;
  type: string;
  severity: string;
  title: string;
  rationale: string;
  recommendedAction: string;
  slot: {
    slotReference: string;
    resourceCode: string;
  } | null;
  metrics: {
    utilizationPercent: number;
    availableUnits: number;
  };
  confidenceScore: number;
};

export type CapacityAdvisoryPanelProps = {
  recommendations: CapacityAdvisoryRecommendation[];
  policy: {
    automationAllowed: boolean;
    humanApprovalRequired: boolean;
    source: string;
  };
};

export function CapacityAdvisoryPanel({ recommendations, policy }: CapacityAdvisoryPanelProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <BadgeGroup
            items={[
              { label: "Advisory de capacidade", variant: "warning" },
              { label: "Sem automação direta", variant: "outline" },
            ]}
          />
          <CardTitle>Otimizacao assistida de capacidade</CardTitle>
          <CardDescription>
            Recomenda saturacao, baixa utilizacao, janelas a expirar e concentracao de reservas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {recommendations.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-4 text-muted-foreground text-sm">
              Sem recomendações de capacidade para a janela atual.
            </div>
          ) : (
            recommendations.map((recommendation) => (
              <div
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground"
                key={recommendation.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={resolveAdvisorySeverityVariant(
                      recommendation.severity as "low" | "medium" | "high" | "critical",
                    )}
                  >
                    {recommendation.severity}
                  </Badge>
                  <Badge variant="outline">
                    {advisoryTypeLabels[recommendation.type as keyof typeof advisoryTypeLabels]}
                  </Badge>
                  <Badge variant="secondary">
                    {(recommendation.confidenceScore * 100).toFixed(0)}% confiança
                  </Badge>
                  <Badge variant="outline">
                    {recommendation.metrics.utilizationPercent.toFixed(1)}% uso
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">{recommendation.title}</h3>
                  <p className="text-muted-foreground text-sm">{recommendation.rationale}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  {recommendation.recommendedAction}
                </div>
                {recommendation.slot === null ? null : (
                  <ContextRow
                    label={recommendation.slot.slotReference}
                    value={`${recommendation.slot.resourceCode} · ${recommendation.metrics.availableUnits} unidade(s) livres`}
                  />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card id="capacity-optimization-policy">
        <CardHeader>
          <CardTitle>Política de otimização</CardTitle>
          <CardDescription>
            O motor local apenas recomenda; abertura, reserva e cancelamento exigem autorização.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ContextRow
            label="Automação"
            value={policy.automationAllowed ? "Permitida" : "Bloqueada"}
          />
          <ContextRow
            label="Aprovação humana"
            value={policy.humanApprovalRequired ? "Obrigatória" : "Não exigida"}
          />
          <ContextRow label="Fonte" value={policy.source} />
        </CardContent>
      </Card>
    </section>
  );
}
