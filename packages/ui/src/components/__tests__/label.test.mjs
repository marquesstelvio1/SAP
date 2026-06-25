import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "../../../dist/components/field.js";
import { Label } from "../../../dist/components/label.js";

/* -------------------------------------------------------------------------- */
/* Label                                                                       */
/* -------------------------------------------------------------------------- */

test("Label is a function and returns a React element", () => {
  assert.equal(typeof Label, "function");
  const element = Label({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "label");
});

test("Label includes base classes", () => {
  const element = Label({});
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("select-none"));
  assert.ok(element.props.className.includes("font-medium"));
  assert.ok(element.props.className.includes("text-sm"));
});

test("Label merges custom className", () => {
  const element = Label({ className: "my-label" });
  assert.ok(element.props.className.includes("my-label"));
  assert.ok(element.props.className.includes("font-medium"));
});

test("Label passes through HTML props", () => {
  const element = Label({ htmlFor: "email", "aria-label": "Email" });
  assert.equal(element.props.htmlFor, "email");
  assert.equal(element.props["aria-label"], "Email");
});

/* -------------------------------------------------------------------------- */
/* Field sub-components                                                        */
/* -------------------------------------------------------------------------- */

test("FieldSet is a function and returns a React element", () => {
  assert.equal(typeof FieldSet, "function");
  const element = FieldSet({});
  assert.equal(element.type, "fieldset");
  assert.equal(element.props["data-slot"], "fieldset");
  assert.ok(element.props.className.includes("flex"));
});

test("FieldSet merges custom className", () => {
  const element = FieldSet({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("FieldLegend is a function and returns a React element", () => {
  assert.equal(typeof FieldLegend, "function");
  const element = FieldLegend({});
  assert.equal(element.type, "legend");
  assert.equal(element.props["data-slot"], "field-legend");
  assert.ok(element.props.className.includes("font-medium"));
});

test("FieldLegend merges custom className", () => {
  const element = FieldLegend({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("FieldGroup is a function and returns a React element", () => {
  assert.equal(typeof FieldGroup, "function");
  const element = FieldGroup({});
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "field-group");
  assert.ok(element.props.className.includes("flex-col"));
});

test("FieldGroup merges custom className", () => {
  const element = FieldGroup({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("Field renders with default vertical orientation", () => {
  const element = Field({});
  assert.equal(element.props["data-slot"], "field");
  assert.equal(element.props["data-orientation"], "vertical");
  assert.ok(element.props.className.includes("flex-col"));
});

test("Field renders with horizontal orientation", () => {
  const element = Field({ orientation: "horizontal" });
  assert.equal(element.props["data-orientation"], "horizontal");
  assert.ok(element.props.className.includes("data-[orientation=horizontal]:items-start"));
  assert.ok(element.props.className.includes("data-[orientation=horizontal]:gap-4"));
});

test("Field merges custom className", () => {
  const element = Field({ className: "custom-field" });
  assert.ok(element.props.className.includes("custom-field"));
});

test("FieldLabel is a function and returns a React element", () => {
  assert.equal(typeof FieldLabel, "function");
  const element = FieldLabel({ children: "Name" });
  assert.equal(element.props["data-slot"], "field-label");
  assert.ok(element.props.className.includes("font-medium"));
});

test("FieldLabel merges custom className", () => {
  const element = FieldLabel({ className: "custom", children: "Name" });
  assert.ok(element.props.className.includes("custom"));
});

test("FieldContent is a function and returns a React element", () => {
  assert.equal(typeof FieldContent, "function");
  const element = FieldContent({});
  assert.equal(element.props["data-slot"], "field-content");
  assert.ok(element.props.className.includes("flex-1"));
});

test("FieldContent merges custom className", () => {
  const element = FieldContent({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("FieldTitle is a function and returns a React element", () => {
  assert.equal(typeof FieldTitle, "function");
  const element = FieldTitle({});
  assert.equal(element.props["data-slot"], "field-title");
  assert.ok(element.props.className.includes("font-medium"));
});

test("FieldTitle merges custom className", () => {
  const element = FieldTitle({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("FieldDescription is a function and returns a React element", () => {
  assert.equal(typeof FieldDescription, "function");
  const element = FieldDescription({});
  assert.equal(element.type, "p");
  assert.equal(element.props["data-slot"], "field-description");
  assert.ok(element.props.className.includes("text-muted-foreground"));
});

test("FieldDescription merges custom className", () => {
  const element = FieldDescription({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("FieldSeparator renders without children", () => {
  const element = FieldSeparator({});
  assert.equal(element.props["data-slot"], "field-separator");
  const children = element.props.children;
  assert.ok(Array.isArray(children));
  const nonNullChildren = children.filter(Boolean);
  assert.equal(nonNullChildren.length, 2);
});

test("FieldSeparator renders with children label", () => {
  const element = FieldSeparator({ children: "OR" });
  assert.equal(element.props["data-slot"], "field-separator");
  const children = element.props.children;
  assert.equal(children.length, 3);
  assert.equal(children[1].props.children, "OR");
});

test("FieldError returns null when no message or errors", () => {
  const result = FieldError({});
  assert.equal(result, null);
});

test("FieldError returns null when errors array is empty", () => {
  const result = FieldError({ errors: [] });
  assert.equal(result, null);
});

test("FieldError renders children message", () => {
  const element = FieldError({ children: "This field is required" });
  assert.equal(element.props["data-slot"], "field-error");
  assert.equal(element.props.children, "This field is required");
  assert.ok(element.props.className.includes("text-destructive"));
});

test("FieldError renders first error message from errors array", () => {
  const element = FieldError({ errors: [{ message: "Required" }, { message: "Invalid" }] });
  assert.equal(element.props["data-slot"], "field-error");
  assert.equal(element.props.children, "Required");
});

test("FieldError prefers children over errors array", () => {
  const element = FieldError({ children: "Custom error", errors: [{ message: "Array error" }] });
  assert.equal(element.props.children, "Custom error");
});

test("FieldError merges custom className", () => {
  const element = FieldError({ children: "Error" });
  assert.ok(element.props.className.includes("text-destructive"));
});
