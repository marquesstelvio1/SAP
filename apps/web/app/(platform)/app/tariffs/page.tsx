import type { PlatformPermission } from "@saptm/auth";
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

import { TariffQuoteApproveForm } from "../../../../components/tariff-quote-approve-form";
import { TariffQuoteCalculateForm } from "../../../../components/tariff-quote-calculate-form";
import { TariffRateCardRegisterForm } from "../../../../components/tariff-rate-card-register-form";
import { TariffRateRuleAddForm } from "../../../../components/tariff-rate-rule-add-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getTariffOverview } from "../../../../lib/tariff-overview";
import {
  addTariffRateRuleAction,
  approveTariffQuoteAction,
  calculateTariffQuoteAction,
  registerTariffRateCardAction,
} from "./actions";
import {
  initialTariffQuoteApproveFormState,
  initialTariffQuoteCalculateFormState,
  initialTariffRateCardRegisterFormState,
  initialTariffRateRuleAddFormState,
} from "./form-state";

const readTariffPermission: PlatformPermission = "tariff.read";
const manageTariffPermission: PlatformPermission = "tariff.manage";
const calculateTariffPermission: PlatformPermission = "tariff.quote.calculate";
const approveTariffPermission: PlatformPermission = "tariff.quote.approve";

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

export default async function TariffOverviewPage() {
  const platformSession = await requirePlatformSession("/app/tariffs");
  const viewerPermissions = platformSession.viewer.permissions;
  const canManageTariffs = viewerPermissions.includes(manageTariffPermission);
  const canCalculateQuotes = viewerPermissions.includes(calculateTariffPermission);
  const canApproveQuotes = viewerPermissions.includes(approveTariffPermission);

  if (!viewerPermissions.includes(readTariffPermission)) {
    return (
      <TariffAccessState
        message="A sessao esta autenticada, mas falta a permissao tariff.read para abrir o modulo."
        status="Sem grant"
        title="Tariff / Pricing bloqueado"
      />
    );
  }

  const result = await getTariffOverview();

  if (result.status !== "ok") {
    return (
      <TariffAccessState
        message={result.message}
        status={result.status}
        title="Tariff / Pricing indisponivel"
      />
    );
  }

  const { overview } = result;

  return (
    <main className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">P10 local</Badge>
            <Badge variant="outline">Tariff / Pricing</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-3xl">Pricing operacional governado</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Rate cards, regras tarifarias, cotacoes e aprovacao financeira para cargas
              ferroviarias, portuarias e logisticas. Nenhuma cotacao e aprovada sem evidencia
              humana, audit trail, idempotencia e outbox.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <MetricTile label="Rate cards" value={overview.totals.rateCards.toString()} />
          <MetricTile label="Ativos" value={overview.totals.activeRateCards.toString()} />
          <MetricTile label="Regras" value={overview.totals.rules.toString()} />
          <MetricTile label="Calculadas" value={overview.totals.calculatedQuotes.toString()} />
          <MetricTile label="Aprovadas" value={overview.totals.approvedQuotes.toString()} />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rate cards ativos</CardTitle>
            <CardDescription>
              Tabelas tarifarias tenant-scoped disponiveis para cotacao.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rate card</TableHead>
                  <TableHead>Moeda</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.activeRateCards.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={4}>
                      Sem rate cards ativos neste tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.activeRateCards.map((rateCard) => (
                    <TableRow key={rateCard.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{rateCard.rateCardCode}</span>
                          <span className="text-muted-foreground text-xs">
                            {rateCard.rateCardName}
                          </span>
                          <span className="text-muted-foreground text-xs">{rateCard.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>{rateCard.currencyCode}</TableCell>
                      <TableCell>
                        {rateCard.validFrom} → {rateCard.validUntil ?? "sem fim"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rateCard.status === "active" ? "success" : "outline"}>
                          {rateCardStatusLabels[rateCard.status]}
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
            <CardTitle>Cotacoes recentes</CardTitle>
            <CardDescription>
              Historico auditavel de calculo e aprovacao financeira.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cotacao</TableHead>
                  <TableHead>Carga</TableHead>
                  <TableHead>Imposto</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={5}>
                      Sem cotacoes neste tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.recentQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{quote.quoteReference}</span>
                          <span className="text-muted-foreground text-xs">
                            {quote.rateCardCode}
                          </span>
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
                          {quoteStatusLabels[quote.status]}
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

      <section className="grid gap-6 xl:grid-cols-2">
        <TariffRateCardRegisterForm
          action={registerTariffRateCardAction}
          canManageTariffs={canManageTariffs}
          initialState={initialTariffRateCardRegisterFormState}
        />
        <TariffRateRuleAddForm
          action={addTariffRateRuleAction}
          canManageTariffs={canManageTariffs}
          initialState={initialTariffRateRuleAddFormState}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TariffQuoteCalculateForm
          action={calculateTariffQuoteAction}
          canCalculateQuotes={canCalculateQuotes}
          initialState={initialTariffQuoteCalculateFormState}
        />
        <TariffQuoteApproveForm
          action={approveTariffQuoteAction}
          canApproveQuotes={canApproveQuotes}
          initialState={initialTariffQuoteApproveFormState}
        />
      </section>

      <Card id="tariff-security-rules">
        <CardHeader>
          <CardTitle>Matriz de seguranca e regras</CardTitle>
          <CardDescription>
            Pricing nao executa operacoes sem autorizacao financeira.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <ContextRow label="Leitura" value={readTariffPermission} />
          <ContextRow label="Gestao" value={manageTariffPermission} />
          <ContextRow label="Calculo" value={calculateTariffPermission} />
          <ContextRow label="Aprovacao" value={approveTariffPermission} />
          <ContextRow label="Rate card" value="codigo unico + moeda + validade temporal" />
          <ContextRow label="Regra" value="base tarifaria valida + janela dentro do rate card" />
          <ContextRow
            label="Cotacao"
            value="carga elegivel + rate card ativo + regras aplicaveis + imposto valido"
          />
          <ContextRow label="Aprovacao" value="estado calculated + evidencia humana + referencia" />
        </CardContent>
      </Card>
    </main>
  );
}

function TariffAccessState({
  title,
  status,
  message,
}: {
  title: string;
  status: string;
  message: string;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-2xl">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">{status}</Badge>
            <Badge variant="outline">Tariff / Pricing</Badge>
          </div>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-base leading-7">{message}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="font-semibold text-2xl">{value}</div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}
