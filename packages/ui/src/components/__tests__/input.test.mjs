import assert from "node:assert/strict";
import { test } from "node:test";

import { Input } from "../../../dist/components/input.js";
import { Textarea } from "../../../dist/components/textarea.js";

/* -------------------------------------------------------------------------- */
/* Input                                                                       */
/* -------------------------------------------------------------------------- */

test("Input is a function and returns a React element", () => {
  assert.equal(typeof Input, "function");
  const element = Input({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "input");
  assert.equal(element.props["data-slot"], "input");
});

test("Input renders with default type", () => {
  const element = Input({});
  assert.equal(element.props.type, undefined);
});

test("Input renders with explicit type", () => {
  const element = Input({ type: "email" });
  assert.equal(element.props.type, "email");
});

test("Input includes base classes", () => {
  const element = Input({});
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("rounded-md"));
  assert.ok(element.props.className.includes("border-input"));
});

test("Input merges custom className", () => {
  const element = Input({ className: "my-custom-class" });
  assert.ok(element.props.className.includes("my-custom-class"));
  assert.ok(element.props.className.includes("rounded-md"));
});

test("Input passes through additional HTML props", () => {
  const element = Input({ placeholder: "Enter name", "aria-label": "Name" });
  assert.equal(element.props.placeholder, "Enter name");
  assert.equal(element.props["aria-label"], "Name");
});

test("Input applies inputPadding via style prop", () => {
  const element = Input({});
  assert.equal(element.props.style.paddingLeft, "var(--space-3)");
  assert.equal(element.props.style.paddingRight, "var(--space-3)");
});

/* -------------------------------------------------------------------------- */
/* Textarea                                                                    */
/* -------------------------------------------------------------------------- */

test("Textarea is a function and returns a React element", () => {
  assert.equal(typeof Textarea, "function");
  const element = Textarea({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "textarea");
  assert.equal(element.props["data-slot"], "textarea");
});

test("Textarea defaults to comfortable density", () => {
  const element = Textarea({});
  assert.ok(element.props.className.includes("min-h-[var(--density-comfortable-control-height)]"));
});

test("Textarea accepts density variants", () => {
  const compact = Textarea({ density: "compact" });
  assert.ok(compact.props.className.includes("min-h-[var(--density-compact-control-height)]"));

  const operational = Textarea({ density: "operational" });
  assert.ok(
    operational.props.className.includes("min-h-[var(--density-operational-control-height)]"),
  );
});

test("Textarea includes base classes", () => {
  const element = Textarea({});
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("w-full"));
  assert.ok(element.props.className.includes("rounded-md"));
});

test("Textarea merges custom className", () => {
  const element = Textarea({ className: "extra-class" });
  assert.ok(element.props.className.includes("extra-class"));
  assert.ok(element.props.className.includes("w-full"));
});

test("Textarea passes through additional props", () => {
  const element = Textarea({ rows: 5, placeholder: "Enter text" });
  assert.equal(element.props.rows, 5);
  assert.equal(element.props.placeholder, "Enter text");
});
