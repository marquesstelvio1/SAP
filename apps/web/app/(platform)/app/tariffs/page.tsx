import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";

import { TariffOverviewHeader } from "../../../../components/tariff/tariff-overview-header";
import { TariffQuoteApproveForm } from "../../../../components/tariff/tariff-quote-approve-form";
import { TariffQuoteCalculateForm } from "../../../../components/tariff/tariff-quote-calculate-form";
import { TariffRateCardRegisterForm } from "../../../../components/tariff/tariff-rate-card-register-form";
import { TariffRateRuleAddForm } from "../../../../components/tariff/tariff-rate-rule-add-form";
import { TariffRulesCard } from "../../../../components/tariff/tariff-rules-card";
import { TariffTablesSection } from "../../../../components/tariff/tariff-tables-section";
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

export const metadata: Metadata = {
  title: "Tarifario",
  description:
    "Rate cards, regras tarifarias, cotacoes e aprovacao financeira para operacoes logisticas.",
};

const readTariffPermission: PlatformPermission = "tariff.read";
const manageTariffPermission: PlatformPermission = "tariff.manage";
const calculateTariffPermission: PlatformPermission = "tariff.quote.calculate";
const approveTariffPermission: PlatformPermission = "tariff.quote.approve";

export default async function TariffOverviewPage() {
  const platformSession = await requirePlatformSession("/app/tariffs");
  const viewerPermissions = platformSession.viewer.permissions;
  const canManageTariffs = viewerPermissions.includes(manageTariffPermission);
  const canCalculateQuotes = viewerPermissions.includes(calculateTariffPermission);
  const canApproveQuotes = viewerPermissions.includes(approveTariffPermission);

  if (!viewerPermissions.includes(readTariffPermission)) {
    return (
      <AccessState
        badgeLabel="Tarifario"
        description="O utilizador autenticado nao tem acesso ao modulo tarifario."
        role="alert"
        title="Tarifario bloqueado"
        variant="blocked"
      />
    );
  }

  let result: Awaited<ReturnType<typeof getTariffOverview>>;
  try {
    result = await getTariffOverview();
  } catch {
    return (
      <AccessState
        badgeLabel="Tarifario"
        description="Nao foi possivel carregar os dados tarifarios. Tente novamente."
        role="alert"
        title="Erro ao carregar tarifario"
        variant="error"
      />
    );
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Tarifario"
        description={result.message}
        role="alert"
        title="Tarifario indisponivel"
        variant="error"
      />
    );
  }

  const { overview } = result;

  return (
    <main className="flex flex-col gap-6 max-w-7xl">
      <TariffOverviewHeader totals={overview.totals} />

      <TariffTablesSection
        activeRateCards={overview.activeRateCards}
        recentQuotes={overview.recentQuotes}
      />

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

      <TariffRulesCard />
    </main>
  );
}
