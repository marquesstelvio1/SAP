import assert from "node:assert/strict";
import { test } from "node:test";
import { Badge } from "../../../dist/components/badge.js";
import { MetricTile } from "../../../dist/components/metric-tile.js";

test("MetricTile is a function and returns a React element", () => {
  assert.equal(typeof MetricTile, "function");
  const element = MetricTile({ label: "Revenue", value: "$100" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
});

test("MetricTile renders label text", () => {
  const element = MetricTile({ label: "Active Users", value: 42 });
  const children = element.props.children;
  const labelElement = children[0];
  assert.equal(labelElement.props.children, "Active Users");
});

test("MetricTile renders value text", () => {
  const element = MetricTile({ label: "Revenue", value: "$1,234" });
  const children = element.props.children;
  const valueDiv = children[1];
  const valueElement = valueDiv.props.children[0];
  assert.equal(valueElement.props.children, "$1,234");
});

test("MetricTile renders with numeric value", () => {
  const element = MetricTile({ label: "Count", value: 42 });
  const children = element.props.children;
  const valueDiv = children[1];
  const valueElement = valueDiv.props.children[0];
  assert.equal(valueElement.props.children, 42);
});

test("MetricTile renders badge when provided", () => {
  const element = MetricTile({ label: "Orders", value: 150, badge: "+12%" });
  const children = element.props.children;
  const valueDiv = children[1];
  const badgeElement = valueDiv.props.children[1];
  assert.ok(badgeElement != null);
  assert.equal(badgeElement.props.children, "+12%");
});

test("MetricTile renders without badge by default", () => {
  const element = MetricTile({ label: "Orders", value: 150 });
  const [, valueDiv] = element.props.children;
  const badgeSlot = valueDiv.props.children[1];
  assert.equal(badgeSlot, undefined);
});

test("MetricTile renders trend with up direction", () => {
  const element = MetricTile({
    label: "Revenue",
    value: "$100",
    trend: { direction: "up", value: "+10% vs last month" },
  });
  const [, , trendElement] = element.props.children;
  assert.ok(trendElement != null);
  assert.ok(trendElement.props.className.includes("text-success"));
  assert.equal(trendElement.props.children, "+10% vs last month");
});

test("MetricTile renders trend with down direction", () => {
  const element = MetricTile({
    label: "Revenue",
    value: "$100",
    trend: { direction: "down", value: "-5% vs last month" },
  });
  const [, , trendElement] = element.props.children;
  assert.ok(trendElement != null);
  assert.ok(trendElement.props.className.includes("text-destructive"));
  assert.equal(trendElement.props.children, "-5% vs last month");
});

test("MetricTile renders without trend by default", () => {
  const element = MetricTile({ label: "Revenue", value: "$100" });
  const trendSlot = element.props.children[2];
  assert.equal(trendSlot, undefined);
});

test("MetricTile merges custom className", () => {
  const element = MetricTile({ label: "Test", value: 1, className: "custom-class" });
  assert.ok(element.props.className.includes("custom-class"));
  assert.ok(element.props.className.includes("p-4"));
});

test("MetricTile passes additional props to Card", () => {
  const element = MetricTile({ label: "Test", value: 1, "data-testid": "tile-1" });
  assert.equal(element.props["data-testid"], "tile-1");
});

test("MetricTile accepts a Badge variant", () => {
  const element = MetricTile({
    label: "Test",
    value: 1,
    badge: "New",
    variant: "success",
  });
  const [, valueDiv] = element.props.children;
  const badgeElement = valueDiv.props.children[1];
  assert.equal(badgeElement.type, Badge);
  assert.equal(badgeElement.props.variant, "success");
});
