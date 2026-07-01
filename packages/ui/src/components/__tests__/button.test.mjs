import assert from "node:assert/strict";
import { test } from "node:test";

import { Button, buttonVariants } from "../../../dist/components/button.js";

test("buttonVariants returns correct default class string", () => {
  const result = buttonVariants({ variant: "default" });
  assert.ok(result.includes("bg-primary"));
  assert.ok(result.includes("text-primary-foreground"));
  assert.ok(result.includes("shadow-panel"));
  assert.ok(result.includes("inline-flex"));
  assert.ok(result.includes("rounded-md"));
});

test("buttonVariants returns correct destructive class string", () => {
  const result = buttonVariants({ variant: "destructive" });
  assert.ok(result.includes("bg-destructive"));
  assert.ok(result.includes("text-destructive-foreground"));
});

test("buttonVariants returns correct ghost class string", () => {
  const result = buttonVariants({ variant: "ghost" });
  assert.ok(result.includes("hover:bg-accent"));
  assert.ok(!result.includes("shadow-panel"));
});

test("buttonVariants returns correct link class string", () => {
  const result = buttonVariants({ variant: "link" });
  assert.ok(result.includes("hover:underline"));
  assert.ok(result.includes("underline-offset-4"));
});

test("buttonVariants returns correct outline class string", () => {
  const result = buttonVariants({ variant: "outline" });
  assert.ok(result.includes("border-input"));
  assert.ok(result.includes("bg-background"));
});

test("buttonVariants returns correct secondary class string", () => {
  const result = buttonVariants({ variant: "secondary" });
  assert.ok(result.includes("bg-secondary"));
  assert.ok(result.includes("text-secondary-foreground"));
});

test("buttonVariants accepts size variants without error", () => {
  const defaultSize = buttonVariants({ size: "default" });
  const smSize = buttonVariants({ size: "sm" });
  const lgSize = buttonVariants({ size: "lg" });
  const iconSize = buttonVariants({ size: "icon" });

  assert.ok(typeof defaultSize === "string");
  assert.ok(typeof smSize === "string");
  assert.ok(typeof lgSize === "string");
  assert.ok(typeof iconSize === "string");
});

test("buttonVariants uses default variant when not specified", () => {
  const result = buttonVariants({});
  assert.ok(result.includes("bg-primary"));
});

test("Button is a function and returns a React element", () => {
  const element = Button({ children: "Click me" });
  assert.equal(typeof Button, "function");
  assert.ok(element != null);
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "button");
  assert.equal(element.props["data-slot"], "button");
});

test("Button renders as Slot.Root when asChild is true", () => {
  const element = Button({ asChild: true, children: "Click" });
  assert.equal(typeof element.type, "object");
  assert.notEqual(element.type, "button");
});

test("Button uses sizeStyles via style prop", () => {
  const element = Button({ children: "Click", size: "lg" });
  assert.equal(element.props.style.height, undefined);
  assert.equal(element.props.style.paddingLeft, "var(--space-6)");
});

test("Button passes className to cn for merging", () => {
  const element = Button({ className: "my-custom-class", children: "Click" });
  assert.ok(element.props.className.includes("my-custom-class"));
  assert.ok(element.props.className.includes("bg-primary"));
});

test("Button passes through additional HTML props", () => {
  const element = Button({ "data-testid": "test-button", children: "Click", type: "submit" });
  assert.equal(element.props["data-testid"], "test-button");
  assert.equal(element.props.type, "submit");
});

test("Button resolves size default when only variant is provided", () => {
  const element = Button({ variant: "destructive", children: "Delete" });
  assert.equal(element.props.style.height, undefined);
});
