import assert from "node:assert/strict";
import { test } from "node:test";

import { ThemeProvider } from "../../../dist/components/theme-provider.js";

/* -------------------------------------------------------------------------- */
/* ThemeProvider                                                               */
/* -------------------------------------------------------------------------- */

test("ThemeProvider is a function and returns a React element", () => {
  assert.equal(typeof ThemeProvider, "function");
  const element = ThemeProvider({ children: "content" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
});

test("ThemeProvider passes through children", () => {
  const element = ThemeProvider({ children: "Hello World" });
  assert.equal(element.props.children, "Hello World");
});

test("ThemeProvider passes through additional props", () => {
  const element = ThemeProvider({
    children: "content",
    attribute: "class",
    defaultTheme: "system",
    enableSystem: true,
  });
  assert.equal(element.props.attribute, "class");
  assert.equal(element.props.defaultTheme, "system");
  assert.equal(element.props.enableSystem, true);
});
