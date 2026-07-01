import assert from "node:assert/strict";
import { test } from "node:test";

import { Alert, AlertDescription, AlertTitle } from "../../../dist/components/alert.js";
import { Toaster } from "../../../dist/components/toast.js";

/* -------------------------------------------------------------------------- */
/* Alert                                                                       */
/* -------------------------------------------------------------------------- */

test("Alert is a function and returns a React element", () => {
  assert.equal(typeof Alert, "function");
  const element = Alert({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "alert");
});

test("Alert includes base classes", () => {
  const element = Alert({});
  assert.ok(element.props.className.includes("relative"));
  assert.ok(element.props.className.includes("rounded-lg"));
  assert.ok(element.props.className.includes("border"));
  assert.ok(element.props.className.includes("px-4"));
  assert.ok(element.props.className.includes("py-3"));
});

test("Alert merges custom className", () => {
  const element = Alert({ className: "custom-alert" });
  assert.ok(element.props.className.includes("custom-alert"));
  assert.ok(element.props.className.includes("rounded-lg"));
});

test("Alert passes through additional props", () => {
  const element = Alert({ "data-testid": "alert-1" });
  assert.equal(element.props["data-testid"], "alert-1");
});

test("AlertTitle is a function and returns a React element", () => {
  assert.equal(typeof AlertTitle, "function");
  const element = AlertTitle({});
  assert.equal(element.type, "h5");
  assert.equal(element.props["data-slot"], "alert-title");
  assert.ok(element.props.className.includes("font-medium"));
  assert.ok(element.props.className.includes("tracking-tight"));
});

test("AlertTitle merges custom className", () => {
  const element = AlertTitle({ className: "custom-title" });
  assert.ok(element.props.className.includes("custom-title"));
});

test("AlertTitle renders children", () => {
  const element = AlertTitle({ children: "Warning" });
  assert.equal(element.props.children, "Warning");
});

test("AlertDescription is a function and returns a React element", () => {
  assert.equal(typeof AlertDescription, "function");
  const element = AlertDescription({});
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "alert-description");
  assert.ok(element.props.className.includes("text-sm"));
});

test("AlertDescription merges custom className", () => {
  const element = AlertDescription({ className: "custom-desc" });
  assert.ok(element.props.className.includes("custom-desc"));
});

test("AlertDescription renders children", () => {
  const element = AlertDescription({ children: "This is a description" });
  assert.equal(element.props.children, "This is a description");
});

/* -------------------------------------------------------------------------- */
/* Toaster                                                                     */
/* -------------------------------------------------------------------------- */

test("Toaster is a function and returns a React element", () => {
  assert.equal(typeof Toaster, "function");
  const element = Toaster({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "toaster");
});

test("Toaster includes group className", () => {
  const element = Toaster({});
  assert.equal(element.props.className, "group");
});

test("Toaster passes through additional props", () => {
  const element = Toaster({ position: "top-right", richColors: true });
  assert.equal(element.props.position, "top-right");
});

test("Toaster includes toastOptions with classNames", () => {
  const element = Toaster({});
  const options = element.props.toastOptions;
  assert.ok(options != null);
  assert.ok(options.classNames != null);
  assert.ok(options.classNames.toast.includes("bg-background"));
  assert.ok(options.classNames.description.includes("text-muted-foreground"));
});
