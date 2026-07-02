import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
} from "@saptm/ui";
import { formatDateTime } from "@/lib/format";

export type IntegrationOverviewHeaderProps = {
  totals: {
    serviceAccounts: number;
    activeServiceAccounts: number;
    activeApiKeys: number;
    integrationEvents: number;
    processedEvents: number;
  };
  securityModel: {
    authorizationModel: string;
    idempotencyModel: string;
    secretStorage: string;
  };
  generatedAt: string;
};

export function IntegrationOverviewHeader({
  totals,
  securityModel,
  generatedAt,
}: IntegrationOverviewHeaderProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Gateway de integração</Badge>
            <Badge variant="outline">Contas de integração</Badge>
            <Badge variant="outline">Segredos protegidos</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle as="h1" className="text-3xl">
              Gateway de Integração
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Contas técnicas e integrações EDI, ERP, TOS para operações ferroviárias,
              portuárias e logísticas.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Contas" value={totals.serviceAccounts.toString()} />
          <MetricTile label="Activas" value={totals.activeServiceAccounts.toString()} />
          <MetricTile label="Chaves" value={totals.activeApiKeys.toString()} />
          <MetricTile label="Eventos" value={totals.integrationEvents.toString()} />
          <MetricTile label="Processados" value={totals.processedEvents.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controlo operacional</CardTitle>
          <CardDescription>
            Validações obrigatórias antes de qualquer integração externa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ContextRow label="Autorização" value={securityModel.authorizationModel} />
          <ContextRow label="Idempotência" value={securityModel.idempotencyModel} />
          <ContextRow label="Segredos" value={securityModel.secretStorage} />
          <ContextRow label="Gerado" value={formatDateTime(generatedAt)} />
        </CardContent>
      </Card>
    </section>
  );
}
