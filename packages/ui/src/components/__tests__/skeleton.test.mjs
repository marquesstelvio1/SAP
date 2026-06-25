import assert from "node:assert/strict";
import { test } from "node:test";

import {
  Skeleton,
  SkeletonCard,
  SkeletonMetricTile,
  SkeletonTable,
} from "../../../dist/components/skeleton.js";

test("Skeleton is a function", () => {
  assert.equal(typeof Skeleton, "function");
});

test("Skeleton returns a div with data-slot skeleton", () => {
  const element = Skeleton({});
  assert.equal(element.$$typeof, Symbol.for("react.transitional.element"));
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "skeleton");
});

test("Skeleton includes animate-pulse and rounded-md classes", () => {
  const element = Skeleton({});
  assert.ok(element.props.className.includes("animate-pulse"));
  assert.ok(element.props.className.includes("rounded-md"));
  assert.ok(element.props.className.includes("bg-muted"));
});

test("Skeleton merges custom className", () => {
  const element = Skeleton({ className: "h-10 w-full" });
  assert.ok(element.props.className.includes("h-10"));
  assert.ok(element.props.className.includes("animate-pulse"));
});

test("Skeleton passes through additional props", () => {
  const element = Skeleton({ "aria-hidden": "true" });
  assert.equal(element.props["aria-hidden"], "true");
});

test("SkeletonCard is a function", () => {
  assert.equal(typeof SkeletonCard, "function");
});

test("SkeletonCard returns a div with data-slot skeleton-card", () => {
  const element = SkeletonCard({});
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "skeleton-card");
});

test("SkeletonCard includes border class", () => {
  const element = SkeletonCard({});
  assert.ok(element.props.className.includes("rounded-xl"));
  assert.ok(element.props.className.includes("border"));
});

test("SkeletonCard renders three Skeleton children", () => {
  const element = SkeletonCard({});
  const children = element.props.children;
  assert.ok(Array.isArray(children));
  assert.equal(children.length, 3);
});

test("SkeletonMetricTile is a function", () => {
  assert.equal(typeof SkeletonMetricTile, "function");
});

test("SkeletonMetricTile returns a div with data-slot skeleton-metric-tile", () => {
  const element = SkeletonMetricTile({});
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "skeleton-metric-tile");
});

test("SkeletonMetricTile renders three Skeleton children", () => {
  const element = SkeletonMetricTile({});
  assert.ok(Array.isArray(element.props.children));
  assert.equal(element.props.children.length, 3);
});

test("SkeletonTable is a function", () => {
  assert.equal(typeof SkeletonTable, "function");
});

test("SkeletonTable returns a div with data-slot skeleton-table", () => {
  const element = SkeletonTable({});
  assert.equal(element.type, "div");
  assert.equal(element.props["data-slot"], "skeleton-table");
});

test("SkeletonTable defaults to 5 rows and 4 columns", () => {
  const element = SkeletonTable({});
  const children = element.props.children;
  assert.ok(Array.isArray(children));
  const rows = Array.isArray(children[1]) ? children[1] : children.slice(1);
  assert.equal(rows.length, 5);
});

test("SkeletonTable accepts custom rows and columns", () => {
  const element = SkeletonTable({ rows: 3, columns: 2 });
  const children = element.props.children;
  assert.ok(Array.isArray(children));
  const rows = Array.isArray(children[1]) ? children[1] : children.slice(1);
  assert.equal(rows.length, 3);
});

test("SkeletonTable includes space-y-2 class", () => {
  const element = SkeletonTable({});
  assert.ok(element.props.className.includes("space-y-2"));
});
