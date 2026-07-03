import { getUserOrganizations } from "@saptm/auth/server";
import { Badge, Button, Separator } from "@saptm/ui";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { AppSidebar } from "../../components/app-sidebar/app-sidebar";
import { QueryTenantBoundary } from "../../components/query-tenant-boundary";
import { BreadcrumbNav } from "../../components/shell/breadcrumb-nav";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/shell/platform-shell-client";
import { getCurrentPlatformSession } from "../../lib/auth-session";
import { resolvePlatformNavigation } from "../../lib/platform-navigation";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await connection();
  const platformSession = await getCurrentPlatformSession();

  if (platformSession === undefined) {
    return children;
  }

  const navigationGroups = resolvePlatformNavigation(platformSession.viewer.permissions);
  const organizations = await getUserOrganizations(platformSession.viewer.id);

  const activeOrganization =
    organizations.find((org) => org.id === platformSession.viewer.organizationId) ??
    organizations[0];

  const organizationName = activeOrganization?.name ?? "Workspace ativo";
  const environmentLabel = process.env.NODE_ENV === "production" ? "Produção" : "Desenvolvimento";

  const hasTrackingAccess = navigationGroups.some((g) =>
    g.items.some((i) => i.href.startsWith("/app/tracking") && i.allowed),
  );
  const hasAuditAccess = navigationGroups.some((g) =>
    g.items.some((i) => i.href.startsWith("/app/audit") && i.allowed),
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        navigationGroups={navigationGroups}
        viewer={platformSession.viewer}
        organizations={organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          isActive: org.id === platformSession.viewer.organizationId,
        }))}
        activeOrganizationId={platformSession.viewer.organizationId}
      />
      <SidebarInset>
        <header className="flex h-[var(--layout-header-height)] shrink-0 items-center gap-2 border-b transition-[width] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--density-row-height)]">
          <div className="flex flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <div className="flex min-w-0 items-center gap-3">
              <span className="truncate text-sm font-medium">{organizationName}</span>
              <span className="hidden text-xs text-muted-foreground md:inline">
                {platformSession.viewer.email}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{environmentLabel}</Badge>
              <Badge variant={platformSession.viewer.organizationId ? "secondary" : "destructive"}>
                {platformSession.viewer.organizationId
                  ? "Sessão organizacional"
                  : "Sem organização ativa"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {hasTrackingAccess ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/app/tracking">Tracking</Link>
                </Button>
              ) : null}
              {hasAuditAccess ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/app/audit">Auditoria</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <BreadcrumbNav />
          <QueryTenantBoundary organizationId={platformSession.viewer.organizationId}>
            {children}
          </QueryTenantBoundary>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
