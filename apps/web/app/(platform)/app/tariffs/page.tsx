import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarifário",
  description:
    "Rate cards, regras tarifárias, cotações e aprovação financeira para operações logísticas.",
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
        badgeLabel="Tarifário"
        description="O utilizador autenticado não tem acesso ao módulo tarifário."
        role="alert"
        title="Tarifário bloqueado"
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
        badgeLabel="Tarifário"
        description="Não foi possível carregar os dados tarifários. Tente novamente."
        role="alert"
        title="Erro ao carregar tarifário"
        variant="error"
      />
    );
  }

  if (result.status === "unauthorized") {
    redirect("/sign-in?reason=session_expired");
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Tarifário"
        description={result.message}
        role="alert"
        title="Tarifário indisponível"
        variant="error"
      />
    );
  }

  const { overview } = result;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
    </div>
  );
}
