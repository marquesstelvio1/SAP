import { AccessState } from "@saptm/ui";
import { GeneralSettingsForm } from "../../../../../components/settings/general-settings-form";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { getSettingsOrganizationData } from "../../../../../lib/settings-data";
import { updateGeneralSettingsAction } from "./actions";
import { initialGeneralSettingsFormState } from "./form-state";

export const dynamic = "force-dynamic";

export default async function GeneralSettingsPage() {
  const platformSession = await requirePlatformSession("/app/settings/general");
  const canManageTenant = platformSession.viewer.permissions.includes("tenant.manage");

  if (!canManageTenant) {
    return (
      <AccessState
        badgeLabel="RBAC"
        message="A sessao esta autenticada, mas falta tenant.manage para aceder as configuracoes."
        role="alert"
        status="Sem grant"
        title="Configuracoes bloqueadas"
        variant="empty"
      />
    );
  }

  const result = await getSettingsOrganizationData();

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Configuracoes"
        message={result.message}
        role="alert"
        status={result.status}
        title="Dados indisponiveis"
        variant="empty"
      />
    );
  }

  return (
    <GeneralSettingsForm
      action={updateGeneralSettingsAction}
      canManageTenant={canManageTenant}
      initialState={initialGeneralSettingsFormState}
      organization={result.organization}
    />
  );
}
