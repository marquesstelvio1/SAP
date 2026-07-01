import assert from "node:assert/strict";
import { test } from "node:test";

import { Timeline, TimelineItem } from "../../../dist/components/timeline.js";

/* -------------------------------------------------------------------------- */
/* Timeline                                                                    */
/* -------------------------------------------------------------------------- */

test("Timeline is a function and returns a React element", () => {
  assert.equal(typeof Timeline, "function");
  const element = Timeline({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "ol");
  assert.equal(element.props["data-slot"], "timeline");
});

test("Timeline includes base classes", () => {
  const element = Timeline({});
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("flex-col"));
});

test("Timeline merges custom className", () => {
  const element = Timeline({ className: "custom-timeline" });
  assert.ok(element.props.className.includes("custom-timeline"));
});

/* -------------------------------------------------------------------------- */
/* TimelineItem                                                                */
/* -------------------------------------------------------------------------- */

test("TimelineItem is a function and returns a React element", () => {
  assert.equal(typeof TimelineItem, "function");
  const element = TimelineItem({ title: "Step 1" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "li");
  assert.equal(element.props["data-slot"], "timeline-item");
});

test("TimelineItem defaults to pending status", () => {
  const element = TimelineItem({ title: "Step" });
  const children = element.props.children;
  const dotColumn = children[0];
  const dot = dotColumn.props.children[0];
  assert.ok(dot.props.className.includes("border-muted-foreground/30"));
});

test("TimelineItem renders with completed status", () => {
  const element = TimelineItem({ title: "Done", status: "completed" });
  const children = element.props.children;
  const dotColumn = children[0];
  const dot = dotColumn.props.children[0];
  assert.ok(dot.props.className.includes("border-success"));
  assert.ok(dot.props.className.includes("bg-success"));
});

test("TimelineItem renders with current status", () => {
  const element = TimelineItem({ title: "In Progress", status: "current" });
  const children = element.props.children;
  const dotColumn = children[0];
  const dot = dotColumn.props.children[0];
  assert.ok(dot.props.className.includes("border-primary"));
  assert.ok(dot.props.className.includes("bg-primary"));
});

test("TimelineItem renders with error status", () => {
  const element = TimelineItem({ title: "Failed", status: "error" });
  const children = element.props.children;
  const dotColumn = children[0];
  const dot = dotColumn.props.children[0];
  assert.ok(dot.props.className.includes("border-destructive"));
  assert.ok(dot.props.className.includes("bg-destructive"));
});

test("TimelineItem renders with warning status", () => {
  const element = TimelineItem({ title: "Warning", status: "warning" });
  const children = element.props.children;
  const dotColumn = children[0];
  const dot = dotColumn.props.children[0];
  assert.ok(dot.props.className.includes("border-warning"));
  assert.ok(dot.props.className.includes("bg-warning"));
});

test("TimelineItem renders title text", () => {
  const element = TimelineItem({ title: "Order Placed" });
  const children = element.props.children;
  const contentColumn = children[1];
  const headerRow = contentColumn.props.children[0];
  const titleEl = headerRow.props.children[0];
  assert.equal(titleEl.props.children, "Order Placed");
  assert.equal(titleEl.props["data-slot"], "timeline-title");
});

test("TimelineItem renders timestamp when provided", () => {
  const element = TimelineItem({ title: "Step", timestamp: "2 min ago" });
  const children = element.props.children;
  const contentColumn = children[1];
  const headerRow = contentColumn.props.children[0];
  const timestampEl = headerRow.props.children[1];
  assert.ok(timestampEl != null);
  assert.equal(timestampEl.props.children, "2 min ago");
});

test("TimelineItem renders without timestamp by default", () => {
  const element = TimelineItem({ title: "Step" });
  const children = element.props.children;
  const contentColumn = children[1];
  const headerRow = contentColumn.props.children[0];
  const timestampSlot = headerRow.props.children[1];
  assert.equal(timestampSlot, null);
});

test("TimelineItem renders description when provided", () => {
  const element = TimelineItem({ title: "Step", description: "Processing order" });
  const children = element.props.children;
  const contentColumn = children[1];
  const descEl = contentColumn.props.children[1];
  assert.ok(descEl != null);
  assert.equal(descEl.props["data-slot"], "timeline-description");
});

test("TimelineItem renders without description by default", () => {
  const element = TimelineItem({ title: "Step" });
  const children = element.props.children;
  const contentColumn = children[1];
  const descSlot = contentColumn.props.children[1];
  assert.equal(descSlot, null);
});

test("TimelineItem renders children actions when provided", () => {
  const actionBtn = {
    $$typeof: Symbol.for("react.transitional.element"),
    type: "button",
    props: { children: "Action" },
  };
  const element = TimelineItem({ title: "Step", children: actionBtn });
  const elChildren = element.props.children;
  const contentColumn = elChildren[1];
  const actionsEl = contentColumn.props.children.find(
    (c) => c != null && c.props != null && c.props["data-slot"] === "timeline-actions",
  );
  assert.ok(actionsEl != null);
});

test("TimelineItem merges custom className", () => {
  const element = TimelineItem({ title: "Test", className: "custom-item" });
  assert.ok(element.props.className.includes("custom-item"));
});
