"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@saptm/ui";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { setActiveOrganization } from "../../lib/org-actions";

export type TeamSwitcherOrganization = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export function TeamSwitcher({
  organizations,
  activeOrganization,
}: {
  organizations: TeamSwitcherOrganization[];
  activeOrganization: TeamSwitcherOrganization;
}) {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSwitch = useCallback(
    async (organizationId: string) => {
      setOpen(false);
      const formData = new FormData();
      formData.set("organizationId", organizationId);
      await setActiveOrganization(formData);
      router.refresh();
    },
    [router],
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-sm font-semibold">
                  {activeOrganization.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrganization.name}</span>
                <span className="truncate text-xs">{activeOrganization.slug}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizações
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <span className="text-xs font-medium">{org.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <span className="flex-1">{org.name}</span>
                {org.id === activeOrganization.id && <CheckIcon className="size-4 shrink-0" />}
                <DropdownMenuShortcut>{org.slug}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <span className="font-medium text-muted-foreground">Criar organização</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
