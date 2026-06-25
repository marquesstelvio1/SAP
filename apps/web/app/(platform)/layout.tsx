import type { ReactNode } from "react";

import { AppSidebar } from "../../components/app-sidebar/app-sidebar";
import {
  BreadcrumbNav,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/shell/platform-shell-client";
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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar navigationGroups={navigationGroups} viewer={platformSession.viewer} />
      <SidebarInset>
        <header className="sticky top-0 z-sticky flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <SidebarTrigger />
          <BreadcrumbNav />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden h-7 items-center gap-1 rounded-md border bg-muted px-1.5 font-mono text-[0.65rem] text-muted-foreground md:inline-flex">
              <span className="text-xs">&#8984;</span>K
            </span>
          </div>
        </header>
        <main id="main-content" className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
