"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@saptm/ui";
import {
  ActivityIcon,
  ContainerIcon,
  CreditCardIcon,
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
import type { LucideIcon } from "lucide-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

const iconMap: Record<string, LucideIcon> = {
  cargo: ContainerIcon,
  tracking: MapPinIcon,
  capacity: ActivityIcon,
  planning: RouteIcon,
  tariffs: TrendingUpIcon,
  admin: UsersIcon,
  teams: UsersIcon,
  audit: NotepadTextIcon,
  reports: FileTextIcon,
  notifications: TruckIcon,
  integrations: MapIcon,
  settings: SettingsIcon,
  security: ShieldCheckIcon,
  billing: CreditCardIcon,
};

function findIcon(label: string): LucideIcon | undefined {
  const key = label.toLowerCase().replace(/\s+/g, "");
  for (const [k, icon] of Object.entries(iconMap)) {
    if (key.includes(k)) return icon;
  }
  return undefined;
}

export function AppSidebar({
  navigationGroups,
  viewer,
}: {
  navigationGroups: readonly ResolvedPlatformNavigationGroup[];
  viewer: PlatformViewer;
}) {
  const navMainItems = navigationGroups.flatMap((group) => {
    const groupIcon = findIcon(group.label);
    const allItems = group.items;
    if (allItems.length === 0) return [];
    if (allItems.length === 1) {
      const item = allItems[0]!;
      const icon = findIcon(item.label) ?? groupIcon;
      return [
        <NavMain
          key={group.label}
          label={group.label}
          items={[
            {
              title: item.label,
              url: item.href,
              ...(icon ? { icon } : {}),
            },
          ]}
        />,
      ];
    }
    const first = allItems[0]!;
    const rest = allItems.slice(1);
    const icon = findIcon(first.label) ?? groupIcon;
    return [
      <NavMain
        key={group.label}
        label={group.label}
        items={[
          {
            title: first.label,
            url: first.href,
            ...(icon ? { icon } : {}),
            items: rest.map((r) => ({
              title: r.label,
              url: r.href,
            })),
          },
        ]}
      />,
    ];
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher
          organizations={[
            { id: "1", name: "SAPTM", slug: "saptm", isActive: true },
          ]}
          activeOrganization={{
            id: "1",
            name: "SAPTM",
            slug: "saptm",
            isActive: true,
          }}
          onSwitch={() => {}}
        />
      </SidebarHeader>
      <SidebarContent>
        {navMainItems}
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
