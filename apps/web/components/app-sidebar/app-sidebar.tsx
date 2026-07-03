"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@saptm/ui";
import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  ContainerIcon,
  FileTextIcon,
  MapIcon,
  MapPinIcon,
  NotepadTextIcon,
  RouteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";
import type { PlatformViewer } from "../../lib/auth-session";
import type { ResolvedPlatformNavigationGroup } from "../../lib/platform-navigation";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher, type TeamSwitcherOrganization } from "./team-switcher";

const iconMap: Record<string, LucideIcon> = {
  dashboard: ActivityIcon,
  "segurança da conta": ShieldCheckIcon,
  configurações: SettingsIcon,
  privacidade: MapPinIcon,
  "gestão de cargas": ContainerIcon,
  "tracking operacional": TruckIcon,
  "capacidade operacional": ActivityIcon,
  planeamento: RouteIcon,
  tarifas: TrendingUpIcon,
  relatórios: FileTextIcon,
  notificações: NotepadTextIcon,
  integrações: MapIcon,
  "identidade e permissões": UsersIcon,
  equipas: UsersIcon,
  auditoria: NotepadTextIcon,
};

function findIcon(label: string): LucideIcon | undefined {
  const key = label.toLowerCase().trim();
  const match = Object.entries(iconMap).find(([k]) => key.startsWith(k));
  return match?.[1];
}

type NavEntry = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

function toNavItems(group: ResolvedPlatformNavigationGroup): NavEntry[] {
  return group.items
    .filter((item) => item.allowed)
    .map((item) => {
      const icon = findIcon(item.label);
      return icon !== undefined
        ? { title: item.label, url: item.href, icon }
        : { title: item.label, url: item.href };
    });
}

export function AppSidebar({
  navigationGroups,
  viewer,
  organizations,
  activeOrganizationId,
}: {
  navigationGroups: readonly ResolvedPlatformNavigationGroup[];
  viewer: PlatformViewer;
  organizations: TeamSwitcherOrganization[];
  activeOrganizationId: string | undefined;
}) {
  const mainGroups = navigationGroups.filter((g) => !g.label.toLowerCase().includes("preparacao"));

  const activeOrganization =
    organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0];

  const fallbackOrg: TeamSwitcherOrganization = {
    id: "",
    name: "SAPTM",
    slug: "saptm",
    isActive: false,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization ?? fallbackOrg}
        />
      </SidebarHeader>
      <SidebarContent>
        {mainGroups.map((group) => {
          const items = toNavItems(group);
          if (items.length === 0) return null;
          return <NavMain key={group.label} label={group.label} items={items} />;
        })}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: viewer.name,
            email: viewer.email,
            hasTwoFactor: viewer.twoFactorEnabled,
            permissionsCount: viewer.permissions.length,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
