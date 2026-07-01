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
import { advisoryDecisionStatusLabels, advisoryTypeLabels } from "../../lib/capacity";

export type CapacityDecisionGroup = {
  recommendationType: string;
  decisions: number;
  approved: number;
  approvalRatePercent: number;
};

export type CapacityRecentDecision = {
  id: string;
  recommendationType: string;
  decisionStatus: string;
  decidedByName: string;
};

export type CapacityDecisionsTablesProps = {
  byRecommendationType: CapacityDecisionGroup[];
  recentDecisions: CapacityRecentDecision[];
};

export function CapacityDecisionsTables({
  byRecommendationType,
  recentDecisions,
}: CapacityDecisionsTablesProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Decisoes por tipo</CardTitle>
          <CardDescription>Distribuicao das decisoes humanas por recomendacao.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Decisoes por tipo">
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Decisoes</TableHead>
                <TableHead>Aprovadas</TableHead>
                <TableHead>Taxa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byRecommendationType.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4} role="status">
                    Sem decisoes de advisory na janela atual.
                  </TableCell>
                </TableRow>
              ) : (
                byRecommendationType.map((group) => (
                  <TableRow key={group.recommendationType}>
                    <TableCell>
                      {
                        advisoryTypeLabels[
                          group.recommendationType as keyof typeof advisoryTypeLabels
                        ]
                      }
                    </TableCell>
                    <TableCell>{group.decisions}</TableCell>
                    <TableCell>{group.approved}</TableCell>
                    <TableCell>{group.approvalRatePercent.toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decisoes recentes</CardTitle>
          <CardDescription>Ultimas decisoes gravadas com evidencia humana.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Decisoes recentes">
            <TableHeader>
              <TableRow>
                <TableHead>Recomendacao</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Decisor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDecisions.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={3} role="status">
                    Sem decisoes humanas registadas.
                  </TableCell>
                </TableRow>
              ) : (
                recentDecisions.map((decision) => (
                  <TableRow key={decision.id}>
                    <TableCell className="font-medium">
                      {
                        advisoryTypeLabels[
                          decision.recommendationType as keyof typeof advisoryTypeLabels
                        ]
                      }
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={decision.decisionStatus === "approved" ? "success" : "warning"}
                      >
                        {
                          advisoryDecisionStatusLabels[
                            decision.decisionStatus as keyof typeof advisoryDecisionStatusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>{decision.decidedByName}</TableCell>
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
