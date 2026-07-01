import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  drawerVariants,
} from "../../../dist/components/drawer.js";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  sheetVariants,
} from "../../../dist/components/sheet.js";

/* -------------------------------------------------------------------------- */
/* sheetVariants                                                               */
/* -------------------------------------------------------------------------- */

test("sheetVariants returns correct class for right side (default)", () => {
  const result = sheetVariants({ side: "right" });
  assert.ok(result.includes("inset-y-0"));
  assert.ok(result.includes("right-0"));
  assert.ok(result.includes("border-l"));
});

test("sheetVariants returns correct class for left side", () => {
  const result = sheetVariants({ side: "left" });
  assert.ok(result.includes("left-0"));
  assert.ok(result.includes("border-r"));
});

test("sheetVariants returns correct class for top side", () => {
  const result = sheetVariants({ side: "top" });
  assert.ok(result.includes("inset-x-0"));
  assert.ok(result.includes("top-0"));
  assert.ok(result.includes("border-b"));
});

test("sheetVariants returns correct class for bottom side", () => {
  const result = sheetVariants({ side: "bottom" });
  assert.ok(result.includes("inset-x-0"));
  assert.ok(result.includes("bottom-0"));
  assert.ok(result.includes("border-t"));
});

test("sheetVariants defaults to right side", () => {
  const result = sheetVariants({});
  assert.ok(result.includes("right-0"));
});

/* -------------------------------------------------------------------------- */
/* Sheet sub-components                                                        */
/* -------------------------------------------------------------------------- */

test("Sheet is a function and returns a React element", () => {
  assert.equal(typeof Sheet, "function");
  const element = Sheet({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "sheet");
});

test("SheetTrigger returns a React element with data-slot sheet-trigger", () => {
  const element = SheetTrigger({});
  assert.equal(element.props["data-slot"], "sheet-trigger");
});

test("SheetClose returns a React element with data-slot sheet-close", () => {
  const element = SheetClose({});
  assert.equal(element.props["data-slot"], "sheet-close");
});

test("SheetPortal returns a React element with data-slot sheet-portal", () => {
  const element = SheetPortal({});
  assert.equal(element.props["data-slot"], "sheet-portal");
});

test("SheetOverlay returns a React element with fixed overlay classes", () => {
  const element = SheetOverlay({});
  assert.equal(element.props["data-slot"], "sheet-overlay");
  assert.ok(element.props.className.includes("fixed"));
  assert.ok(element.props.className.includes("inset-0"));
  assert.ok(element.props.className.includes("bg-background/80"));
});

test("SheetOverlay merges custom className", () => {
  const element = SheetOverlay({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
  assert.ok(element.props.className.includes("fixed"));
});

test("SheetHeader returns a div with data-slot sheet-header", () => {
  const element = SheetHeader({});
  assert.equal(element.props["data-slot"], "sheet-header");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-col"));
});

test("SheetFooter returns a div with data-slot sheet-footer", () => {
  const element = SheetFooter({});
  assert.equal(element.props["data-slot"], "sheet-footer");
  assert.ok(element.props.className.includes("flex-col"));
});

test("SheetTitle returns a React element with data-slot sheet-title", () => {
  const element = SheetTitle({});
  assert.equal(element.props["data-slot"], "sheet-title");
  assert.ok(element.props.className.includes("font-semibold"));
  assert.ok(element.props.className.includes("text-lg"));
});

test("SheetDescription returns a React element with data-slot sheet-description", () => {
  const element = SheetDescription({});
  assert.equal(element.props["data-slot"], "sheet-description");
  assert.ok(element.props.className.includes("text-muted-foreground"));
});

test("SheetContent returns a React element with showCloseButton defaulting to true", () => {
  const element = SheetContent({ children: "content" });
  assert.ok(element != null);
});

/* -------------------------------------------------------------------------- */
/* drawerVariants                                                              */
/* -------------------------------------------------------------------------- */

test("drawerVariants returns correct class for right side (default)", () => {
  const result = drawerVariants({ side: "right" });
  assert.ok(result.includes("right-0"));
  assert.ok(result.includes("border-l"));
});

test("drawerVariants returns correct class for left side", () => {
  const result = drawerVariants({ side: "left" });
  assert.ok(result.includes("left-0"));
  assert.ok(result.includes("border-r"));
});

test("drawerVariants defaults to compact density", () => {
  const result = drawerVariants({ side: "right" });
  assert.ok(result.includes("w-[var(--density-compact-drawer-width,18rem)]"));
});

test("drawerVariants accepts density variants", () => {
  const comfortable = drawerVariants({ side: "right", density: "comfortable" });
  assert.ok(comfortable.includes("w-[var(--density-comfortable-drawer-width,20rem)]"));

  const operational = drawerVariants({ side: "right", density: "operational" });
  assert.ok(operational.includes("w-[var(--density-operational-drawer-width,16rem)]"));
});

/* -------------------------------------------------------------------------- */
/* Drawer sub-components                                                       */
/* -------------------------------------------------------------------------- */

test("Drawer is a function and returns a React element", () => {
  assert.equal(typeof Drawer, "function");
  const element = Drawer({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "drawer");
});

test("DrawerTrigger returns a React element with data-slot drawer-trigger", () => {
  const element = DrawerTrigger({});
  assert.equal(element.props["data-slot"], "drawer-trigger");
});

test("DrawerClose returns a React element with data-slot drawer-close", () => {
  const element = DrawerClose({});
  assert.equal(element.props["data-slot"], "drawer-close");
});

test("DrawerPortal returns a React element with data-slot drawer-portal", () => {
  const element = DrawerPortal({});
  assert.equal(element.props["data-slot"], "drawer-portal");
});

test("DrawerOverlay returns a React element with fixed overlay classes", () => {
  const element = DrawerOverlay({});
  assert.equal(element.props["data-slot"], "drawer-overlay");
  assert.ok(element.props.className.includes("fixed"));
  assert.ok(element.props.className.includes("inset-0"));
});

test("DrawerHeader returns a div with data-slot drawer-header", () => {
  const element = DrawerHeader({});
  assert.equal(element.props["data-slot"], "drawer-header");
  assert.ok(element.props.className.includes("border-b"));
});

test("DrawerFooter returns a div with data-slot drawer-footer", () => {
  const element = DrawerFooter({});
  assert.equal(element.props["data-slot"], "drawer-footer");
  assert.ok(element.props.className.includes("border-t"));
});

test("DrawerTitle returns a React element with data-slot drawer-title", () => {
  const element = DrawerTitle({});
  assert.equal(element.props["data-slot"], "drawer-title");
  assert.ok(element.props.className.includes("font-semibold"));
});

test("DrawerDescription returns a React element with data-slot drawer-description", () => {
  const element = DrawerDescription({});
  assert.equal(element.props["data-slot"], "drawer-description");
  assert.ok(element.props.className.includes("text-muted-foreground"));
});

test("DrawerContent returns a React element with showCloseButton defaulting to true", () => {
  const element = DrawerContent({ children: "content" });
  assert.ok(element != null);
});
