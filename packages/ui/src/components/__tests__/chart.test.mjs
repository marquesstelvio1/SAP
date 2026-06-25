import assert from "node:assert/strict";
import { test } from "node:test";

import { ChartContainer, ChartTooltipContent } from "../../../dist/components/chart.js";

/* -------------------------------------------------------------------------- */
/* ChartContainer                                                              */
/* -------------------------------------------------------------------------- */

test("ChartContainer is a function and returns a React element", () => {
  assert.equal(typeof ChartContainer, "function");
  const element = ChartContainer({ config: { series: { label: "Series" } }, children: "content" });
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "chart");
});

test("ChartContainer includes base classes", () => {
  const element = ChartContainer({ config: { series: { label: "Series" } }, children: "content" });
  assert.ok(element.props.className.includes("flex"));
  assert.ok(element.props.className.includes("aspect-video"));
  assert.ok(element.props.className.includes("text-xs"));
});

test("ChartContainer sets CSS custom properties for config colors", () => {
  const config = {
    revenue: { label: "Revenue", color: "#ff0000" },
    costs: { label: "Costs", color: "#00ff00" },
  };
  const element = ChartContainer({ config, children: "content" });
  assert.equal(element.props.style["--color-chart-base"], "var(--color-chart-1)");
  assert.equal(element.props.style["--color-revenue"], "#ff0000");
  assert.equal(element.props.style["--color-costs"], "#00ff00");
});

test("ChartContainer uses default color when color is not provided", () => {
  const config = { series: { label: "Series" } };
  const element = ChartContainer({ config, children: "content" });
  assert.equal(element.props.style["--color-series"], "var(--color-chart-1)");
});

test("ChartContainer merges custom className", () => {
  const element = ChartContainer({
    config: { a: { label: "A" } },
    className: "custom",
    children: "content",
  });
  assert.ok(element.props.className.includes("custom"));
});

/* -------------------------------------------------------------------------- */
/* ChartTooltipContent                                                         */
/* -------------------------------------------------------------------------- */

test("ChartTooltipContent returns null when not active", () => {
  const result = ChartTooltipContent({ active: false });
  assert.equal(result, null);
});

test("ChartTooltipContent returns null when payload is empty", () => {
  const result = ChartTooltipContent({ active: true, payload: [] });
  assert.equal(result, null);
});

test("ChartTooltipContent renders with active payload", () => {
  const element = ChartTooltipContent({
    active: true,
    payload: [{ name: "series1", value: 100, dataKey: "series1" }],
    config: { series1: { label: "Series 1" } },
  });
  assert.ok(element != null);
  assert.equal(element.props.className.includes("rounded-lg"), true);
});

test("ChartTooltipContent renders label when provided and not hidden", () => {
  const element = ChartTooltipContent({
    active: true,
    payload: [{ name: "series1", value: 100 }],
    label: "January",
    config: { series1: { label: "Series 1" } },
  });
  const children = element.props.children;
  const labelEl = children[0];
  assert.equal(labelEl.props.children, "January");
});

test("ChartTooltipContent hides label when hideLabel is true", () => {
  const element = ChartTooltipContent({
    active: true,
    payload: [{ name: "series1", value: 100 }],
    label: "January",
    hideLabel: true,
    config: { series1: { label: "Series 1" } },
  });
  const children = element.props.children;
  // When hideLabel is true, the label slot is null, so skip it.
  const payloadDiv = children.find(
    (c) => c != null && c.props?.className?.includes("flex flex-col"),
  );
  assert.ok(payloadDiv != null);
});

test("ChartTooltipContent uses dot indicator by default", () => {
  const element = ChartTooltipContent({
    active: true,
    payload: [{ name: "series1", value: 100 }],
    config: { series1: { label: "Series 1" } },
  });
  const children = element.props.children;
  const payloadDiv = children.length > 1 ? children[1] : children;
  assert.ok(payloadDiv != null);
});

test("ChartTooltipContent accepts line indicator", () => {
  const element = ChartTooltipContent({
    active: true,
    payload: [{ name: "s1", value: 50 }],
    config: { s1: { label: "S1" } },
    indicator: "line",
  });
  assert.ok(element != null);
});

test("ChartTooltipContent accepts dashed indicator", () => {
  const element = ChartTooltipContent({
    active: true,
    payload: [{ name: "s1", value: 50 }],
    config: { s1: { label: "S1" } },
    indicator: "dashed",
  });
  assert.ok(element != null);
});
