import assert from "node:assert/strict";
import { test } from "node:test";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../dist/components/breadcrumb.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../dist/components/tabs.js";

/* -------------------------------------------------------------------------- */
/* Breadcrumb sub-components                                                   */
/* -------------------------------------------------------------------------- */

test("Breadcrumb is a function and returns a React element", () => {
  assert.equal(typeof Breadcrumb, "function");
  const element = Breadcrumb({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "nav");
  assert.equal(element.props["data-slot"], "breadcrumb");
  assert.equal(element.props["aria-label"], "breadcrumb");
});

test("BreadcrumbList is a function and returns a React element", () => {
  assert.equal(typeof BreadcrumbList, "function");
  const element = BreadcrumbList({});
  assert.equal(element.type, "ol");
  assert.equal(element.props["data-slot"], "breadcrumb-list");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-wrap"));
});

test("BreadcrumbList merges custom className", () => {
  const element = BreadcrumbList({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("BreadcrumbItem is a function and returns a React element", () => {
  assert.equal(typeof BreadcrumbItem, "function");
  const element = BreadcrumbItem({});
  assert.equal(element.type, "li");
  assert.equal(element.props["data-slot"], "breadcrumb-item");
  assert.ok(element.props.className.includes("inline-flex"));
});

test("BreadcrumbItem merges custom className", () => {
  const element = BreadcrumbItem({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("BreadcrumbLink is a function and returns a React element", () => {
  assert.equal(typeof BreadcrumbLink, "function");
  const element = BreadcrumbLink({ children: "Home" });
  assert.equal(element.type, "a");
  assert.equal(element.props["data-slot"], "breadcrumb-link");
  assert.ok(element.props.className.includes("hover:text-foreground"));
});

test("BreadcrumbLink renders as Slot.Root when asChild is true", () => {
  const element = BreadcrumbLink({ asChild: true, children: "Home" });
  assert.equal(typeof element.type, "object");
  assert.notEqual(element.type, "a");
});

test("BreadcrumbLink merges custom className", () => {
  const element = BreadcrumbLink({ className: "custom", children: "Link" });
  assert.ok(element.props.className.includes("custom"));
});

test("BreadcrumbPage is a function and returns a React element", () => {
  assert.equal(typeof BreadcrumbPage, "function");
  const element = BreadcrumbPage({ children: "Current Page" });
  assert.equal(element.type, "span");
  assert.equal(element.props["data-slot"], "breadcrumb-page");
  assert.equal(element.props["aria-current"], "page");
  assert.equal(element.props["aria-disabled"], "true");
});

test("BreadcrumbPage merges custom className", () => {
  const element = BreadcrumbPage({ className: "custom", children: "Page" });
  assert.ok(element.props.className.includes("custom"));
});

test("BreadcrumbSeparator is a function and returns a React element", () => {
  assert.equal(typeof BreadcrumbSeparator, "function");
  const element = BreadcrumbSeparator({});
  assert.equal(element.type, "li");
  assert.equal(element.props["data-slot"], "breadcrumb-separator");
  assert.equal(element.props.role, "presentation");
  assert.equal(element.props["aria-hidden"], "true");
});

test("BreadcrumbEllipsis is a function and returns a React element", () => {
  assert.equal(typeof BreadcrumbEllipsis, "function");
  const element = BreadcrumbEllipsis({});
  assert.equal(element.props["data-slot"], "breadcrumb-ellipsis");
  assert.equal(element.props.role, "presentation");
  assert.equal(element.props["aria-hidden"], "true");
});

test("all Breadcrumb sub-components are exported and are functions", () => {
  assert.equal(typeof Breadcrumb, "function");
  assert.equal(typeof BreadcrumbList, "function");
  assert.equal(typeof BreadcrumbItem, "function");
  assert.equal(typeof BreadcrumbLink, "function");
  assert.equal(typeof BreadcrumbPage, "function");
  assert.equal(typeof BreadcrumbSeparator, "function");
  assert.equal(typeof BreadcrumbEllipsis, "function");
});

/* -------------------------------------------------------------------------- */
/* Tabs sub-components                                                         */
/* -------------------------------------------------------------------------- */

test("Tabs is a function and returns a React element", () => {
  assert.equal(typeof Tabs, "function");
  const element = Tabs({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "tabs");
});

test("TabsList is a function and returns a React element", () => {
  assert.equal(typeof TabsList, "function");
  const element = TabsList({});
  assert.equal(element.props["data-slot"], "tabs-list");
  assert.ok(element.props.className.includes("inline-flex"));
  assert.ok(element.props.className.includes("rounded-md"));
  assert.ok(element.props.className.includes("bg-muted"));
});

test("TabsList merges custom className", () => {
  const element = TabsList({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("TabsTrigger is a function and returns a React element", () => {
  assert.equal(typeof TabsTrigger, "function");
  const element = TabsTrigger({ children: "Tab 1" });
  assert.equal(element.props["data-slot"], "tabs-trigger");
  assert.ok(element.props.className.includes("inline-flex"));
  assert.ok(element.props.className.includes("rounded-sm"));
});

test("TabsTrigger merges custom className", () => {
  const element = TabsTrigger({ className: "custom", children: "Tab" });
  assert.ok(element.props.className.includes("custom"));
});

test("TabsContent is a function and returns a React element", () => {
  assert.equal(typeof TabsContent, "function");
  const element = TabsContent({ children: "Content" });
  assert.equal(element.props["data-slot"], "tabs-content");
  assert.ok(element.props.className.includes("mt-2"));
});

test("TabsContent merges custom className", () => {
  const element = TabsContent({ className: "custom", children: "Content" });
  assert.ok(element.props.className.includes("custom"));
});

test("all Tabs sub-components are exported and are functions", () => {
  assert.equal(typeof Tabs, "function");
  assert.equal(typeof TabsList, "function");
  assert.equal(typeof TabsTrigger, "function");
  assert.equal(typeof TabsContent, "function");
});
