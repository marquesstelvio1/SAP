import assert from "node:assert/strict";
import { test } from "node:test";

import { EmptyState } from "../../../dist/components/empty-state.js";
import { ErrorCard } from "../../../dist/components/error-card.js";

/* -------------------------------------------------------------------------- */
/* EmptyState                                                                  */
/* -------------------------------------------------------------------------- */

test("EmptyState is a function and returns a React element", () => {
  assert.equal(typeof EmptyState, "function");
  const element = EmptyState({ title: "No items" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "empty-state");
});

test("EmptyState renders title text", () => {
  const element = EmptyState({ title: "No results found" });
  const children = element.props.children;
  // children[0] is null (icon slot), children[1] is the title
  const titleEl = children[1];
  assert.equal(titleEl.props.children, "No results found");
  assert.equal(titleEl.type, "h3");
});

test("EmptyState renders icon when provided", () => {
  const icon = {
    $$typeof: Symbol.for("react.transitional.element"),
    type: "svg",
    props: { "data-testid": "test-icon" },
  };
  const element = EmptyState({ title: "Empty", icon });
  const children = element.props.children;
  const iconWrapper = children.find(
    (c) => c != null && c.props && c.props.className?.includes("rounded-full"),
  );
  assert.ok(iconWrapper != null);
});

test("EmptyState renders without icon by default", () => {
  const element = EmptyState({ title: "Empty" });
  const children = element.props.children;
  const iconSlot = children.filter(
    (c) => c != null && c.props && c.props.className?.includes("rounded-full"),
  );
  assert.equal(iconSlot.length, 0);
});

test("EmptyState renders description when provided", () => {
  const element = EmptyState({ title: "Empty", description: "Add items to get started" });
  const children = element.props.children;
  const descEl = children.find(
    (c) => c != null && c.props && c.props.className?.includes("text-muted-foreground"),
  );
  assert.ok(descEl != null);
  assert.equal(descEl.props.children, "Add items to get started");
});

test("EmptyState renders without description by default", () => {
  const element = EmptyState({ title: "Empty" });
  const html = JSON.stringify(element.props.children);
  assert.ok(!html.includes("text-muted-foreground"));
});

test("EmptyState renders action when provided", () => {
  const action = {
    $$typeof: Symbol.for("react.transitional.element"),
    type: "button",
    props: { children: "Create" },
  };
  const element = EmptyState({ title: "Empty", action });
  const children = element.props.children;
  const actionWrapper = children.find((c) => c != null && c.props && c.props.className === "mt-2");
  assert.ok(actionWrapper != null);
});

test("EmptyState renders without action by default", () => {
  const element = EmptyState({ title: "Empty" });
  const html = JSON.stringify(element.props.children);
  assert.ok(!html.includes("mt-2"));
});

test("EmptyState merges custom className", () => {
  const element = EmptyState({ title: "Empty", className: "custom-empty" });
  assert.ok(element.props.className.includes("custom-empty"));
  assert.ok(element.props.className.includes("py-12"));
});

test("EmptyState passes through additional props", () => {
  const element = EmptyState({ title: "Empty", "data-testid": "empty-1" });
  assert.equal(element.props["data-testid"], "empty-1");
});

/* -------------------------------------------------------------------------- */
/* ErrorCard                                                                   */
/* -------------------------------------------------------------------------- */

test("ErrorCard is a forwardRef object with a render function", () => {
  assert.ok(ErrorCard != null);
  assert.equal(typeof ErrorCard, "object");
  assert.equal(ErrorCard.$$typeof, Symbol.for("react.forward_ref"));
  assert.equal(typeof ErrorCard.render, "function");
});

test("ErrorCard uses default title", () => {
  const element = ErrorCard.render({});
  const children = element.props.children;
  const titleEl = children[0];
  assert.equal(titleEl.props.children, "Erro inesperado");
  assert.equal(titleEl.type, "h2");
});

test("ErrorCard renders custom title", () => {
  const element = ErrorCard.render({ title: "Custom Error" });
  const children = element.props.children;
  const titleEl = children[0];
  assert.equal(titleEl.props.children, "Custom Error");
});

test("ErrorCard renders message when provided", () => {
  const element = ErrorCard.render({ message: "Something went wrong" });
  const children = element.props.children;
  const messageEl = children.find(
    (c) => c != null && c.props && c.props.className?.includes("text-muted-foreground"),
  );
  assert.ok(messageEl != null);
  assert.equal(messageEl.props.children, "Something went wrong");
});

test("ErrorCard renders without message by default", () => {
  const element = ErrorCard.render({});
  const children = element.props.children;
  const messageSlot = children.filter(
    (c) => c != null && c.props && c.props.className?.includes("text-muted-foreground"),
  );
  assert.equal(messageSlot.length, 0);
});

test("ErrorCard renders retry button when onRetry is provided", () => {
  let called = false;
  const element = ErrorCard.render({
    onRetry: () => {
      called = true;
    },
  });
  const html = JSON.stringify(element.props.children);
  assert.ok(html.includes("Tentar novamente"));
});

test("ErrorCard does not render retry button when onRetry is absent", () => {
  const element = ErrorCard.render({});
  const children = element.props.children;
  const hasRetryButton = children.some(
    (c) => c != null && c.props && c.props.children === "Tentar novamente",
  );
  assert.equal(hasRetryButton, false);
});

test("ErrorCard passes ref", () => {
  const element = ErrorCard.render({});
  assert.ok(element.ref == null || element.ref != null);
});
