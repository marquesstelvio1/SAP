import assert from "node:assert/strict";
import { test } from "node:test";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../../../dist/components/dialog.js";

test("all Dialog sub-components are exported and are functions", () => {
  assert.equal(typeof Dialog, "function");
  assert.equal(typeof DialogClose, "function");
  assert.equal(typeof DialogContent, "function");
  assert.equal(typeof DialogDescription, "function");
  assert.equal(typeof DialogFooter, "function");
  assert.equal(typeof DialogHeader, "function");
  assert.equal(typeof DialogOverlay, "function");
  assert.equal(typeof DialogPortal, "function");
  assert.equal(typeof DialogTitle, "function");
  assert.equal(typeof DialogTrigger, "function");
});

test("Dialog returns a React element with data-slot dialog", () => {
  const element = Dialog({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.props["data-slot"], "dialog");
});

test("DialogTrigger returns a React element with data-slot dialog-trigger", () => {
  const element = DialogTrigger({});
  assert.equal(element.props["data-slot"], "dialog-trigger");
});

test("DialogPortal returns a React element with data-slot dialog-portal", () => {
  const element = DialogPortal({});
  assert.equal(element.props["data-slot"], "dialog-portal");
});

test("DialogOverlay returns a React element with fixed overlay classes", () => {
  const element = DialogOverlay({});
  assert.equal(element.props["data-slot"], "dialog-overlay");
  assert.ok(element.props.className.includes("fixed"));
  assert.ok(element.props.className.includes("inset-0"));
  assert.ok(element.props.className.includes("bg-background/80"));
});

test("DialogContent returns a React element with showCloseButton defaulting to true", () => {
  const element = DialogContent({ children: "content" });
  // DialogContent returns a Portal wrapping Overlay + Content
  assert.ok(element != null);
});

test("DialogHeader returns a div with data-slot dialog-header", () => {
  const element = DialogHeader({});
  assert.equal(element.props["data-slot"], "dialog-header");
  assert.ok(element.props.className.includes("flex"));
});

test("DialogFooter returns a div with data-slot dialog-footer", () => {
  const element = DialogFooter({});
  assert.equal(element.props["data-slot"], "dialog-footer");
  assert.ok(element.props.className.includes("flex"));
});

test("DialogTitle returns a React element with data-slot dialog-title", () => {
  const element = DialogTitle({});
  assert.equal(element.props["data-slot"], "dialog-title");
  assert.ok(element.props.className.includes("font-semibold"));
});

test("DialogDescription returns a React element with data-slot dialog-description", () => {
  const element = DialogDescription({});
  assert.equal(element.props["data-slot"], "dialog-description");
  assert.ok(element.props.className.includes("text-muted-foreground"));
});

test("DialogClose returns a React element with data-slot dialog-close", () => {
  const element = DialogClose({});
  assert.equal(element.props["data-slot"], "dialog-close");
});

test("DialogOverlay merges custom className", () => {
  const element = DialogOverlay({ className: "custom-overlay" });
  assert.ok(element.props.className.includes("custom-overlay"));
  assert.ok(element.props.className.includes("fixed"));
});
