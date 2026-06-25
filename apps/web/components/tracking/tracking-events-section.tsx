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
import { eventTypeLabels, workflowStateLabels } from "../../app/(platform)/app/tracking/logic";

export type TrackingEventsSectionProps = {
  analytics: {
    slaRisk: { unscheduledActiveShipments: number };
    window: { startedAt: string; endedAt: string };
    eventTypeCounts: Array<{ eventType: string; count: number; latestOccurredAt: string | null }>;
    workflowStateCounts: Array<{ state: string; count: number }>;
  };
};

export function TrackingEventsSection({ analytics }: TrackingEventsSectionProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Eventos por janela</CardTitle>
          <CardDescription>
            Frequencia de eventos operacionais no periodo analisado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Eventos por janela">
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Ultima ocorrencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.eventTypeCounts.map((item) => (
                <TableRow key={item.eventType}>
                  <TableCell className="font-medium">
                    {eventTypeLabels[item.eventType as keyof typeof eventTypeLabels]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.count > 0 ? "secondary" : "outline"}>{item.count}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.latestOccurredAt ?? "Sem ocorrencia"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow de excecoes</CardTitle>
          <CardDescription>
            Estados extraidos dos eventos de excecao e release para suporte a auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {analytics.workflowStateCounts.map((item) => (
            <div key={item.state} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {workflowStateLabels[item.state as keyof typeof workflowStateLabels]}
              </span>
              <span>{item.count.toString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sem ETA ativo</span>
            <span>{analytics.slaRisk.unscheduledActiveShipments.toString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Janela</span>
            <span>
              {analytics.window.startedAt} -&gt; {analytics.window.endedAt}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
