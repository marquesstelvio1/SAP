import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
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
          <CardTitle>Workflow de exceções</CardTitle>
          <CardDescription>
            Estados extraidos dos eventos de exceção e release para suporte a auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {analytics.workflowStateCounts.map((item) => (
            <ContextRow
              key={item.state}
              label={workflowStateLabels[item.state as keyof typeof workflowStateLabels]}
              value={item.count.toString()}
            />
          ))}
          <ContextRow
            label="Sem ETA ativo"
            value={analytics.slaRisk.unscheduledActiveShipments.toString()}
          />
          <ContextRow
            label="Janela"
            value={`${analytics.window.startedAt} → ${analytics.window.endedAt}`}
          />
        </CardContent>
      </Card>
    </section>
  );
}
