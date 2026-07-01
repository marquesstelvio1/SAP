import type { ReactNode } from "react";
import { SettingsShell } from "../../../../components/settings/settings-shell";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getSettingsOrganizationData } from "../../../../lib/settings-data";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const platformSession = await requirePlatformSession("/app/settings/general");
  const canManageTenant = platformSession.viewer.permissions.includes("tenant.manage");

  const orgData = canManageTenant ? await getSettingsOrganizationData() : undefined;
  const orgName = orgData?.status === "ok" ? orgData.organization.name : "Organizacao";

  return <SettingsShell organizationName={orgName}>{children}</SettingsShell>;
}
