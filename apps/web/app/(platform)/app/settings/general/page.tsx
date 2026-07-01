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
        badgeLabel="Configurações gerais"
        description="O utilizador autenticado não tem acesso as configuracoes gerais."
        role="alert"
        title="Configurações bloqueadas"
        variant="blocked"
      />
    );
  }

  let result: Awaited<ReturnType<typeof getSettingsOrganizationData>>;
  try {
    result = await getSettingsOrganizationData();
  } catch {
    return (
      <AccessState
        badgeLabel="Configurações gerais"
        description="Não foi possível carregar os dados da organização. Tente novamente."
        role="alert"
        title="Erro ao carregar dados"
        variant="error"
      />
    );
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Configurações gerais"
        description={result.message}
        role="alert"
        title="Dados indisponíveis"
        variant="error"
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
