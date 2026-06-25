import assert from "node:assert/strict";
import { test } from "node:test";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../../dist/components/select.js";
import { SelectNative } from "../../../dist/components/select-native.js";

/* -------------------------------------------------------------------------- */
/* Select sub-components                                                       */
/* -------------------------------------------------------------------------- */

test("Select is a function and returns a React element", () => {
  assert.equal(typeof Select, "function");
  const element = Select({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "select");
});

test("SelectGroup is a function and returns a React element", () => {
  assert.equal(typeof SelectGroup, "function");
  const element = SelectGroup({});
  assert.equal(element.props["data-slot"], "select-group");
});

test("SelectValue is a function and returns a React element", () => {
  assert.equal(typeof SelectValue, "function");
  const element = SelectValue({});
  assert.equal(element.props["data-slot"], "select-value");
});

test("SelectTrigger is a function and returns a React element", () => {
  assert.equal(typeof SelectTrigger, "function");
  const element = SelectTrigger({ children: "Pick option" });
  assert.equal(element.props["data-slot"], "select-trigger");
});

test("SelectTrigger defaults to compact density", () => {
  const element = SelectTrigger({ children: "Pick" });
  assert.ok(element.props.className.includes("h-[var(--density-compact-control-height)]"));
});

test("SelectTrigger accepts density variants", () => {
  const comfortable = SelectTrigger({ children: "Pick", density: "comfortable" });
  assert.ok(comfortable.props.className.includes("h-[var(--density-comfortable-control-height)]"));

  const operational = SelectTrigger({ children: "Pick", density: "operational" });
  assert.ok(operational.props.className.includes("h-[var(--density-operational-control-height)]"));
});

test("SelectTrigger merges custom className", () => {
  const element = SelectTrigger({ className: "custom", children: "Pick" });
  assert.ok(element.props.className.includes("custom"));
});

test("SelectContent is a function and returns a React element", () => {
  assert.equal(typeof SelectContent, "function");
  const element = SelectContent({ children: "content" });
  // SelectContent is wrapped in a Portal; data-slot is on the inner Content
  assert.equal(element.props.children.props["data-slot"], "select-content");
});

test("SelectContent defaults to popper position", () => {
  const element = SelectContent({ children: "content" });
  // position is passed to the inner SelectPrimitive.Content
  assert.equal(element.props.children.props.position, "popper");
});

test("SelectLabel is a function and returns a React element", () => {
  assert.equal(typeof SelectLabel, "function");
  const element = SelectLabel({});
  assert.equal(element.props["data-slot"], "select-label");
  assert.ok(element.props.className.includes("font-semibold"));
});

test("SelectLabel merges custom className", () => {
  const element = SelectLabel({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("SelectItem is a function and returns a React element", () => {
  assert.equal(typeof SelectItem, "function");
  const element = SelectItem({ children: "Option 1" });
  assert.equal(element.props["data-slot"], "select-item");
});

test("SelectItem merges custom className", () => {
  const element = SelectItem({ className: "custom", children: "Opt" });
  assert.ok(element.props.className.includes("custom"));
});

test("SelectSeparator is a function and returns a React element", () => {
  assert.equal(typeof SelectSeparator, "function");
  const element = SelectSeparator({});
  assert.equal(element.props["data-slot"], "select-separator");
  assert.ok(element.props.className.includes("h-px"));
});

/* -------------------------------------------------------------------------- */
/* SelectNative                                                                */
/* -------------------------------------------------------------------------- */

test("SelectNative is a function and returns a React element", () => {
  assert.equal(typeof SelectNative, "function");
  const element = SelectNative({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "select");
  assert.equal(element.props["data-slot"], "select-native");
});

test("SelectNative defaults to comfortable density", () => {
  const element = SelectNative({});
  assert.ok(element.props.className.includes("h-[var(--density-comfortable-control-height)]"));
});

test("SelectNative accepts density variants", () => {
  const compact = SelectNative({ density: "compact" });
  assert.ok(compact.props.className.includes("h-[var(--density-compact-control-height)]"));

  const operational = SelectNative({ density: "operational" });
  assert.ok(operational.props.className.includes("h-[var(--density-operational-control-height)]"));
});

test("SelectNative includes base classes", () => {
  const element = SelectNative({});
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("rounded-md"));
  assert.ok(element.props.className.includes("border-input"));
});

test("SelectNative merges custom className", () => {
  const element = SelectNative({ className: "custom-native" });
  assert.ok(element.props.className.includes("custom-native"));
  assert.ok(element.props.className.includes("rounded-md"));
});

test("SelectNative passes through additional props", () => {
  const element = SelectNative({ disabled: true, "aria-label": "Choose" });
  assert.equal(element.props.disabled, true);
  assert.equal(element.props["aria-label"], "Choose");
});
