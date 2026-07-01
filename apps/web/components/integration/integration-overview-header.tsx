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
            <Badge variant="success">Gateway de Integração P13</Badge>
            <Badge variant="outline">Service Accounts</Badge>
            <Badge variant="outline">{securityModel.secretStorage}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle as="h1" className="text-3xl">
              Gateway de Integração
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Service accounts e integrações EDI, ERP, TOS para operações ferroviárias, portuárias e
              logísticas.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <MetricTile label="Service accounts" value={totals.serviceAccounts.toString()} />
          <MetricTile label="Ativas" value={totals.activeServiceAccounts.toString()} />
          <MetricTile label="API keys" value={totals.activeApiKeys.toString()} />
          <MetricTile label="Eventos" value={totals.integrationEvents.toString()} />
          <MetricTile label="Processados" value={totals.processedEvents.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modelo de segurança</CardTitle>
          <CardDescription>
            Controles obrigatórios antes de qualquer adapter externo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ContextRow label="Autorização" value={securityModel.authorizationModel} />
          <ContextRow label="Idempotência" value={securityModel.idempotencyModel} />
          <ContextRow label="Secrets" value={securityModel.secretStorage} />
          <ContextRow label="Gerado" value={formatDateTime(generatedAt)} />
        </CardContent>
      </Card>
    </section>
  );
}
