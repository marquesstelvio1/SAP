import assert from "node:assert/strict";
import { test } from "node:test";

import { ContextRow } from "../../../dist/components/context-row.js";

test("ContextRow is a function and returns a React element", () => {
  assert.equal(typeof ContextRow, "function");
  const element = ContextRow({ label: "Name", value: "John" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "div");
});

test("ContextRow renders label text", () => {
  const element = ContextRow({ label: "Status", value: "Active" });
  const [labelDiv] = element.props.children;
  const [labelElement] = labelDiv.props.children;
  assert.equal(labelElement.props.children, "Status");
});

test("ContextRow renders value text", () => {
  const element = ContextRow({ label: "Email", value: "test@example.com" });
  const [, valueElement] = element.props.children;
  assert.equal(valueElement.props.children, "test@example.com");
});

test("ContextRow applies muted class by default", () => {
  const element = ContextRow({ label: "Role", value: "Admin" });
  assert.ok(element.props.className.includes("bg-muted/30"));
});

test("ContextRow removes muted class when muted is false", () => {
  const element = ContextRow({ label: "Role", value: "Admin", muted: false });
  assert.ok(!element.props.className.includes("bg-muted/30"));
});

test("ContextRow renders description when provided", () => {
  const element = ContextRow({
    label: "Name",
    value: "John",
    description: "Full name",
  });
  const [labelDiv] = element.props.children;
  const [, descriptionElement] = labelDiv.props.children;
  assert.ok(descriptionElement != null);
  assert.equal(descriptionElement.props.children, "Full name");
});

test("ContextRow renders without description by default", () => {
  const element = ContextRow({ label: "Name", value: "John" });
  const [labelDiv] = element.props.children;
  const descriptionSlot = labelDiv.props.children[1];
  assert.equal(descriptionSlot, undefined);
});

test("ContextRow merges custom className", () => {
  const element = ContextRow({
    label: "Test",
    value: "Value",
    className: "extra-class",
  });
  assert.ok(element.props.className.includes("extra-class"));
  assert.ok(element.props.className.includes("rounded-md"));
});

test("ContextRow renders ReactNode value", () => {
  const element = ContextRow({ label: "Score", value: 95 });
  const [, valueElement] = element.props.children;
  assert.equal(valueElement.props.children, 95);
});

test("ContextRow renders always in flex justify-between layout", () => {
  const element = ContextRow({ label: "A", value: "B" });
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("justify-between"));
  assert.ok(element.props.className.includes("items-center"));
});
