import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../../dist/components/dropdown-menu.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../dist/components/popover.js";

/* -------------------------------------------------------------------------- */
/* Popover                                                                     */
/* -------------------------------------------------------------------------- */

test("Popover is a function and returns a React element", () => {
  assert.equal(typeof Popover, "function");
  const element = Popover({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "popover");
});

test("PopoverTrigger is a function and returns a React element", () => {
  assert.equal(typeof PopoverTrigger, "function");
  const element = PopoverTrigger({});
  assert.equal(element.props["data-slot"], "popover-trigger");
});

test("PopoverContent is a function and returns a React element", () => {
  assert.equal(typeof PopoverContent, "function");
  const element = PopoverContent({ children: "content" });
  // PopoverContent wraps in Portal; data-slot/props are on inner content
  assert.ok(element != null);
  const inner = element.props.children;
  assert.equal(inner.props["data-slot"], "popover-content");
  assert.equal(inner.props.align, "center");
  assert.equal(inner.props.sideOffset, 4);
});

test("PopoverContent accepts custom align and sideOffset", () => {
  const element = PopoverContent({ align: "start", sideOffset: 8, children: "content" });
  const inner = element.props.children;
  assert.equal(inner.props.align, "start");
  assert.equal(inner.props.sideOffset, 8);
});

test("PopoverContent merges custom className", () => {
  const element = PopoverContent({ className: "custom", children: "content" });
  const inner = element.props.children;
  assert.ok(inner.props.className.includes("custom"));
  assert.ok(inner.props.className.includes("rounded-md"));
});

/* -------------------------------------------------------------------------- */
/* DropdownMenu sub-components                                                 */
/* -------------------------------------------------------------------------- */

test("DropdownMenu is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenu, "function");
  const element = DropdownMenu({});
  assert.equal(element.props["data-slot"], "dropdown-menu");
});

test("DropdownMenuTrigger is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuTrigger, "function");
  const element = DropdownMenuTrigger({});
  assert.equal(element.props["data-slot"], "dropdown-menu-trigger");
});

test("DropdownMenuGroup is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuGroup, "function");
  const element = DropdownMenuGroup({});
  assert.equal(element.props["data-slot"], "dropdown-menu-group");
});

test("DropdownMenuPortal is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuPortal, "function");
  const element = DropdownMenuPortal({});
  assert.equal(element.props["data-slot"], "dropdown-menu-portal");
});

test("DropdownMenuSub is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuSub, "function");
  const element = DropdownMenuSub({});
  assert.equal(element.props["data-slot"], "dropdown-menu-sub");
});

test("DropdownMenuRadioGroup is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuRadioGroup, "function");
  const element = DropdownMenuRadioGroup({});
  assert.equal(element.props["data-slot"], "dropdown-menu-radio-group");
});

test("DropdownMenuContent is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuContent, "function");
  const element = DropdownMenuContent({ children: "content" });
  // Wraps in Portal; data-slot/props are on inner content
  assert.ok(element != null);
  const inner = element.props.children;
  assert.equal(inner.props["data-slot"], "dropdown-menu-content");
  assert.equal(inner.props.sideOffset, 4);
});

test("DropdownMenuContent merges custom className", () => {
  const element = DropdownMenuContent({ className: "custom", children: "content" });
  const inner = element.props.children;
  assert.ok(inner.props.className.includes("custom"));
});

test("DropdownMenuItem is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuItem, "function");
  const element = DropdownMenuItem({ children: "Item" });
  assert.equal(element.props["data-slot"], "dropdown-menu-item");
});

test("DropdownMenuItem accepts inset prop", () => {
  const element = DropdownMenuItem({ inset: true, children: "Item" });
  assert.ok(element.props.className.includes("pl-8"));
});

test("DropdownMenuItem merges custom className", () => {
  const element = DropdownMenuItem({ className: "custom", children: "Item" });
  assert.ok(element.props.className.includes("custom"));
});

test("DropdownMenuCheckboxItem is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuCheckboxItem, "function");
  const element = DropdownMenuCheckboxItem({ children: "Check" });
  assert.equal(element.props["data-slot"], "dropdown-menu-checkbox-item");
});

test("DropdownMenuRadioItem is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuRadioItem, "function");
  const element = DropdownMenuRadioItem({ children: "Radio" });
  assert.equal(element.props["data-slot"], "dropdown-menu-radio-item");
});

test("DropdownMenuLabel is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuLabel, "function");
  const element = DropdownMenuLabel({});
  assert.equal(element.props["data-slot"], "dropdown-menu-label");
});

test("DropdownMenuLabel accepts inset prop", () => {
  const element = DropdownMenuLabel({ inset: true });
  assert.ok(element.props.className.includes("pl-8"));
});

test("DropdownMenuSeparator is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuSeparator, "function");
  const element = DropdownMenuSeparator({});
  assert.equal(element.props["data-slot"], "dropdown-menu-separator");
  assert.ok(element.props.className.includes("h-px"));
});

test("DropdownMenuShortcut is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuShortcut, "function");
  const element = DropdownMenuShortcut({});
  assert.equal(element.props["data-slot"], "dropdown-menu-shortcut");
  assert.ok(element.props.className.includes("text-muted-foreground"));
});

test("DropdownMenuSubTrigger is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuSubTrigger, "function");
  const element = DropdownMenuSubTrigger({ children: "Sub" });
  assert.equal(element.props["data-slot"], "dropdown-menu-sub-trigger");
});

test("DropdownMenuSubTrigger accepts inset prop", () => {
  const element = DropdownMenuSubTrigger({ inset: true, children: "Sub" });
  assert.ok(element.props.className.includes("pl-8"));
});

test("DropdownMenuSubContent is a function and returns a React element", () => {
  assert.equal(typeof DropdownMenuSubContent, "function");
  const element = DropdownMenuSubContent({});
  assert.equal(element.props["data-slot"], "dropdown-menu-sub-content");
});

test("all DropdownMenu sub-components are exported and are functions", () => {
  assert.equal(typeof DropdownMenu, "function");
  assert.equal(typeof DropdownMenuTrigger, "function");
  assert.equal(typeof DropdownMenuContent, "function");
  assert.equal(typeof DropdownMenuGroup, "function");
  assert.equal(typeof DropdownMenuItem, "function");
  assert.equal(typeof DropdownMenuCheckboxItem, "function");
  assert.equal(typeof DropdownMenuRadioItem, "function");
  assert.equal(typeof DropdownMenuLabel, "function");
  assert.equal(typeof DropdownMenuSeparator, "function");
  assert.equal(typeof DropdownMenuShortcut, "function");
  assert.equal(typeof DropdownMenuSub, "function");
  assert.equal(typeof DropdownMenuSubTrigger, "function");
  assert.equal(typeof DropdownMenuSubContent, "function");
  assert.equal(typeof DropdownMenuPortal, "function");
  assert.equal(typeof DropdownMenuRadioGroup, "function");
});
