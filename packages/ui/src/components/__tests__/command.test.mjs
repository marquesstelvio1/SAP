import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from "../../../dist/components/combobox.js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../../../dist/components/command.js";

/* -------------------------------------------------------------------------- */
/* Command sub-components                                                      */
/* -------------------------------------------------------------------------- */

test("Command is a function and returns a React element", () => {
  assert.equal(typeof Command, "function");
  const element = Command({ children: "content" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "command");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("size-full"));
  assert.ok(element.props.className.includes("bg-popover"));
});

test("Command merges custom className", () => {
  const element = Command({ className: "custom", children: "content" });
  assert.ok(element.props.className.includes("custom"));
});

test("CommandInput is a function and returns a React element", () => {
  assert.equal(typeof CommandInput, "function");
  const element = CommandInput({});
  assert.equal(element.props["data-slot"], "command-input-wrapper");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("border-b"));
});

test("CommandInput includes a SearchIcon child", () => {
  const element = CommandInput({});
  const children = element.props.children;
  const icon = children.find((c) => c != null && c.type != null && c.props != null);
  assert.ok(icon != null);
});

test("CommandList is a function and returns a React element", () => {
  assert.equal(typeof CommandList, "function");
  const element = CommandList({});
  assert.equal(element.props["data-slot"], "command-list");
  assert.ok(element.props.className.includes("max-h-72"));
});

test("CommandList merges custom className", () => {
  const element = CommandList({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("CommandEmpty is a function and returns a React element", () => {
  assert.equal(typeof CommandEmpty, "function");
  const element = CommandEmpty({});
  assert.equal(element.props["data-slot"], "command-empty");
  assert.ok(element.props.className.includes("text-center"));
  assert.ok(element.props.className.includes("py-6"));
});

test("CommandGroup is a function and returns a React element", () => {
  assert.equal(typeof CommandGroup, "function");
  const element = CommandGroup({});
  assert.equal(element.props["data-slot"], "command-group");
  assert.ok(element.props.className.includes("overflow-hidden"));
});

test("CommandGroup merges custom className", () => {
  const element = CommandGroup({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("CommandItem is a function and returns a React element", () => {
  assert.equal(typeof CommandItem, "function");
  const element = CommandItem({ children: "Item" });
  assert.equal(element.props["data-slot"], "command-item");
  assert.ok(element.props.className.includes("relative"));
  assert.ok(element.props.className.includes("flex"));
});

test("CommandItem merges custom className", () => {
  const element = CommandItem({ className: "custom", children: "Item" });
  assert.ok(element.props.className.includes("custom"));
});

test("CommandSeparator is a function and returns a React element", () => {
  assert.equal(typeof CommandSeparator, "function");
  const element = CommandSeparator({});
  assert.equal(element.props["data-slot"], "command-separator");
  assert.ok(element.props.className.includes("h-px"));
});

test("CommandShortcut is a function and returns a React element", () => {
  assert.equal(typeof CommandShortcut, "function");
  const element = CommandShortcut({});
  assert.equal(element.props["data-slot"], "command-shortcut");
  assert.ok(element.props.className.includes("text-muted-foreground"));
  assert.ok(element.props.className.includes("text-xs"));
});

test("CommandShortcut merges custom className", () => {
  const element = CommandShortcut({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("all Command sub-components are exported and are functions", () => {
  assert.equal(typeof Command, "function");
  assert.equal(typeof CommandInput, "function");
  assert.equal(typeof CommandList, "function");
  assert.equal(typeof CommandEmpty, "function");
  assert.equal(typeof CommandGroup, "function");
  assert.equal(typeof CommandItem, "function");
  assert.equal(typeof CommandSeparator, "function");
  assert.equal(typeof CommandShortcut, "function");
});

/* -------------------------------------------------------------------------- */
/* Combobox sub-components (non-hook-dependent)                                */
/* -------------------------------------------------------------------------- */

test("ComboboxInput is a function and returns a React element", () => {
  assert.equal(typeof ComboboxInput, "function");
  const element = ComboboxInput({});
  assert.equal(element.props["data-slot"], "combobox-input-wrapper");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("border-b"));
});

test("ComboboxInput merges custom className", () => {
  const element = ComboboxInput({ className: "custom" });
  // className is passed to the inner CommandPrimitive.Input, not the wrapper
  assert.ok(element.props.children.props.className.includes("custom"));
});

test("ComboboxContent is a function and returns a React element", () => {
  assert.equal(typeof ComboboxContent, "function");
  const element = ComboboxContent({});
  assert.equal(element.props["data-slot"], "combobox-content");
  assert.ok(element.props.className.includes("max-h-72"));
});

test("ComboboxItem is a function and returns a React element", () => {
  assert.equal(typeof ComboboxItem, "function");
  const element = ComboboxItem({ children: "Option 1" });
  assert.equal(element.props["data-slot"], "combobox-item");
});

test("ComboboxItem renders check icon when isSelected is true", () => {
  const element = ComboboxItem({ children: "Selected", isSelected: true });
  const children = element.props.children;
  const iconSpan = children[0];
  const CheckIcon = iconSpan.props.children;
  assert.ok(CheckIcon != null);
});

test("ComboboxItem does not render check icon when isSelected is false", () => {
  const element = ComboboxItem({ children: "Not selected", isSelected: false });
  const children = element.props.children;
  const iconSpan = children[0];
  // false && <CheckIcon /> evaluates to false
  assert.equal(iconSpan.props.children, false);
});

test("ComboboxItem merges custom className", () => {
  const element = ComboboxItem({ className: "custom", children: "Opt" });
  assert.ok(element.props.className.includes("custom"));
});

test("ComboboxEmpty is a function and returns a React element", () => {
  assert.equal(typeof ComboboxEmpty, "function");
  const element = ComboboxEmpty({});
  assert.equal(element.props["data-slot"], "combobox-empty");
  assert.ok(element.props.className.includes("text-center"));
});
