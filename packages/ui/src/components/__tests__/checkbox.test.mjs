import assert from "node:assert/strict";
import { test } from "node:test";

import { Checkbox } from "../../../dist/components/checkbox.js";
import { RadioGroup, RadioGroupItem } from "../../../dist/components/radio-group.js";
import { Switch } from "../../../dist/components/switch.js";

/* -------------------------------------------------------------------------- */
/* Checkbox                                                                    */
/* -------------------------------------------------------------------------- */

test("Checkbox is a function and returns a React element", () => {
  assert.equal(typeof Checkbox, "function");
  const element = Checkbox({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "checkbox");
});

test("Checkbox includes base classes", () => {
  const element = Checkbox({});
  assert.ok(element.props.className.includes("peer"));
  assert.ok(element.props.className.includes("rounded-sm"));
  assert.ok(element.props.className.includes("border-input"));
});

test("Checkbox merges custom className", () => {
  const element = Checkbox({ className: "custom-checkbox" });
  assert.ok(element.props.className.includes("custom-checkbox"));
  assert.ok(element.props.className.includes("peer"));
});

test("Checkbox passes through additional props", () => {
  const element = Checkbox({ checked: true, "aria-label": "Accept terms" });
  assert.equal(element.props.checked, true);
  assert.equal(element.props["aria-label"], "Accept terms");
});

test("Checkbox renders CheckboxPrimitive.Indicator child", () => {
  const element = Checkbox({});
  const children = element.props.children;
  assert.ok(children != null);
  assert.equal(children.props["data-slot"], "checkbox-indicator");
});

/* -------------------------------------------------------------------------- */
/* Switch                                                                      */
/* -------------------------------------------------------------------------- */

test("Switch is a function and returns a React element", () => {
  assert.equal(typeof Switch, "function");
  const element = Switch({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "switch");
});

test("Switch includes base classes", () => {
  const element = Switch({});
  assert.ok(element.props.className.includes("inline-flex"));
  assert.ok(element.props.className.includes("h-6"));
  assert.ok(element.props.className.includes("w-10"));
  assert.ok(element.props.className.includes("rounded-full"));
});

test("Switch merges custom className", () => {
  const element = Switch({ className: "custom-switch" });
  assert.ok(element.props.className.includes("custom-switch"));
  assert.ok(element.props.className.includes("rounded-full"));
});

test("Switch passes through additional props", () => {
  const element = Switch({ "aria-label": "Toggle setting" });
  assert.equal(element.props["aria-label"], "Toggle setting");
});

test("Switch renders SwitchPrimitive.Thumb child", () => {
  const element = Switch({});
  const children = element.props.children;
  assert.ok(children != null);
  assert.equal(children.props["data-slot"], "switch-thumb");
});

/* -------------------------------------------------------------------------- */
/* RadioGroup                                                                  */
/* -------------------------------------------------------------------------- */

test("RadioGroup is a function and returns a React element", () => {
  assert.equal(typeof RadioGroup, "function");
  const element = RadioGroup({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "radio-group");
});

test("RadioGroup includes base classes", () => {
  const element = RadioGroup({});
  assert.ok(element.props.className.includes("grid"));
  assert.ok(element.props.className.includes("gap-2"));
});

test("RadioGroup merges custom className", () => {
  const element = RadioGroup({ className: "custom-group" });
  assert.ok(element.props.className.includes("custom-group"));
});

test("RadioGroupItem is a function and returns a React element", () => {
  assert.equal(typeof RadioGroupItem, "function");
  const element = RadioGroupItem({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "radio-group-item");
});

test("RadioGroupItem includes base classes", () => {
  const element = RadioGroupItem({});
  assert.ok(element.props.className.includes("aspect-square"));
  assert.ok(element.props.className.includes("rounded-full"));
  assert.ok(element.props.className.includes("border-input"));
});

test("RadioGroupItem merges custom className", () => {
  const element = RadioGroupItem({ className: "custom-item" });
  assert.ok(element.props.className.includes("custom-item"));
});

test("RadioGroupItem renders RadioGroupPrimitive.Indicator child", () => {
  const element = RadioGroupItem({});
  const children = element.props.children;
  assert.ok(children != null);
  assert.equal(children.props["data-slot"], "radio-group-indicator");
});
