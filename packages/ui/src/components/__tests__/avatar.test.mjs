import assert from "node:assert/strict";
import { test } from "node:test";

import { Avatar, AvatarFallback, AvatarImage } from "../../../dist/components/avatar.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../dist/components/tooltip.js";

/* -------------------------------------------------------------------------- */
/* Avatar sub-components                                                       */
/* -------------------------------------------------------------------------- */

test("Avatar is a function and returns a React element", () => {
  assert.equal(typeof Avatar, "function");
  const element = Avatar({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "avatar");
});

test("Avatar includes base classes", () => {
  const element = Avatar({});
  assert.ok(element.props.className.includes("relative"));
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("size-10"));
  assert.ok(element.props.className.includes("rounded-full"));
});

test("Avatar merges custom className", () => {
  const element = Avatar({ className: "custom-avatar" });
  assert.ok(element.props.className.includes("custom-avatar"));
  assert.ok(element.props.className.includes("rounded-full"));
});

test("Avatar passes through additional props", () => {
  const element = Avatar({ "aria-label": "User avatar" });
  assert.equal(element.props["aria-label"], "User avatar");
});

test("AvatarImage is a function and returns a React element", () => {
  assert.equal(typeof AvatarImage, "function");
  const element = AvatarImage({});
  assert.equal(element.props["data-slot"], "avatar-image");
  assert.ok(element.props.className.includes("aspect-square"));
});

test("AvatarImage merges custom className", () => {
  const element = AvatarImage({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("AvatarImage passes through additional props", () => {
  const element = AvatarImage({ src: "https://example.com/avatar.jpg", alt: "User" });
  assert.equal(element.props.src, "https://example.com/avatar.jpg");
  assert.equal(element.props.alt, "User");
});

test("AvatarFallback is a function and returns a React element", () => {
  assert.equal(typeof AvatarFallback, "function");
  const element = AvatarFallback({});
  assert.equal(element.props["data-slot"], "avatar-fallback");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("rounded-full"));
  assert.ok(element.props.className.includes("bg-muted"));
});

test("AvatarFallback merges custom className", () => {
  const element = AvatarFallback({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("AvatarFallback renders children", () => {
  const element = AvatarFallback({ children: "JD" });
  assert.equal(element.props.children, "JD");
});

/* -------------------------------------------------------------------------- */
/* Tooltip sub-components                                                      */
/* -------------------------------------------------------------------------- */

test("TooltipProvider is a function and returns a React element", () => {
  assert.equal(typeof TooltipProvider, "function");
  const element = TooltipProvider({ children: "content" });
  assert.equal(element.props["data-slot"], "tooltip-provider");
});

test("Tooltip is a function and returns a React element", () => {
  assert.equal(typeof Tooltip, "function");
  const element = Tooltip({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "tooltip");
});

test("TooltipTrigger is a function and returns a React element", () => {
  assert.equal(typeof TooltipTrigger, "function");
  const element = TooltipTrigger({ children: "Hover me" });
  assert.equal(element.props["data-slot"], "tooltip-trigger");
});

test("TooltipContent is a function and returns a React element", () => {
  assert.equal(typeof TooltipContent, "function");
  const element = TooltipContent({ children: "Tooltip text" });
  // TooltipContent wraps in Portal; data-slot is on inner content
  assert.ok(element != null);
  assert.equal(element.props.children.props["data-slot"], "tooltip-content");
  assert.equal(element.props.children.props.sideOffset, 4);
});

test("TooltipContent accepts custom sideOffset", () => {
  const element = TooltipContent({ sideOffset: 8, children: "text" });
  assert.equal(element.props.children.props.sideOffset, 8);
});

test("TooltipContent includes base classes", () => {
  const element = TooltipContent({ children: "text" });
  const inner = element.props.children;
  assert.ok(inner.props.className.includes("z-popover"));
  assert.ok(inner.props.className.includes("rounded-md"));
  assert.ok(inner.props.className.includes("border"));
  assert.ok(inner.props.className.includes("bg-popover"));
});

test("TooltipContent merges custom className", () => {
  const element = TooltipContent({ className: "custom", children: "text" });
  const inner = element.props.children;
  assert.ok(inner.props.className.includes("custom"));
  assert.ok(inner.props.className.includes("rounded-md"));
});
