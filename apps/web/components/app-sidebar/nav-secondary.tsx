"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@saptm/ui";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export type SecondaryNavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

export function NavSecondary({
  items,
  ...props
}: {
  items: SecondaryNavItem[];
} & React.ComponentProps<"div">) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  <Link href={item.url as Route}>
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
