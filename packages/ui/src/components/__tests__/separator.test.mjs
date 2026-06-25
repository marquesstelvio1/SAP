import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../dist/components/alert-dialog.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../dist/components/collapsible.js";
import { Separator } from "../../../dist/components/separator.js";
import { Toggle, toggleVariants } from "../../../dist/components/toggle.js";

/* -------------------------------------------------------------------------- */
/* toggleVariants                                                              */
/* -------------------------------------------------------------------------- */

test("toggleVariants returns correct default variant class", () => {
  const result = toggleVariants({ variant: "default" });
  assert.ok(result.includes("bg-transparent"));
  assert.ok(result.includes("inline-flex"));
  assert.ok(result.includes("rounded-md"));
});

test("toggleVariants returns correct outline variant class", () => {
  const result = toggleVariants({ variant: "outline" });
  assert.ok(result.includes("border"));
  assert.ok(result.includes("border-input"));
  assert.ok(result.includes("bg-transparent"));
});

test("toggleVariants accepts size variants", () => {
  const defaultSize = toggleVariants({ size: "default" });
  const smSize = toggleVariants({ size: "sm" });
  const lgSize = toggleVariants({ size: "lg" });
  assert.ok(defaultSize.includes("h-9"));
  assert.ok(smSize.includes("h-8"));
  assert.ok(lgSize.includes("h-10"));
});

test("toggleVariants uses default variant when not specified", () => {
  const result = toggleVariants({});
  assert.ok(result.includes("bg-transparent"));
  assert.ok(result.includes("h-9"));
});

/* -------------------------------------------------------------------------- */
/* Separator                                                                   */
/* -------------------------------------------------------------------------- */

test("Separator is a function and returns a React element", () => {
  assert.equal(typeof Separator, "function");
  const element = Separator({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "separator");
});

test("Separator defaults to horizontal orientation", () => {
  const element = Separator({});
  assert.equal(element.props.orientation, "horizontal");
  assert.ok(element.props.className.includes("data-[orientation=horizontal]:h-px"));
});

test("Separator defaults to decorative=true", () => {
  const element = Separator({});
  assert.equal(element.props.decorative, true);
});

test("Separator accepts vertical orientation", () => {
  const element = Separator({ orientation: "vertical" });
  assert.equal(element.props.orientation, "vertical");
  assert.ok(element.props.className.includes("data-[orientation=vertical]:h-full"));
});

test("Separator merges custom className", () => {
  const element = Separator({ className: "custom-sep" });
  assert.ok(element.props.className.includes("custom-sep"));
});

test("Separator passes through additional props", () => {
  const element = Separator({ "aria-orientation": "horizontal" });
  assert.equal(element.props["aria-orientation"], "horizontal");
});

/* -------------------------------------------------------------------------- */
/* Collapsible sub-components                                                  */
/* -------------------------------------------------------------------------- */

test("Collapsible is a function and returns a React element", () => {
  assert.equal(typeof Collapsible, "function");
  const element = Collapsible({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "collapsible");
});

test("CollapsibleTrigger is a function and returns a React element", () => {
  assert.equal(typeof CollapsibleTrigger, "function");
  const element = CollapsibleTrigger({ children: "Toggle" });
  assert.equal(element.props["data-slot"], "collapsible-trigger");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("w-full"));
});

test("CollapsibleTrigger merges custom className", () => {
  const element = CollapsibleTrigger({ className: "custom", children: "Toggle" });
  assert.ok(element.props.className.includes("custom"));
});

test("CollapsibleContent is a function and returns a React element", () => {
  assert.equal(typeof CollapsibleContent, "function");
  const element = CollapsibleContent({ children: "content" });
  assert.equal(element.props["data-slot"], "collapsible-content");
  assert.ok(element.props.className.includes("grid"));
  assert.ok(element.props.className.includes("overflow-hidden"));
});

test("CollapsibleContent merges custom className", () => {
  const element = CollapsibleContent({ className: "custom", children: "content" });
  assert.ok(element.props.className.includes("custom"));
});

/* -------------------------------------------------------------------------- */
/* Toggle                                                                      */
/* -------------------------------------------------------------------------- */

test("Toggle is a function and returns a React element", () => {
  assert.equal(typeof Toggle, "function");
  const element = Toggle({ children: "Bold" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "toggle");
});

test("Toggle renders with default variant and size", () => {
  const element = Toggle({ children: "Bold" });
  assert.ok(element.props.className.includes("bg-transparent"));
  assert.ok(element.props.className.includes("h-9"));
});

test("Toggle renders with outline variant", () => {
  const element = Toggle({ children: "Italic", variant: "outline" });
  assert.ok(element.props.className.includes("border"));
  assert.ok(element.props.className.includes("border-input"));
});

test("Toggle renders with sm size", () => {
  const element = Toggle({ children: "Small", size: "sm" });
  assert.ok(element.props.className.includes("h-8"));
});

test("Toggle renders with lg size", () => {
  const element = Toggle({ children: "Large", size: "lg" });
  assert.ok(element.props.className.includes("h-10"));
});

test("Toggle merges custom className", () => {
  const element = Toggle({ className: "custom-toggle", children: "Bold" });
  assert.ok(element.props.className.includes("custom-toggle"));
  assert.ok(element.props.className.includes("inline-flex"));
});

/* -------------------------------------------------------------------------- */
/* AlertDialog sub-components                                                  */
/* -------------------------------------------------------------------------- */

test("AlertDialog is a function and returns a React element", () => {
  assert.equal(typeof AlertDialog, "function");
  const element = AlertDialog({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "alert-dialog");
});

test("AlertDialogTrigger is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogTrigger, "function");
  const element = AlertDialogTrigger({});
  assert.equal(element.props["data-slot"], "alert-dialog-trigger");
});

test("AlertDialogPortal is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogPortal, "function");
  const element = AlertDialogPortal({ children: "content" });
  assert.equal(element.props["data-slot"], "alert-dialog-portal");
});

test("AlertDialogOverlay is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogOverlay, "function");
  const element = AlertDialogOverlay({});
  assert.equal(element.props["data-slot"], "alert-dialog-overlay");
  assert.ok(element.props.className.includes("fixed"));
  assert.ok(element.props.className.includes("inset-0"));
});

test("AlertDialogOverlay merges custom className", () => {
  const element = AlertDialogOverlay({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("AlertDialogContent returns a React element", () => {
  assert.equal(typeof AlertDialogContent, "function");
  const element = AlertDialogContent({ children: "content" });
  assert.ok(element != null);
});

test("AlertDialogHeader is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogHeader, "function");
  const element = AlertDialogHeader({});
  assert.equal(element.props["data-slot"], "alert-dialog-header");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-col"));
});

test("AlertDialogFooter is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogFooter, "function");
  const element = AlertDialogFooter({});
  assert.equal(element.props["data-slot"], "alert-dialog-footer");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-col-reverse"));
});

test("AlertDialogTitle is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogTitle, "function");
  const element = AlertDialogTitle({});
  assert.equal(element.props["data-slot"], "alert-dialog-title");
  assert.ok(element.props.className.includes("font-semibold"));
  assert.ok(element.props.className.includes("text-lg"));
});

test("AlertDialogDescription is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogDescription, "function");
  const element = AlertDialogDescription({});
  assert.equal(element.props["data-slot"], "alert-dialog-description");
  assert.ok(element.props.className.includes("text-muted-foreground"));
});

test("AlertDialogAction is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogAction, "function");
  const element = AlertDialogAction({ children: "Confirm" });
  assert.equal(element.props["data-slot"], "alert-dialog-action");
});

test("AlertDialogCancel is a function and returns a React element", () => {
  assert.equal(typeof AlertDialogCancel, "function");
  const element = AlertDialogCancel({ children: "Cancel" });
  assert.equal(element.props["data-slot"], "alert-dialog-cancel");
});

test("all AlertDialog sub-components are exported and are functions", () => {
  assert.equal(typeof AlertDialog, "function");
  assert.equal(typeof AlertDialogTrigger, "function");
  assert.equal(typeof AlertDialogPortal, "function");
  assert.equal(typeof AlertDialogOverlay, "function");
  assert.equal(typeof AlertDialogContent, "function");
  assert.equal(typeof AlertDialogHeader, "function");
  assert.equal(typeof AlertDialogFooter, "function");
  assert.equal(typeof AlertDialogTitle, "function");
  assert.equal(typeof AlertDialogDescription, "function");
  assert.equal(typeof AlertDialogAction, "function");
  assert.equal(typeof AlertDialogCancel, "function");
});
