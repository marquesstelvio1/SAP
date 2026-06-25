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
        badgeLabel="RBAC"
        message="A sessao esta autenticada, mas falta billing.read para aceder a faturacao."
        role="alert"
        status="Sem grant"
        title="Faturacao bloqueada"
        variant="empty"
      />
    );
  }

  const result = await getBillingOverview();

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Faturacao"
        message={result.message}
        role="alert"
        status={result.status}
        title="Dados indisponiveis"
        variant="empty"
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
