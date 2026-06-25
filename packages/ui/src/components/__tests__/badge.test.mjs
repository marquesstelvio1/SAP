import assert from "node:assert/strict";
import { test } from "node:test";

import { Badge, badgeVariants } from "../../../dist/components/badge.js";
import { BadgeGroup } from "../../../dist/components/badge-group.js";

/* -------------------------------------------------------------------------- */
/* badgeVariants                                                               */
/* -------------------------------------------------------------------------- */

test("badgeVariants returns correct default class string", () => {
  const result = badgeVariants({ variant: "default" });
  assert.ok(result.includes("bg-primary"));
  assert.ok(result.includes("text-primary-foreground"));
});

test("badgeVariants returns correct destructive class string", () => {
  const result = badgeVariants({ variant: "destructive" });
  assert.ok(result.includes("bg-destructive"));
  assert.ok(result.includes("text-destructive-foreground"));
});

test("badgeVariants returns correct info class string", () => {
  const result = badgeVariants({ variant: "info" });
  assert.ok(result.includes("bg-info"));
  assert.ok(result.includes("text-info-foreground"));
});

test("badgeVariants returns correct outline class string", () => {
  const result = badgeVariants({ variant: "outline" });
  assert.ok(result.includes("text-foreground"));
  assert.ok(!result.includes("bg-"));
});

test("badgeVariants returns correct secondary class string", () => {
  const result = badgeVariants({ variant: "secondary" });
  assert.ok(result.includes("bg-secondary"));
  assert.ok(result.includes("text-secondary-foreground"));
});

test("badgeVariants returns correct success class string", () => {
  const result = badgeVariants({ variant: "success" });
  assert.ok(result.includes("bg-success"));
  assert.ok(result.includes("text-success-foreground"));
});

test("badgeVariants returns correct warning class string", () => {
  const result = badgeVariants({ variant: "warning" });
  assert.ok(result.includes("bg-warning"));
  assert.ok(result.includes("text-warning-foreground"));
});

test("badgeVariants uses default variant when not specified", () => {
  const result = badgeVariants({});
  assert.ok(result.includes("bg-primary"));
});

/* -------------------------------------------------------------------------- */
/* Badge                                                                       */
/* -------------------------------------------------------------------------- */

test("Badge is a function and returns a React element", () => {
  assert.equal(typeof Badge, "function");
  const element = Badge({ children: "Tag" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "span");
  assert.equal(element.props["data-slot"], "badge");
});

test("Badge renders with default variant", () => {
  const element = Badge({ children: "Default" });
  assert.ok(element.props.className.includes("bg-primary"));
});

test("Badge renders with destructive variant", () => {
  const element = Badge({ children: "Error", variant: "destructive" });
  assert.ok(element.props.className.includes("bg-destructive"));
});

test("Badge renders with info variant", () => {
  const element = Badge({ children: "Info", variant: "info" });
  assert.ok(element.props.className.includes("bg-info"));
});

test("Badge renders with outline variant", () => {
  const element = Badge({ children: "Outline", variant: "outline" });
  assert.ok(element.props.className.includes("text-foreground"));
});

test("Badge renders with secondary variant", () => {
  const element = Badge({ children: "Secondary", variant: "secondary" });
  assert.ok(element.props.className.includes("bg-secondary"));
});

test("Badge renders with success variant", () => {
  const element = Badge({ children: "Success", variant: "success" });
  assert.ok(element.props.className.includes("bg-success"));
});

test("Badge renders with warning variant", () => {
  const element = Badge({ children: "Warning", variant: "warning" });
  assert.ok(element.props.className.includes("bg-warning"));
});

test("Badge renders as Slot.Root when asChild is true", () => {
  const element = Badge({ asChild: true, children: "Slot" });
  assert.equal(typeof element.type, "object");
  assert.notEqual(element.type, "span");
});

test("Badge defaults to compact density", () => {
  const element = Badge({ children: "Tag" });
  assert.ok(element.props.className.includes("h-[var(--density-compact-control-height)]"));
});

test("Badge accepts density variants", () => {
  const comfortable = Badge({ children: "Tag", density: "comfortable" });
  assert.ok(comfortable.props.className.includes("h-[var(--density-comfortable-control-height)]"));

  const operational = Badge({ children: "Tag", density: "operational" });
  assert.ok(operational.props.className.includes("h-[var(--density-operational-control-height)]"));
});

test("Badge merges custom className", () => {
  const element = Badge({ className: "custom-badge", children: "Tag" });
  assert.ok(element.props.className.includes("custom-badge"));
  assert.ok(element.props.className.includes("bg-primary"));
});

/* -------------------------------------------------------------------------- */
/* BadgeGroup                                                                  */
/* -------------------------------------------------------------------------- */

test("BadgeGroup is a function and returns a React element", () => {
  assert.equal(typeof BadgeGroup, "function");
  const element = BadgeGroup({ items: [{ label: "Tag 1" }] });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "div");
});

test("BadgeGroup renders all items", () => {
  const items = [
    { label: "Active" },
    { label: "Pending", variant: "warning" },
    { label: "Failed", variant: "destructive" },
  ];
  const element = BadgeGroup({ items });
  const children = element.props.children;
  assert.ok(Array.isArray(children));
  assert.equal(children.length, 3);
});

test("BadgeGroup passes variant to each Badge", () => {
  const items = [
    { label: "Success", variant: "success" },
    { label: "Error", variant: "destructive" },
  ];
  const element = BadgeGroup({ items });
  const children = element.props.children;
  assert.equal(children[0].props.variant, "success");
  assert.equal(children[1].props.variant, "destructive");
});

test("BadgeGroup includes flex-wrap layout", () => {
  const element = BadgeGroup({ items: [{ label: "A" }, { label: "B" }] });
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-wrap"));
  assert.ok(element.props.className.includes("gap-2"));
});
