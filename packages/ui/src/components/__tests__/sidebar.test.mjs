import assert from "node:assert/strict";
import { test } from "node:test";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerVariants,
} from "../../../dist/components/navigation-menu.js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  sidebarVariants,
  useSidebar,
} from "../../../dist/components/sidebar.js";

/* -------------------------------------------------------------------------- */
/* navigationMenuTriggerVariants                                               */
/* -------------------------------------------------------------------------- */

test("navigationMenuTriggerVariants returns a class string", () => {
  const result = navigationMenuTriggerVariants();
  assert.ok(typeof result === "string");
  assert.ok(result.includes("inline-flex"));
  assert.ok(result.includes("h-9"));
  assert.ok(result.includes("rounded-md"));
});

/* -------------------------------------------------------------------------- */
/* NavigationMenu sub-components                                               */
/* -------------------------------------------------------------------------- */

test("NavigationMenu components are exported as functions", () => {
  assert.equal(typeof NavigationMenu, "function");
  assert.equal(typeof NavigationMenuList, "function");
  assert.equal(typeof NavigationMenuItem, "function");
  assert.equal(typeof NavigationMenuTrigger, "function");
  assert.equal(typeof NavigationMenuLink, "function");
  assert.equal(typeof NavigationMenuContent, "function");
  assert.equal(typeof NavigationMenuIndicator, "function");
});

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                      */
/* -------------------------------------------------------------------------- */

test("sidebarVariants returns a class string", () => {
  const result = sidebarVariants();
  assert.ok(typeof result === "string");
  assert.ok(result.includes("bg-sidebar"));
});

test("all Sidebar components and hooks are exported as functions", () => {
  assert.equal(typeof Sidebar, "function");
  assert.equal(typeof SidebarProvider, "function");
  assert.equal(typeof SidebarHeader, "function");
  assert.equal(typeof SidebarContent, "function");
  assert.equal(typeof SidebarFooter, "function");
  assert.equal(typeof SidebarGroup, "function");
  assert.equal(typeof SidebarGroupLabel, "function");
  assert.equal(typeof SidebarGroupContent, "function");
  assert.equal(typeof SidebarMenu, "function");
  assert.equal(typeof SidebarMenuItem, "function");
  assert.equal(typeof SidebarMenuButton, "function");
  assert.equal(typeof SidebarMenuAction, "function");
  assert.equal(typeof SidebarMenuBadge, "function");
  assert.equal(typeof SidebarMenuSub, "function");
  assert.equal(typeof SidebarMenuSubItem, "function");
  assert.equal(typeof SidebarMenuSubButton, "function");
  assert.equal(typeof SidebarMenuSkeleton, "function");
  assert.equal(typeof SidebarSeparator, "function");
  assert.equal(typeof SidebarRail, "function");
  assert.equal(typeof SidebarTrigger, "function");
  assert.equal(typeof SidebarInset, "function");
  assert.equal(typeof useSidebar, "function");
});
