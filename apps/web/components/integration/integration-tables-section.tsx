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
import { formatDateTime } from "@/lib/format";

export type IntegrationServiceAccount = {
  id: string;
  name: string;
  active: boolean;
  scopes: string[];
  apiKeys: Array<{ id: string; prefix: string }>;
  createdAt: string;
};

export type IntegrationRecentEvent = {
  id: string;
  eventType: string;
  sourceSystem: string;
  externalId: string;
  payload: unknown;
  receivedAt: string;
  processedAt: string | null;
};

export type IntegrationTablesSectionProps = {
  serviceAccounts: IntegrationServiceAccount[];
  recentEvents: IntegrationRecentEvent[];
};

export function IntegrationTablesSection({
  serviceAccounts,
  recentEvents,
}: IntegrationTablesSectionProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Contas de integração</CardTitle>
          <CardDescription>
            Identidades técnicas da organização com permissões operacionais e chaves activas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Contas de integração">
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Chaves</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceAccounts.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4} role="status">
                    Nenhuma conta de serviço criada para esta organização.
                  </TableCell>
                </TableRow>
              ) : (
                serviceAccounts.map((serviceAccount) => (
                  <TableRow key={serviceAccount.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{serviceAccount.name}</span>
                        <span className="text-muted-foreground text-xs">
                          Criada {formatDateTime(serviceAccount.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={serviceAccount.active ? "success" : "warning"}>
                        {serviceAccount.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {serviceAccount.scopes.map((scope) => (
                          <Badge key={scope} variant="outline">
                            {formatScopeLabel(scope)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {serviceAccount.apiKeys.length === 0 ? (
                          <Badge variant="warning">Sem chave activa</Badge>
                        ) : (
                          serviceAccount.apiKeys.map((apiKey) => (
                            <span className="font-mono text-xs" key={apiKey.id}>
                              {apiKey.prefix}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card data-testid="integration-recent-events">
        <CardHeader>
          <CardTitle>Eventos externos recentes</CardTitle>
          <CardDescription>
            Entradas EDI/TOS/ERP guardadas com referência externa única por organização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Eventos externos recentes">
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Payload</TableHead>
                <TableHead>Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4} role="status">
                    Nenhum evento externo registado.
                  </TableCell>
                </TableRow>
              ) : (
                recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{event.eventType}</span>
                        <Badge variant={event.processedAt === null ? "warning" : "success"}>
                          {event.processedAt === null ? "Recebido" : "Processado"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{event.sourceSystem}</span>
                        <span className="text-muted-foreground text-xs">{event.externalId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 font-mono text-xs">
                        {JSON.stringify(event.payload)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(event.receivedAt)}</TableCell>
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

function formatScopeLabel(scope: string): string {
  switch (scope) {
    case "integration.event.ingest":
      return "Recepção de eventos";
    case "tracking.event.record":
      return "Registo de tracking";
    case "tracking.exception.manage":
      return "Gestão de excepções";
    default:
      return "Permissão operacional";
  }
}
