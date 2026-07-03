import { AccessState } from "@saptm/ui";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { getBillingOverview } from "../../../../../lib/billing";
import { BillingPageContent } from "./billing-page-content";

export const dynamic = "force-dynamic";

export default async function BillingSettingsPage() {
  const platformSession = await requirePlatformSession("/app/settings/billing");

  if (!platformSession.viewer.permissions.includes("billing.read")) {
    return (
      <AccessState
        badgeLabel="Faturação"
        description="O utilizador autenticado não tem acesso ao módulo de faturação."
        role="alert"
        title="Faturação bloqueada"
        variant="blocked"
      />
    );
  }

  let result: Awaited<ReturnType<typeof getBillingOverview>>;

  try {
    result = await getBillingOverview();
  } catch {
    return (
      <AccessState
        badgeLabel="Faturação"
        description="API nao respondeu dentro do tempo limite."
        role="alert"
        title="Dados indisponiveis"
        variant="error"
      />
    );
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Faturação"
        description={result.message}
        role="alert"
        title="Dados indisponiveis"
        variant="error"
      />
    );
  }

  if (result.subscription === null) {
    return (
      <BillingPageContent
        subscription={null}
        usage={result.usage}
        recentInvoices={result.recentInvoices}
      />
    );
  }

  return (
    <BillingPageContent
      subscription={result.subscription}
      usage={result.usage}
      recentInvoices={result.recentInvoices}
    />
  );
}
