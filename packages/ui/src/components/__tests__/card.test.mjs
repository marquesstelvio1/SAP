import assert from "node:assert/strict";
import { test } from "node:test";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../dist/components/card.js";

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

test("Card is a function and returns a React element", () => {
  assert.equal(typeof Card, "function");
  const element = Card({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "card");
});

test("Card includes base classes", () => {
  const element = Card({});
  assert.ok(element.props.className.includes("rounded-xl"));
  assert.ok(element.props.className.includes("border"));
  assert.ok(element.props.className.includes("bg-card"));
  assert.ok(element.props.className.includes("shadow-panel"));
});

test("Card merges custom className", () => {
  const element = Card({ className: "custom-card" });
  assert.ok(element.props.className.includes("custom-card"));
  assert.ok(element.props.className.includes("rounded-xl"));
});

test("Card passes through additional props", () => {
  const element = Card({ "data-testid": "card-1" });
  assert.equal(element.props["data-testid"], "card-1");
});

/* -------------------------------------------------------------------------- */
/* CardHeader                                                                  */
/* -------------------------------------------------------------------------- */

test("CardHeader is a function and returns a React element", () => {
  assert.equal(typeof CardHeader, "function");
  const element = CardHeader({});
  assert.equal(element.props["data-slot"], "card-header");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-col"));
});

test("CardHeader applies padding via style", () => {
  const element = CardHeader({});
  assert.equal(element.props.style.padding, "var(--space-6)");
});

test("CardHeader merges custom className", () => {
  const element = CardHeader({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

/* -------------------------------------------------------------------------- */
/* CardTitle                                                                   */
/* -------------------------------------------------------------------------- */

test("CardTitle is a function and returns a React element", () => {
  assert.equal(typeof CardTitle, "function");
  const element = CardTitle({});
  assert.equal(element.type, "h3");
  assert.equal(element.props["data-slot"], "card-title");
  assert.ok(element.props.className.includes("font-semibold"));
  assert.ok(element.props.className.includes("tracking-tight"));
});

test("CardTitle merges custom className", () => {
  const element = CardTitle({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

test("CardTitle renders children", () => {
  const element = CardTitle({ children: "Card Title" });
  assert.equal(element.props.children, "Card Title");
});

/* -------------------------------------------------------------------------- */
/* CardDescription                                                             */
/* -------------------------------------------------------------------------- */

test("CardDescription is a function and returns a React element", () => {
  assert.equal(typeof CardDescription, "function");
  const element = CardDescription({});
  assert.equal(element.props["data-slot"], "card-description");
  assert.ok(element.props.className.includes("text-muted-foreground"));
  assert.ok(element.props.className.includes("text-sm"));
});

test("CardDescription merges custom className", () => {
  const element = CardDescription({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

/* -------------------------------------------------------------------------- */
/* CardContent                                                                 */
/* -------------------------------------------------------------------------- */

test("CardContent is a function and returns a React element", () => {
  assert.equal(typeof CardContent, "function");
  const element = CardContent({});
  assert.equal(element.props["data-slot"], "card-content");
  assert.equal(element.props.style.paddingLeft, "var(--space-6)");
  assert.equal(element.props.style.paddingRight, "var(--space-6)");
  assert.equal(element.props.style.paddingBottom, "var(--space-6)");
  assert.equal(element.props.style.paddingTop, 0);
});

test("CardContent merges custom className", () => {
  const element = CardContent({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});

/* -------------------------------------------------------------------------- */
/* CardFooter                                                                  */
/* -------------------------------------------------------------------------- */

test("CardFooter is a function and returns a React element", () => {
  assert.equal(typeof CardFooter, "function");
  const element = CardFooter({});
  assert.equal(element.props["data-slot"], "card-footer");
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("items-center"));
});

test("CardFooter applies padding via style", () => {
  const element = CardFooter({});
  assert.equal(element.props.style.paddingLeft, "var(--space-6)");
  assert.equal(element.props.style.paddingRight, "var(--space-6)");
  assert.equal(element.props.style.gap, "var(--space-3)");
});

test("CardFooter merges custom className", () => {
  const element = CardFooter({ className: "custom" });
  assert.ok(element.props.className.includes("custom"));
});
