import type { ReactNode } from "react";

import { PlatformShell } from "../../components/platform-shell";
import { getCurrentPlatformSession } from "../../lib/auth-session";
import { resolvePlatformNavigation } from "../../lib/platform-navigation";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const platformSession = await getCurrentPlatformSession();

  if (platformSession === undefined) {
    return children;
  }

  const navigationGroups = resolvePlatformNavigation(platformSession.viewer.permissions);

  return (
    <PlatformShell navigationGroups={navigationGroups} viewer={platformSession.viewer}>
      {children}
    </PlatformShell>
  );
}
