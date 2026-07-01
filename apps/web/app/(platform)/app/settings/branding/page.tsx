import { AccessState } from "@saptm/ui";
import { BrandingSettingsForm } from "../../../../../components/settings/branding-settings-form";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { getSettingsOrganizationData } from "../../../../../lib/settings-data";
import { updateBrandingSettingsAction } from "./actions";
import { initialBrandingSettingsFormState } from "./form-state";

export const dynamic = "force-dynamic";

export default async function BrandingSettingsPage() {
  const platformSession = await requirePlatformSession("/app/settings/branding");
  const canManageTenant = platformSession.viewer.permissions.includes("tenant.manage");

  if (!canManageTenant) {
    return (
      <AccessState
        badgeLabel="Branding"
        description="O utilizador autenticado não tem permissões para gerir a identidade visual da organização."
        role="alert"
        title="Branding indisponível"
        variant="blocked"
      />
    );
  }

  const result = await getSettingsOrganizationData();

  return (
    <BrandingSettingsForm
      action={updateBrandingSettingsAction}
      canManageTenant={canManageTenant}
      initialState={initialBrandingSettingsFormState}
      organizationSlug={result.status === "ok" ? result.organization.slug : ""}
    />
  );
}
