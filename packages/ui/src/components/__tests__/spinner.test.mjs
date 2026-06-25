import assert from "node:assert/strict";
import { test } from "node:test";
import { Progress } from "../../../dist/components/progress.js";
import { Spinner } from "../../../dist/components/spinner.js";

/* -------------------------------------------------------------------------- */
/* Spinner                                                                     */
/* -------------------------------------------------------------------------- */

test("Spinner is a function and returns a React element", () => {
  assert.equal(typeof Spinner, "function");
  const element = Spinner({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "spinner");
  assert.equal(element.props.role, "status");
  assert.equal(element.props["aria-label"], "Loading");
});

test("Spinner includes base classes", () => {
  const element = Spinner({});
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("items-center"));
  assert.ok(element.props.className.includes("justify-center"));
});

test("Spinner merges custom className", () => {
  const element = Spinner({ className: "custom-spinner" });
  assert.ok(element.props.className.includes("custom-spinner"));
  assert.ok(element.props.className.includes("items-center"));
});

test("Spinner renders an SVG child", () => {
  const element = Spinner({});
  const children = element.props.children;
  const svg = children[0];
  assert.equal(svg.type, "svg");
  assert.ok(svg.props.className.includes("animate-spin"));
});

test("Spinner passes through additional props to SVG", () => {
  const element = Spinner({ "aria-hidden": "true" });
  // {...props} goes to the inner SVG, not the outer div
  const svg = element.props.children.find((c) => c != null && c.type === "svg");
  assert.equal(svg.props["aria-hidden"], "true");
});

/* -------------------------------------------------------------------------- */
/* Progress                                                                    */
/* -------------------------------------------------------------------------- */

test("Progress is a function and returns a React element", () => {
  assert.equal(typeof Progress, "function");
  const element = Progress({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "progress");
});

test("Progress includes base classes", () => {
  const element = Progress({});
  assert.ok(element.props.className.includes("relative"));
  assert.ok(element.props.className.includes("h-4"));
  assert.ok(element.props.className.includes("w-full"));
  assert.ok(element.props.className.includes("rounded-full"));
  assert.ok(element.props.className.includes("bg-secondary"));
});

test("Progress merges custom className", () => {
  const element = Progress({ className: "custom-progress" });
  assert.ok(element.props.className.includes("custom-progress"));
  assert.ok(element.props.className.includes("rounded-full"));
});

test("Progress defaults to 0% when value is not provided", () => {
  const element = Progress({});
  const indicator = element.props.children;
  assert.equal(indicator.props["data-slot"], "progress-indicator");
  assert.equal(indicator.props.style.transform, "translateX(-100%)");
});

test("Progress renders with custom value", () => {
  const element = Progress({ value: 60 });
  const indicator = element.props.children;
  assert.equal(indicator.props["data-slot"], "progress-indicator");
  assert.equal(indicator.props.style.transform, "translateX(-40%)");
});

test("Progress renders at 100%", () => {
  const element = Progress({ value: 100 });
  const indicator = element.props.children;
  assert.equal(indicator.props.style.transform, "translateX(-0%)");
});

test("Progress passes through additional props", () => {
  const element = Progress({ "aria-label": "Loading progress" });
  assert.equal(element.props["aria-label"], "Loading progress");
});
