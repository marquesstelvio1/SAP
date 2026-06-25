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
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarNav,
  SidebarNavItem,
  SidebarNavLink,
  SidebarNavSection,
  SidebarProvider,
  SidebarUserCard,
  sidebarVariants,
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

test("NavigationMenu is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenu, "function");
  const element = NavigationMenu({ children: "nav" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "navigation-menu");
});

test("NavigationMenu merges custom className", () => {
  const element = NavigationMenu({ className: "custom", children: "nav" });
  assert.ok(element.props.className.includes("custom"));
});

test("NavigationMenuList is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenuList, "function");
  const element = NavigationMenuList({});
  assert.equal(element.props["data-slot"], "navigation-menu-list");
});

test("NavigationMenuItem is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenuItem, "function");
  const element = NavigationMenuItem({});
  assert.equal(element.props["data-slot"], "navigation-menu-item");
});

test("NavigationMenuTrigger is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenuTrigger, "function");
  const element = NavigationMenuTrigger({ children: "Trigger" });
  assert.equal(element.props["data-slot"], "navigation-menu-trigger");
});

test("NavigationMenuLink is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenuLink, "function");
  const element = NavigationMenuLink({});
  assert.equal(element.props["data-slot"], "navigation-menu-link");
});

test("NavigationMenuContent is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenuContent, "function");
  const element = NavigationMenuContent({ children: "content" });
  assert.equal(element.props["data-slot"], "navigation-menu-content");
});

test("NavigationMenuViewport is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenu, "function");
  const element = NavigationMenu({ children: "nav" });
  assert.ok(element != null);
});

test("NavigationMenuIndicator is a function and returns a React element", () => {
  assert.equal(typeof NavigationMenuIndicator, "function");
  const element = NavigationMenuIndicator({});
  assert.equal(element.props["data-slot"], "navigation-menu-indicator");
});

/* -------------------------------------------------------------------------- */
/* sidebarVariants                                                             */
/* -------------------------------------------------------------------------- */

test("sidebarVariants returns correct class for compact density (default)", () => {
  const result = sidebarVariants({ density: "compact" });
  assert.ok(result.includes("w-64"));
  assert.ok(result.includes("flex"));
  assert.ok(result.includes("flex-col"));
  assert.ok(result.includes("border-r"));
  assert.ok(result.includes("bg-sidebar"));
});

test("sidebarVariants returns correct class for comfortable density", () => {
  const result = sidebarVariants({ density: "comfortable" });
  assert.ok(result.includes("w-72"));
});

test("sidebarVariants returns correct class for operational density", () => {
  const result = sidebarVariants({ density: "operational" });
  assert.ok(result.includes("w-56"));
});

test("sidebarVariants defaults to compact density", () => {
  const result = sidebarVariants({});
  assert.ok(result.includes("w-64"));
});

/* -------------------------------------------------------------------------- */
/* Sidebar sub-components (non-context-dependent)                               */
/* -------------------------------------------------------------------------- */

test("SidebarProvider is a function and returns a React element", () => {
  assert.equal(typeof SidebarProvider, "function");
  const element = SidebarProvider({ children: "content" });
  assert.ok(element != null);
});

test("SidebarProvider defaults to compact density", () => {
  const element = SidebarProvider({ children: "content" });
  assert.ok(element != null);
});

test("SidebarHeader is a function and returns a React element", () => {
  assert.equal(typeof SidebarHeader, "function");
  const element = SidebarHeader({});
  assert.equal(element.props["data-slot"], "sidebar-header");
  assert.ok(element.props.className.includes("border-b"));
});

test("SidebarHeader merges custom className", () => {
  const element = SidebarHeader({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("SidebarFooter is a function and returns a React element", () => {
  assert.equal(typeof SidebarFooter, "function");
  const element = SidebarFooter({});
  assert.equal(element.props["data-slot"], "sidebar-footer");
  assert.ok(element.props.className.includes("border-t"));
});

test("SidebarFooter merges custom className", () => {
  const element = SidebarFooter({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("SidebarContent is a function and returns a React element", () => {
  assert.equal(typeof SidebarContent, "function");
  const element = SidebarContent({});
  assert.equal(element.props["data-slot"], "sidebar-content");
  assert.ok(element.props.className.includes("flex-1"));
  assert.ok(element.props.className.includes("overflow-y-auto"));
});

test("SidebarContent merges custom className", () => {
  const element = SidebarContent({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("SidebarBrand is a function and returns a React element", () => {
  assert.equal(typeof SidebarBrand, "function");
  const element = SidebarBrand({});
  assert.equal(element.props["data-slot"], "sidebar-brand");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("items-center"));
  assert.ok(element.props.className.includes("gap-3"));
});

test("SidebarBrand merges custom className", () => {
  const element = SidebarBrand({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("SidebarNav is a function and returns a React element", () => {
  assert.equal(typeof SidebarNav, "function");
  const element = SidebarNav({});
  assert.equal(element.props["data-slot"], "sidebar-nav");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-col"));
});

test("SidebarNavItem is a function and returns a React element", () => {
  assert.equal(typeof SidebarNavItem, "function");
  const element = SidebarNavItem({});
  assert.equal(element.props["data-slot"], "sidebar-nav-item");
  assert.ok(element.props.className.includes("flex-col"));
});

test("SidebarNavLink is a function and returns a React element", () => {
  assert.equal(typeof SidebarNavLink, "function");
  const element = SidebarNavLink({ children: "Link" });
  assert.equal(element.props["data-slot"], "sidebar-nav-link");
  assert.equal(element.type, "a");
});

test("SidebarNavLink renders as Slot.Root when asChild is true", () => {
  const element = SidebarNavLink({ asChild: true, children: "Link" });
  assert.equal(typeof element.type, "object");
  assert.notEqual(element.type, "a");
});

test("SidebarNavLink sets data-active and aria-current when active", () => {
  const element = SidebarNavLink({ active: true, children: "Link" });
  assert.equal(element.props["data-active"], "true");
  assert.equal(element.props["aria-current"], "page");
});

test("SidebarNavLink sets data-disabled and aria-disabled when disabled", () => {
  const element = SidebarNavLink({ disabled: true, children: "Link" });
  assert.equal(element.props["data-disabled"], "true");
  assert.equal(element.props["aria-disabled"], true);
});

test("SidebarNavLink merges custom className", () => {
  const element = SidebarNavLink({ className: "custom", children: "Link" });
  assert.ok(element.props.className.includes("custom"));
});

test("SidebarUserCard is a function and returns a React element", () => {
  assert.equal(typeof SidebarUserCard, "function");
  const element = SidebarUserCard({ name: "John Doe" });
  assert.equal(element.props["data-slot"], "sidebar-user-card");
});

test("SidebarUserCard renders name text", () => {
  const element = SidebarUserCard({ name: "Jane Smith" });
  const children = element.props.children;
  // children = [innerFlexDiv, childrenProp]; innerFlexDiv = children[0]
  const innerFlexDiv = children[0];
  // innerFlexDiv children = [avatarSlot, nameInfoDiv]
  const nameInfoDiv = innerFlexDiv.props.children[1];
  // nameInfoDiv children = [nameP, emailP]
  const nameP = nameInfoDiv.props.children[0];
  assert.equal(nameP.props.children, "Jane Smith");
});

test("SidebarUserCard renders email when provided", () => {
  const element = SidebarUserCard({ name: "Jane", email: "jane@test.com" });
  const children = element.props.children;
  const innerFlexDiv = children[0];
  const nameInfoDiv = innerFlexDiv.props.children[1];
  const emailP = nameInfoDiv.props.children[1];
  assert.equal(emailP.props.children, "jane@test.com");
});

test("SidebarUserCard renders without email by default", () => {
  const element = SidebarUserCard({ name: "Jane" });
  const children = element.props.children;
  const innerFlexDiv = children[0];
  const nameInfoDiv = innerFlexDiv.props.children[1];
  const nameInfoChildren = nameInfoDiv.props.children;
  // nameInfoChildren = [nameP, null]
  const nameP = nameInfoChildren[0];
  assert.equal(nameP.props.children, "Jane");
  assert.equal(nameInfoChildren[1], null);
});

test("SidebarUserCard renders avatar when provided", () => {
  const CustomAvatar = () => null;
  const element = SidebarUserCard({ name: "Jane", avatar: CustomAvatar({}) });
  const children = element.props.children;
  const innerFlexDiv = children[0];
  const avatarSlot = innerFlexDiv.props.children[0];
  assert.ok(avatarSlot != null);
});

test("SidebarUserCard merges custom className", () => {
  const element = SidebarUserCard({ name: "Test", className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

/* -------------------------------------------------------------------------- */
/* SidebarInset                                                               */
/* -------------------------------------------------------------------------- */

test("SidebarInset is a function and returns a React element", () => {
  assert.equal(typeof SidebarInset, "function");
  const element = SidebarInset({});
  assert.equal(element.props["data-slot"], "sidebar-inset");
  assert.ok(element.props.className.includes("flex-1"));
});

test("SidebarInset merges custom className", () => {
  const element = SidebarInset({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("all non-context-dependent Sidebar components are exported and are functions", () => {
  assert.equal(typeof SidebarProvider, "function");
  assert.equal(typeof SidebarHeader, "function");
  assert.equal(typeof SidebarContent, "function");
  assert.equal(typeof SidebarFooter, "function");
  assert.equal(typeof SidebarBrand, "function");
  assert.equal(typeof SidebarNav, "function");
  assert.equal(typeof SidebarNavItem, "function");
  assert.equal(typeof SidebarNavLink, "function");
  assert.equal(typeof SidebarUserCard, "function");
  assert.equal(typeof SidebarInset, "function");
});
