"use client";

import {
  Avatar,
  AvatarFallback,
  cn,
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
} from "@saptm/ui";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export function TeamSwitcher({
  organizations,
  activeOrganization,
  onSwitch,
}: {
  organizations: Organization[];
  activeOrganization: Organization;
  onSwitch: (org: Organization) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                  {activeOrganization.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeOrganization.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {activeOrganization.slug}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              Organizações
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => {
                  onSwitch(org);
                  setOpen(false);
                }}
                className={cn(
                  "gap-2 p-2",
                  org.id === activeOrganization.id && "bg-accent font-medium",
                )}
              >
                <Avatar className="size-6 rounded-sm">
                  <AvatarFallback className="rounded-sm bg-sidebar-primary/20 text-sidebar-primary text-[10px] font-medium">
                    {org.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1">{org.name}</span>
                {org.id === activeOrganization.id && <CheckIcon className="size-4" />}
                <DropdownMenuShortcut>{org.slug}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <PlusIcon className="size-4" />
              <span>Criar organização</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
