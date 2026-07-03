import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";
import { BrandingSettingsForm } from "../../../../../components/settings/branding-settings-form";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { getSettingsOrganizationData } from "../../../../../lib/settings-data";
import { updateBrandingSettingsAction } from "./actions";
import { initialBrandingSettingsFormState } from "./form-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marca",
  description: "Personalização da identidade visual da organização.",
};

export default async function BrandingSettingsPage() {
  const platformSession = await requirePlatformSession("/app/settings/branding");
  const canManageTenant = platformSession.viewer.permissions.includes("tenant.manage");

  if (!canManageTenant) {
    return (
      <AccessState
        badgeLabel="Marca"
        description="O utilizador autenticado não tem permissões para gerir a identidade visual da organização."
        role="alert"
        title="Marca indisponível"
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
        badgeLabel="Marca"
        description="API não respondeu dentro do tempo limite."
        role="alert"
        title="Dados indisponiveis"
        variant="error"
      />
    );
  }

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Marca"
        description={result.message}
        role="alert"
        title="Dados indisponiveis"
        variant="error"
      />
    );
  }

  return (
    <BrandingSettingsForm
      action={updateBrandingSettingsAction}
      canManageTenant={canManageTenant}
      initialState={initialBrandingSettingsFormState}
      organizationSlug={result.organization.slug}
    />
  );
}
