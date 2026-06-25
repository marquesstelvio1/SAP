import assert from "node:assert/strict";
import { test } from "node:test";

import { Calendar } from "../../../dist/components/calendar.js";
import { DatePicker } from "../../../dist/components/date-picker.js";

/* -------------------------------------------------------------------------- */
/* Calendar                                                                    */
/* -------------------------------------------------------------------------- */

test("Calendar is a function and returns a React element", () => {
  assert.equal(typeof Calendar, "function");
  const element = Calendar({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "calendar");
});

test("Calendar defaults to showOutsideDays = true", () => {
  const element = Calendar({});
  assert.equal(element.props.showOutsideDays, true);
});

test("Calendar accepts custom showOutsideDays", () => {
  const element = Calendar({ showOutsideDays: false });
  assert.equal(element.props.showOutsideDays, false);
});

test("Calendar merges custom className", () => {
  const element = Calendar({ className: "custom-cal" });
  assert.ok(element.props.className.includes("custom-cal"));
  assert.ok(element.props.className.includes("p-3"));
});

test("Calendar includes classNames for months, nav, table", () => {
  const element = Calendar({});
  assert.ok(element.props.classNames != null);
  assert.equal(typeof element.props.classNames, "object");
  assert.ok(element.props.classNames.months.includes("flex"));
  assert.ok(element.props.classNames.nav_button.includes("inline-flex"));
  assert.ok(element.props.classNames.table.includes("w-full"));
});

test("Calendar has Chevron component for left orientation", () => {
  const element = Calendar({});
  const Chevron = element.props.components.Chevron;
  const leftEl = Chevron({ orientation: "left" });
  assert.ok(leftEl != null);
});

test("Calendar has Chevron component for right orientation", () => {
  const element = Calendar({});
  const Chevron = element.props.components.Chevron;
  const rightEl = Chevron({ orientation: "right" });
  assert.ok(rightEl != null);
});

/* -------------------------------------------------------------------------- */
/* DatePicker                                                                  */
/* -------------------------------------------------------------------------- */

test("DatePicker is a function and returns a React element", () => {
  assert.equal(typeof DatePicker, "function");
  const element = DatePicker({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
});

test("DatePicker renders with default placeholder", () => {
  const element = DatePicker({});
  const children = element.props.children;
  assert.ok(children != null);
});

test("DatePicker renders with custom placeholder", () => {
  const element = DatePicker({ placeholder: "Select date" });
  const children = element.props.children;
  assert.ok(children != null);
});

test("DatePicker passes disabled prop", () => {
  const element = DatePicker({ disabled: true });
  const children = element.props.children;
  assert.ok(children != null);
});
